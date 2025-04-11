import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type User
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

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

      // Create the user profile document in Firestore
      await createUserProfile(userCredential.user);
    }

    return { user: userCredential.user };
  } catch (error) {
    console.error('Email sign-up error:', error);
    return { user: null, error: formatAuthError(error) };
  }
}

// Use unknown type and type guards for safe error handling
function formatAuthError(error: unknown): string {
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
