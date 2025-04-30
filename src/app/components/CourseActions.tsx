'use client'

import React, { useEffect } from 'react'

import { useRouter, usePathname } from 'next/navigation'

import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { useAuth } from '@/lib/hooks/useAuth'
import { GolfCourse } from '@/types/course'

interface CourseActionsProps {
  course: GolfCourse
  layout?: 'vertical' | 'horizontal'
}

export default function CourseActions({ course, layout = 'vertical' }: CourseActionsProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { trackPageView, trackCourseEvent, trackUserInteraction } = useAnalytics()
  
  // Safely access course properties with fallbacks
  const courseId = course.id
  const courseName = course.courseName
  
  // Track course view on component mount
  useEffect(() => {
    if (pathname && courseId) {
      // Track page view
      trackPageView(pathname)
      // Track course view event
      trackCourseEvent('view_course', courseId, courseName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const handleBookmarkClick = (): void => {
    // Track bookmark attempt
    trackUserInteraction('bookmark_attempt', courseId)
    
    if (!user) {
      // Track redirect to login
      trackUserInteraction('redirect_to_login', 'bookmark_flow')
      // If not logged in, redirect to login
      router.push('/login?returnUrl=' + encodeURIComponent(`/courses/${courseId}`))
      return
    }
    
    // Track successful bookmark click
    trackCourseEvent('bookmark', courseId, courseName)
    
    // TODO: Implement bookmark functionality
    alert('Bookmark functionality coming soon!')
  }
  
  const handleReviewClick = (): void => {
    // Track review attempt
    trackUserInteraction('review_attempt', courseId)
    
    // Track successful review navigation (might need adjustment if user is anonymous initially)
    // Consider tracking only after successful *submission* for anonymous flow
    if (user) { // Only track this event if the user IS logged in when clicking
        trackCourseEvent('start_review', courseId, courseName)
    }
    
    // Navigate to review page for everyone
    router.push(`/courses/${courseId}/review`)
  }
  
  const handleWebsiteClick = (): void => {
    // Track website click
    trackCourseEvent('visit_website', courseId, courseName)
  }
  
  // Define base classes and conditional classes
  const containerClasses = layout === 'horizontal' ? 'flex flex-row space-x-2 items-center' : 'space-y-3';
  
  const reviewButtonClasses = `flex items-center justify-center rounded ${ 
    layout === 'horizontal' 
    ? 'py-2 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700' 
    : 'w-full py-2 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700' 
  }`;

  const bookmarkButtonClasses = `flex items-center justify-center rounded border ${ 
    layout === 'horizontal' 
    ? 'py-2 px-3 text-sm border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'w-full py-2 px-4 text-sm border-white/80 text-white/90 hover:bg-white/10'
  }`;

  const websiteLinkClasses = `flex items-center justify-center rounded border ${ 
    layout === 'horizontal' 
    ? 'py-2 px-3 text-sm border-gray-300 text-gray-700 hover:bg-gray-100'
    : 'w-full py-2 px-4 text-sm border-white/80 text-white/90 hover:bg-white/10'
  }`;

  const reviewIconClass = layout === 'horizontal' ? 'h-5 w-5 mr-1.5' : 'h-4 w-4 mr-1.5';
  const bookmarkIconClass = layout === 'horizontal' ? 'h-4 w-4' : 'h-4 w-4 mr-1.5';
  const websiteIconClass = layout === 'horizontal' ? 'h-4 w-4' : 'h-4 w-4 mr-1.5';

  return (
    <div className={containerClasses}>
      <button
        onClick={handleReviewClick}
        className={reviewButtonClasses}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={reviewIconClass} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {'Write a Review'}
      </button>
      
      <button
        onClick={handleBookmarkClick}
        className={bookmarkButtonClasses}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={bookmarkIconClass} viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
        {layout !== 'horizontal' && 'Bookmark Course'}
      </button>
      
      {course.contact_website && (
        <a
          href={course.contact_website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWebsiteClick}
          className={websiteLinkClasses}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={websiteIconClass} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
          </svg>
          {layout !== 'horizontal' && 'Visit Website'}
        </a>
      )}
    </div>
  )
} 