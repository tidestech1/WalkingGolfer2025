'use client';

import { useEffect, useState, Suspense } from 'react';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/hooks/useAuth';
import { auth as firebaseClientAuth } from '@/lib/firebase/firebase';

// Define possible statuses
type VerificationStatus = 
  | 'idle' 
  | 'checking_link' 
  | 'needs_email' 
  | 'signing_in' 
  | 'getting_token'
  | 'calling_backend'
  | 'success' 
  | 'error';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading } = useAuth();
  const auth = firebaseClientAuth;
  
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState<string>('Verifying your email link...');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // Only run this effect once auth is loaded and status is idle
    if (authLoading || !auth || status !== 'idle') {
        if (authLoading) console.log('[VerifyEmail] Waiting for auth to load...');
        if (!auth) console.log('[VerifyEmail] Auth instance not available yet.');
        return;
    }

    console.log('[VerifyEmail] Auth loaded, starting verification process.');
    setStatus('checking_link');
    const link = window.location.href;
    console.log('[VerifyEmail] Checking URL:', link);

    if (isSignInWithEmailLink(auth, link)) {
        console.log('[VerifyEmail] Link is a valid sign-in link.');
        let storedEmail = window.localStorage.getItem('emailForSignIn');
        
        if (!storedEmail) {
            console.warn('[VerifyEmail] Email not found in local storage.');
            // Potentially prompt user for email here in a real app
            // For now, set error state
            setStatus('needs_email');
            setMessage('Could not find email for verification. Session might have expired. Please try submitting your review again.');
        } else {
            setEmail(storedEmail);
            setStatus('signing_in');
            console.log(`[VerifyEmail] Email found: ${storedEmail}. Attempting sign-in...`);
            
            signInWithEmailLink(auth, storedEmail, link)
                .then(async (result) => {
                    console.log('[VerifyEmail] signInWithEmailLink successful.');
                    window.localStorage.removeItem('emailForSignIn');
                    setStatus('getting_token');
                    setMessage('Sign-in successful. Finalizing review...');

                    const loggedInUser = result.user;
                    let idToken;
                    try {
                        console.log('[VerifyEmail] Getting ID token...');
                        idToken = await loggedInUser.getIdToken(true);
                        console.log('[VerifyEmail] Got ID token.');
                    } catch (tokenError) {
                        console.error("Error getting ID token:", tokenError);
                        throw new Error('Could not get session token after verification.');
                    }

                    if (!idToken) {
                        throw new Error('Authentication token missing after verification.');
                    }

                    const reviewId = searchParams.get('reviewId');
                    const courseId = searchParams.get('courseId');
                    console.log(`[VerifyEmail] reviewId: ${reviewId}, courseId: ${courseId}`);

                    if (!reviewId) {
                        throw new Error('Missing review ID in verification link.');
                    }
                    if (!courseId) {
                         console.warn('Course ID missing from verification link, redirect might go home.')
                         // Allow proceeding without courseId for now, but log warning
                    }

                    setStatus('calling_backend');
                    setMessage('Verifying review with server...');
                    console.log('[VerifyEmail] Calling backend /api/reviews/verify...');
                    
                    const response = await fetch('/api/reviews/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({ reviewId }),
                    });

                    const verifyResult = await response.json();
                    console.log('[VerifyEmail] Backend response status:', response.status);
                    console.log('[VerifyEmail] Backend response body:', verifyResult);

                    if (!response.ok) {
                        throw new Error(verifyResult.error || `Failed to verify review (status: ${response.status})`);
                    }

                    setStatus('success');
                    setMessage('Review successfully verified and published!');
                    console.log('[VerifyEmail] Verification successful! Redirecting...');

                    const redirectPath = courseId ? `/courses/${courseId}?verified=true` : '/';
                    setTimeout(() => {
                        router.push(redirectPath);
                    }, 3000);

                })
                .catch((error) => {
                    console.error('Error during signInWithEmailLink or backend call:', error);
                    setMessage(`Verification process failed: ${error.message || 'Unknown error'}`);
                    setStatus('error');
                });
        }
    } else {
        console.log('[VerifyEmail] Link is NOT a valid sign-in link.');
        setMessage('Invalid or expired verification link.');
        setStatus('error');
    }
  // Rerun when auth instance is ready, or if searchParams change (though unlikely needed)
  }, [auth, authLoading, status, searchParams, router]); 

  // Render different UI based on status
  if (status === 'idle' || status === 'checking_link' || status === 'signing_in' || status === 'getting_token' || status === 'calling_backend') {
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
        <p className="mt-2 text-sm text-gray-500">Redirecting shortly...</p>
      </div>
    );
  }

  // Handle error states (error, needs_email)
  return (
    <div className="text-center p-8">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
       </svg>
       <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verification Failed</h1>
       <p className="text-lg text-red-600">{message}</p>
       <Button asChild className="mt-6 w-full bg-blue-600 hover:bg-blue-700">
         <Link href="/"> 
           Go Home
         </Link>
       </Button>
    </div>
  );
}

// Main page component now just wraps the inner component in Suspense
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
           <Suspense fallback={<LoadingSpinner />}>
              <VerifyEmailInner />
           </Suspense>
       </div>
    </div>
  );
} 