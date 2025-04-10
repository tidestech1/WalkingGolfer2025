"use client";

import React, { createContext, useEffect, useState } from "react";

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

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(
          auth,
          (user: User | null) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            setUser(user);
            setLoading(false);
          },
          (error) => {
            console.error('Auth state change error:', formatAuthError(error));
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error initializing Firebase auth:', formatAuthError(error));
        setUser(null);
        setLoading(false);
      }
    };
    
    void initializeAuth();
    
    return (): void => {
      if (unsubscribe) {
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

function formatAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export { AuthContext };