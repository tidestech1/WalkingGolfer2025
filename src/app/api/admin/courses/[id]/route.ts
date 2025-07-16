import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { GolfCourse } from '@/types/course';
import { generateSearchableTerms } from '@/lib/firebase/courseUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = { id: courseDoc.id, ...courseDoc.data() } as GolfCourse;
    
    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const updates = body.updates;

    if (!updates) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const currentCourse = courseDoc.data() as GolfCourse;

    // Generate searchable terms
    const searchableTerms = generateSearchableTerms(updates);

    // Prepare update history entry
    const updateHistoryEntry = {
      updatedBy: authResult.userId || 'Unknown',
      updatedAt: new Date(),
      changes: 'Course details updated'
    };

    // Get current update history or initialize empty array
    const currentUpdateHistory = currentCourse.updateHistory || [];
    
    // Add new entry and keep only last 10 entries
    const newUpdateHistory = [updateHistoryEntry, ...currentUpdateHistory].slice(0, 10);

    // Prepare update data
    const updateData = {
      ...updates,
      searchableTerms,
      updatedAt: new Date(),
      lastUpdatedBy: authResult.userId,
      updateHistory: newUpdateHistory,
    };

    await courseRef.update(updateData);

    // Get updated course
    const updatedCourseDoc = await courseRef.get();
    const updatedCourse = { id: updatedCourseDoc.id, ...updatedCourseDoc.data() } as GolfCourse;

    return NextResponse.json({ course: updatedCourse });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(id);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has reviews - if so, don't allow deletion
    const reviewsQuery = db.collection('reviews').where('courseId', '==', id);
    const reviewsSnapshot = await reviewsQuery.get();
    
    if (!reviewsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing reviews' },
        { status: 400 }
      );
    }

    await courseRef.delete();

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 