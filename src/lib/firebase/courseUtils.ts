import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { FieldValue, Transaction } from 'firebase-admin/firestore';

import { GolfCourse, CourseFilters, MapBounds } from '@/types/course';
import { CourseReview } from '@/types/review';

// Client-side Firestore instance
import { db, isFirebaseAvailable } from './firebase';
// Server-side Firestore instance (Admin SDK)
import { getAdminFirestore } from './firebaseAdmin';

const COLLECTION_NAME = 'courses';

// Error message for when Firebase is unavailable
const FIREBASE_UNAVAILABLE_ERROR = 'Sorry, the Walking Golfer course database is currently not available. Please check again later or contact us.';

/**
 * Get a single course by ID
 */
export async function getCourseById(id: string): Promise<GolfCourse | null> {
  try {
    if (typeof window === 'undefined') {
      // Server-side: Use Admin SDK
      console.log("Using Admin Firestore SDK (server-side) for getCourseById");
      const adminDb = getAdminFirestore();
      const courseDoc = adminDb.collection('courses').doc(id);
      const snapshot = await courseDoc.get();
      
      if (snapshot.exists) {
        const data = snapshot.data();
        return { id: snapshot.id, ...data } as GolfCourse;
      }
      
      return null;
    } else {
      // Client-side: Use Client SDK
      console.log("Using Client Firestore SDK (client-side) for getCourseById");
      if (!db) {
        console.error('Firestore is not available');
        return null;
      }
      
      const courseDoc = doc(db, 'courses', id);
      const snapshot = await getDoc(courseDoc);
      
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as GolfCourse;
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    return null;
  }
}

/**
 * Build query constraints based on filters
 */
export function buildFilterSortConstraints(filters: CourseFilters): QueryConstraint[] {
  console.log('[buildFilterSortConstraints LOG] Input Filters:', JSON.stringify(filters, null, 2));
  const constraints: QueryConstraint[] = [];
  let firstOrderByField: string | null = null;
  // Default sort order if not specified in filters
  const sortDirection = filters.sortOrder || 'desc';

  // --- Add clause for club type filter ---
  if (filters.clubTypes && filters.clubTypes.length > 0) {
    constraints.push(where('club_type', 'in', filters.clubTypes));
  }

  // --- Add clause for course holes filter ---
  if (filters.courseHoles && filters.courseHoles.length > 0) {
    // Convert discrete values to ranges
    // 9 = 9-17 holes, 18 = 18+ holes
    const has9Range = filters.courseHoles.includes(9);
    const has18Range = filters.courseHoles.includes(18);
    
    if (has9Range && has18Range) {
      // Both ranges selected = 9+ holes (essentially no filtering)
      constraints.push(where('club_totalHoles', '>=', 9));
    } else if (has9Range) {
      // Only 9-17 holes
      constraints.push(where('club_totalHoles', '>=', 9));
      constraints.push(where('club_totalHoles', '<=', 17));
    } else if (has18Range) {
      // Only 18+ holes
      constraints.push(where('club_totalHoles', '>=', 18));
    }
  }

  // --- Add clause for walkability rating ---
  if (typeof filters.walkabilityRating_overall_min === 'number' && filters.walkabilityRating_overall_min > 0) {
    constraints.push(where('walkabilityRating_overall', '>=', filters.walkabilityRating_overall_min));
    if (!firstOrderByField) {
      firstOrderByField = 'walkabilityRating_overall';
    }
  }

  // --- Add clause for search query ---
  if (filters.searchQuery?.trim()) {
    const searchTerm = filters.searchQuery.trim().toLowerCase();
    constraints.push(where('searchableTerms', 'array-contains', searchTerm));
    if (!firstOrderByField) {
      firstOrderByField = 'courseName';
    }
  }

  // --- Apply default or explicit sorting ---
  const finalSortField = filters.sortBy || firstOrderByField || 'walkabilityRating_overall';
  const primarySortDirection = (finalSortField === 'courseName' && !filters.sortBy) ? 'asc' : sortDirection; 
  constraints.push(orderBy(finalSortField, primarySortDirection));
  if (finalSortField !== '__name__') {
    constraints.push(orderBy('__name__', primarySortDirection)); 
  }

  console.log('[buildFilterSortConstraints LOG] Generated Constraints (without pagination):', constraints); 
  return constraints;
}

/**
 * Add pagination constraints to the query
 */
export function addPaginationConstraints(
  constraints: QueryConstraint[], 
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): QueryConstraint[] {
    const paginatedConstraints = [...constraints]; // Create a copy
    // Apply limit (adjust as needed) - maybe make this configurable?
    paginatedConstraints.push(limit(100)); // Example limit - Increased limit for map view

    if (lastVisible) {
        paginatedConstraints.push(startAfter(lastVisible));
    }
    return paginatedConstraints;
}

/**
 * Get courses with pagination and caching
 */
export async function getCourses(
  filters: CourseFilters
): Promise<{ courses: GolfCourse[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  if (!isFirebaseAvailable() || !db) {
    throw new Error('Firebase/DB not available in getCourses');
  }

  try {
    const filterSortConstraints = buildFilterSortConstraints(filters); // Get filter/sort constraints
    // NOTE: Pagination is NOT added here by default anymore. 
    // The caller (like a paginated list) should handle adding pagination if needed.
    // For map view, we typically want all results matching filters (within bounds, handled later)

    console.log('[getCourses LOG] Attempting Firestore query with constraints:', filterSortConstraints); 
    const coursesRef = collection(db, COLLECTION_NAME);
    // Use only filter/sort constraints for the base query
    const q = query(coursesRef, ...filterSortConstraints); 
    
    const snapshot = await getDocs(q);
    console.log('[getCourses LOG] Firestore query executed successfully. Docs fetched:', snapshot.docs.length); 
    
    const docs = snapshot.docs;
    const courses = docs.map(doc => ({ id: doc.id, ...doc.data() } as GolfCourse));
    
    // Determine the last document for potential future pagination, even if not used now
    const lastDocInArray = docs.length > 0 ? docs[docs.length - 1] : null;
    const newLastVisible = lastDocInArray ?? null; // Explicitly handle potential undefined

    return { courses, lastDoc: newLastVisible };

  } catch (error) {
    console.error("Error fetching courses in getCourses:", error);
    // Check if it's a Firestore error indicating missing index
    if (error instanceof Error && error.message.includes('requires an index')) {
      console.error("Firestore index possibly missing. Check Firebase console logs for index creation link.");
      // Potentially re-throw a more specific error or handle it
    }
    throw error; // Re-throw the error to be caught by the caller
  }
}

/**
 * Prefetch the next page of results
 */
export async function prefetchNextPage(
  filters: CourseFilters
): Promise<void> {
  try {
    await getCourses(filters);
  } catch (error) {
    console.error('Error prefetching next page:', error);
    // Swallow the error since this is just prefetching
  }
}

/**
 * Get courses by state
 */
export async function getCoursesByState(state: string): Promise<GolfCourse[]> {
  if (!db) {
    console.warn(FIREBASE_UNAVAILABLE_ERROR);
    return [];
  }
  
  const q = query(
    collection(db, COLLECTION_NAME),
    where('location.state', '==', state),
    orderBy('courseName')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GolfCourse[];
}

/**
 * Search courses with filters - simplified for course search only
 */
export async function searchCourses(filters: CourseFilters): Promise<GolfCourse[]> {
  if (!db) {
    console.warn(FIREBASE_UNAVAILABLE_ERROR);
    return [];
  }

  try {
    const coursesRef = collection(db, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [];

    // Only use searchableTerms for searching
    if (filters.searchQuery?.trim()) {
      constraints.push(where('searchableTerms', 'array-contains', filters.searchQuery.trim().toLowerCase()));
    }

    // Always sort by course name for better UX
    constraints.push(orderBy('courseName', 'asc'));

    // Limit results for better performance
    constraints.push(limit(10));

    const q = query(coursesRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GolfCourse));
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
}

/**
 * Add a new course
 */
export async function addCourse(courseData: Omit<GolfCourse, 'id'>): Promise<string | null> {
  if (!db) {
    console.error('Cannot add course: Firebase DB not available on client.');
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding course:', error);
    return null;
  }
}

/**
 * Update an existing course
 */
export async function updateCourse(id: string, courseData: Partial<GolfCourse>): Promise<boolean> {
  if (!db) {
    console.error('Cannot update course: Firebase DB not available on client.');
    return false;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...courseData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating course:', error);
    return false;
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string): Promise<boolean> {
  if (!db) {
    console.error('Cannot delete course: Firebase DB not available on client.');
    return false;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting course:', error);
    return false;
  }
}

/**
 * Generate searchable terms from course data
 */
export function generateSearchableTerms(course: Omit<GolfCourse, 'searchableTerms' | 'id'>): string[] {
  const terms = new Set<string>();
  
  // Add full terms
  terms.add(course.courseName.toLowerCase());
  terms.add(course.location_city.toLowerCase());
  terms.add(course.location_state.toLowerCase());
  
  // Add club name if it exists and is different from course name
  if (course.club_name && course.club_name.toLowerCase() !== course.courseName.toLowerCase()) {
    terms.add(course.club_name.toLowerCase());
  }
  
  // Add individual words from course name
  course.courseName.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) { // Only add words longer than 2 characters
      terms.add(word);
    }
  });
  
  // Add city name words
  course.location_city.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) {
      terms.add(word);
    }
  });
  
  // Add club name words if it exists
  if (course.club_name) {
    course.club_name.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) {
        terms.add(word);
      }
    });
  }
  
  return Array.from(terms);
}

