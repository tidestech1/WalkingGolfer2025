import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, updates } = body;

    if (!courseId || !updates) {
      return NextResponse.json(
        { error: 'Course ID and updates are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const courseRef = db.collection('courses').doc(courseId);

    // Add timestamp and user info to updates
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      // Add the user ID who made the update
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