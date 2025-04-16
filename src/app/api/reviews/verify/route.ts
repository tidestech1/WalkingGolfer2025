import { UserRecord } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { updateCourseRatingsFromReview } from '@/lib/firebase/courseUtils';
import { CreateUserProfileInput } from '@/lib/firebase/userUtils';
import { deriveReviewerDisplayName } from '@/lib/utils/reviewUtils';
import { CourseReview } from '@/types/review';
import { UserProfile } from '@/types/user';
import { CourseRatingUpdateLog } from '@/types/log';
import { GolfCourse } from '@/types/course';

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
    let review: CourseReview | null = null;

    // Run transaction which includes fetching review first
    await db.runTransaction(async (transaction) => {
        const reviewSnap = await transaction.get(reviewRef);

        if (!reviewSnap.exists) {
            // Throw error inside transaction to abort
            throw new Error('Review not found');
        }
        // Store the review data for later use
        review = reviewSnap.data() as CourseReview;

        if (review.status !== 'pending') {
            throw new Error('Review is not pending verification');
        }
        if (review.submittedEmail !== userEmail) {
            console.warn(`Verification attempt mismatch: User ${userId} (${userEmail}) tried to verify review ${reviewId} submitted by ${review.submittedEmail}`);
            throw new Error('Email mismatch');
        }

        // 4. Fetch or Create User Profile (within transaction)
        const userRef = db.collection('users').doc(userId);
        let userProfileSnap = await transaction.get(userRef);
        let userProfile: UserProfile | null = null;

        // 5. Read Course Document EARLY
        const courseRef = db.collection('courses').doc(review.courseId);
        const courseSnap = await transaction.get(courseRef);
        if (!courseSnap.exists) {
             console.error(`[Verify Review] Course ${review.courseId} referenced by review ${reviewId} not found.`);
             throw new Error(`Course ${review.courseId} not found.`);
        }
        const courseData = courseSnap.data() as GolfCourse;

        if (!userProfileSnap.exists) {
            console.log(`User profile for ${userId} not found, creating one...`);
            try {
                const firebaseUser: UserRecord = await auth.getUser(userId);
                const createProfileInput: CreateUserProfileInput = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || null,
                    displayName: firebaseUser.displayName || null,
                    photoURL: firebaseUser.photoURL || null,
                };
                // NOTE: createUserProfile likely doesn't operate within a transaction.
                // It might be safer to just `transaction.set` the basic profile data here.
                // Let's create the profile data directly in the transaction for atomicity.
                const newProfileData: UserProfile = {
                    id: userId,
                    email: createProfileInput.email ?? '',
                    displayName: createProfileInput.displayName ?? 'Anonymous User',
                    photoURL: createProfileInput.photoURL ?? null,
                    reviewDisplayNameType: review.display_name_type, // Use preference from review initially
                    reviewCount: 0, // Start at 0 before incrementing
                    createdAt: FieldValue.serverTimestamp() as any,
                    updatedAt: FieldValue.serverTimestamp() as any,
                    // Add other default fields from UserProfile if necessary
                };
                transaction.set(userRef, newProfileData);
                userProfile = newProfileData; // Use the data we just set
                console.log(`Prepared new profile for ${userId} in transaction.`);
            } catch (creationError) {
                console.error(`Failed during user profile creation setup for ${userId}:`, creationError);
                throw new Error(`Could not ensure user profile exists for user ${userId}.`);
            }
        } else {
            userProfile = userProfileSnap.data() as UserProfile;
        }

        // Ensure userProfile is not null before proceeding
        if (!userProfile) {
             throw new Error(`User profile could not be obtained or created for ${userId}.`);
        }

        // 6. Prepare Review Update Data
        const derivedName = deriveReviewerDisplayName(userProfile, review);
        const reviewUpdateData: ReviewUpdateData = {
            userId: userId,
            userDisplayName: derivedName,
            userPhotoUrl: userProfile.photoURL || null,
            status: 'published', // Changed to 'published' as review is now live
            email_verified: true,
            updatedAt: FieldValue.serverTimestamp(),
            submittedEmail: FieldValue.delete(),
            submittedName: FieldValue.delete(),
        };

        // 7. Prepare User Profile Update Data
        const userProfileUpdateData: UserProfileUpdateData = {
            reviewDisplayNameType: userProfile.reviewDisplayNameType || review.display_name_type,
            reviewCount: FieldValue.increment(1),
            // Ensure createdAt is treated as Date for comparison/conversion
            lastReviewDate: (review.createdAt instanceof Timestamp ? review.createdAt.toDate() : new Date(review.createdAt)).toISOString(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        // 8. Perform updates (Review and User)
        transaction.update(reviewRef, reviewUpdateData);
        transaction.update(userRef, userProfileUpdateData as Record<string, any>);

        // 9. Update Course Ratings
        if (!review) {
            throw new Error('Review data is missing unexpectedly.');
        }
        await updateCourseRatingsFromReview(transaction, review.courseId, review, courseData);

        // 10. Create Rating Update Log Entry
        const logRef = db.collection('courseRatingUpdates').doc(); // Auto-generate ID
        const logData: Omit<CourseRatingUpdateLog, 'id' | 'timestamp'> & { timestamp: FieldValue } = {
            courseId: review.courseId,
            triggeringReviewId: reviewId, // reviewId from the request validation
            triggeringUserId: userId, // userId from token verification
            timestamp: FieldValue.serverTimestamp(),
            reviewRatings: {
                overall: review.overallRating,
                cost: review.costRating,
                condition: review.courseConditionRating,
                hilliness: review.hillinessRating,
                distance: review.distanceRating,
                weighted: review.walkabilityRating,
            }
        };
        transaction.set(logRef, logData);
    });

    console.log(`Review ${reviewId} verified successfully for user ${userId}`);
    return NextResponse.json({ success: true, message: 'Review verified successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying review:', error);
    // Provide more specific error responses based on transaction errors
    if (error.message === 'Review not found' || error.message === 'User profile could not be obtained or created for user ${userId}.' || error.message === 'Review data is missing unexpectedly.') {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === 'Review is not pending verification') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message === 'Email mismatch') {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to verify review', details: error.message || 'Unknown error' }, { status: 500 });
  }
} 