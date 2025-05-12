import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, limit, orderBy, getDocs, QueryConstraint } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '@/lib/firebase/firebase'; // Assuming client SDK is okay here, adjust if admin needed
import { GolfCourse, CourseFilters } from '@/types/course';
// import { COLLECTION_NAME } from '@/lib/firebase/constants'; // Assuming constants file exists

// Define collection name directly
const COLLECTION_NAME = 'courses'; 
const MAX_RESULTS = 20;

// Define the mapping from query param keys to Firestore field names
const facilityFilterMappings: { [K in keyof Pick<CourseFilters, 'filter_drivingRange' | 'filter_golfCarts' | 'filter_pushCarts' | 'filter_restaurant' | 'filter_proShop' | 'filter_puttingGreen' | 'filter_chippingGreen' | 'filter_practiceBunker' | 'filter_caddies' | 'filter_clubRental'>]: keyof Pick<GolfCourse, 'facilities_drivingRange' | 'facilities_golfCarts' | 'facilities_pushCarts' | 'facilities_restaurant' | 'facilities_proShop' | 'facilities_puttingGreen' | 'facilities_chippingGreen' | 'facilities_practiceBunker' | 'facilities_caddies' | 'facilities_clubRental'> } = {
  filter_drivingRange: 'facilities_drivingRange',
  filter_golfCarts: 'facilities_golfCarts',
  filter_pushCarts: 'facilities_pushCarts',
  filter_restaurant: 'facilities_restaurant',
  filter_proShop: 'facilities_proShop',
  filter_puttingGreen: 'facilities_puttingGreen',
  filter_chippingGreen: 'facilities_chippingGreen',
  filter_practiceBunker: 'facilities_practiceBunker',
  filter_caddies: 'facilities_caddies',
  filter_clubRental: 'facilities_clubRental',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // --- Get Search and Filter Params ---
  const searchQuery = searchParams.get('q');
  const minRatingParam = searchParams.get('minRating');
  const isWalkableParam = searchParams.get('isWalkable');
  
  const activeFacilityFilters: { firestoreField: keyof GolfCourse, value: boolean }[] = [];
  for (const paramKey in facilityFilterMappings) {
    if (searchParams.has(paramKey)) {
      if (searchParams.get(paramKey) === 'true') {
        activeFacilityFilters.push({
          firestoreField: facilityFilterMappings[paramKey as keyof typeof facilityFilterMappings]!,
          value: true,
        });
      }
    }
  }
  // --- End Params ---

  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json({ error: 'Firebase is not available' }, { status: 503 });
  }
  
  // Validate search criteria presence (at least one needed)
  const hasSearchTerm = searchQuery && searchQuery.trim().length >= 2;
  const minRating = minRatingParam ? parseInt(minRatingParam, 10) : 0;
  const hasRatingFilter = minRating > 0 && minRating <= 5;
  const isWalkable = isWalkableParam === 'true';
  const hasFacilityFilters = activeFacilityFilters.length > 0;
  
  if (!hasSearchTerm && !hasRatingFilter && !isWalkable && !hasFacilityFilters) {
    return NextResponse.json({ error: 'Missing search criteria. Provide a search term or filter.' }, { status: 400 });
  }

  try {
    const coursesRef = collection(db, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [];

    // --- Apply Filters ---
    if (hasSearchTerm) {
      const searchTerm = searchQuery.trim().toLowerCase();
      constraints.push(where('searchableTerms', 'array-contains', searchTerm));
    }
    
    if (hasRatingFilter) {
       // Clamp rating just in case, although frontend should handle it
      const clampedRating = Math.max(0, Math.min(5, minRating)); 
      constraints.push(where('walkabilityRating_overall', '>=', clampedRating));
    }
    
    if (isWalkable) {
      constraints.push(where('course_isWalkable', '==', true));
    }

    activeFacilityFilters.forEach(filter => {
      constraints.push(where(filter.firestoreField as string, '==', filter.value));
    });
    // --- End Filters ---

    // Add sorting (requires composite indexes!)
    // Base sort by name if search term exists, otherwise by rating maybe?
    if (hasSearchTerm) {
        constraints.push(orderBy('courseName', 'asc'));
    } else if (hasRatingFilter) {
        // Sort by rating descending if filtering by rating but not searching text
        constraints.push(orderBy('walkabilityRating_overall', 'desc'));
        constraints.push(orderBy('courseName', 'asc')); // Secondary sort
    } else {
        // Default sort if only filtering by walkable
        constraints.push(orderBy('courseName', 'asc'));
    }

    // Limit the results
    constraints.push(limit(MAX_RESULTS));

    console.log("Executing Firestore query with constraints:", constraints);
    const q = query(coursesRef, ...constraints);
    const snapshot = await getDocs(q);

    // Select only the required fields to minimize data exposure
    const courses = snapshot.docs.map(doc => {
        const data = doc.data() as GolfCourse; // Assert type after fetching
        return {
          id: doc.id, // Include id for potential linking
          club_name: data.club_name,
          course_name: data.courseName,
          location_city: data.location_city,
          location_state: data.location_state,
          walkabilityRating_overall: data.walkabilityRating_overall,
          course_holes: data.course_holes,
        };
      });
      
    // Do not expose total counts

    return NextResponse.json({ courses });

  } catch (error) {
    console.error('Error searching courses:', error);
     // Check if it's a Firestore error indicating missing index
    if (error instanceof Error && error.message.includes('requires an index')) {
      console.error("Firestore index possibly missing. Check Firebase console logs for index creation link based on the failed query.");
       return NextResponse.json({ error: 'Search configuration error. Please check Firestore indexes.' }, { status: 500 }); // User-friendly message
    }
    return NextResponse.json({ error: 'Failed to search courses' }, { status: 500 });
  }
} 