import { FirebaseError } from 'firebase/app';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';

import { getFirestoreDB } from './firebaseUtils';
import { createUserProfile } from './userUtils'; // Assuming userUtils exists

interface AuthResult {
  user: User | null;
  error?: string;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const db = getFirestoreDB();
    const auth = getAuth(db.app);
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (error) {
    console.error('Email sign-in error:', error);
    return { user: null, error: formatAuthError(error) };
  }
}

// New function for signing up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  try {
    const db = getFirestoreDB();
    const auth = getAuth(db.app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update the Firebase Auth profile with the display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
        console.log('Verification email sent successfully.');
      } catch (verificationError) {
        console.error('Failed to send verification email:', verificationError);
        // Optionally: Log this error more formally or decide if it should block the process.
        // For now, we proceed even if verification email fails, but log the error.
      }

      // Create the user profile document in Firestore
      await createUserProfile(userCredential.user);

      // Track user registration in Klaviyo (non-blocking)
      try {
        const { getKlaviyoClient, createKlaviyoProfile, KlaviyoEvents } = await import('@/lib/klaviyo');
        const klaviyoClient = getKlaviyoClient();
        
        // Create basic Klaviyo profile
        const klaviyoProfile = createKlaviyoProfile(email, displayName);
        await klaviyoClient.createOrUpdateProfileAttributes(klaviyoProfile);
        
        // Track registration event
        await klaviyoClient.trackEvent(
          KlaviyoEvents.USER_REGISTERED,
          email,
          {
            display_name: displayName,
            registration_date: new Date().toISOString(),
            registration_source: 'email_signup',
            email_verification_sent: true
          }
        );
        console.log('Successfully tracked user registration in Klaviyo');
      } catch (klaviyoError) {
        console.warn('Failed to track user registration in Klaviyo:', klaviyoError);
        // Don't fail the signup for Klaviyo issues
      }
    }

    return { user: userCredential.user };
  } catch (error) {
    console.error('Email sign-up error:', error);
    return { user: null, error: formatAuthError(error) };
  }
}

// Use unknown type and type guards for safe error handling
export function formatAuthError(error: unknown): string {
  // Check if it's a FirebaseError first
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found': // Often same user-facing message
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/popup-closed-by-user':
        return 'Sign in was cancelled';
      case 'auth/popup-blocked':
        return 'Sign in popup was blocked. Please allow popups for this site.';
      default:
        // Fallback for other Firebase errors
        return error.message || 'An unexpected Firebase error occurred.';
    }
  }
  
  // Check if it's a generic Error
  if (error instanceof Error) {
    // Check generic error messages if needed (less reliable)
    if (error.message.includes('popup-closed-by-user')) {
      return 'Sign in was cancelled';
    }
    if (error.message.includes('auth/popup-blocked')) { // Keep this check as backup
      return 'Sign in popup was blocked. Please allow popups for this site.';
    }
    return error.message || 'An unexpected error occurred.';
  }
  
  // Handle non-Error types (e.g., strings)
  if (typeof error === 'string') {
    // Add specific string checks if necessary
    return error;
  }
  
  // Final fallback
  return 'An unknown error occurred';
}

interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

export async function sendPasswordReset(email: string): Promise<ResetPasswordResult> {
  try {
    const db = getFirestoreDB(); // Assuming this gets your initialized Firestore instance
    const auth = getAuth(db.app); // Get the auth instance from the same app
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: formatAuthError(error) };
  }
}
