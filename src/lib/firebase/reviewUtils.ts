import { query, where, orderBy, collection, getDocs, getFirestore, Timestamp } from 'firebase/firestore';
import { getFirestoreDB } from './firebaseUtils';
import { getAdminFirestore } from './firebaseAdmin';
import type { Firestore as AdminFirestore, CollectionReference as AdminCollectionReference, Query as AdminQuery, DocumentData as AdminDocumentData } from 'firebase-admin/firestore';

import type { CourseReview, ReviewStatus, DisplayNameType, CreateReviewInput } from '@/types/review';

import { addDocument, getDocuments } from './firebaseUtils';
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
    let querySnapshot;
    // Define constraints separately for clarity
    const courseIdConstraint = where('courseId', '==', courseId);
    const statusConstraint = where('status', '==', 'published' as ReviewStatus);
    const orderConstraint = orderBy('createdAt', 'desc');

    if (typeof window === 'undefined') {
      // Server-side: Use Admin SDK
      console.log("Using Admin Firestore SDK (server-side) for getPublishedReviewsForCourse");
      const adminDb: AdminFirestore = getAdminFirestore();
      // Build query using Admin SDK methods
      const adminQuery = adminDb.collection('reviews')
                                .where('courseId', '==', courseId)
                                .where('status', '==', 'published' as ReviewStatus)
                                .orderBy('createdAt', 'desc');
      querySnapshot = await adminQuery.get();
    } else {
      // Client-side: Use Client SDK
      console.log("Using Client Firestore SDK (client-side) for getPublishedReviewsForCourse");
      const db = getFirestoreDB();
      if (!db) {
        throw new Error('Client Firestore database is not available.');
      }
      const reviewsCollection = collection(db, 'reviews');
      // Apply constraints using Client SDK function style
      const q = query(reviewsCollection, courseIdConstraint, statusConstraint, orderConstraint);
      querySnapshot = await getDocs(q);
    }

    const reviews: CourseReview[] = [];
    // Process snapshot (works for both Admin and Client SDK snapshot types)
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
