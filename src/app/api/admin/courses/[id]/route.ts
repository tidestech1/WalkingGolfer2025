import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { GolfCourse } from '@/types/course';
import { generateSearchableTerms } from '@/lib/firebase/courseUtils';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { params } = context;
    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(params.id);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = {
      id: courseSnap.id,
      ...courseSnap.data()
    } as GolfCourse;

    return NextResponse.json({ course });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { params } = context;
    const body = await request.json();
    const updates = body.updates;

    if (!updates) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(params.id);
    
    // Check if course exists
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get current course data
    const currentCourse = courseSnap.data() as GolfCourse;

    // Merge updates with current data for searchable terms generation
    const updatedCourse = { ...currentCourse, ...updates };

    // Generate new searchable terms if relevant fields changed
    const searchableTerms = generateSearchableTerms(updatedCourse);

    // Prepare update data
    const updateData = {
      ...updates,
      searchableTerms,
      updatedAt: new Date(),
      lastUpdatedBy: authResult.userId,
    };

    await courseRef.update(updateData);

    return NextResponse.json({ 
      success: true, 
      message: 'Course updated successfully' 
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { params } = context;
    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(params.id);
    
    // Check if course exists
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if there are any reviews for this course
    const reviewsSnapshot = await db.collection('reviews')
      .where('courseId', '==', params.id)
      .limit(1)
      .get();

    if (!reviewsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing reviews. Please delete reviews first.' },
        { status: 400 }
      );
    }

    // Delete the course
    await courseRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 