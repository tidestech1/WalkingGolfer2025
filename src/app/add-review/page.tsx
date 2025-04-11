'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourseSearch from '@/app/components/CourseSearch'; // Adjust path if needed
import { GolfCourse } from '@/types/course';

export default function AddReviewPage() {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);

  useEffect(() => {
    // When a course is selected in the CourseSearch component,
    // redirect the user to the specific review page for that course.
    if (selectedCourse) {
      console.log(`Course selected: ${selectedCourse.courseName}, redirecting...`);
      router.push(`/courses/${selectedCourse.id}/review`);
    }
  }, [selectedCourse, router]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-[#0A3357] mb-4">Review a Golf Course</h1>
        <p className="text-gray-600 mb-8">
          Find the golf course you want to review by searching below. Your feedback helps fellow walking golfers!
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
           <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              Search for Golf Course *
            </label>
           <CourseSearch
                selectedCourse={selectedCourse}
                onSelect={setSelectedCourse} 
           />
        </div>

        {/* Optional: Add link to browse map if user can't find course */}
        <p className="mt-6 text-sm text-gray-500">
            Can't find the course? <a href="/map" className="text-blue-600 hover:underline">Browse the map</a> or contact support.
        </p>
      </div>
    </div>
  );
} 