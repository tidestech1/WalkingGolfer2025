'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';

// We might need the CourseReview type or a subset of it
// import { CourseReview } from '@/types/review'; 
// And possibly GolfCourse type if we want to display course name
// import { GolfCourse } from '@/types/course';

interface ReviewDataFromStorage {
  // Define based on what's in fullDataForPending from RatingForm.tsx
  // This will include fields like courseId (from pendingReviewData), walkabilityRating, isWalkable, 
  // courseConditionRating, overallRating, hillinessRating, distanceRating, costRating, 
  // comment, walkingDate, pros, cons, submittedEmail, submittedName, display_name_type
  courseId: string;
  walkabilityRating: number;
  isWalkable: boolean;
  courseConditionRating: number;
  overallRating: number;
  hillinessRating: number;
  distanceRating: number;
  costRating: number;
  comment?: string;
  walkingDate?: string; // Assuming it's ISO string
  pros?: string[];
  cons?: string[];
  submittedEmail: string; 
  submittedName?: string;
  display_name_type: string; 
  imageUrls?: string[]; // Added to match usage in submissionPayload
  // Add other fields that are part of 'fullDataForPending' and expected by submit-authenticated
}

function CompleteReviewContent() {
  const router = useRouter();
  const params = useParams(); // For getting [courseId] from URL
  const { user, getIdToken, loading: authLoading } = useAuth();
  
  const pageCourseId = typeof params['courseId'] === 'string' ? params['courseId'] : null; // Fixed: bracket notation

  const [status, setStatus] = useState<'loading' | 'submitting' | 'success' | 'error' | 'idle'>('loading');
  const [message, setMessage] = useState<string>('');
  // const [courseName, setCourseName] = useState<string>(''); // Optional: for display

  useEffect(() => {
    if (authLoading) {
      setStatus('loading');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to complete your review.');
      router.replace('/login'); // Or /login?returnUrl=/review/complete/COURSE_ID
      return;
    }

    if (!pageCourseId) {
        setStatus('error');
        setMessage('Course ID is missing from the URL. Cannot complete review.');
        toast.error('Course ID is missing.');
        return;
    }

    setStatus('submitting');
    let reviewDataString: string | null = null;
    let storedCourseId: string | null = null;

    try {
      reviewDataString = sessionStorage.getItem('pendingReviewDataForLogin');
      storedCourseId = sessionStorage.getItem('pendingReviewCourseId');
    } catch (e) {
      console.error("Error accessing sessionStorage:", e);
      setStatus('error');
      setMessage('Could not access stored review data. Please try submitting again.');
      toast.error('Error accessing stored review data.');
      return;
    }

    // Clear sessionStorage immediately after retrieving
    try {
        sessionStorage.removeItem('pendingReviewDataForLogin');
        sessionStorage.removeItem('pendingReviewCourseId');
    } catch (e) {
        console.warn("Could not remove items from sessionStorage:", e);
        // Non-fatal, but good to log
    }

    if (!reviewDataString || !storedCourseId) {
      setStatus('error');
      setMessage('No pending review data found. Please try submitting your review again.');
      toast.error('Pending review data not found.');
      return;
    }

    if (storedCourseId !== pageCourseId) {
      setStatus('error');
      setMessage('Course ID mismatch. Cannot complete review. Please try again.');
      toast.error('Course ID mismatch.');
      return;
    }

    const parsedReviewData: ReviewDataFromStorage = JSON.parse(reviewDataString);
    
    // Prepare data for the /api/reviews/submit-authenticated endpoint
    // It expects fields like those in ratingFormSchema plus imageUrls and courseId.
    // The user ID is derived from the token by the backend.
    const submissionPayload = {
      ...parsedReviewData, // Contains most fields
      courseId: pageCourseId, // Ensure this is the primary courseId from URL
      imageUrls: parsedReviewData.imageUrls || [], // Ensure imageUrls is present, defaults to empty array
      // Ensure any other transformations or additions required by submit-authenticated are done here.
      // For example, if submittedName and submittedEmail are not directly used by submit-authenticated for display,
      // they are still good to have in the stored data for context, but the backend will use user profile for display.
    };

    const submitReview = async () => {
      const token = await getIdToken();
      if (!token) {
        setStatus('error');
        setMessage('Authentication token not found. Please log in again.');
        toast.error('Authentication failed.');
        return;
      }

      try {
        const response = await fetch('/api/reviews/submit-authenticated', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(submissionPayload),
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          //Potentially fetch course name here if needed for message, or pass it via sessionStorage
          setMessage(result.message || `Your review for course ${pageCourseId} has been submitted and published successfully!`); 
          toast.success(result.message || 'Review submitted and published!');
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to submit your review. Please try again later.');
          toast.error(result.error || 'Review submission failed.');
        }
      } catch (err) {
        console.error('Error submitting review:', err);
        setStatus('error');
        setMessage('An unexpected error occurred while submitting your review.');
        toast.error('Review submission error.');
      }
    };

    submitReview();

  }, [user, authLoading, router, pageCourseId, getIdToken]);

  // UI for different states
  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  if (status === 'submitting') {
    return <div className="flex justify-center items-center min-h-screen">Submitting your review...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      {status === 'success' && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-md shadow-md">
          <h1 className="text-2xl font-semibold mb-3">Review Submitted!</h1>
          <p className="mb-4">{message}</p>
          <Link href={`/courses/${pageCourseId}`} className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out">
            View Course
          </Link>
          <Link href={`/profile`} className="ml-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out">
            View Your Profile
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md">
          <h1 className="text-2xl font-semibold mb-3">Submission Failed</h1>
          <p className="mb-4">{message}</p>
          <Link href={`/courses/${pageCourseId}/review/new`} className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out">
            Try Again
          </Link>
           <Link href={`/`} className="ml-4 inline-block bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out">
            Go Home
          </Link>
        </div>
      )}
       {/* Idle state could be if the page is accessed directly without proper flow */}
      {status === 'idle' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-md shadow-md">
            <h1 className="text-2xl font-semibold mb-3">Nothing to do</h1>
            <p className="mb-4">This page is for completing a review after login. If you were trying to submit a review, please start from the course page.</p>
            <Link href={`/`} className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out">
                Go Home
            </Link>
        </div>
      )}
    </div>
  );
}

export default function CompleteReviewPage() {
  // Using Suspense for good measure, though useSearchParams is not directly used in CompleteReviewContent
  // but router and params are.
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading page...</div>}>
      <CompleteReviewContent />
    </Suspense>
  );
} 