"use client";

import { useEffect, useState, Suspense } from 'react';

import { getAuth, applyActionCode, checkActionCode, Auth, signInWithEmailLink, ActionCodeInfo } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { app as firebaseApp } from '@/lib/firebase/firebase'; // Import the exported app instance
import { updateUserProfile, getUserProfile } from '@/lib/firebase/userUtils';

// Define possible statuses for the action handler
type ActionStatus = 'loading' | 'success' | 'error' | 'invalid' | 'signing_in' | 'calling_backend';

function ActionHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ActionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    if (!mode || !actionCode) {
      console.warn('Auth Action Handler: Missing mode or actionCode.');
      setStatus('invalid');
      setErrorMessage('Invalid or incomplete action link.');
      return;
    }

    if (!firebaseApp) {
      console.error('Auth Action Handler: Firebase App not initialized.');
      setStatus('error');
      setErrorMessage('Application error. Please try again later.');
      return;
    }

    // --- Define auth instance here ---
    let auth: Auth | null = null;
    try {
        auth = getAuth(firebaseApp);
    } catch (initError) {
        console.error('Auth Action Handler: Error getting Auth instance:', initError);
        setStatus('error');
        setErrorMessage('Application error initializing authentication.');
        return;
    }
    // --- Ensure auth is not null before proceeding ---
    if (!auth) {
        console.error('Auth Action Handler: Failed to get Auth instance.');
        setStatus('error');
        setErrorMessage('Application error initializing authentication.');
        return;
    }

    const handleAction = async (authInstance: Auth) => {
      try {
        // --- Get continueUrl from the main URL parameters --- 
        // Firebase usually appends the original continueUrl to the action handler URL
        // We need this to extract our custom reviewId and courseId later for the signIn mode
        const actionLink = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        // Note: Firebase might not pass continueUrl directly as a top-level param on the action handler URL.
        // It's usually embedded *within* the link sent via email. We might need to parse it differently if checkActionCode isn't used.
        // Let's assume for now we can get it or parse it from the actionLink if needed.
        console.log('[Auth Action] Full action link:', actionLink);
        // --- End continueUrl handling attempt ---
        
        switch (mode) {
          case 'verifyEmail':
            console.log('Auth Action Handler: Handling verifyEmail...');
            const actionCodeInfo = await checkActionCode(authInstance, actionCode);
            console.log('Action code info:', actionCodeInfo);

            await applyActionCode(authInstance, actionCode);
            console.log('Auth Action Handler: Email verified in Firebase Auth.');

            const currentUser = authInstance.currentUser;
            if (currentUser) {
              console.log(`Auth Action Handler: User ${currentUser.uid} is signed in. Attempting Firestore update.`);
              try {
                const profile = await getUserProfile(currentUser.uid);
                if (profile && !profile.emailVerified) {
                  await updateUserProfile(currentUser.uid, { emailVerified: true });
                  console.log('Auth Action Handler: Firestore emailVerified updated successfully.');
                } else if (profile?.emailVerified) {
                  console.log('Auth Action Handler: Firestore emailVerified already true.');
                } else {
                   console.warn(`Auth Action Handler: Profile not found for user ${currentUser.uid} when trying to update Firestore.`);
                }
              } catch (updateError) {
                 console.error('Auth Action Handler: Error updating Firestore:', updateError);
              }
            } else {
              console.warn('Auth Action Handler: No currentUser found after applying code. Firestore sync will rely on AuthContext post-login.');
            }

            setStatus('success');
            console.log('Redirecting to complete profile after verification attempt.');
            router.push('/complete-profile');
            break;

          case 'signIn':
            console.log('Auth Action Handler: Handling signIn (for review verification)...');
            setStatus('signing_in'); // Use a more specific status if desired
            
            const email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                console.error('Auth Action Handler: Email not found in local storage for signIn.');
                throw new Error('Your verification session may have expired. Please try submitting the review again.');
            }
            console.log(`[Auth Action] Email found: ${email}. Attempting signInWithEmailLink...`);

            // Attempt sign-in using the link
            const userCredential = await signInWithEmailLink(authInstance, email, actionLink);
            window.localStorage.removeItem('emailForSignIn');
            console.log('[Auth Action] signInWithEmailLink successful.');

            // Get ID token
            const user = userCredential.user;
            const idToken = await user.getIdToken(true);
            if (!idToken) {
                throw new Error('Authentication token missing after verification.');
            }
            console.log('[Auth Action] Got ID token.');

            // --- Extract reviewId and courseId from the *original* continueUrl --- 
            // Firebase appends the original continueUrl to the action URL, but it's URL-encoded.
            // We need to find it and parse it.
            let originalContinueUrl = '';
            const continueUrlParam = urlParams.get('continueUrl'); // Check if Firebase passes it directly
            if (continueUrlParam) {
               originalContinueUrl = continueUrlParam; 
            } else {
                // Fallback: Try to extract from actionLink (less reliable)
                const match = actionLink.match(/[?&]continueUrl=([^&]+)/);
                if (match?.[1]) {
                    originalContinueUrl = decodeURIComponent(match[1]);
                } else {
                    console.error('[Auth Action] Could not find original continueUrl in action link.');
                    throw new Error('Could not parse verification details from link.');
                }
            }
            console.log('[Auth Action] Original continueUrl:', originalContinueUrl);

            const continueUrlSearchParams = new URLSearchParams(new URL(originalContinueUrl).search);
            const reviewId = continueUrlSearchParams.get('reviewId');
            const courseId = continueUrlSearchParams.get('courseId');
            console.log(`[Auth Action] Extracted reviewId: ${reviewId}, courseId: ${courseId}`);

            if (!reviewId) {
                throw new Error('Missing review ID in verification link details.');
            }
            // --- End extraction ---

            // Call backend verification API
            setStatus('calling_backend');
            setMessage('Verifying review with server...');
            console.log('[Auth Action] Calling backend /api/reviews/verify...');

            const response = await fetch('/api/reviews/verify', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${idToken}`,
               },
               body: JSON.stringify({ reviewId }),
            });
            const verifyResult = await response.json();
            console.log('[Auth Action] Backend response status:', response.status);
            console.log('[Auth Action] Backend response body:', verifyResult);

            if (!response.ok) {
                throw new Error(verifyResult.error || `Failed to verify review (status: ${response.status})`);
            }

            setStatus('success');
            setMessage('Review successfully verified and published!');
            console.log('[Auth Action] Review Verification successful! Redirecting...');

            // Redirect to course page or home
            const redirectPath = courseId ? `/courses/${courseId}?verified=true` : '/';
            router.push(redirectPath); // Redirect immediately after success
            break;

          case 'resetPassword':
            // TODO: Implement password reset flow if needed
            console.log('Auth Action Handler: Handling password reset...');
            // You'd typically verify the code and redirect to a password change form
            setStatus('invalid'); // Placeholder
            setErrorMessage('Password reset not yet implemented.');
            break;

          case 'recoverEmail':
            // TODO: Implement email recovery flow if needed
            setStatus('invalid'); // Placeholder
            setErrorMessage('Email recovery not yet implemented.');
            break;

          default:
            console.warn(`Auth Action Handler: Unhandled mode: ${mode}`);
            setStatus('invalid');
            setErrorMessage(`Unknown action: ${mode}`);
            break;
        }
      } catch (error: any) {
        console.error('Auth Action Handler: Error applying action code:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to process the request. The link may be invalid or expired.');
      }
    };

    handleAction(auth).catch(console.error);

  }, [searchParams, router]);


  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-700">Processing your request...</p>
          </>
        );
      case 'success':
        // Message might not be seen if redirect is immediate
        return (
           <>
             <h1 className="text-2xl font-bold text-green-600 mb-4">{message}</h1>
             <p className="text-gray-700 mb-6">Redirecting you to complete your profile...</p>
             {/* Optional: Add a manual redirect button if needed */}
             {/* <Button onClick={() => router.push('/complete-profile')}>Complete Profile</Button> */}
           </>
        );
      case 'error':
        return (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h1>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <Button asChild variant="link">
                <Link href="/signup">Return to Sign Up</Link>
            </Button>
          </>
        );
      case 'invalid':
      case 'signing_in':
      case 'calling_backend':
      default:
        return (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
            <p className="text-gray-700 mb-6">{errorMessage || 'This link is invalid or has expired.'}</p>
             <Button asChild variant="link">
                <Link href="/signup">Return to Sign Up</Link>
            </Button>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {renderContent()}
      </div>
    </div>
  );
}


// Wrap component in Suspense for useSearchParams hook
export default function ActionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActionHandler />
    </Suspense>
  );
} 