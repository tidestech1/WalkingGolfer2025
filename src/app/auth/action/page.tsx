"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, applyActionCode, checkActionCode, Auth } from 'firebase/auth';

import { updateUserProfile, getUserProfile } from '@/lib/firebase/userUtils';
import { app as firebaseApp } from '@/lib/firebase/firebase'; // Import the exported app instance

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define possible statuses for the action handler
type ActionStatus = 'loading' | 'success' | 'error' | 'invalid';

function ActionHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ActionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
                } else if (profile && profile.emailVerified) {
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
             <h1 className="text-2xl font-bold text-green-600 mb-4">Email Verified Successfully!</h1>
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