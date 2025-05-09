import { type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Firestore, Timestamp } from 'firebase/firestore';

import type { CourseReview } from '@/types/review';
import type { UserProfile } from '@/types/user';

import { getDocuments, updateDocument } from './firebaseUtils';
import { getFirestoreDB } from './firebaseUtils';

// Import Admin Firestore for server-side utility
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

// Imports for client-side Firestore operations
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

// Imports for Admin Firestore operations
import { Timestamp as AdminTimestamp, FieldValue as AdminFieldValue, getFirestore as getAdminFirestoreInternal, DocumentData } from 'firebase-admin/firestore';
// We need to be careful not to cause a circular dependency if firebaseAdmin also imports from userUtils indirectly.
// Assuming getAdminFirestore from firebaseAdmin.ts is the primary way to get admin db.

// Define a type for the necessary user data for profile creation
export interface CreateUserProfileInput {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

/**
 * Retrieves the Firestore database instance.
 * Ensures that Firebase is available before attempting operations.
 * Throws an error if Firestore is not available.
 */
function getDb(): Firestore {
  const db = getFirestoreDB();
  if (!db) {
    console.error('Firestore DB is not available.');
    throw new Error('Database service is currently unavailable. Please try again later.');
  }
  return db;
}

/**
 * Creates a user profile document in Firestore if it doesn't already exist.
 * Populates the profile with provided user data.
 * Sets initial default values for preferences and review counts.
 * 
 * @param userData - An object containing uid, email, displayName, photoURL.
 * @returns Promise<boolean> - True if a new profile was created, false if it already existed.
 * @throws Throws an error if Firestore operation fails.
 */
export async function createUserProfile(userData: CreateUserProfileInput): Promise<boolean> {
  if (!userData?.uid) {
throw new Error('User data with UID is required to create a profile.');
}
  
  const db = getDb();
  const userRef = doc(db, 'users', userData.uid);

  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUserProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        id: userData.uid,
        email: userData.email || '', 
        displayName: userData.displayName || 'Walking Golfer', 
        photoURL: userData.photoURL || null,
        preferences: {
          emailNotifications: true,
          newsletterSubscribed: false,
        },
        reviewCount: 0,
        zipcode: null,
        emailVerified: false,
        welcomeEmailSent: false,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, newUserProfile);
      console.log('Created new user profile for:', userData.uid);
      return true;
    } else {
      console.log('User profile already exists for:', userData.uid);
      const updateData: Partial<UserProfile> = {};
      const existingData = docSnap.data() as UserProfile;
      if (userData.displayName && existingData.displayName !== userData.displayName) {
        updateData.displayName = userData.displayName;
      }
      if (userData.photoURL !== undefined && existingData.photoURL !== userData.photoURL) {
        updateData.photoURL = userData.photoURL;
      }
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, { 
          ...updateData,
          updatedAt: serverTimestamp()
        });
        console.log('Updated existing user profile with latest info:', userData.uid);
      }
      return false;
    }
  } catch (error) {
    console.error('Error creating/checking user profile:', error);
    throw new Error('Failed to create or verify user profile.');
  }
}

/**
 * Fetches a user profile document from Firestore.
 * 
 * @param userId - The ID of the user whose profile is to be fetched.
 * @returns Promise<UserProfile | null> - The user profile data or null if not found.
 * @throws Throws an error if Firestore operation fails.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('User ID is required to fetch profile.');
    return null;
  }
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: (data['createdAt'] as Timestamp)?.toDate ? (data['createdAt'] as Timestamp).toDate().toISOString() : new Date().toISOString(),
        updatedAt: (data['updatedAt'] as Timestamp)?.toDate ? (data['updatedAt'] as Timestamp).toDate().toISOString() : new Date().toISOString(),
        lastReviewDate: (data['lastReviewDate'] instanceof Timestamp) ? (data['lastReviewDate'] as Timestamp).toDate().toISOString() : data['lastReviewDate'],
      } as UserProfile;
    } else {
      console.log('No user profile found for:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to retrieve user profile.');
  }
}

/**
 * Fetches a user profile document from Firestore using the ADMIN SDK.
 * Intended for use in server-side (admin) contexts.
 * 
 * @param userId - The ID of the user whose profile is to be fetched.
 * @returns Promise<UserProfile | null> - The user profile data or null if not found.
 * @throws Throws an error if Firestore operation fails.
 */
