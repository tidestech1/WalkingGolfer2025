import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, limit, orderBy, getDocs, QueryConstraint } from 'firebase/firestore';
import { db, isFirebaseAvailable } from '@/lib/firebase/firebase'; // Assuming client SDK is okay here, adjust if admin needed
import { GolfCourse } from '@/types/course';
// import { COLLECTION_NAME } from '@/lib/firebase/constants'; // Assuming constants file exists

// Define collection name directly
const COLLECTION_NAME = 'courses'; 
const MAX_RESULTS = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // --- Get Search and Filter Params ---
  const searchQuery = searchParams.get('q');
  const minRatingParam = searchParams.get('minRating');
  const isWalkableParam = searchParams.get('isWalkable');
  // --- End Params ---

  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json({ error: 'Firebase is not available' }, { status: 503 });
  }
  
  // Validate search criteria presence (at least one needed)
  const hasSearchTerm = searchQuery && searchQuery.trim().length >= 2;
  const minRating = minRatingParam ? parseInt(minRatingParam, 10) : 0;
  const hasRatingFilter = minRating > 0 && minRating <= 5;
  const isWalkable = isWalkableParam === 'true';
  
  if (!hasSearchTerm && !hasRatingFilter && !isWalkable) {
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