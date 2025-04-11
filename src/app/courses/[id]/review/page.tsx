'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth'; // Adjust import path if needed
import { getCourseById } from '@/lib/firebase/courseUtils'; // Adjust import path if needed
import { GolfCourse } from '@/types/course';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Removed CourseSearch import
import RatingForm from './RatingForm';

// Accept params prop
export default function ReviewCoursePage({ params }: { params: { id: string } }) {
  const { id: courseId } = params; // Destructure and rename id
  const [course, setCourse] = useState<GolfCourse | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: loadingAuth } = useAuth(); // Get auth state

  useEffect(() => {
    if (!courseId) {
      setError('No course ID provided.');
      setIsLoadingCourse(false);
      return;
    }

    const fetchCourse = async () => {
      setIsLoadingCourse(true);
      setError(null);
      try {
        const fetchedCourse = await getCourseById(courseId);
        if (!fetchedCourse) {
          // Handle course not found - using notFound() might be better if this is a server component
          // but for client components, setting an error state is common.
          setError('Course not found.');
        } else {
          setCourse(fetchedCourse);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError('Failed to load course data.');
      } finally {
        setIsLoadingCourse(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Show loading state while fetching course or checking auth
  if (isLoadingCourse || loadingAuth) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle errors fetching course data
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <p>Error: {error}</p>
        {/* Optionally add a link back or retry button */}
      </div>
    );
  }
  
  // Handle case where course was definitively not found (after loading)
  if (!course) {
     // This triggers Next.js 404 page if thrown during render in Server Components
     // In Client Components, it might cause an error boundary trigger or just stop rendering.
     // Consider redirecting or showing a dedicated "Not Found" UI instead.
     // For now, relying on the error state above for client-side handling.
     // notFound(); 
     return (
       <div className="container mx-auto px-4 py-8 text-center text-gray-600">
         <p>Course not found.</p>
       </div>
     );
  }
  
  // TODO: Implement redirect or prompt if user is null (for initial setup, assume user must be logged in)
  // if (!user) { ... }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {/* Update title to reference the specific course */}
          <h1 className="text-3xl font-bold text-[#0A3357] mb-2">Rate: {course.courseName}</h1>
          <p className="text-gray-600">
            {course.location_city}, {course.location_state}
          </p>
          <p className="text-gray-600 mt-2">
            Share your experience and help other golfers.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="space-y-6">
            {/* Removed the old Course Info Section with CourseSearch */}
            
            {/* Display minimal course info for context (optional) */}
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-[#0A3357]">Confirming Course</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {course.location_address1}, {course.location_city}, {course.location_state}
                </p>
            </div>

            {/* Rating Form - Pass courseId and potentially user */}
            <RatingForm course={course} user={user} /> 
          </div>
        </div>

        {/* Rating Guidelines (can remain as is) */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#0A3357] mb-4">
            Rating Guidelines
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-[#0A3357]">Walkability (1-5 stars)</h3>
              <p className="text-gray-600">
                Consider terrain, distances between holes, path conditions, and overall walking experience.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#0A3357]">Caddie Program</h3>
              <p className="text-gray-600">
                Indicate if caddies are available and any relevant details about the program.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#0A3357]">Push Cart Policy</h3>
              <p className="text-gray-600">
                Note if push carts are allowed and any restrictions that may apply.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[#0A3357]">Walking Restrictions</h3>
              <p className="text-gray-600">
                Specify any time-based restrictions or seasonal limitations on walking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 