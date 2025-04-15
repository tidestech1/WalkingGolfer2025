import { useState, useEffect } from 'react';

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

import { 
  isFirebaseAvailable, 
  db,
  auth,
  storage
} from '@/lib/firebase/firebase';
import { 
  getCollection, 
  getDocument, 
  getFirestoreDB
} from '@/lib/firebase/firebaseUtils';

// Import types for return value

// Define the return type structure
interface UseFirebaseReturn {
  isAvailable: boolean;
  error: string | null;
  checkedAt: Date;
  withFirestore: <T>(
    operation: () => Promise<T>,
    fallbackData: T,
    errorMessage?: string
  ) => Promise<{ data: T; error: string | null; source: 'firebase' | 'fallback' }>;
  withAuth: <T>(
    operation: () => Promise<T>,
    fallbackResult: T,
    errorMessage?: string
  ) => Promise<{ result: T; error: string | null }>;
  getCollection: typeof getCollection;
  getDocument: typeof getDocument;
  getFirestoreDB: typeof getFirestoreDB;
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

/**
 * Custom hook for working with Firebase safely throughout the application
 * Provides:
 * - Firebase availability status
 * - Safe access to Firebase services
 * - Error handling and messaging
 */
export default function useFirebase(): UseFirebaseReturn {
  // Initialize with a fixed date string to avoid hydration mismatches
  const [status, setStatus] = useState<{
    available: boolean;
    error: string | null;
    checkedAt: Date;
  }>({
    available: false,
    error: 'Checking Firebase availability...',
    checkedAt: new Date(0) // Use epoch time for initial render to avoid hydration mismatches
  });

  // Re-check availability on mount (client-side only)
  useEffect(() => {
    const available = isFirebaseAvailable();
    // Only update the timestamp on the client to avoid hydration mismatches
    setStatus({
      available,
      error: available ? null : 'Firebase is not available or not properly configured',
      checkedAt: new Date()
    });

    // Log warning in development if Firebase is not available
    if (process.env.NODE_ENV === 'development' && !available) {
      console.warn('⚠️ Firebase is not available in this environment. Check your configuration.');
      console.info('💡 Tip: Make sure all required environment variables are set in Replit Secrets.');
    }
  }, []);

  /**
   * Executes a Firestore operation safely with fallback
   * @param operation Function that uses Firestore
   * @param fallbackData Data to return if Firebase is unavailable
   * @returns Result of operation or fallback data
   */
  const withFirestore = async <T>(
    operation: () => Promise<T>,
    fallbackData: T,
    errorMessage = 'Firebase operation failed'
  ): Promise<{ data: T; error: string | null; source: 'firebase' | 'fallback' }> => {
    const available = isFirebaseAvailable();
    if (!available || !db) {
      return {
        data: fallbackData,
        error: 'Firebase is unavailable, using fallback data',
        source: 'fallback'
      };
    }

    try {
      const result = await operation();
      return {
        data: result,
        error: null,
        source: 'firebase'
      };
    } catch (error) {
      console.error(errorMessage, error);
      return {
        data: fallbackData,
        error: error instanceof Error ? error.message : String(error),
        source: 'fallback'
      };
    }
  };

  /**
   * Executes an auth operation safely with fallback
   */
  const withAuth = async <T>(
    operation: () => Promise<T>,
    fallbackResult: T,
    errorMessage = 'Firebase auth operation failed'
  ): Promise<{ result: T; error: string | null }> => {
    const available = isFirebaseAvailable();
    if (!available || !auth) {
      return {
        result: fallbackResult,
        error: 'Firebase auth is unavailable'
      };
    }

    try {
      const result = await operation();
      return {
        result,
        error: null
      };
    } catch (error) {
      console.error(errorMessage, error);
      return {
        result: fallbackResult,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Return type matches UseFirebaseReturn
  return {
    isAvailable: status.available,
    error: status.error,
    checkedAt: status.checkedAt,
    withFirestore,
    withAuth,
    // Safe accessors
    getCollection,
    getDocument,
    getFirestoreDB,
    // Direct references (use with caution)
    db,
    auth,
    storage
  };
} 