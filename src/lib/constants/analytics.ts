// Google Analytics measurement ID
// Replace this with your actual measurement ID when set up
export const GA_MEASUREMENT_ID = process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'] || '';

// Helper function to check if analytics should be enabled
// Only enable in production and when measurement ID is available
export const isAnalyticsEnabled = (): boolean => {
  return process.env.NODE_ENV === 'production' && !!GA_MEASUREMENT_ID;
}

// Track custom events
export const trackEvent = (
  action: string, 
  category: string, 
  label?: string, 
  value?: number
): void => {
  if (typeof window !== 'undefined' && window.gtag && isAnalyticsEnabled()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}; 