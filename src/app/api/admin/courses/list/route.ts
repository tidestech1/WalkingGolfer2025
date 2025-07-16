import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { GolfCourse } from '@/types/course';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '5000'); // Increased default limit to handle more courses
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'courseName';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const state = searchParams.get('state');
    const clubType = searchParams.get('clubType');
    const searchQuery = searchParams.get('search');

    // Build query
    let query = db.collection('courses').orderBy(sortBy, sortOrder as 'asc' | 'desc');

    // Add filters
    if (state) {
      query = query.where('location_state', '==', state);
    }
    if (clubType) {
      query = query.where('club_type', '==', clubType);
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    // Execute query
    const snapshot = await query.get();
    let courses: GolfCourse[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GolfCourse[];

    // Apply text search filter (client-side for now)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      courses = courses.filter(course =>
        course.courseName.toLowerCase().includes(query) ||
        course.club_name.toLowerCase().includes(query) ||
        course.location_city.toLowerCase().includes(query) ||
        course.location_state.toLowerCase().includes(query)
      );
    }

    // Get total count for pagination
    const totalSnapshot = await db.collection('courses').get();
    const totalCount = totalSnapshot.size;

    return NextResponse.json({
      courses,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 