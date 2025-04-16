import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore'; 
import { NextRequest, NextResponse } from 'next/server';
// Correct imports for Firebase Admin SDK Firestore

// Correctly import the getter functions
import { z } from 'zod'; // Assuming Zod is installed

import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/firebaseAdmin'; 
import { CourseReview, ReviewStatus, DisplayNameType } from '@/types/review'; // Removed CreateReviewInput as we use Zod type now

// Get Firestore and Auth instances using the getter functions
// This also handles initialization internally
const db = getAdminFirestore();
const auth = getAdminAuth();

// Define the expected input schema using Zod for validation
const submitReviewSchema = z.object({
  // Fields from the review form (adjust based on the actual form component)
  courseId: z.string().min(1),
  walkabilityRating: z.number().min(1).max(5),
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

    // Validate input data
    const validationResult = submitReviewSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation Errors:", validationResult.error.errors);
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
    }
    const data: SubmitReviewData = validationResult.data;

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

    // Generate the email verification/sign-in link
    const frontendBaseUrl = process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'; 
    const continueUrl = `${frontendBaseUrl}/verify-email?reviewId=${pendingReviewId}&courseId=${courseId}`;
    
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };

    const emailLink = await auth.generateSignInWithEmailLink(data.submittedEmail, actionCodeSettings);

    // --- IMPORTANT --- 
    // The Firebase Admin SDK (backend) *generates* the link, but does NOT send the email.
    // You MUST trigger sending this link from your frontend using the Firebase Client SDK's 
    // `sendSignInLinkToEmail` function OR use a separate backend email service (e.g., SendGrid, Mailgun) 
    // triggered from this API route, passing the generated 'emailLink'.
    // This API route currently ONLY saves the pending review and generates the link.
    // The frontend MUST handle the email sending step after calling this API.
    // Logging the link here is only for debugging during development.
    console.log(`[API INFO] Generated email link for ${data.submittedEmail} (Review ID: ${pendingReviewId}).`);

    // Return success, indicating the client should proceed with email sending/user notification
    return NextResponse.json({ 
        success: true, 
        message: 'Review submitted pending verification. Please check your email.',
        pendingReviewId: pendingReviewId,
        emailLink: emailLink
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