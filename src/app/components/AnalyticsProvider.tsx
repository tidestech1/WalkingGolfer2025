'use client';

import { useEffect } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { useAnalytics } from '@/lib/hooks/useAnalytics';

type AnalyticsProviderProps = {
  children: React.ReactNode;
  pageCategory?: string;
  customData?: Record<string, unknown>;
};

/**
 * Analytics Provider component to track page views and route changes
 * Used to wrap components or pages that need analytics tracking
 */
export default function AnalyticsProvider({ 
  children, 
  pageCategory = 'page', 
  customData = {} 
}: AnalyticsProviderProps): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView, trackUserInteraction } = useAnalytics();
  
  // Track page views when the path changes
  useEffect(() => {
    if (pathname) {
      // Track the page view with the current path
      trackPageView(pathname);
      
      // Track page category for better data organization in GA
      trackUserInteraction('page_category', pageCategory);
      
      // Track custom data if provided
      if (Object.keys(customData).length > 0) {
        trackUserInteraction('custom_data', JSON.stringify(customData));
      }
    }
  }, [pathname, pageCategory, customData, trackPageView, trackUserInteraction]);
  
  // Track search params changes separately (for filters, sorting, etc.)
  useEffect(() => {
    if (pathname && searchParams.size > 0) {
      const params: Record<string, string> = {};
      
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
      
      trackUserInteraction('url_parameters', JSON.stringify(params));
    }
  }, [searchParams, pathname, trackUserInteraction]);
  
  // Simply render children - this component is just for tracking
  return <>{children}</>;
} 