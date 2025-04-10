'use client';

import { useState } from 'react';

import CourseSearch from '@/app/components/CourseSearch';
import { GolfCourse } from '@/types/course';

import RatingForm from './RatingForm';

export default function RateCoursePage() {
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0A3357] mb-2">Rate a Course</h1>
          <p className="text-gray-600">
            Share your experience and help other golfers find walking-friendly courses.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="space-y-6">
            {/* Course Information Section */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0A3357]">Course Information</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Start typing the course name to search. Select the correct course from the dropdown to ensure accurate ratings.
                </p>
              </div>

              {/* Course Search and Date Field Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="course-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Golf Course *
                  </label>
                  <CourseSearch
                    selectedCourse={selectedCourse}
                    onSelect={setSelectedCourse}
                  />
                </div>
                <div>
                  <label htmlFor="date-played" className="block text-sm font-medium text-gray-500 mb-1">
                    Date Played *
                  </label>
                  <input
                    type="date"
                    id="date-played"
                    name="date-played"
                    required
                    placeholder="MM/DD/YYYY"
                    pattern="\d{2}/\d{2}/\d{4}"
                    max={new Date().toISOString().split('T')[0]}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Selected Course Display */}
              {selectedCourse && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-lg font-semibold text-[#0A3357] mb-2">{selectedCourse.courseName}</h2>
                  <div className="text-sm text-gray-600">
                    <p>{selectedCourse.location_address1}</p>
                    <p>{selectedCourse.location_city}, {selectedCourse.location_state} {selectedCourse.location_zip}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rating Form */}
            <RatingForm selectedCourse={selectedCourse} />
          </div>
        </div>

        {/* Rating Guidelines */}
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