import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getRateLimitHeaders } from '@/lib/utils/rateLimiter';
import { shouldBypassRateLimit } from '@/lib/utils/adminWhitelist';

import { updateCourseRatingsFromReview } from '@/lib/firebase/courseUtils';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { getUserProfileAdmin } from '@/lib/firebase/userUtils';
import { GolfCourse } from '@/types/course';
import { CourseRatingUpdateLog } from '@/types/log';
import { CourseReview, ReviewStatus } from '@/types/review';
import { UserProfile } from '@/types/user';


const db = getAdminFirestore();
const auth = getAdminAuth();

// Zod schema for authenticated review submission (excludes email/name/display_type)
const authenticatedSubmitSchema = z.object({
  courseId: z.string().min(1),
  walkabilityRating: z.number().min(1).max(5),
  isWalkable: z.boolean(),
  courseConditionRating: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  courseQualityRating: z.number().min(1).max(5),
  hillinessRating: z.number().min(1).max(5),
  distanceRating: z.number().min(1).max(5),
  costRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  walkingDate: z.string().datetime().optional(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  imageUrls: z.array(z.string().url()).optional(),
});
type AuthenticatedSubmitData = z.infer<typeof authenticatedSubmitSchema>;

// Reusing or adapting the display name derivation logic
// Note: This version doesn't need the 'review' object's submittedName/display_type
function deriveAuthenticatedDisplayName(profile: UserProfile): string {
  const nameToUse = (profile.displayName || 'Authenticated User').trim();
  if (!nameToUse) {
return 'Authenticated User';
} 

  switch (profile.reviewDisplayNameType) {
    case 'full':
      return nameToUse;
    case 'first_initial':
      const parts = nameToUse.split(/\s+/);
      return parts.length > 1 ? `${parts[0]} ${parts.slice(1).map(n => n[0]).join('.')}.` : nameToUse;
    case 'initials':
      return nameToUse.split(/\s+/).map(n => n[0]).join('.') + '.';
    case 'private':
      return 'Private Reviewer';
    default: // Default to full if preference not set or unknown
      return nameToUse;
  }
}

// Define a more accurate type for the Firestore user profile update payload
type UserProfileUpdatePayload = {
    // Allow fields from UserProfile (except immutable ones) to be their original type OR FieldValue
    [K in keyof Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>]?: Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>[K] | FieldValue;
  } & {
      // Explicitly require updatedAt to be FieldValue for the update operation
      updatedAt: FieldValue;
      // Explicitly allow reviewCount to be FieldValue
      reviewCount?: FieldValue;
  };

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Bearer token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: Malformed token' }, { status: 401 });
    }
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Check if user should bypass rate limiting (admin users during soft-launch)
    if (!shouldBypassRateLimit(userEmail, userId)) {
      // Rate limiting: 5 authenticated reviews per user per day (or more during soft-launch)
      const limit = process.env.SOFT_LAUNCH_MODE === 'true' ? 100 : 5;
      const rateLimitResult = rateLimit(`auth_review_${userId}`, limit, 24 * 60 * 60 * 1000);
      
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many reviews submitted today. Please try again tomorrow.' }, 
          { 
            status: 429,
            headers: getRateLimitHeaders(rateLimitResult)
          }
        );
      }
    }

    // 2. Input Validation
    const rawData = await request.json();
    const validationResult = authenticatedSubmitSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
    }
    const data: AuthenticatedSubmitData = validationResult.data;

    // 3. Fetch User Profile (Must exist for authenticated submission)
    const userProfile = await getUserProfileAdmin(userId);
    if (!userProfile) {
      console.error(`Authenticated user ${userId} attempting to submit review, but profile not found.`);
      // This case should ideally not happen if profile creation is robust on sign-up/first verification
      return NextResponse.json({ error: 'User profile not found. Cannot submit review.' }, { status: 404 });
    }

    // 4. Prepare Review Data (Base)
    const userDisplayName = deriveAuthenticatedDisplayName(userProfile);
    // Base object excluding optional fields that need conditional logic
    const reviewDataBase: Omit<CourseReview, 'id' | 'cartExperience' | 'imageUrls'> = {
      courseId: data.courseId,
      userId: userId,
      userDisplayName: userDisplayName,
      userPhotoUrl: userProfile.photoURL || null,
      status: 'published' as ReviewStatus,
      email_verified: true, 
      display_name_type: userProfile.reviewDisplayNameType || 'full',
      isWalkable: data.isWalkable,
      walkabilityRating: data.walkabilityRating,
      courseConditionRating: data.courseConditionRating,
      overallRating: data.overallRating,
      courseQualityRating: data.courseQualityRating,
      hillinessRating: data.hillinessRating,
      distanceRating: data.distanceRating,
      costRating: data.costRating,
      comment: data.comment || '',
      walkingDate: data.walkingDate ? new Date(data.walkingDate) : null,
      pros: data.pros,
      cons: data.cons,
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    // Conditionally add optional fields 
    const reviewData: Omit<CourseReview, 'id'> = { ...reviewDataBase };
    if (data.imageUrls && data.imageUrls.length > 0) {
      reviewData.imageUrls = data.imageUrls;
    }

    // 5. Prepare User Profile Update using the corrected type
    const userProfileUpdateData: UserProfileUpdatePayload = {
      reviewCount: FieldValue.increment(1), // Type matches now
      lastReviewDate: new Date().toISOString(), // Type matches string | undefined
      updatedAt: FieldValue.serverTimestamp(), // Type matches now
    };

    // 6. Perform Transaction
    const reviewCollection = db.collection('reviews');
    const userRef = db.collection('users').doc(userId);
    const validatedReviewData = data; // Rename for clarity below
    const newReviewRef = await db.runTransaction(async (transaction) => {
        // Get course data within transaction
        const courseRef = db.collection('courses').doc(validatedReviewData.courseId);
        const courseSnap = await transaction.get(courseRef);
        if (!courseSnap.exists) {
          throw new Error(`Course with ID ${validatedReviewData.courseId} not found.`);
        }
        const courseData = courseSnap.data() as GolfCourse;

        const tempReviewRef = reviewCollection.doc();
        transaction.set(tempReviewRef, reviewData);
        transaction.update(userRef, userProfileUpdateData as Record<string, any>);

        // Pass fetched courseData as the 4th argument
        await updateCourseRatingsFromReview(transaction, validatedReviewData.courseId, validatedReviewData, courseData);

        // --- Add Rating Update Log Entry --- 
        const logRef = db.collection('courseRatingUpdates').doc();
        const logData: Omit<CourseRatingUpdateLog, 'id' | 'timestamp'> & { timestamp: FieldValue } = {
            courseId: validatedReviewData.courseId,
            triggeringReviewId: tempReviewRef.id, // Use the ID of the review being created
            triggeringUserId: userId, // userId from token verification
            timestamp: FieldValue.serverTimestamp(),
            reviewRatings: {
                overall: validatedReviewData.overallRating,
                cost: validatedReviewData.costRating,
                condition: validatedReviewData.courseConditionRating,
                hilliness: validatedReviewData.hillinessRating,
                distance: validatedReviewData.distanceRating, // Added this field based on schema
                weighted: validatedReviewData.walkabilityRating,
            }
        };
        transaction.set(logRef, logData);
        // --- End log entry creation ---

        return tempReviewRef;
    });

    console.log(`Review ${newReviewRef.id} submitted successfully by authenticated user ${userId}`);
    return NextResponse.json({ success: true, reviewId: newReviewRef.id, message: 'Review submitted successfully.' }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting authenticated review:', error);
    return NextResponse.json({ error: 'Failed to submit review', details: error.message || 'Unknown error' }, { status: 500 });
  }
} 