export async function getUserProfileAdmin(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('User ID is required to fetch profile (admin).');
    return null;
  }
  const dbAdmin = getAdminFirestore(); 
  // Use admin-compatible doc and getDoc. Since firebase-admin/firestore exports these directly,
  // and they operate on its own Firestore instance type, we can use them if we ensure dbAdmin is of that type.
  // The getAdminFirestore() from firebaseAdmin.ts should return the correct type.
  // The `doc` and `getDoc` imported at the top are from 'firebase/firestore' (client).
  // To avoid confusion and ensure type compatibility, let's use the full path or specific admin imports if possible.
  // However, the Firestore types themselves are different. We must use `doc` and `getDoc` that work with `AdminSDK.Firestore`.
  // The `firebase-admin/firestore` module itself provides these.
  // So, it's better to get `doc` and `getDoc` from the admin SDK when using the admin DB.
  // For now, let's assume the global `doc` and `getDoc` might resolve if types are compatible or aliased.
  // The linter error indicated they are not. So we must use specific admin versions of doc/getDoc.
  
  // Correct approach: firebase-admin functions are typically directly on the db instance or imported from firebase-admin/firestore.
  // Since `getAdminFirestore()` gives us the admin db, its `doc()` method should be used, or imported `doc` from `firebase-admin/firestore`.
  const userAdminRef = dbAdmin.collection('users').doc(userId); // Admin SDK style

  try {
    const docSnap = await userAdminRef.get(); // Admin SDK style
    if (docSnap.exists) {
      const data = docSnap.data() as DocumentData; // firebase-admin returns DocumentData
      return {
        ...data,
        id: docSnap.id,
        createdAt: (data['createdAt'] as AdminTimestamp)?.toDate ? (data['createdAt'] as AdminTimestamp).toDate().toISOString() : new Date().toISOString(),
        updatedAt: (data['updatedAt'] as AdminTimestamp)?.toDate ? (data['updatedAt'] as AdminTimestamp).toDate().toISOString() : new Date().toISOString(),
        lastReviewDate: (data['lastReviewDate'] instanceof AdminTimestamp) 
                        ? (data['lastReviewDate'] as AdminTimestamp).toDate().toISOString() 
                        : typeof data['lastReviewDate'] === 'string' 
                            ? data['lastReviewDate'] 
                            : null, 
      } as UserProfile;
    } else {
      console.log('No user profile found for (admin):', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile (admin):', error);
    throw new Error('Failed to retrieve user profile (admin).');
  }
}

/**
 * Updates a user profile document in Firestore.
 * 
 * @param userId - The ID of the user whose profile is to be updated.
 * @param data - An object containing the fields to update (Partial<UserProfile>).
 * @returns Promise<void>
 * @throws Throws an error if Firestore operation fails.
 */
export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<void> {
  if (!userId) {
throw new Error('User ID is required to update profile.');
}
  if (!data || Object.keys(data).length === 0) {
    console.warn('Update user profile called with no data.');
    return;
  }
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  try {
    const updateData = { 
      ...data,
      updatedAt: serverTimestamp()
    };
    await updateDoc(userRef, updateData);
    console.log('Successfully updated user profile for:', userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile.');
  }
}

export async function getUserReviews(userId: string): Promise<CourseReview[]> {
  try {
    const reviews = await getDocuments('reviews'); // Uses client SDK via firebaseUtils
    const userReviews = reviews.filter(review => review.userId === userId);
    return userReviews.map(review => ({
        ...review,
        // Ensure Timestamps are handled correctly if they come from client SDK
        createdAt: (review.createdAt instanceof ClientTimestamp) 
                        ? review.createdAt.toDate() 
                        : typeof review.createdAt === 'string' 
                            ? new Date(review.createdAt) 
                            : review.createdAt, // Assuming it is already a Date object
        updatedAt: (review.updatedAt instanceof ClientTimestamp) 
                        ? review.updatedAt.toDate() 
                        : typeof review.updatedAt === 'string' 
                            ? new Date(review.updatedAt) 
                            : review.updatedAt, // Assuming it is already a Date object
        walkingDate: (review.walkingDate instanceof ClientTimestamp) 
                        ? review.walkingDate.toDate() 
                        : review.walkingDate === null 
                            ? null 
                            : typeof review.walkingDate === 'string' 
                                ? new Date(review.walkingDate) 
                                : review.walkingDate, // Assuming it is already a Date object or null
    })) as CourseReview[];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

