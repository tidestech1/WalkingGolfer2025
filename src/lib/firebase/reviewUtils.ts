import { query, where, orderBy, collection, getDocs, getFirestore, Timestamp } from 'firebase/firestore';

import type { CourseReview, ReviewStatus, DisplayNameType, CreateReviewInput } from '@/types/review';

import { addDocument, getDocuments } from './firebaseUtils';
import { getFirestoreDB } from './firebaseUtils';
import { uploadImage } from './storageUtils';

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
    const foundReview = reviews.find(
      review => review.userId === userId && review.courseId === courseId
    );
    return foundReview ? (foundReview as CourseReview) : null;
  } catch (error) {
    console.error('Error fetching user review:', error);
    return null;
  }
}

/**
 * Fetches all published reviews for a specific course, ordered by creation date.
 * 
 * @param courseId The ID of the course.
 * @returns Promise<CourseReview[]> An array of published reviews.
 * @throws Throws an error if Firestore operation fails.
 */
export async function getPublishedReviewsForCourse(courseId: string): Promise<CourseReview[]> {
  try {
    const db = getFirestoreDB(); 
    if (!db) {
      throw new Error('Firestore database is not available.');
    }

    const reviewsCollection = collection(db, 'reviews');
    const q = query(
      reviewsCollection, 
      where('courseId', '==', courseId),
      where('status', '==', 'published' as ReviewStatus),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reviews: CourseReview[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const review = {
        id: doc.id,
        ...data,
        createdAt: (data['createdAt'] as Timestamp)?.toDate ? (data['createdAt'] as Timestamp).toDate() : new Date(),
        updatedAt: (data['updatedAt'] as Timestamp)?.toDate ? (data['updatedAt'] as Timestamp).toDate() : new Date(),
        walkingDate: (data['walkingDate'] as Timestamp)?.toDate ? (data['walkingDate'] as Timestamp).toDate() : new Date(), 
      } as CourseReview;
      reviews.push(review);
    });

    return reviews;

  } catch (error) {
    console.error(`Error fetching published reviews for course ${courseId}:`, error);
    return []; 
  }
}
