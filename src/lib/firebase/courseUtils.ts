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
import { Firestore as AdminFirestore, FieldValue, Transaction } from 'firebase-admin/firestore';
 
import { getCachedCourse, setCachedCourse, getCachedCourseList, setCachedCourseList, generateQueryKey } from '@/lib/utils/courseCache';
import { GolfCourse, CourseFilters, MapBounds } from '@/types/course';
import { CourseReview } from '@/types/review';

// Client-side Firestore instance
import { db } from './firebase'; 
// Server-side Firestore instance (Admin SDK)
import { getAdminFirestore } from './firebaseAdmin'; 

const COLLECTION_NAME = 'courses';
const COURSES_PER_PAGE = 20;
const MAX_QUERY_ATTEMPTS = 3;

// Error message for when Firebase is unavailable
const FIREBASE_UNAVAILABLE_ERROR = 'Sorry, the Walking Golfer course database is currently not available. Please check again later or contact us.';

interface CourseQueryResult {
  courses: GolfCourse[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  source: 'cache' | 'firebase';
}

/**
 * Get a single course by ID with caching
 */
export async function getCourseById(id: string): Promise<GolfCourse | null> {
  try {
    const cached = getCachedCourse(id);
    if (cached) {
      console.log(`Cache hit for course: ${id}`);
      return cached;
    }
    console.log(`Cache miss for course: ${id}, fetching from Firestore...`);

    let course: GolfCourse | null = null;
    let docSnap;

    if (typeof window === 'undefined') {
      // --- Server-Side --- 
      console.log("Using Admin Firestore SDK (server-side) for getCourseById");
      try {
        const adminDb: AdminFirestore = getAdminFirestore();
        const docRef = adminDb.collection(COLLECTION_NAME).doc(id); // Use Admin SDK methods
        docSnap = await docRef.get();
        
        if (docSnap.exists) {
          course = { id: docSnap.id, ...docSnap.data() } as GolfCourse;
        } else {
          console.log(`Course not found in Admin Firestore: ${id}`);
        }
      } catch (adminError) {
        console.error(`Admin Firestore error fetching course ${id}:`, adminError);
        throw adminError; // Re-throw server errors
      }
    } else {
      // --- Client-Side --- 
      console.log("Using Client Firestore SDK (client-side) for getCourseById");
      if (!db) { 
          console.error('Client Firestore DB instance is not available.');
          return null;
      }
      try {
        const docRef = doc(db, COLLECTION_NAME, id); // Use Client SDK function
        docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          course = { id: docSnap.id, ...docSnap.data() } as GolfCourse;
        } else {
          console.log(`Course not found in Client Firestore: ${id}`);
        }
      } catch (clientError) {
        console.error(`Client Firestore error fetching course ${id}:`, clientError);
        return null;
      }
    }

    if (course) {
      console.log(`Fetched course from Firestore, caching: ${id}`);
      setCachedCourse(course);
    }
    
    return course;

  } catch (error) {
    console.error(`Overall error fetching course ${id}:`, error);
    return null;
  }
}

/**
 * Build query constraints based on filters
 */
function buildQueryConstraints(
  filters: CourseFilters, 
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  let firstOrderByField: string | null = null;
  const sortDirection = filters.sortOrder || 'desc';

  // --- New Filter Logic --- 

  // Boolean Filters (applied first)
  if (filters.filter_isWalkable === true) {
    constraints.push(where('course_isWalkable', '==', true));
  }
  if (filters.filter_drivingRange === true) {
    constraints.push(where('facilities_drivingRange', '==', true));
  }
  if (filters.filter_golfCarts === true) {
    constraints.push(where('facilities_golfCarts', '==', true));
  }
  if (filters.filter_pushCarts === true) {
    constraints.push(where('facilities_pushCarts', '==', true));
  }
  if (filters.filter_restaurant === true) {
    constraints.push(where('facilities_restaurant', '==', true));
  }
  if (filters.filter_proShop === true) {
    constraints.push(where('facilities_proShop', '==', true));
  }
  if (filters.filter_puttingGreen === true) {
    constraints.push(where('facilities_puttingGreen', '==', true));
  }
  if (filters.filter_chippingGreen === true) {
    constraints.push(where('facilities_chippingGreen', '==', true));
  }
  if (filters.filter_practiceBunker === true) {
    constraints.push(where('facilities_practiceBunker', '==', true));
  }
  if (filters.filter_caddies === true) {
    constraints.push(where('facilities_caddies', '==', true));
  }
  if (filters.filter_clubRental === true) {
    constraints.push(where('facilities_clubRental', '==', true));
  }
  
  // Walkability Rating Filter
  if (filters.walkabilityRating_overall_min > 0) {
    constraints.push(where('walkabilityRating_overall', '>=', filters.walkabilityRating_overall_min));
    // If filtering by rating, it often makes sense to sort by it too
    if (!firstOrderByField) {
       firstOrderByField = 'walkabilityRating_overall';
       constraints.push(orderBy(firstOrderByField, sortDirection));
    }
  }
  
  // Search Term Filter
  if (filters.searchQuery?.trim()) {
    constraints.push(where('searchableTerms', 'array-contains', filters.searchQuery.trim().toLowerCase()));
    // If searching, default sort might change (e.g., by relevance if available, or name)
    if (!firstOrderByField) {
        firstOrderByField = 'courseName'; // Example: Sort by name when searching
        constraints.push(orderBy(firstOrderByField, 'asc')); // Example: Ascending for name
    }
  }

  // REMOVED OLD FILTERS: pricing_fee, course_types, course_categories
  /*
  else if (filters.pricing_fee_min > 0 || filters.pricing_fee_max < 9999) { ... }
  if (filters.course_types?.length > 0) { ... }
  if (filters.course_categories?.length > 0) { ... }
  */

  // Default Sort Order (if not already set by a filter)
  if (!firstOrderByField) {
    const sortField = filters.sortBy || 'walkabilityRating_overall'; // Default sort
    constraints.push(orderBy(sortField, sortDirection));
    firstOrderByField = sortField;
  }

  // Add secondary sort for stable pagination if primary sort isn't unique
  // Using document ID (__name__) is a common Firestore pattern
  if (firstOrderByField !== '__name__') {
     constraints.push(orderBy('__name__', sortDirection)); // Use same direction as primary for consistency
  }
  
  return addPaginationConstraints(constraints, lastVisible);
}

