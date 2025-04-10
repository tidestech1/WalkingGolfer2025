import type { CourseReview } from '@/types/review';
import type { UserProfile } from '@/types/user';

import { getDocuments, updateDocument } from './firebaseUtils';

export async function getUserReviews(userId: string): Promise<CourseReview[]> {
  try {
    const reviews = await getDocuments('reviews');
    return reviews.filter(review => review.userId === userId);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const users = await getDocuments('users');
    const user = users.find(u => u.id === userId);
    return user || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    await updateDocument('users', userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}
