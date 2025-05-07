import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { updateCourseRatingsFromReview } from '@/lib/firebase/courseUtils'; // Import the utility
import { CourseReview } from '@/types/review';
import { GolfCourse } from '@/types/course'; // Import course type
import { CourseRatingUpdateLog } from '@/types/log'; // Import log type

// Potentially define a broader type for reading pending reviews
interface PendingReview extends CourseReview {
  verificationTokenHash?: string;
  verificationTokenExpiresAt?: Timestamp;
}

const db = getAdminFirestore();

// Define the expected input schema using Zod
const verifyTokenSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format." }), // Assuming UUID tokens
});

export async function POST(request: NextRequest) {
  console.log('[VerifyToken] Received verification request');
  try {
    const rawData = await request.json();

    // 1. Validate input data
    const validationResult = verifyTokenSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("[VerifyToken] Validation Errors:", validationResult.error.errors);
      return NextResponse.json({ success: false, error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
    }
    const { token: rawToken } = validationResult.data;
    console.log('[VerifyToken] Raw token received:', rawToken);

    // 2. Hash the received token
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    console.log('[VerifyToken] Hashed token:', hashedToken);

    // 3. Query Firestore for a matching pending review
    const now = Timestamp.now();
    const reviewsRef = db.collection('reviews');
    const query = reviewsRef
      .where('verificationTokenHash', '==', hashedToken)
      .where('status', '==', 'pending')
      // Note: Firestore requires an index for inequality filters on different fields
      // For simplicity here, we filter expiry after fetching.
      // Consider creating a composite index if performance becomes an issue.
      .limit(1);

    const snapshot = await query.get();

    // Find the first document that is not expired
    const validDoc = snapshot.docs.find(doc => {
        const data = doc.data() as PendingReview; // Use broader type
        return data.verificationTokenExpiresAt && data.verificationTokenExpiresAt > now;
    });

    if (!validDoc) {
      console.warn('[VerifyToken] No matching pending review found for hash or token expired:', hashedToken);
       // Check if it exists but is expired or already verified
       const existingCheck = await reviewsRef.where('verificationTokenHash', '==', hashedToken).limit(1).get();
       if (!existingCheck.empty) {
           const docData = existingCheck.docs[0]?.data() as PendingReview | undefined;
           // Check properties safely
           if (docData?.status !== 'pending') {
             return NextResponse.json({ success: false, error: 'This review has already been verified.' }, { status: 409 }); // Conflict
           } else if (docData?.verificationTokenExpiresAt && docData.verificationTokenExpiresAt <= now) {
             return NextResponse.json({ success: false, error: 'Verification token has expired.' }, { status: 410 }); // Gone
           }
       }
      return NextResponse.json({ success: false, error: 'Invalid or expired verification token.' }, { status: 404 });
    }

    // 4. Review found, update it within a transaction
    const reviewId = validDoc.id;
    const reviewData = validDoc.data() as PendingReview; // Use broader type initially
    const courseId = reviewData.courseId;
    console.log(`[VerifyToken] Found matching review: ${reviewId} for course ${courseId}`);

    if (!courseId) {
        console.error(`[VerifyToken] Review ${reviewId} is missing courseId.`);
        return NextResponse.json({ success: false, error: 'Review data is incomplete (missing courseId).' }, { status: 500 });
    }

    try {
        await db.runTransaction(async (transaction) => {
            const reviewRef = db.collection('reviews').doc(reviewId);
            const courseRef = db.collection('courses').doc(courseId);
            
            // Fetch review and course within transaction
            const [freshReviewSnap, freshCourseSnap] = await Promise.all([
                transaction.get(reviewRef),
                transaction.get(courseRef)
            ]);
            
            if (!freshReviewSnap.exists) {
                 console.error(`[VerifyToken] Review ${reviewId} disappeared during transaction.`);
                 throw new Error('Review not found during transaction.');
            }
             if (!freshCourseSnap.exists) {
                 console.error(`[VerifyToken] Course ${courseId} disappeared during transaction.`);
                 throw new Error('Course not found during transaction.');
             }

            const freshReviewData = freshReviewSnap.data() as PendingReview;
            const freshCourseData = freshCourseSnap.data() as GolfCourse;

            // Double-check status and expiry inside transaction
            if (freshReviewData.status !== 'pending') {
                 console.warn(`[VerifyToken] Review ${reviewId} was already verified (concurrently?).`);
                 throw new Error('Review already verified.');
            }
            // Safe check for expiry timestamp existence and value
            if (!freshReviewData.verificationTokenExpiresAt || freshReviewData.verificationTokenExpiresAt <= now) {
                console.warn(`[VerifyToken] Review ${reviewId} token expired concurrently.`);
                throw new Error('Token expired.');
            }

            // Prepare review update data
            const reviewUpdateData: Record<string, any> = {
                status: 'published' as const,
                email_verified: true,
                updatedAt: FieldValue.serverTimestamp(),
                verificationTokenHash: FieldValue.delete(),
                verificationTokenExpiresAt: FieldValue.delete(),
                // Keep submittedEmail/Name for potential linking later
                // submittedEmail: FieldValue.delete(), 
                // submittedName: FieldValue.delete(), 
            };
            transaction.update(reviewRef, reviewUpdateData);
            console.log(`[VerifyToken] Updated review ${reviewId} status to published.`);

            // --- Update Course Ratings --- 
            // Ensure all required rating fields exist on freshReviewData before calling
            if (freshReviewData.overallRating != null && 
                freshReviewData.costRating != null && 
                freshReviewData.courseConditionRating != null && 
                freshReviewData.hillinessRating != null && 
                freshReviewData.distanceRating != null && 
                freshReviewData.walkabilityRating != null) 
            {
                 await updateCourseRatingsFromReview(
                     transaction, 
                     courseId,
                     {
                         overallRating: freshReviewData.overallRating,
                         costRating: freshReviewData.costRating,
                         courseConditionRating: freshReviewData.courseConditionRating,
                         hillinessRating: freshReviewData.hillinessRating,
                         distanceRating: freshReviewData.distanceRating,
                         walkabilityRating: freshReviewData.walkabilityRating
                     },
                     freshCourseData
                 );
                 console.log(`[VerifyToken] Updated ratings for course ${courseId}`);

                 // --- Add Rating Update Log Entry --- 
                 const logRef = db.collection('courseRatingUpdates').doc();
                 const logData: Omit<CourseRatingUpdateLog, 'id' | 'timestamp'> & { timestamp: FieldValue } = {
                     courseId: courseId,
                     triggeringReviewId: reviewId,
                     triggeringUserId: null, // Set to null as user is not authenticated here
                     timestamp: FieldValue.serverTimestamp(),
                     reviewRatings: {
                         overall: freshReviewData.overallRating,
                         cost: freshReviewData.costRating,
                         condition: freshReviewData.courseConditionRating,
                         hilliness: freshReviewData.hillinessRating,
                         distance: freshReviewData.distanceRating,
                         weighted: freshReviewData.walkabilityRating,
                     }
                 };
                 transaction.set(logRef, logData);
                 console.log(`[VerifyToken] Added courseRatingUpdates log entry for review ${reviewId}`);
            } else {
                 console.warn(`[VerifyToken] Review ${reviewId} is missing one or more rating fields, skipping course rating update.`);
            }
            // --- End Course Rating Update --- 

            // NOTE: User profile updates (reviewCount, etc.) are not handled here.
        });

        console.log(`[VerifyToken] Review ${reviewId} successfully verified and published, course ratings updated.`);
        return NextResponse.json({
            success: true,
            message: 'Review verified successfully!',
            courseId: courseId // Return courseId for redirection
        }, { status: 200 });

    } catch (transactionError: any) {
        console.error(`[VerifyToken] Transaction failed for review ${reviewId}:`, transactionError);
        if (transactionError.message === 'Review already verified.') {
             return NextResponse.json({ success: false, error: 'This review has already been verified.' }, { status: 409 });
        }
        if (transactionError.message === 'Token expired.') {
             return NextResponse.json({ success: false, error: 'Verification token has expired.' }, { status: 410 });
        }
        if (transactionError.message === 'Review not found during transaction.' || transactionError.message === 'Course not found during transaction.') {
             return NextResponse.json({ success: false, error: 'Required data not found.' }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Failed to update review status.', details: transactionError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[VerifyToken] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process verification request', details: error.message || 'Unknown error' }, { status: 500 });
  }
} 