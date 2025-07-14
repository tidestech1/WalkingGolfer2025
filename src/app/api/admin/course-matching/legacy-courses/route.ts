import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { Timestamp } from 'firebase-admin/firestore';

interface LegacyCourse {
  courseName: string;
  type: string;
  city: string;
  state: string;
  twgReviewerNotes: string;
  twgRating: string;
  walkabilityRating_overall: number;
  originalIndex: number;
}

interface LegacyCourseSession {
  id: string;
  courses: LegacyCourse[];
  uploadedBy: string;
  uploadedAt: Timestamp;
  totalCourses: number;
  sessionName: string;
}

// GET - Retrieve legacy course data
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getAdminFirestore();
    const snapshot = await db.collection('legacyCourses').orderBy('uploadedAt', 'desc').limit(1).get();
    
    if (snapshot.empty) {
      return NextResponse.json({ courses: [], session: null });
    }

    const doc = snapshot.docs[0];
    const session = { id: doc.id, ...doc.data() } as LegacyCourseSession;
    
    return NextResponse.json({ 
      courses: session.courses, 
      session: {
        id: session.id,
        sessionName: session.sessionName,
        uploadedBy: session.uploadedBy,
        uploadedAt: session.uploadedAt,
        totalCourses: session.totalCourses
      }
    });

  } catch (error) {
    console.error('Error retrieving legacy courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Store new legacy course data
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courses, sessionName } = await request.json();
    
    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json({ error: 'Invalid courses data' }, { status: 400 });
    }

    const db = getAdminFirestore();
    
    // Create new session
    const sessionData: Omit<LegacyCourseSession, 'id'> = {
      courses,
      uploadedBy: authResult.userId || 'unknown',
      uploadedAt: Timestamp.now(),
      totalCourses: courses.length,
      sessionName: sessionName || `Course Import ${new Date().toISOString().split('T')[0]}`
    };

    const docRef = await db.collection('legacyCourses').add(sessionData);
    
    return NextResponse.json({ 
      success: true, 
      sessionId: docRef.id,
      message: `Uploaded ${courses.length} legacy courses` 
    });

  } catch (error) {
    console.error('Error storing legacy courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 