/**
 * Add pagination constraints to the query
 */
function addPaginationConstraints(
  constraints: QueryConstraint[],
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): QueryConstraint[] {
  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }
  constraints.push(limit(COURSES_PER_PAGE + 1));
  return constraints;
}

/**
 * Get courses with pagination and caching
 */
export async function getCourses(
  filters: CourseFilters,
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<CourseQueryResult> {
  const queryKey = generateQueryKey({ ...filters, cursor: lastVisible?.id });
  
  // --- Server-Side Execution --- 
  if (typeof window === 'undefined') {
    console.log("Executing getCourses on Server (Simplified)");
    try {
      const adminDb = getAdminFirestore();
      // Simplified query: Fetch first page ordered by walkability
      const adminQuery = adminDb.collection(COLLECTION_NAME)
                              .orderBy('walkabilityRating_overall', 'desc') // Example default sort
                              .limit(COURSES_PER_PAGE); // Fetch fixed number
      const snapshot = await adminQuery.get();
      const resultCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GolfCourse[];
      
      // Server-side does not return pagination cursor or accurate hasMore for this simplified version
      return {
        courses: resultCourses,
        lastVisible: null, 
        hasMore: false, // Assume false for simplified server query
        source: 'firebase'
      };
    } catch (error) {
       console.error(`Server-side getCourses failed:`, error);
       // Throw or return empty based on how you want to handle server errors
       throw error; 
    }
  }

  // --- Client-Side Execution --- 
  console.log("Executing getCourses on Client");
  // Check cache first
  if (!lastVisible) {
    const cached = getCachedCourseList(queryKey);
    if (cached) {
      console.log(`Cache hit for query: ${queryKey}`);
      return { courses: cached, lastVisible: null, hasMore: false, source: 'cache' };
    }
    console.log(`Cache miss for query: ${queryKey}, fetching from Firestore...`);
  }

  let resultCourses: GolfCourse[] = [];
  let resultLastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
  let hasMore = false;
  let attempts = 0;
  let lastError: Error | null = null;

  const clientConstraints = buildQueryConstraints(filters, lastVisible);

  while (attempts < MAX_QUERY_ATTEMPTS) {
    try {
      if (!db) {
throw new Error('Client Firestore DB not available');
}
      const coursesRef = collection(db, COLLECTION_NAME);
      const q = query(coursesRef, ...clientConstraints); 
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      hasMore = docs.length > COURSES_PER_PAGE;
      const courseDocs = hasMore ? docs.slice(0, -1) : docs;
      resultCourses = courseDocs.map(doc => ({ id: doc.id, ...doc.data() })) as GolfCourse[];
      resultLastVisible = courseDocs[courseDocs.length - 1] || null;
      
      // Client-side caching
      if (!lastVisible) {
        setCachedCourseList(queryKey, resultCourses);
      }
      resultCourses.forEach(course => setCachedCourse(course));

      return {
        courses: resultCourses,
        lastVisible: resultLastVisible,
        hasMore,
        source: 'firebase'
      };

    } catch (error) {
      console.error(`Client getCourses Query attempt ${attempts + 1} failed:`, error);
      lastError = error as Error;
      attempts++;
      if (attempts < MAX_QUERY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  throw lastError || new Error('Client: Failed to fetch courses after multiple attempts');
}

/**
 * Prefetch the next page of results
 */
export async function prefetchNextPage(
  filters: CourseFilters,
  lastVisible: QueryDocumentSnapshot<DocumentData>
): Promise<void> {
  try {
    await getCourses(filters, lastVisible);
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
 console.error('Cannot add course: Firebase DB not available on client.'); return null; 
}
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
 console.error('Error adding course:', error); return null; 
}
}

/**
 * Update an existing course
 */
export async function updateCourse(id: string, courseData: Partial<GolfCourse>): Promise<boolean> {
   if (!db) {
 console.error('Cannot update course: Firebase DB not available on client.'); return false; 
}
   try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...courseData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
 console.error('Error updating course:', error); return false; 
}
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string): Promise<boolean> {
   if (!db) {
 console.error('Cannot delete course: Firebase DB not available on client.'); return false; 
}
   try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
 console.error('Error deleting course:', error); return false; 
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