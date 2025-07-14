import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';

interface ReviewCourse {
  id: string;
  sessionId: string;
  courseIndex: number;
  courseName: string;
  type: string;
  city: string;
  state: string;
  twgReviewerNotes: string;
  twgRating: string;
  walkabilityRating_overall: number;
  processedBy: string;
  processedByEmail: string;
  processedAt: Date;
  notes?: string;
}

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
    
    // Get all progress records marked as "needs_review"
    const progressSnapshot = await db.collection('courseMatchingProgress')
      .where('status', '==', 'needs_review')
      .get();

    // Get all legacy course sessions to map course data
    const sessionsSnapshot = await db.collection('legacyCourses').get();
    const sessionsMap = new Map();
    
    sessionsSnapshot.forEach(doc => {
      const session = doc.data();
      sessionsMap.set(doc.id, session);
    });

    // Compile review courses with full data
    const reviewCourses: ReviewCourse[] = [];
    
    progressSnapshot.forEach(doc => {
      const progress = doc.data();
      const session = sessionsMap.get(progress.sessionId);
      
      if (session && session.courses && session.courses[progress.courseIndex]) {
        const courseData = session.courses[progress.courseIndex];
        
        reviewCourses.push({
          id: doc.id,
          sessionId: progress.sessionId,
          courseIndex: progress.courseIndex,
          courseName: courseData.courseName,
          type: courseData.type,
          city: courseData.city,
          state: courseData.state,
          twgReviewerNotes: courseData.twgReviewerNotes,
          twgRating: courseData.twgRating,
          walkabilityRating_overall: courseData.walkabilityRating_overall,
          processedBy: progress.processedBy,
          processedByEmail: progress.processedByEmail,
          processedAt: progress.processedAt.toDate(),
          notes: progress.notes
        });
      }
    });

    // Sort by processed date (newest first)
    reviewCourses.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());

    return NextResponse.json({ courses: reviewCourses });

  } catch (error) {
    console.error('Error fetching review courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 