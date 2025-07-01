import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore'; 
import { NextRequest, NextResponse } from 'next/server';
// Correct imports for Firebase Admin SDK Firestore

// Correctly import the getter functions
import { z } from 'zod'; // Assuming Zod is installed

import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/firebaseAdmin'; 
import { CourseReview, ReviewStatus, DisplayNameType } from '@/types/review'; // Removed CreateReviewInput as we use Zod type now
import crypto from 'crypto';
import { getKlaviyoClient, KlaviyoEvents } from '@/lib/klaviyo';
import { rateLimit, getRateLimitHeaders } from '@/lib/utils/rateLimiter';
import { shouldBypassRateLimit } from '@/lib/utils/adminWhitelist';
import { logger, ErrorSeverity } from '@/lib/utils/errorLogger';

// Get Firestore and Auth instances using the getter functions
// This also handles initialization internally
const db = getAdminFirestore();
const auth = getAdminAuth();

// Define the expected input schema using Zod for validation
const submitReviewSchema = z.object({
  // Fields from the review form (adjust based on the actual form component)
  courseId: z.string().min(1),
  walkabilityRating: z.number().min(1).max(5),
  isWalkable: z.boolean(),
  courseConditionRating: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  hillinessRating: z.number().min(1).max(5),
  distanceRating: z.number().min(1).max(5),
  costRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  walkingDate: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO 8601" }).optional(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  imageUrls: z.array(z.string().url()).optional(),

  // Fields from the pre-submission modal
  submittedEmail: z.string().email(),
  submittedName: z.string().optional(),
  display_name_type: z.enum(["full", "first_initial", "initials", "private"]),
});

// Type for the validated input data
type SubmitReviewData = z.infer<typeof submitReviewSchema>;

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();

    // Validate input data first to get email for bypass check
    const validationResult = submitReviewSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation Errors:", validationResult.error.errors);
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
    }
    const data: SubmitReviewData = validationResult.data;

    // Rate limiting with bypass for admin users
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!shouldBypassRateLimit(data.submittedEmail, undefined, clientIP)) {
      // Flexible rate limits: 50/hour during soft-launch, 3/hour in production
      const limit = process.env.SOFT_LAUNCH_MODE === 'true' ? 50 : 3;
      const rateLimitResult = rateLimit(`review_submit_${clientIP}`, limit, 60 * 60 * 1000);
      
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many review submissions. Please try again later.' }, 
          { 
            status: 429,
            headers: getRateLimitHeaders(rateLimitResult)
          }
        );
      }
    }

    // Check if a user with this email already exists
    const usersRef = db.collection('users');
    const userQuery = usersRef.where('email', '==', data.submittedEmail).limit(1);
    const userSnapshot = await userQuery.get();

    if (!userSnapshot.empty) {
      // User exists, prompt to log in
      console.log(`User with email ${data.submittedEmail} already exists. Prompting login.`);
      return NextResponse.json(
        { requiresLogin: true, email: data.submittedEmail, message: "An account with this email already exists. Please log in to submit your review." },
        { status: 409 } // 409 Conflict
      );
    }

    // Base object with required fields and fields guaranteed by validation
    const reviewToCreateBase: Omit<CourseReview, 'id' | 'submittedName' | 'imageUrls'> = {
      courseId: data.courseId,
      userId: null,
      userDisplayName: null,
      userPhotoUrl: null,
      submittedEmail: data.submittedEmail,
      status: 'pending' as ReviewStatus,
      email_verified: false,
      display_name_type: data.display_name_type as DisplayNameType,
      walkabilityRating: data.walkabilityRating,
      isWalkable: data.isWalkable,
      courseConditionRating: data.courseConditionRating,
      overallRating: data.overallRating,
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

    // Conditionally add optional fields if they exist in the validated data
    const reviewToCreate: Omit<CourseReview, 'id'> = { ...reviewToCreateBase };
    if (data.submittedName) {
      reviewToCreate.submittedName = data.submittedName;
    }
    if (data.imageUrls && data.imageUrls.length > 0) {
      reviewToCreate.imageUrls = data.imageUrls;
    }

    // Add the pending review to Firestore using Admin SDK syntax
    const reviewRef = await db.collection('reviews').add(reviewToCreate);
    const pendingReviewId = reviewRef.id;
    const courseId = data.courseId;

    // --- NEW: Generate secure token and expiry ---
    const rawToken = crypto.randomUUID();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store the hashed token and expiry in the review document
    await reviewRef.update({
      verificationTokenHash: hashedToken,
      verificationTokenExpiresAt: expiresAt,
      status: 'pending',
      email_verified: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Construct the verification link
    const frontendBaseUrl = process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000';
    const verificationUrl = `${frontendBaseUrl}/verify-review?token=${rawToken}`;

    // --- Send Klaviyo event for verification email ---
    try {
      const klaviyo = getKlaviyoClient();
      await klaviyo.trackEvent(KlaviyoEvents.REVIEW_SUBMITTED, data.submittedEmail, {
        name: data.submittedName || '',
        reviewId: pendingReviewId,
        courseId,
        verificationUrl,
      });
    } catch (err) {
      console.error('Error sending Klaviyo event:', err);
      // Optionally: delete the review or mark as error
      return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
    }

    // Return success, do not return the token or link
    return NextResponse.json({ 
        success: true, 
        message: 'Review submitted pending verification. Please check your email.',
        pendingReviewId: pendingReviewId
     }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting review:', error);
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email format provided.' }, { status: 400 });
    }
    // No need to specifically handle 'auth/email-already-exists' here, sign-in link handles it.
    return NextResponse.json({ error: 'Failed to submit review', details: error.message || 'Unknown error' }, { status: 500 });
  }
} 