'use client'

import Image from 'next/image'
import Link from 'next/link'

import { GolfCourse } from '@/types/course'

interface CourseCardProps {
  course: GolfCourse
  className?: string
}

export default function CourseCard({ course, className = '' }: CourseCardProps): JSX.Element {
  return (
    <Link
      href={`/course/${course.id}`}
      className={`block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${className}`}
    >
      <div className="relative h-48 w-full">
        <Image
          src={course.imageUrl || '/images/default-course.jpg'}
          alt={course.courseName}
          fill
          className="object-cover rounded-t-lg"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {course.courseName}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {course.location_city}, {course.location_state}
        </p>
        
        {/* Walkability Rating */}
        {course.walkabilityRating_overall && (
          <div className="flex items-center space-x-2 mb-3">
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

        {/* Course Info */}
        <div className="text-sm text-gray-600 mb-3">
          <p>{course.course_holes} holes</p>
        </div>

        {/* Cart Options */}
        <div className="flex flex-wrap gap-2">
          {course.facilities_golfCarts && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Golf Carts Available
            </span>
          )}
          {course.facilities_pushCarts && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Push/Pull Carts Available
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}