'use server';

/**
 * This file contains server-only functions for Firebase Admin operations
 * These functions should never be imported directly in client components
 */

import { getFirestore, Firestore, DocumentData } from 'firebase-admin/firestore';

import { getFirebaseAdmin } from '@/lib/firebase/firebaseAdmin';

/**
 * Get Firebase Admin Firestore instance for server operations
 * This should ONLY be used on the server
 */
export function getAdminFirestore(): Firestore {
  const app = getFirebaseAdmin();
  if (!app) {
    throw new Error('Firebase Admin not initialized');
  }
  return getFirestore(app);
}

/**
 * Define a more specific return type for the function
 */
type AdminOperationResult =
  | { success: true; data: DocumentData | null }
  | { success: true; verified: boolean }
  | { success: false; error: string };

/**
 * Perform server-side operations with Firebase Admin
 * Use this for operations that require admin privileges
 */
export async function performAdminOperation(operation: string, data: unknown): Promise<AdminOperationResult> {
  try {
    const db = getAdminFirestore();
    
    // Example operations - implement as needed
    switch (operation) {
      case 'get-course':
        const courseId = (data as { id: string }).id;
        if (typeof courseId !== 'string') {
           return { success: false, error: 'Invalid data format for get-course: id must be a string' };
        }
        const courseRef = db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        return { success: true, data: courseDoc.exists ? courseDoc.data() ?? null : null };
        
      case 'admin-verify':
        // Add admin verification logic here
        return { success: true, verified: true };
        
      default:
        return { success: false, error: 'Unknown operation' };
    }
  } catch (error) {
    console.error('Admin operation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 