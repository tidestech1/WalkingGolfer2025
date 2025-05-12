/* 
Firebase version of this component is available in git history.
Key features of the Firebase version:
- Uses getCourse() and getCourseReviews() from courseUtils.ts
- Includes user authentication with useAuth()
- Has full review submission functionality
- Displays walkability ratings and restrictions
*/

import React from 'react'

import { Timestamp } from 'firebase/firestore'
import { MapPin, Phone, Globe } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import CourseActions from '@/app/components/CourseActions'
import CourseFacilities from '@/app/components/CourseFacilities'
import CourseRatings from '@/app/components/CourseRatings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IMAGES } from '@/lib/constants/images'
import { getCourseById } from '@/lib/firebase/courseUtils'
import { getPublishedReviewsForCourse } from '@/lib/firebase/reviewUtils'
import type { GolfCourse } from '@/types/course'

import CourseAnalytics from './CourseAnalytics'
import CourseClientMap from './CourseClientMap'
import ReviewItem from './ReviewItem'

// Provide inline type for the destructured params
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const course: GolfCourse | null = await getCourseById(id);

  if (!course) {
    return {
      title: 'Course Not Found | The Walking Golfer',
      description: 'The requested golf course could not be found. Please try another search or return to our course finder.',
    };
  }

  const titleParts: string[] = [];
  if (course.courseName) {
    titleParts.push(course.courseName);
  }
  if (course.course_holes) {
    titleParts.push(`(${course.course_holes} Holes)`);
  }
  if (course.club_name && course.club_name.toLowerCase() !== course.courseName.toLowerCase()) { // Avoid "Course Name - Course Name"
    titleParts.push(`- ${course.club_name}`);
  }
  
  const locationParts: string[] = [];
  if (course.location_city) {
    locationParts.push(course.location_city);
  }
  if (course.location_state) {
    locationParts.push(course.location_state);
  }
  if (locationParts.length > 0) {
    titleParts.push(`- ${locationParts.join(', ')}`);
  }

  let title = titleParts.join(' ') || 'Golf Course Details'; // Fallback if all parts are somehow empty

  // Ensure the main site name is appended
  if (!title.includes('| Walking Golfer')) {
      title = `${title} | Walking Golfer`;
  }


  let description = `Learn about ${course.courseName}`;
  if (course.club_name && course.club_name.toLowerCase() !== course.courseName.toLowerCase()) {
    description += ` at ${course.club_name}`;
  }
  if (course.location_city && course.location_state) {
    description += `, located in ${course.location_city}, ${course.location_state}. `;
  } else if (course.location_city) {
    description += `, located in ${course.location_city}. `;
  } else if (course.location_state) {
    description += `, located in ${course.location_state}. `;
  } else {
    description += `. `;
  }
  description += `Find walkability details, amenities, ${course.course_holes ? course.course_holes + ' holes, ' : ''}and read reviews for this course on Walking Golfer.`;
  
  if (course.course_description) {
    description += ` Official description: ${course.course_description.substring(0, 150)}${course.course_description.length > 150 ? '...' : ''}`;
  }


  return {
    title: title,
    description: description,
    openGraph: { // Basic Open Graph data
      title: title,
      description: description,
      images: course.imageUrl ? [{ url: course.imageUrl }] : [{ url: '/images/default-og-course.png' }], // Assuming a default OG image
      url: `/courses/${id}`,
      type: 'article', // Or 'place' if more appropriate, but 'article' is safe
    }
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
  
  // Fetch course and reviews in parallel
  const [courseResult, reviewsResult] = await Promise.all([
    getCourseById(id),
    getPublishedReviewsForCourse(id)
  ]);

  if (!courseResult) {
    notFound();
  }

  // Serialize course data
  const course = serializeDates(courseResult) as GolfCourse;
  const reviews = reviewsResult;

  const courseName = course?.courseName ?? 'Unknown Course';
  const city = course?.location_city ?? '';
  const state = course?.location_state ?? '';
  const coordinates = {
    lat: course?.location_coordinates_latitude ?? 39.8283,
    lng: course?.location_coordinates_longitude ?? -98.5795,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <CourseAnalytics course={course} />
      
      {/* Hero Section with Map Background - Reduced height */}
      <div className="relative h-64 md:h-72 w-full overflow-hidden"> 
        {/* Map Background - Positioned behind overlay */}
        <div className="absolute inset-0 z-0">
           <CourseClientMap 
             coordinates={coordinates}
             name={courseName}
             // Optional: Add props to disable interaction if needed
             // options={{ gestureHandling: 'none', zoomControl: false }} 
           />
        </div>
        
        {/* Dark Overlay - Above map, below text/buttons - Reduced opacity */}
        <div className="absolute inset-0 bg-black bg-opacity-15 z-10"></div>
        
        {/* Content Overlay - Above dark overlay */}
        <div className="absolute inset-0 z-20 p-4 md:p-6 text-white flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          
          {/* Combined Text Info Group (Top Left on desktop, Top on mobile) */}
          <div className="space-y-3 max-w-md lg:max-w-lg bg-black/70 rounded-md p-3"> 
            {/* Top Part: Course Name, Club Name, Location */}
            <div>
              {/* REMOVED Back to Course Finder Link */}
              
              {/* Updated h1 to include number of holes */}
              <h1 className="text-3xl md:text-4xl font-bold">
                {courseName} 
                {course?.course_holes && (
                  <span className="text-lg md:text-xl font-medium text-white/70 ml-2">
                    ({course.course_holes} Holes)
                  </span>
                )}
              </h1>
              
              {/* Display Club Name */}
              <p className="text-lg md:text-xl text-white/90 mt-2">
                {course?.club_name ? course.club_name : `${city}, ${state}`}
              </p>
            </div>

            {/* Contact Info (Moved into the text group) */}
            <div className="space-y-2 text-sm pt-2 border-t border-white/20"> {/* Added border-top for separation */}
                {(course?.location_address1 || city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                      <div className="text-white/90">
                        {course?.location_address1 && <p>{course.location_address1}</p>}
                        {course?.location_address2 && <p>{course.location_address2}</p>}
                        <p>
                          {city}{city && state ? ', ' : ''}{state} {course?.location_zip ?? ''}
                        </p>
                      </div>
                    </div>
                )}
                {course?.contact_phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                      <div>
                        <a href={`tel:${course.contact_phone}`} className="text-white hover:underline">
                          {course.contact_phone}
                        </a>
                      </div>
                    </div>
                )}
                {course?.contact_website && (
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
                      <div>
                        <a href={course.contact_website} target="_blank" rel="noopener noreferrer" className="text-white hover:underline break-all">
                          {(course.contact_website ?? '').replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    </div>
                )}
            </div>
          </div>
          
          {/* Actions Group (Top Right on desktop, Hidden on mobile) */}
          <div className="w-full md:w-auto flex-shrink-0 bg-black/40 rounded-md p-3 hidden md:block">
            <CourseActions course={course} /> 
          </div>
        </div>
      </div>

      {/* Mobile Actions - Displayed below hero only on mobile */}
      <div className="container mx-auto px-4 pt-4 pb-2 block md:hidden">
         {/* Pass layout prop to mobile instance */}
         <CourseActions course={course} layout="horizontal" />
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column (Wider) - unchanged */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <CourseRatings course={course} />
                <Button asChild size="lg" className="bg-[#0A3357] hover:bg-[#0A3357]/90 text-white w-full md:w-auto">
                  <Link href={`/courses/${id}/review`}>Write a Review</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <ReviewItem key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No reviews yet. Be the first to review this course!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Narrower) */}
          <div className="space-y-6 md:space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Course Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm border-t pt-4">
                  <div>
                    <span className="font-medium text-gray-500 w-20 inline-block">Holes:</span>
                    <span className="text-gray-800">{course?.course_holes ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 w-20 inline-block">Type:</span>
                    <span className="text-gray-800">{course?.course_type ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 w-20 inline-block">Designer:</span>
                    <span className="text-gray-800">{course?.course_designer ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 w-20 inline-block">Established:</span>
                    <span className="text-gray-800">{course?.course_yearEstablished ?? 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CourseFacilities course={course} />
          </div>
        </div>
      </div>
    </div>
  )
}