import {
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import type { ContactFormData } from "@/types/contact";
import type { NewsArticle } from "@/types/news";
import type { NewsletterSubscription } from '@/types/newsletter';
import type { UserProfile } from '@/types/user';

import { auth, db, storage, isFirebaseAvailable } from "./firebase";
import type { GolfCourse } from "../../types/course";
import type { CourseReview } from "../../types/review";

// Define allowed collections and their types
type CollectionTypes = {
  courses: GolfCourse;
  reviews: CourseReview;
  users: UserProfile;
  news: NewsArticle;
  contacts: ContactFormData;
  newsletters: NewsletterSubscription;
};

type CollectionName = keyof CollectionTypes;

// Validate collection name
const validateCollection = (collectionName: string): collectionName is CollectionName => {
  return ['courses', 'reviews', 'users', 'news', 'contacts', 'newsletters'].includes(collectionName);
};

// Auth functions
export const logoutUser = (): Promise<void> => {
  if (!auth) {
    console.warn('Firebase auth is not available. Cannot log out.');
    return Promise.resolve();
  }
  return signOut(auth);
};

// Firestore functions
export const addDocument = async <T extends keyof CollectionTypes>(
  collectionName: T, 
  data: CollectionTypes[T]
): Promise<DocumentReference<CollectionTypes[T]>> => {
  if (!db) {
    console.error('Firebase db is not available. Cannot add document.');
    throw new Error('Database is not available');
  }

  if (!validateCollection(collectionName)) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }

  try {
    const collectionRef = collection(db, collectionName) as CollectionReference<CollectionTypes[T]>;
    return await addDoc(collectionRef, data);
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async <T extends keyof CollectionTypes>(
  collectionName: T
): Promise<(CollectionTypes[T] & { id: string })[]> => {
  if (!db) {
    console.error('Firebase db is not available. Cannot get documents.');
    return [];
  }

  if (!validateCollection(collectionName)) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (CollectionTypes[T] & { id: string })[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    return [];
  }
};

export const updateDocument = async <T extends keyof CollectionTypes>(
  collectionName: T,
  id: string,
  data: Partial<CollectionTypes[T]>
): Promise<void> => {
  if (!db) {
    console.error('Firebase db is not available. Cannot update document.');
    throw new Error('Database is not available');
  }

  if (!validateCollection(collectionName)) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }

  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data as Partial<DocumentData>);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  if (!db) {
    console.error('Firebase db is not available. Cannot delete document.');
    throw new Error('Database is not available');
  }
  return deleteDoc(doc(db, collectionName, id));
};

// Storage functions
export const uploadFile = async (
  file: File, 
  path: string
): Promise<string> => {
  if (!storage) {
    console.error('Firebase storage is not available. Cannot upload file.');
    throw new Error('Storage is not available');
  }
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

/**
 * Safely access Firestore database reference
 * @returns The Firestore instance or throws an error if Firebase is unavailable
 */
export function getFirestoreDB(): Firestore {
  if (!isFirebaseAvailable || !db) {
    console.warn('Firebase is not available. Make sure environment variables are properly set.');
    throw new Error('Firebase database is not available');
  }
  return db as Firestore;
}

/**
 * Safely get a collection reference
 * @param collectionPath Path to the collection
 * @returns Collection reference
 */
export function getCollection(collectionPath: string): CollectionReference {
  const firestoreDB = getFirestoreDB();
  return collection(firestoreDB, collectionPath);
}

/**
 * Safely get a document reference
 * @param collectionPath Path to the collection
 * @param documentId Document ID
 * @returns Document reference
 */
export function getDocument(collectionPath: string, documentId: string): DocumentReference {
  const firestoreDB = getFirestoreDB();
  return doc(firestoreDB, collectionPath, documentId);
}

/**
 * Check if Firebase is available with fallback handling
 * @param fallbackFn Optional function to execute if Firebase is unavailable
 * @returns True if Firebase is available, false otherwise
 */
export function withFirebaseCheck<T>(fallbackData: T): { available: boolean; fallbackData: T } {
  if (!isFirebaseAvailable || !db) {
    console.warn('Firebase is not available. Using fallback data.');
    return { available: false, fallbackData };
  }
  return { available: true, fallbackData };
}

// Export auth and storage for convenience
export { auth, storage };

// Add these types
interface AdminVerificationResult {
  success: boolean;
  adminToken?: string | undefined;
  expiration?: Date | undefined;
  error?: string;
}

// Define expected API response structure
interface VerifyAdminApiResponse {
  adminToken?: string;
  expiration?: number; // Expecting timestamp number from API
  error?: string;
}

// Add this function
export async function verifyAdminStatus(idToken: string): Promise<AdminVerificationResult> {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    // Assert the type of the parsed JSON data
    const data = await response.json() as VerifyAdminApiResponse;
    
    if (response.ok) {
      // Safely access properties and convert expiration
      const expirationTimestamp = typeof data.expiration === 'number' ? data.expiration : undefined;
      return {
        success: true,
        adminToken: data.adminToken,
        expiration: expirationTimestamp ? new Date(expirationTimestamp) : undefined
      };
    } else {
      return {
        success: false,
        error: data.error || 'Admin verification failed'
      };
    }
  } catch (error) {
    console.error('Error during admin verification:', error);
    return {
      success: false,
      error: 'Admin verification failed' // Generic error on catch
    };
  }
}
