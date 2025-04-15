"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, applyActionCode, checkActionCode } from 'firebase/auth';

import { updateUserProfile } from '@/lib/firebase/userUtils';
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
    const continueUrl = searchParams.get('continueUrl'); // May not be needed directly here

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
    const auth = getAuth(firebaseApp);

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'verifyEmail':
            console.log('Auth Action Handler: Handling verifyEmail...');
            // Check the code first to get user UID before applying
            // This prevents applying code if user state is somehow lost
            const actionCodeInfo = await checkActionCode(auth, actionCode);
            console.log('Action code info:', actionCodeInfo); // Contains user email

            // Apply the code to verify the email in Firebase Auth backend
            await applyActionCode(auth, actionCode);
            console.log('Auth Action Handler: Email verified in Firebase Auth.');

            // Now, attempt to update Firestore profile immediately
            // Need the user's UID. This is tricky as the user might not be
            // signed in *in this specific browser tab* when the link is clicked.
            // The reliable way is often backend-driven via the action code info,
            // but client-side requires the user to potentially sign in first *after* verifying.
            //
            // Alternative/Improvement:
            // Instead of updating Firestore here, we rely on the AuthContext listener
            // BUT we need to ensure the user gets redirected to a state where AuthContext runs.
            // Let's redirect to login and let AuthContext handle the sync on successful login.

            // Simplified Success Logic:
            setStatus('success');
            // Optional: Short delay before redirect?
            // setTimeout(() => router.push('/login?verified=true'), 3000);
            // router.push('/login?verified=true'); // Redirect to login, maybe with a flag

            // --- Direct Redirect to Profile Completion (assuming user will be logged in shortly) ---
            // This relies on AuthContext picking up the verified user state QUICKLY after they log in.
            // If the user logs in, AuthContext *should* run, see emailVerified=true, update Firestore,
            // and then the normal redirect logic (e.g., from App layout or login page)
            // based on profile completion should take over.
             console.log('Redirecting to complete profile after verification.');
             router.push('/complete-profile'); // Redirect to profile completion

            // --- Original immediate Firestore update attempt (less reliable client-side) ---
            // const currentUser = auth.currentUser;
            // if (currentUser) {
            //   console.log(`Auth Action Handler: Found current user ${currentUser.uid}. Updating Firestore.`);
            //   await updateUserProfile(currentUser.uid, { emailVerified: true });
            //   console.log('Auth Action Handler: Firestore updated.');
            //   setStatus('success');
            //   router.push('/complete-profile'); // Redirect on success
            // } else {
            //   // This happens if the user clicks the link in a browser where they aren't logged in
            //   console.warn('Auth Action Handler: User not signed in after applying action code. Cannot update Firestore directly.');
            //   setStatus('success'); // Mark success, but Firestore might not be updated yet
            //   // Redirect to login, Firestore update will happen via AuthContext after login
            //   router.push('/login?verified=true');
            // }
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
        }
      } catch (error: any) {
        console.error('Auth Action Handler: Error applying action code:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to process the request. The link may be invalid or expired.');
      }
    };

    handleAction().catch(console.error);

  }, [searchParams, router]); // Dependencies


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