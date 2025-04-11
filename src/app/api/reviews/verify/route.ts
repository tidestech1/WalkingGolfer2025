import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { CourseReview, ReviewStatus, DisplayNameType } from '@/types/review';
import { UserProfile } from '@/types/user';
import { getUserProfile, createUserProfile, updateUserProfile, CreateUserProfileInput } from '@/lib/firebase/userUtils'; // Import new type
import { deriveReviewerDisplayName } from '@/lib/utils/reviewUtils';
import { z } from 'zod';
import { UserRecord } from 'firebase-admin/auth';

const db = getAdminFirestore();
const auth = getAdminAuth();

// Input validation schema
const verifyReviewSchema = z.object({
  reviewId: z.string().min(1),
});

// Define a type for the Firestore update payload, allowing FieldValue
// This allows properties from CourseReview OR FieldValue sentinels
type ReviewUpdateData = {
    [K in keyof Partial<Omit<CourseReview, 'id'>>]?: Partial<Omit<CourseReview, 'id'>>[K] | FieldValue;
  } & { submittedEmail?: FieldValue, submittedName?: FieldValue, updatedAt: FieldValue }; // Ensure FieldValue is allowed for specific fields

type UserProfileUpdateData = {
    [K in keyof Partial<UserProfile>]?: Partial<UserProfile>[K] | FieldValue;
} & { updatedAt: FieldValue }; // Ensure FieldValue is allowed for updatedAt

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Bearer token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    // Add check for idToken existence
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: Malformed token' }, { status: 401 });
    }
    let decodedToken;
    try {
      // Now idToken is guaranteed to be a string
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Check if email exists in token
    if (!userEmail) {
         console.error(`User token for ${userId} is missing email.`);
         return NextResponse.json({ error: 'Unauthorized: Token missing email' }, { status: 401 });
    }

    // 2. Input Validation
    const rawData = await request.json();
    const validationResult = verifyReviewSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: validationResult.error.flatten() }, { status: 400 });
    }
    const { reviewId } = validationResult.data;

    // 3. Fetch and Validate Review
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    const review = reviewSnap.data() as CourseReview;

    if (review.status !== 'pending') {
      return NextResponse.json({ error: 'Review is not pending verification' }, { status: 400 });
    }
    if (review.submittedEmail !== userEmail) {
      console.warn(`Verification attempt mismatch: User ${userId} (${userEmail}) tried to verify review ${reviewId} submitted by ${review.submittedEmail}`);
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 }); // Forbidden
    }

    // 4. Fetch or Create User Profile
    let userProfile = await getUserProfile(userId);
    if (!userProfile) {
      console.log(`User profile for ${userId} not found, creating one...`);
      try {
        const firebaseUser: UserRecord = await auth.getUser(userId);
        
        // Create the input object, converting undefined to null
        const createProfileInput: CreateUserProfileInput = {
           uid: firebaseUser.uid,
           email: firebaseUser.email || null, // Convert undefined to null
           displayName: firebaseUser.displayName || null, // Convert undefined to null
           photoURL: firebaseUser.photoURL || null, // Convert undefined to null
        };
        
        // Call createUserProfile 
        await createUserProfile(createProfileInput); 

        userProfile = await getUserProfile(userId);
        if (!userProfile) {
          throw new Error(`Failed to retrieve user profile for ${userId} immediately after creation.`);
        }
        console.log(`Successfully created and retrieved profile for ${userId}`);
      } catch (creationError) {
        console.error(`Failed during user profile creation flow for ${userId}:`, creationError);
        throw new Error(`Could not ensure user profile exists for user ${userId}.`);
      }
    }

    // 5. Prepare Review Update Data
    const derivedName = deriveReviewerDisplayName(userProfile, review);
    const reviewUpdateData: ReviewUpdateData = {
      userId: userId,
      userDisplayName: derivedName,
      userPhotoUrl: userProfile.photoURL || null,
      status: 'verified' as ReviewStatus, // Change to 'published' if reviews go live immediately
      email_verified: true,
      updatedAt: FieldValue.serverTimestamp(),
      submittedEmail: FieldValue.delete(), 
      submittedName: FieldValue.delete(),
    };

    // 6. Prepare User Profile Update Data
    const userProfileUpdateData: UserProfileUpdateData = {
      reviewDisplayNameType: userProfile.reviewDisplayNameType || review.display_name_type,
      reviewCount: FieldValue.increment(1),
      lastReviewDate: review.createdAt.toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 7. Perform updates in a transaction (optional but recommended for atomicity)
    await db.runTransaction(async (transaction) => {
        transaction.update(reviewRef, reviewUpdateData);
        const userRef = db.collection('users').doc(userId);
        transaction.update(userRef, userProfileUpdateData as Record<string, any>);
    });

    console.log(`Review ${reviewId} verified successfully for user ${userId}`);
    return NextResponse.json({ success: true, message: 'Review verified successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying review:', error);
    return NextResponse.json({ error: 'Failed to verify review', details: error.message || 'Unknown error' }, { status: 500 });
  }
} 