// Use this when creating or updating a course
export async function createCourse(courseData: Omit<GolfCourse, 'id' | 'searchableTerms'>) {
  if (!db) {
    throw new Error('Firebase is not initialized');
  }
  const searchableTerms = generateSearchableTerms(courseData);
  const courseRef = doc(collection(db, 'courses'));
  await setDoc(courseRef, {
    ...courseData,
    searchableTerms,
    id: courseRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return courseRef.id;
}

/**
 * Get courses within map bounds
 */
export async function getCoursesInBounds(bounds: MapBounds): Promise<GolfCourse[]> {
  if (!db) {
    console.warn(FIREBASE_UNAVAILABLE_ERROR);
    return [];
  }
  
  console.log('Querying courses with bounds:', bounds);
  
  // First query by latitude range
  const q = query(
    collection(db, COLLECTION_NAME),
    where('location_coordinates_latitude', '>=', bounds.south),
    where('location_coordinates_latitude', '<=', bounds.north),
    orderBy('location_coordinates_latitude')
  );
  
  try {
    const snapshot = await getDocs(q);
    console.log('Query successful, found courses:', snapshot.size);
    
    // Filter by longitude in memory since Firestore doesn't support compound queries with multiple range filters
    const courses = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GolfCourse[];
    
    // Filter by longitude
    const filteredCourses = courses.filter(course => 
      course.location_coordinates_longitude >= bounds.west &&
      course.location_coordinates_longitude <= bounds.east
    );
    
    console.log('Courses after longitude filter:', filteredCourses.length);
    return filteredCourses;
  } catch (error) {
    console.error('Firestore query error:', error);
    throw error;
  }
}

/**
 * Calculates the new average ensuring not to divide by zero.
 */
function calculateAverage(sum: number, count: number): number | null {
    if (count === 0) {
        return null;
    }
    return Math.round((sum / count) * 100) / 100;
}

// Define the payload for updating course ratings
// Uses new rating sum fields and FieldValue for increments/timestamps
type CourseUpdatePayload = {
    reviewCount: FieldValue;
    overallRatingSum: FieldValue;
    costRatingSum: FieldValue;
    conditionRatingSum: FieldValue;
    hillinessRatingSum: FieldValue;
    distanceRatingSum: FieldValue;
    calculatedWeightedRatingSum: FieldValue;
    walkabilityRating_overall: number | null; // Recalculated average
    walkabilityRating_cost: number | null;
    walkabilityRating_courseCondition: number | null;
    walkabilityRating_hilliness: number | null;
    walkabilityRating_holeDistance: number | null;
    walkabilityRating_weightedRating: number | null;
    lastRatingUpdate: FieldValue; 
    updatedAt: FieldValue;
};

/**
 * Updates the average ratings and count on a course document based on a new review.
 * Designed to be used within a Firestore transaction.
 */
async function updateCourseRatingsFromReview(
    transaction: Transaction, 
    courseId: string,
    // Include all individual ratings from the review needed for sums
    newReviewData: Pick<
        CourseReview,
        'overallRating' | 'costRating' | 'courseConditionRating' | 
        'hillinessRating' | 'distanceRating' | 'walkabilityRating' // This is the weighted rating
    >,
    currentCourseData: GolfCourse // Pass the existing course data
): Promise<void> {
    const courseRef = getAdminFirestore().collection(COLLECTION_NAME).doc(courseId);

    // Calculate increments using FieldValue
    const increments = {
        reviewCount: FieldValue.increment(1),
        overallRatingSum: FieldValue.increment(newReviewData.overallRating || 0),
        costRatingSum: FieldValue.increment(newReviewData.costRating || 0),
        conditionRatingSum: FieldValue.increment(newReviewData.courseConditionRating || 0),
        hillinessRatingSum: FieldValue.increment(newReviewData.hillinessRating || 0),
        distanceRatingSum: FieldValue.increment(newReviewData.distanceRating || 0),
        calculatedWeightedRatingSum: FieldValue.increment(newReviewData.walkabilityRating || 0) // Increment sum for weighted rating
    };

    // Calculate new averages
    const newReviewCount = (currentCourseData.reviewCount || 0) + 1;
    const newOverallSum = (currentCourseData.overallRatingSum || 0) + (newReviewData.overallRating || 0);
    const newCostSum = (currentCourseData.costRatingSum || 0) + (newReviewData.costRating || 0);
    const newConditionSum = (currentCourseData.conditionRatingSum || 0) + (newReviewData.courseConditionRating || 0);
    const newHillinessSum = (currentCourseData.hillinessRatingSum || 0) + (newReviewData.hillinessRating || 0);
    const newDistanceSum = (currentCourseData.distanceRatingSum || 0) + (newReviewData.distanceRating || 0);
    const newWeightedSum = (currentCourseData.calculatedWeightedRatingSum || 0) + (newReviewData.walkabilityRating || 0);

    const newAverages = {
        walkabilityRating_overall: calculateAverage(newOverallSum, newReviewCount),
        walkabilityRating_cost: calculateAverage(newCostSum, newReviewCount),
        walkabilityRating_courseCondition: calculateAverage(newConditionSum, newReviewCount),
        walkabilityRating_hilliness: calculateAverage(newHillinessSum, newReviewCount),
        walkabilityRating_holeDistance: calculateAverage(newDistanceSum, newReviewCount),
        walkabilityRating_weightedRating: calculateAverage(newWeightedSum, newReviewCount)
    };

    // Prepare the update payload
    const updateData: CourseUpdatePayload = {
        ...increments,
        ...newAverages,
        lastRatingUpdate: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    };

    console.log(`[updateCourseRatings] Updating course ${courseId} with:`, JSON.stringify({ 
        newReviewCount, 
        newAverages 
    }));

    // Perform the update within the transaction
    transaction.update(courseRef, updateData);
}

export { updateCourseRatingsFromReview }; 