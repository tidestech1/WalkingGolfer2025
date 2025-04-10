'use client';

import { useCallback } from 'react';

import { trackEvent, isAnalyticsEnabled } from '@/lib/constants/analytics';

// Define the return type for the hook
interface UseAnalyticsReturn {
  trackPageView: (url: string) => void;
  trackUserInteraction: (action: string, label?: string, value?: number) => void;
  trackCourseEvent: (action: string, courseId: string, courseName: string) => void;
  trackSearch: (searchTerm: string, resultsCount: number) => void;
  trackEvent: (action: string, category: string, label?: string, value?: number) => void;
}

// Custom hook for tracking analytics events
export function useAnalytics(): UseAnalyticsReturn {
  // Track page view manually (useful for custom page transitions)
  const trackPageView = useCallback((url: string): void => {
    if (typeof window !== 'undefined' && window.gtag && isAnalyticsEnabled()) {
      window.gtag('config', process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'] || '', {
        page_path: url,
      });
    }
  }, []);

  // Track a user interaction event
  const trackUserInteraction = useCallback((
    action: string, 
    label?: string, 
    value?: number
  ): void => {
    trackEvent(action, 'User Interaction', label, value);
  }, []);

  // Track a course-related event
  const trackCourseEvent = useCallback((
    action: string, 
    courseId: string, 
    courseName: string
  ): void => {
    trackEvent(action, 'Course', `${courseId} - ${courseName}`);
  }, []);

  // Track a search event
  const trackSearch = useCallback((
    searchTerm: string, 
    resultsCount: number
  ): void => {
    trackEvent('search', 'Search', searchTerm, resultsCount);
  }, []);

  return {
    trackPageView,
    trackUserInteraction,
    trackCourseEvent,
    trackSearch,
    trackEvent, // Export the base trackEvent for custom usage
  };
} 