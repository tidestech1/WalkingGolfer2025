import Image from 'next/image'

import { GolfCourse } from '@/types/course'

interface CourseCardProps {
  course: GolfCourse
}

export default function CourseCard({ course }: CourseCardProps): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Course Image */}
      <div className="relative h-48 w-full rounded-lg overflow-hidden">
        <Image
          src="/images/course-placeholder.jpg"
          alt={course.courseName}
          fill
          className="object-cover"
        />
      </div>

      {/* Course Info */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{course.courseName}</h2>
        
        {/* Location */}
        <div className="text-gray-600">
          <p>{course.location_city}, {course.location_state}</p>
          <p>{course.location_address1}</p>
          {course.location_address2 && <p>{course.location_address2}</p>}
          <p>{course.location_zip}</p>
        </div>

        {/* Walkability Rating */}
        {course.walkabilityRating_overall && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Walkability Rating:</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(course.walkabilityRating_overall || 0)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({course.walkabilityRating_overall.toFixed(1)})
            </span>
          </div>
        )}

        {/* Facilities */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {course.facilities_pushCarts && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Push Carts</span>
            </div>
          )}
          {course.facilities_golfCarts && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Golf Carts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 