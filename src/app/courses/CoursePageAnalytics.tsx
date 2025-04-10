'use client';

import { useEffect } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { useAnalytics } from '@/lib/hooks/useAnalytics';

// This component handles tracking page views and filter interactions for the course list page.
// It does not render any visible UI.
export default function CoursePageAnalytics(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView, trackUserInteraction } = useAnalytics();
  
  useEffect(() => {
    // Only track if pathname is available
    if (pathname) {
      // Track basic page view event
      trackPageView(pathname);
      
      // Check for and track applied filters from search parameters
      const filtersApplied: Record<string, string> = {};
      let hasFilters = false;
      
      // Iterate over search parameters to find filters
      for (const [key, value] of searchParams.entries()) {
        // Exclude potentially non-filter params if needed (e.g., 'page', 'sort')
        if (key !== 'page' && key !== 'sort') {
          filtersApplied[key] = value;
          hasFilters = true;
        }
      }
      
      // If filters were found, track the interaction
      if (hasFilters) {
        // trackUserInteraction('apply_filters', filtersApplied); // Pass object directly if possible
        // Or stringify if the tracking function requires a string:
        trackUserInteraction('apply_filters', JSON.stringify(filtersApplied));
      }
    }
    
    // Dependencies: re-run when path or search params change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trackPageView/trackUserInteraction are stable from useAnalytics hook
  }, [pathname, searchParams]); // Track dependencies are correct, hook functions assumed stable
  
  // This is a tracking-only component, render nothing
  return null;
} 