/* 
Firebase version of this component is available in git history.
Key features of the Firebase version:
- Uses getCourse() and getCourseReviews() from courseUtils.ts
- Includes user authentication with useAuth()
- Has full review submission functionality
- Displays walkability ratings and restrictions
*/

import React from 'react'

import { MapPin, Phone, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Timestamp } from 'firebase/firestore'

import CourseActions from '@/app/components/CourseActions'
import CourseRatings from '@/app/components/CourseRatings'
import WalkabilityDetails from '@/app/components/WalkabilityDetails'
import { IMAGES } from '@/lib/constants/images'
import { getCourseById } from '@/lib/firebase/courseUtils'
import type { GolfCourse } from '@/types/course'

import CourseAnalytics from './CourseAnalytics'
import CourseClientMap from './CourseClientMap'

// Provide inline type for the destructured params
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const course: GolfCourse | null = await getCourseById(id);

  if (!course) {
    return {
      title: 'Course Not Found'
    };
  }

  return {
    title: `${course.courseName} | The Walking Golfer`,
    description: course.course_description || `View walkability details and reviews for ${course.courseName}, a golf course.`,
  };
}

function serializeDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeDates(item));
  }

  if (typeof obj === 'object' && obj !== null && !(obj instanceof Date) && !Array.isArray(obj)) {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeDates((obj as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  return obj;
}

// Provide inline type for the destructured params
export default async function CourseDetailsPage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const { id } = params;
  const courseResult: GolfCourse | null = await getCourseById(id);

  if (!courseResult) {
    notFound();
  }

  const serializedCourse = serializeDates(courseResult) as GolfCourse;

  const courseName = serializedCourse?.courseName ?? 'Unknown Course';
  const city = serializedCourse?.location_city ?? '';
  const state = serializedCourse?.location_state ?? '';
  const coordinates = {
    lat: serializedCourse?.location_coordinates_latitude ?? 39.8283,
    lng: serializedCourse?.location_coordinates_longitude ?? -98.5795,
  };
  const heroImageUrl = IMAGES.placeholders.course;

  return (
    <div className="bg-gray-50 min-h-screen">
      <CourseAnalytics course={serializedCourse} />
      
      <div className="relative h-64 md:h-80 w-full">
        <Image
          src={heroImageUrl}
          alt={courseName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
          <div className="container mx-auto">
            <Link href="/map" className="text-white/80 hover:text-white inline-flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 010 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Course Finder
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">{courseName}</h1>
            <p className="text-sm md:text-base text-white/90">
              {city}, {state}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">About This Course</h2>
              <p className="text-gray-700 mb-4 prose prose-sm max-w-none">
                {serializedCourse?.course_description ?? `${courseName} is a ${serializedCourse?.course_holes ?? 18}-hole golf course located in ${city}, ${state}.`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 border-t pt-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center sm:text-left">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Holes</div>
                  <div className="text-lg font-bold text-gray-800">{serializedCourse?.course_holes ?? 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center sm:text-left">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Established</div>
                  <div className="text-lg font-bold text-gray-800">{serializedCourse?.course_yearEstablished ?? 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center sm:text-left">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Type</div>
                  <div className="text-lg font-bold text-gray-800">{serializedCourse?.course_type ?? 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-3">Reviews</h2>
              <p className="text-gray-500 italic">
                Reviews are coming soon. Be the first to review this course!
              </p>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <CourseRatings course={serializedCourse} />

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Walkability Details</h2>
              <WalkabilityDetails course={serializedCourse} />
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Contact Information</h2>

              <div className="space-y-4">
                {(serializedCourse?.location_address1 || serializedCourse?.location_city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      {serializedCourse?.location_address1 && <p>{serializedCourse.location_address1}</p>}
                      {serializedCourse?.location_address2 && <p>{serializedCourse.location_address2}</p>}
                      <p>
                        {serializedCourse?.location_city ?? ''}{serializedCourse?.location_city && serializedCourse?.location_state ? ', ' : ''}{serializedCourse?.location_state ?? ''} {serializedCourse?.location_zip ?? ''}
                      </p>
                    </div>
                  </div>
                )}

                {serializedCourse?.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <a href={`tel:${serializedCourse.contact_phone}`} className="text-blue-600 hover:underline">
                        {serializedCourse.contact_phone}
                      </a>
                    </div>
                  </div>
                )}

                {serializedCourse?.contact_website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <a href={serializedCourse.contact_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-xs">
                        {(serializedCourse.contact_website ?? '').replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Location</h2>
              <div className="h-64 rounded-lg overflow-hidden">
                <CourseClientMap 
                  coordinates={coordinates}
                  name={courseName}
                />
              </div>
            </div>

            <CourseActions course={serializedCourse} />
          </div>
        </div>
      </div>
    </div>
  )
}