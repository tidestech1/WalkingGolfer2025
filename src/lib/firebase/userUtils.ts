import type { CourseReview } from '@/types/review';
import type { UserProfile } from '@/types/user';

import { getDocuments, updateDocument } from './firebaseUtils';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { getFirestoreDB } from './firebaseUtils';

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
 * Populates the profile with data from the Firebase Auth user object.
 * Sets initial default values for preferences and review counts.
 * 
 * @param user - The Firebase Auth User object.
 * @returns Promise<boolean> - True if a new profile was created, false if it already existed.
 * @throws Throws an error if Firestore operation fails.
 */
export async function createUserProfile(user: User): Promise<boolean> {
  if (!user) throw new Error('User object is required to create a profile.');
  
  const db = getDb();
  const userRef = doc(db, 'users', user.uid);

  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUserProfile: UserProfile = {
        id: user.uid,
        email: user.email || '', // Ensure email is not null
        displayName: user.displayName || 'Walking Golfer', // Default display name
        photoURL: user.photoURL || null, // Use null if missing
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          emailNotifications: true,
          newsletterSubscribed: false,
        },
        reviewCount: 0,
        zipcode: null, // Initialize zipcode as null
      };
      
      await setDoc(userRef, {
        ...newUserProfile,
        createdAt: serverTimestamp(), // Use server timestamp for creation
        updatedAt: serverTimestamp()  // Use server timestamp for update
      });
      console.log('Created new user profile for:', user.uid);
      return true; // Indicate new profile was created
    } else {
      console.log('User profile already exists for:', user.uid);
      // Optionally update display name/photo URL if they changed during sign-in
      const updateData: Partial<UserProfile> = {};
      const existingData = docSnap.data();
      if (user.displayName && existingData['displayName'] !== user.displayName) {
        updateData.displayName = user.displayName;
      }
      if (user.photoURL && existingData['photoURL'] !== user.photoURL) {
        updateData.photoURL = user.photoURL;
      } else if (!user.photoURL && existingData['photoURL']) {
        // Handle case where auth photoURL is removed
        updateData.photoURL = null;
      }
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, { 
          ...updateData,
          updatedAt: serverTimestamp()
        });
        console.log('Updated existing user profile with latest auth info:', user.uid);
      }
      return false; // Indicate profile already existed
    }
  } catch (error) {
    console.error('Error creating/checking user profile:', error);
    // Consider more specific error handling or re-throwing a custom error
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
      // We need to manually convert Timestamps if they exist
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate().toISOString() : new Date().toISOString(),
        updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate().toISOString() : new Date().toISOString(),
      } as UserProfile; // Assert type after processing
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
 * Updates a user profile document in Firestore.
 * 
 * @param userId - The ID of the user whose profile is to be updated.
 * @param data - An object containing the fields to update (Partial<UserProfile>).
 * @returns Promise<void>
 * @throws Throws an error if Firestore operation fails.
 */
export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<void> {
  if (!userId) throw new Error('User ID is required to update profile.');
  if (!data || Object.keys(data).length === 0) {
    console.warn('Update user profile called with no data.');
    return;
  }
  
  const db = getDb();
  const userRef = doc(db, 'users', userId);

  try {
    // Ensure we don't try to update immutable fields like id or createdAt
    const updateData = { 
      ...data,
      updatedAt: serverTimestamp() // Always update the timestamp
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
    const reviews = await getDocuments('reviews');
    return reviews.filter(review => review.userId === userId);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

