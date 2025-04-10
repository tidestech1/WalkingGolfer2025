'use client';

import { useEffect } from 'react';

import { useAnalytics } from '@/lib/hooks/useAnalytics';

// Define the return type for the component
interface HomeAnalyticsReturn {
  trackExternalLink: (destination: string) => void;
  trackFeatureClick: (feature: string) => void;
  trackCallToAction: (cta: string) => void;
}

export default function HomeAnalytics(): HomeAnalyticsReturn {
  const { trackPageView, trackUserInteraction } = useAnalytics();
  
  useEffect(() => {
    // Track homepage view
    trackPageView('/');
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const trackExternalLink = (destination: string): void => {
    trackUserInteraction('external_link_click', destination);
  };
  
  const trackFeatureClick = (feature: string): void => {
    trackUserInteraction('feature_click', feature);
  };
  
  const trackCallToAction = (cta: string): void => {
    trackUserInteraction('cta_click', cta);
  };
  
  // Return functions to be used by the parent component
  return {
    trackExternalLink,
    trackFeatureClick,
    trackCallToAction
  };
} 