'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Map as MapIcon, ArrowLeft, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/components/ui/breadcrumb';

interface CourseBreadcrumbProps {
  courseName: string;
}

export default function CourseBreadcrumb({ courseName }: CourseBreadcrumbProps) {
  const searchParams = useSearchParams();
  const fromSearch = searchParams.get('from') === 'search';
  const fromMap = searchParams.get('from') === 'map';
  const boundsParam = searchParams.get('bounds');
  const zoomParam = searchParams.get('zoom');
  
  // State for attention-grabbing animation
  const [showAttention, setShowAttention] = useState(false);

  // Only show attention animation if user came from search or map
  const shouldShowAttention = fromSearch || fromMap;

  useEffect(() => {
    if (shouldShowAttention) {
      // Small delay to ensure page has loaded
      const timer = setTimeout(() => {
        setShowAttention(true);
        
        // Hide attention after 5 seconds
        const hideTimer = setTimeout(() => {
          setShowAttention(false);
        }, 5000);

        return () => clearTimeout(hideTimer);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldShowAttention]);

  const breadcrumbItems: BreadcrumbItem[] = [];

  // Add Home first
  breadcrumbItems.push({
    label: 'Home',
    href: '/',
    icon: <Home className="w-4 h-4" />
  });

  // Add the appropriate back link based on where the user came from
  if (fromSearch) {
    // Build the search params to preserve
    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'from') {
        params.append(key, value);
      }
    }
    const queryString = params.toString();
    const href = `/search${queryString ? `?${queryString}` : ''}`;
    
    breadcrumbItems.push({
      label: 'Search Results',
      href: href,
      icon: <Search className="w-4 h-4" />
    });
  } else if (fromMap && boundsParam) {
    const bounds = JSON.parse(decodeURIComponent(boundsParam));
    let href = `/map?bounds=${encodeURIComponent(JSON.stringify(bounds))}`;
    if (zoomParam) {
      href += `&zoom=${zoomParam}`;
    }
    
    breadcrumbItems.push({
      label: 'Map',
      href: href,
      icon: <MapIcon className="w-4 h-4" />
    });
  } else {
    // Default fallback to course finder
    breadcrumbItems.push({
      label: 'Course Finder',
      href: '/coursefinder',
      icon: <Search className="w-4 h-4" />
    });
  }

  // Add current course as final item (no href means it's not clickable)
  breadcrumbItems.push({
    label: courseName
  });

  return (
    <div className={`transition-all duration-1000 ${
      showAttention 
        ? 'bg-blue-50 border-blue-200 shadow-md' 
        : 'bg-white border-gray-200'
    } border-b py-3`}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center space-x-2 text-sm relative">
          {breadcrumbItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 relative">
              {index > 0 && (
                <div className="text-gray-400 flex-shrink-0">›</div>
              )}
              <div className="flex items-center space-x-1">
                {item.icon && (
                  <span className="text-gray-500">{item.icon}</span>
                )}
                {item.href ? (
                  <a 
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-gray-700 font-medium">{item.label}</span>
                )}
              </div>
              
              {/* Show attention indicator after the back navigation link (index 1 = Search Results/Map/Course Finder) */}
              {showAttention && index === 1 && item.href && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 z-20 ml-2">
                  <div className="flex items-center space-x-1 bg-blue-500 text-white px-2 py-1 rounded-md shadow-lg animate-pulse whitespace-nowrap">
                    <ArrowLeft className="w-3 h-3" />
                    <span className="text-xs font-medium">Click here to go back</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
} 