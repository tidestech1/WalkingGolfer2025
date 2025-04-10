import type { CourseReview, CreateReviewInput } from '@/types/review';

import { addDocument, getDocuments } from './firebaseUtils';
import { uploadImage } from './storageUtils';

export async function createReview(data: CreateReviewInput): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the review document
    const reviewData: Omit<CourseReview, 'id'> = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDocument('reviews', reviewData as CourseReview);
    return { success: true };
  } catch (error) {
    console.error('Error creating review:', error);
    return { 
      success: false, 
      error: 'Failed to submit review. Please try again.' 
    };
  }
}

export async function uploadReviewImages(
  courseId: string, 
  userId: string, 
  files: File[]
): Promise<{ urls: string[]; error?: string }> {
  try {
    const uploadPromises = files.map(file => {
      const path = `reviews/${courseId}/${userId}/${Date.now()}-${file.name}`;
      return uploadImage(file, path);
    });

    const urls = await Promise.all(uploadPromises);
    return { urls };
  } catch (error) {
    console.error('Error uploading review images:', error);
    return { 
      urls: [], 
      error: 'Failed to upload images. Please try again.' 
    };
  }
}

export async function getUserReviewForCourse(
  userId: string, 
  courseId: string
): Promise<CourseReview | null> {
  try {
    const reviews = await getDocuments('reviews');
    return reviews.find(
      review => review.userId === userId && review.courseId === courseId
    ) || null;
  } catch (error) {
    console.error('Error fetching user review:', error);
    return null;
  }
}
