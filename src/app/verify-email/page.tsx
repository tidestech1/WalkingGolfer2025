'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    getAuth, 
    isSignInWithEmailLink, 
    signInWithEmailLink 
} from 'firebase/auth';
import { auth as firebaseClientAuth } from '@/lib/firebase/firebase'; // Client auth instance
import { useAuth } from '@/lib/hooks/useAuth'; // Auth context hook
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'; // Correct named import

// Define the component that uses searchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authContext = useAuth(); // Get auth context methods
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing verification link...');

  useEffect(() => {
    // Ensure client-side execution
    if (typeof window === 'undefined') return;

    const link = window.location.href;
    const reviewId = searchParams.get('reviewId');

    // Check if Firebase auth is available
    if (!firebaseClientAuth) {
        setMessage('Firebase authentication service is not available.');
        setStatus('error');
        return;
    }

    // 1. Check if it's a sign-in link
    if (isSignInWithEmailLink(firebaseClientAuth, link)) {
      setStatus('verifying');
      // 2. Get email from local storage
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // Ask user for email if not found (more robust flow)
        // For now, show error
        setMessage('Verification session expired or invalid. Please try submitting your review again.');
        setStatus('error');
        return;
      }

      // 3. Sign in user
      signInWithEmailLink(firebaseClientAuth, email, link)
        .then(async (result) => {
          // 4. Clear the email from storage
          window.localStorage.removeItem('emailForSignIn');
          setMessage('Email verified successfully! Finalizing review...');
          
          // 5. Get ID Token
          const user = result.user;
          let idToken;
          try {
            idToken = await user.getIdToken(true); // Force refresh token
          } catch (tokenError) {
            console.error("Error getting ID token after sign-in:", tokenError);
            throw new Error('Could not authenticate session after verification.');
          }

          if (!idToken) {
            throw new Error('Authentication token is missing after verification.');
          }

          // 6. Check for reviewId
          if (!reviewId) {
            throw new Error('Missing review ID in verification link.');
          }

          // 7. Call backend verification API
          const response = await fetch('/api/reviews/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ reviewId }),
          });

          const verifyResult = await response.json();

          if (!response.ok) {
            throw new Error(verifyResult.error || `Failed to verify review (status: ${response.status})`);
          }

          // 8. Success!
          setMessage('Review successfully verified and published!');
          setStatus('success');
          
          // Redirect back to the course page after a short delay
          setTimeout(() => {
            router.push(`/courses/${searchParams.get('courseIdFromReview') || reviewId}?verified=true`); // Assuming courseId is somehow passed or derivable
            // Or just redirect home if course context is lost: router.push('/');
          }, 3000); // 3 second delay

        })
        .catch((error) => {
          console.error('Error during email link sign-in or verification API call:', error);
          setMessage(`Verification failed: ${error.message || 'Unknown error'}`);
          setStatus('error');
        });
    } else {
      setMessage('Invalid or expired verification link.');
      setStatus('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Depend on searchParams to re-run if URL changes

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
      {status === 'loading' || status === 'verifying' ? (
        <>
          <LoadingSpinner />
          <p className="mt-4 text-lg text-gray-600">{message}</p>
        </>
      ) : status === 'success' ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verification Successful!</h1>
          <p className="text-lg text-gray-600">{message}</p>
          <p className="mt-2 text-sm text-gray-500">Redirecting shortly...</p>
        </>
      ) : (
        <>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verification Failed</h1>
           <p className="text-lg text-red-600">{message}</p>
           {/* Optionally add a button to retry or go home */}
           <button 
             onClick={() => router.push('/')} 
             className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
             Go Home
           </button>
        </>
      )}
    </div>
  );
}

// Main page component wraps the content in Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[300px]"><LoadingSpinner /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
} 