import type { CourseReview } from '@/types/review';
import type { UserProfile } from '@/types/user';
import { getDocuments, updateDocument } from './firebaseUtils';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Firestore, Timestamp } from 'firebase/firestore';
import { getFirestoreDB } from './firebaseUtils';

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
  if (!userData?.uid) throw new Error('User data with UID is required to create a profile.');
  
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
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, newUserProfile);
      console.log('Created new user profile for:', userData.uid);
      return true;
    } else {
      console.log('User profile already exists for:', userData.uid);
      const updateData: Partial<UserProfile> = {};
      const existingData = docSnap.data();
      if (userData.displayName && existingData['displayName'] !== userData.displayName) {
        updateData.displayName = userData.displayName;
      }
      if (userData.photoURL !== undefined && existingData['photoURL'] !== userData.photoURL) {
        updateData.photoURL = userData.photoURL || null;
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
    const reviews = await getDocuments('reviews');
    const userReviews = reviews.filter(review => review.userId === userId);
    return userReviews.map(review => ({
        ...review,
        createdAt: (review.createdAt instanceof Timestamp) ? review.createdAt.toDate() : new Date(review.createdAt),
        updatedAt: (review.updatedAt instanceof Timestamp) ? review.updatedAt.toDate() : new Date(review.updatedAt),
        walkingDate: (review.walkingDate instanceof Timestamp) ? review.walkingDate.toDate() : new Date(review.walkingDate),
    })) as CourseReview[];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

