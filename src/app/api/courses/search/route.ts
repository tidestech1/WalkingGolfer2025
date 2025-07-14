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
  const includeUnwalkableParam = searchParams.get('includeUnwalkable');
  const clubTypesParam = searchParams.get('clubTypes');
  const courseHolesParam = searchParams.get('courseHoles');
  const sortByParam = searchParams.get('sortBy');
  const sortOrderParam = searchParams.get('sortOrder');
  
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json({ error: 'Firebase is not available' }, { status: 503 });
  }
  
  // Validate search criteria presence (at least one needed)
  const hasSearchTerm = searchQuery && searchQuery.trim().length >= 2;
  const minRating = minRatingParam ? parseInt(minRatingParam, 10) : 0;
  const hasRatingFilter = minRating > 0 && minRating <= 5;
  const includeUnwalkable = includeUnwalkableParam === 'true';
  const clubTypes = clubTypesParam ? clubTypesParam.split(',') : ['Public', 'Semi-Private', 'Resort'];
  const courseHoles = courseHolesParam ? courseHolesParam.split(',').map(h => parseInt(h, 10)) : [18];
  
  // Sorting parameters
  const sortBy = sortByParam || 'walkabilityRating_overall';
  const sortOrder = (sortOrderParam === 'asc' || sortOrderParam === 'desc') ? sortOrderParam : 'desc';
  
  // Check if filters differ from defaults
  const hasClubTypeFilter = clubTypes.length !== 3 || !clubTypes.includes('Public') || !clubTypes.includes('Semi-Private') || !clubTypes.includes('Resort');
  const hasCourseHolesFilter = courseHoles.length !== 1 || !courseHoles.includes(18);
  
  if (!hasSearchTerm && !hasRatingFilter && !includeUnwalkable && !hasClubTypeFilter && !hasCourseHolesFilter) {
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
    
    // Include un-walkable courses filter (matches map search logic)
    if (!includeUnwalkable) {
      // By default, exclude courses that are explicitly marked as not walkable
      constraints.push(where('course_isWalkable', '!=', false));
    }

    // Club type filter
    if (hasClubTypeFilter) {
      constraints.push(where('club_type', 'in', clubTypes));
    }

    // Course holes filter
    if (hasCourseHolesFilter) {
      // Convert discrete values to ranges like in map search
      // 9 = 9-17 holes, 18 = 18+ holes
      const has9Range = courseHoles.includes(9);
      const has18Range = courseHoles.includes(18);
      
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

    // Add dynamic sorting
    if (sortBy === 'course_name') {
      constraints.push(orderBy('courseName', sortOrder));
    } else if (sortBy === 'walkabilityRating_overall') {
      constraints.push(orderBy('walkabilityRating_overall', sortOrder));
      // Add secondary sort by course name for consistent ordering
      constraints.push(orderBy('courseName', 'asc'));
    } else {
      // Default fallback
      constraints.push(orderBy('courseName', 'asc'));
    }

    // Limit the results
    constraints.push(limit(MAX_RESULTS));

    console.log("Executing Firestore query with constraints:", constraints);
    const q = query(coursesRef, ...constraints);
    const snapshot = await getDocs(q);

    const courses = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<GolfCourse, 'id'>;
      return {
        id: doc.id,
        club_name: data.club_name,
        course_name: data.courseName,
        location_city: data.location_city,
        location_state: data.location_state,
        walkabilityRating_overall: data.walkabilityRating_overall,
        course_holes: data.course_holes,
      };
    });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('Error searching courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for more complex search scenarios (like admin course matching)
export async function POST(request: NextRequest) {
  if (!isFirebaseAvailable() || !db) {
    return NextResponse.json({ error: 'Firebase is not available' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { searchQuery, limit: requestLimit = MAX_RESULTS, state, city } = body;

    const coursesRef = collection(db, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [];

    // For course matching, we want to search by location first
    if (state) {
      constraints.push(where('location_state', '==', state));
    }
    
    if (city) {
      constraints.push(where('location_city', '==', city));
    }

    // If we have a search query, add it to searchable terms
    if (searchQuery && searchQuery.trim().length >= 2) {
      const searchTerm = searchQuery.trim().toLowerCase();
      constraints.push(where('searchableTerms', 'array-contains', searchTerm));
    }

    // Order by course name for consistent results
    constraints.push(orderBy('courseName', 'asc'));
    
    // Limit results
    constraints.push(limit(requestLimit));

    console.log("Executing POST search with constraints:", constraints);
    const q = query(coursesRef, ...constraints);
    const snapshot = await getDocs(q);

    const courses = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<GolfCourse, 'id'>;
      return {
        id: doc.id,
        courseName: data.courseName,
        club_name: data.club_name,
        location_city: data.location_city,
        location_state: data.location_state,
        club_type: data.club_type,
        course_holes: data.course_holes,
        walkabilityRating_overall: data.walkabilityRating_overall,
      };
    });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('Error in POST search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}