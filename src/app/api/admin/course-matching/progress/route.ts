import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { Timestamp } from 'firebase-admin/firestore';

interface MatchingProgress {
  id: string;
  sessionId: string;
  courseIndex: number;
  status: 'pending' | 'matched' | 'closed' | 'needs_review';
  matchedCourseId?: string;
  notes?: string;
  processedAt: Timestamp;
  processedBy: string;
  processedByEmail: string;
}

// GET - Retrieve progress for a session
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const snapshot = await db.collection('courseMatchingProgress')
      .where('sessionId', '==', sessionId)
      .get();
    
    const progress: Record<number, MatchingProgress> = {};
    
    snapshot.forEach(doc => {
      const data = doc.data() as Omit<MatchingProgress, 'id'>;
      progress[data.courseIndex] = {
        id: doc.id,
        ...data
      };
    });

    return NextResponse.json({ progress });

  } catch (error) {
    console.error('Error retrieving progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update progress for a course
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId, courseIndex, status, matchedCourseId, notes, processedByEmail } = await request.json();
    
    if (!sessionId || courseIndex === undefined || !status) {
      return NextResponse.json({ 
        error: 'Session ID, course index, and status are required' 
      }, { status: 400 });
    }

    const db = getAdminFirestore();
    
    // Check if progress record already exists
    const existingSnapshot = await db.collection('courseMatchingProgress')
      .where('sessionId', '==', sessionId)
      .where('courseIndex', '==', courseIndex)
      .get();

    // Create progress data object, filtering out undefined values
    const progressData: any = {
      sessionId,
      courseIndex,
      status,
      processedAt: Timestamp.now(),
      processedBy: authResult.userId || 'unknown',
      processedByEmail: processedByEmail || 'unknown'
    };

    // Only add optional fields if they have values
    if (matchedCourseId !== undefined) {
      progressData.matchedCourseId = matchedCourseId;
    }
    if (notes !== undefined) {
      progressData.notes = notes;
    }

    if (!existingSnapshot.empty) {
      // Update existing record
      const docRef = existingSnapshot.docs[0].ref;
      await docRef.update(progressData);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Progress updated',
        id: docRef.id
      });
    } else {
      // Create new record
      const docRef = await db.collection('courseMatchingProgress').add(progressData);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Progress created',
        id: docRef.id
      });
    }

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 