'use client';

import { useEffect } from 'react';

import Script from 'next/script';

// This component handles Google Analytics initialization and page view tracking
export default function GoogleAnalytics({ measurementId }: { measurementId: string }): JSX.Element | null {
  // Handle page view tracking when route changes
  useEffect(() => {
    // Skip if no measurement ID is provided or we're not in production
    // or if gtag isn't defined yet
    if (measurementId && process.env.NODE_ENV === 'production' && typeof window.gtag !== 'undefined') {
      const handleRouteChange = (url: string): void => {
        window.gtag('config', measurementId, {
          page_path: url,
        });
      };

      // Track initial page view
      handleRouteChange(window.location.pathname);
    }
  }, [measurementId]);

  // Only render the scripts in production and if we have a measurement ID
  if (!measurementId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Load the GA script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      
      {/* Initialize GA */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_location: window.location.href,
            page_title: document.title,
          });
        `}
      </Script>
    </>
  );
}

// Add the window gtag function type definition
declare global {
  interface Window {
    gtag: (
      command: string,
      target: string,
      config?: Record<string, string | number | boolean | undefined>
    ) => void;
    dataLayer: unknown[];
  }
} 