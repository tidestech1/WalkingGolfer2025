'use client';

import { useEffect } from 'react';

import { usePathname } from 'next/navigation';

import { useAnalytics } from '@/lib/hooks/useAnalytics';
import type { GolfCourse } from '@/types/course';

interface CourseAnalyticsProps {
  course: GolfCourse;
}

export default function CourseAnalytics({ course }: CourseAnalyticsProps): null {
  const pathname = usePathname();
  const { trackPageView, trackCourseEvent } = useAnalytics();
  
  useEffect(() => {
    // Ensure necessary data is available before tracking
    if (pathname && course?.id && course?.courseName) {
      // Track the page view event
      trackPageView(pathname);

      // Track a specific event for viewing this course
      trackCourseEvent('view_course', course.id, JSON.stringify({
        courseName: course.courseName,
        // Add other relevant course details if needed by the tracking event
        // e.g., city: course.location?.city, state: course.location?.state
      }));
    }

    // Run only once on component mount to track the initial view
    // Analytics functions from the hook are assumed stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array
  
  // Render nothing - this component is purely for side-effects (tracking)
  return null;
} 