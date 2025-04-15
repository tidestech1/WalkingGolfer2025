"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";

import { FirebaseError } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { 
  User,
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from "firebase/auth";

import { getUserProfile, updateUserProfile } from '../firebase/userUtils';
import { formatAuthError } from '../firebase/authUtils';

// Export the interface
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState<ReturnType<typeof getAuth> | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initializeAuth = async (): Promise<void> => {
      try {
        const firebaseModule = await import('../firebase/firebase');
        const available = firebaseModule.isFirebaseAvailable();
        const auth = getAuth(firebaseModule.app as FirebaseApp | undefined);
        
        setAuthInstance(auth);
        
        if (!available || !auth) {
          console.warn('Firebase auth is not available');
          setUser(null);
          setLoading(false);
          return;
        }

        console.log("Setting up onAuthStateChanged listener...");
        unsubscribe = onAuthStateChanged(
          auth,
          async (authUser: User | null) => {
            console.log('Auth state changed:', authUser ? `User logged in (${authUser.uid}), Verified: ${authUser?.emailVerified}` : 'No user');
            setUser(authUser);

            if (authUser && authUser.emailVerified) {
               console.log(`onAuthStateChanged: Auth state shows user ${authUser.uid} is verified. Checking Firestore.`);
               try {
                 const profile = await getUserProfile(authUser.uid);
                 if (profile && !profile.emailVerified) {
                   console.log(`onAuthStateChanged: Syncing emailVerified status to Firestore for user ${authUser.uid}`);
                   await updateUserProfile(authUser.uid, { emailVerified: true });
                   console.log(`onAuthStateChanged: Firestore emailVerified status updated successfully for user ${authUser.uid}`);
                 } else if (profile && profile.emailVerified) {
                    console.log(`onAuthStateChanged: Firestore emailVerified status already synced for user ${authUser.uid}`);
                 } else if (!profile) {
                    console.warn(`onAuthStateChanged: Cannot sync emailVerified status for ${authUser.uid}, Firestore profile not found.`);
                 }
               } catch(error) {
                  console.error(`onAuthStateChanged: Error syncing Firestore for user ${authUser.uid}:`, formatAuthError(error));
               }
            } else if (authUser && !authUser.emailVerified) {
                console.log(`onAuthStateChanged: User ${authUser.uid} is logged in but email is not verified.`);
            }

            setLoading(false);
          },
          (error) => {
            console.error('Auth state change error:', formatAuthError(error));
            setUser(null);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error initializing Firebase auth:', formatAuthError(error));
        setUser(null);
        setLoading(false);
      }
    };
    
    initializeAuth().catch(err => {
       console.error("Unhandled error during auth initialization:", formatAuthError(err));
       setLoading(false);
    });
    
    return (): void => {
      if (unsubscribe) {
        console.log("Unsubscribing from onAuthStateChanged listener.");
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    if (!authInstance) {
      console.warn('Firebase auth is not available. Cannot sign in.');
      return;
    }
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      console.log('Attempting Google sign in...');
      const result = await signInWithPopup(authInstance, provider);
      console.log('Sign in successful:', result.user ? 'User obtained' : 'No user');
      // The auth state listener will handle updating the user state
    } catch (error) {
      console.error("Error signing in with Google:", formatAuthError(error));
      throw error; // Let the login page handle the error
    }
  };

  const signOutUser = async (): Promise<void> => {
    if (!authInstance) {
      console.warn('Firebase auth is not available. Cannot sign out.');
      return;
    }
    
    try {
      await firebaseSignOut(authInstance);
      // The auth state listener will handle updating the user state
    } catch (error) {
      console.error("Error signing out:", formatAuthError(error));
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!authInstance || !user) {
      console.warn('Firebase auth or user is not available. Cannot get ID token.');
      return null;
    }
    
    try {
      return await user.getIdToken(true);
    } catch (error) {
      console.error("Error getting ID token:", formatAuthError(error));
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signOut: signOutUser,
      getIdToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };