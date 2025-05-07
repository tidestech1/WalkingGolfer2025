import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';

import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { CourseReview } from '@/types/review';

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
    console.log(`[VerifyToken] Found matching review: ${reviewId}`);

    try {
        await db.runTransaction(async (transaction) => {
            const reviewRef = db.collection('reviews').doc(reviewId);
            const freshSnap = await transaction.get(reviewRef);
            
            if (!freshSnap.exists) {
                 console.error(`[VerifyToken] Review ${reviewId} disappeared during transaction.`);
                 throw new Error('Review not found during transaction.');
            }

            // Use broader type for reading fetched data
            const freshData = freshSnap.data() as PendingReview;

            // Double-check status and expiry inside transaction
            if (freshData.status !== 'pending') {
                 console.warn(`[VerifyToken] Review ${reviewId} was already verified (concurrently?).`);
                 throw new Error('Review already verified.');
            }
            // Safe check for expiry timestamp existence and value
            if (!freshData.verificationTokenExpiresAt || freshData.verificationTokenExpiresAt <= now) {
                console.warn(`[VerifyToken] Review ${reviewId} token expired concurrently.`);
                throw new Error('Token expired.');
            }

            // Prepare update data
            // Type assertion might be needed if the base CourseReview type doesn't allow these fields
            const updateData: Record<string, any> = {
                status: 'published' as const,
                email_verified: true,
                updatedAt: FieldValue.serverTimestamp(),
                verificationTokenHash: FieldValue.delete(), // Remove token hash
                verificationTokenExpiresAt: FieldValue.delete(), // Remove expiry
            };

            console.log(`[VerifyToken] Updating review ${reviewId} status to published.`);
            transaction.update(reviewRef, updateData);
        });

        console.log(`[VerifyToken] Review ${reviewId} successfully verified and published.`);
        return NextResponse.json({
            success: true,
            message: 'Review verified successfully!',
            // Use original reviewData read outside transaction for courseId
            courseId: reviewData.courseId 
        }, { status: 200 });

    } catch (transactionError: any) {
        console.error(`[VerifyToken] Transaction failed for review ${reviewId}:`, transactionError);
        if (transactionError.message === 'Review already verified.') {
             return NextResponse.json({ success: false, error: 'This review has already been verified.' }, { status: 409 });
        }
        if (transactionError.message === 'Token expired.') {
             return NextResponse.json({ success: false, error: 'Verification token has expired.' }, { status: 410 });
        }
        return NextResponse.json({ success: false, error: 'Failed to update review status.', details: transactionError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[VerifyToken] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process verification request', details: error.message || 'Unknown error' }, { status: 500 });
  }
} 