'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CourseReview } from '@/types/review';

// Define possible statuses for the verification process
type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

// Define the expected success response structure from the backend
interface VerifySuccessResponse {
  success: boolean;
  message: string;
  courseId?: string; // Optional: Backend might return courseId for redirection
  review?: CourseReview; // Optional: Backend might return the verified review
}

// Define the expected error response structure from the backend
interface VerifyErrorResponse {
  success: boolean;
  error: string;
}

function VerifyReviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState<string>('Verifying your review link...');
  const [courseIdForRedirect, setCourseIdForRedirect] = useState<string | null>(null);

  useEffect(() => {
    // Only run verification once when the component mounts and status is idle
    if (status !== 'idle') {
      return;
    }

    const token = searchParams.get('token');

    if (!token) {
      setMessage('Invalid verification link: No token provided.');
      setStatus('error');
      return;
    }

    console.log('[VerifyReview] Token found:', token);
    setStatus('verifying');
    setMessage('Verifying your review with the server...');

    // Call the backend API endpoint to verify the custom token
    // NOTE: This endpoint needs to be created next!
    fetch('/api/reviews/verify-token', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const result = await res.json();
        console.log('[VerifyReview] Backend response status:', res.status);
        console.log('[VerifyReview] Backend response body:', result);

        if (!res.ok) {
          // Throw an error with the message from the backend if available
          throw new Error((result as VerifyErrorResponse).error || `Verification failed with status: ${res.status}`);
        }
        
        const successResult = result as VerifySuccessResponse;
        setMessage(successResult.message || 'Review verified successfully!');
        setStatus('success');
        
        // Store courseId if backend returns it for redirection
        if (successResult.courseId) {
            setCourseIdForRedirect(successResult.courseId);
            // Optional: Redirect after a delay
            // setTimeout(() => router.push(`/courses/${successResult.courseId}?review_verified=true`), 3000);
        }
      })
      .catch((err) => {
        console.error('[VerifyReview] Verification error:', err);
        // Display the error message caught from the fetch or thrown from the response check
        setMessage(err.message || 'An unknown error occurred during verification.');
        setStatus('error');
      });
      
  // Only depend on searchParams, run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- Render UI based on status --- 

  if (status === 'idle' || status === 'verifying') {
    return (
        <div className="text-center p-8">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-gray-600">{message}</p>
        </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center p-8">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verification Successful!</h1>
        <p className="text-lg text-gray-600">{message}</p>
        {courseIdForRedirect ? (
             <Button asChild className="mt-6">
                 <Link href={`/courses/${courseIdForRedirect}?review_verified=true`}>View Course</Link>
             </Button>
         ) : (
             <Button asChild className="mt-6">
                 <Link href="/">Go Home</Link>
             </Button>
         )}
      </div>
    );
  }

  // Error status
  return (
    <div className="text-center p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
       <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verification Failed</h1>
       <p className="text-lg text-red-600">{message}</p>
       <Button asChild className="mt-6">
         <Link href="/"> 
           Go Home
         </Link>
       </Button>
    </div>
  );
}

// Main page component wraps the inner component in Suspense
// Suspense is needed because VerifyReviewInner uses useSearchParams
export default function VerifyReviewPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
           <Suspense fallback={<div className="text-center p-8"><LoadingSpinner /><p>Loading verification...</p></div>}>
              <VerifyReviewInner />
           </Suspense>
       </div>
    </div>
  );
} 