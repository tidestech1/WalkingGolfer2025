'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import { GoogleMap, useLoadScript, Libraries, InfoWindow } from '@react-google-maps/api';
import { Star } from 'lucide-react';
import Link from 'next/link';

import { GolfCourse, MapBounds } from '@/types/course';

import { LoadingIndicator } from './LoadingIndicator';
import { SearchBox } from './SearchBox';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import {} from '@/lib/utils';

/**
 * MAP BOUNDS BUFFER SYSTEM
 * 
 * This component implements a "safe zone" buffer system for map bounds to ensure
 * that golf courses are only considered "visible" when they're clearly within the
 * viewable area, not just technically within the viewport bounds.
 * 
 * PROBLEM: 
 * - Google Maps getBounds() returns exact viewport coordinates
 * - Courses at the very edges might be cut off by UI elements or barely visible
 * - Users expect to see courses that are clearly visible and actionable
 * 
 * SOLUTION:
 * - Apply a buffer percentage (default 10%) to shrink the "effective" bounds
 * - Only courses within this safe zone are considered "in bounds"
 * - Navigation and exact bounds still use raw viewport for precision
 * 
 * CONFIGURATION:
 * - boundsBufferPercent prop controls the buffer size (0.1 = 10%)
 * - Higher values = smaller safe zone = more conservative filtering
 * - Lower values = larger safe zone = more courses included
 * 
 * USAGE:
 * - convertToMapBounds() applies buffer by default for course filtering
 * - getRawMapBounds() provides exact bounds for navigation/URLs
 * - applyBoundsBuffer() utility for custom buffer applications
 */

const MIN_ZOOM_FOR_MARKERS = 7.5;
const DEFAULT_ZOOM = 8;

const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'marker'] as const;

interface MapProps {
  courses: GolfCourse[];
  selectedCourseId: string | null;
  onCourseSelect: (course: GolfCourse) => void;
  onBoundsChanged: (bounds: MapBounds) => void;
  loading?: boolean;
  onMapLoad: (map: google.maps.Map) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  targetBounds?: MapBounds | null;
  onZoomStatusChange: (isZoomedOut: boolean) => void;
  /**
   * Buffer percentage for bounds safe zone (default: 0.1 = 10%)
   * Higher values create a smaller "safe zone" for course visibility
   */
  boundsBufferPercent?: number;
}

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Apply a buffer to map bounds to create a "safe zone" for visible courses
 * This ensures courses near the edges aren't technically in bounds but practically invisible
 * @param bounds Original map bounds
 * @param bufferPercent Percentage of the view to buffer (default 10% = 0.1)
 * @returns Bounds with buffer applied (smaller visible area)
 */
const applyBoundsBuffer = (bounds: MapBounds, bufferPercent: number): MapBounds => {
  const latRange = bounds.north - bounds.south;
  const lngRange = bounds.east - bounds.west;
  
  const latBuffer = latRange * bufferPercent;
  const lngBuffer = lngRange * bufferPercent;
  
  return {
    north: bounds.north - latBuffer,
    south: bounds.south + latBuffer,
    east: bounds.east - lngBuffer,
    west: bounds.west + lngBuffer
  };
};

const convertToMapBounds = (bounds: google.maps.LatLngBounds, applyBuffer: boolean = true, bufferPercent: number = 0.1): MapBounds => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const rawBounds: MapBounds = {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng()
  };
  
  // Apply buffer to create safe zone for course visibility
  return applyBuffer ? applyBoundsBuffer(rawBounds, bufferPercent) : rawBounds;
};

/**
 * Get raw map bounds without buffer for cases where exact viewport is needed
 */
const getRawMapBounds = (bounds: google.maps.LatLngBounds): MapBounds => {
  return convertToMapBounds(bounds, false);
};

export default function Map({
  courses,
  selectedCourseId,
  onCourseSelect,
  onBoundsChanged,
  loading,
  onMapLoad,
  onPlaceSelect,
  targetBounds,
  onZoomStatusChange,
  boundsBufferPercent = 0.1,
}: MapProps): JSX.Element | React.ReactNode {
  const [showZoomMessage, setShowZoomMessage] = useState<boolean>(false);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [selectedInfoWindowCourse, setSelectedInfoWindowCourse] = useState<GolfCourse | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    mapIds: [process.env['NEXT_PUBLIC_GOOGLE_MAPS_ID'] || '']
  });

  // Use progressive loading hook
  const { isLoading, progress } = useProgressiveLoading({
    allCourses: courses,
    bounds: currentBounds,
    zoom: currentMapZoom
  });

  const mapOptions = useMemo((): google.maps.MapOptions => {
    const baseOptions = {
      mapId: process.env['NEXT_PUBLIC_GOOGLE_MAPS_ID'] || null,
      disableDefaultUI: false,
      clickableIcons: false,
      minZoom: 4,
      maxZoom: 18,
      fullscreenControl: false,
      streetViewControl: true,
      zoomControl: true,
      mapTypeControl: true,
      mapTypeId: 'roadmap'
    };

    // Only add position-specific options when google is available
    if (isLoaded && typeof google !== 'undefined') {
      return {
        ...baseOptions,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.BOTTOM_LEFT,
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
        },
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      };
    }

    return baseOptions;
  }, [isLoaded]);

  // Function to calculate marker scale based on zoom level and selection state
  const getMarkerScale = useCallback((isSelected: boolean, isUnwalkable: boolean): number => {
    // Return default scale if map isn't ready yet
    let baseScale: number;
    if (!mapRef.current) {
      baseScale = isSelected ? 1.5 : 1.0; // Adjusted default selected scale
    } else {
      const currentZoom = mapRef.current.getZoom();
      // Return default scale if zoom level isn't available
      if (!currentZoom) {
        baseScale = isSelected ? 1.5 : 1.0; // Adjusted default selected scale
      } else if (currentZoom <= 8) {
        baseScale = isSelected ? 1.2 : 0.8; // Updated: Normal increased from 0.7x to 0.8x
      } else if (currentZoom <= 10) {
        baseScale = isSelected ? 1.4 : 0.9; // Larger selected at medium zoom
      } else {
        // Larger scale when zoomed in or selected - Increased selected scale
        baseScale = isSelected ? 1.5 : 1.0;
      }
    }
    
    // Apply 20% increase for walkable courses (rated + unrated) ONLY if they are NOT selected
    // Only unwalkable courses stay at base scale
    if (!isUnwalkable && !isSelected) {
      return baseScale * 1.2;
    }
    return baseScale; // Selected courses or unwalkable courses use base scale
  }, []);

  // Function to determine which marker icon to use based on course data
  const getMarkerIconPath = useCallback((course: GolfCourse): string => {
    const isExplicitlyUnwalkable = course.course_isWalkable === false;
    const hasWalkabilityRating = typeof course.walkabilityRating_overall === 'number' && course.walkabilityRating_overall > 0;

    // If explicitly marked as unwalkable (cart-only), use unwalkable marker
    if (isExplicitlyUnwalkable) {
      return '/images/map/map-marker-unwalkable.svg';
    }

    // If course has a rating (1-5), use appropriate numbered marker
    if (hasWalkabilityRating) {
      const rating = Math.round(course.walkabilityRating_overall!);
      const clampedRating = Math.min(Math.max(rating, 1), 5); // Ensure rating is between 1-5
      return `/images/map/map-marker-${clampedRating}star.svg`;
    }

    // If no rating but walkable or unknown walkability, use unrated marker
    return '/images/map/map-marker-unrated.svg';
  }, []);

  // Function to create marker content for individual courses using custom images
  const createMarkerContent = useCallback((course: GolfCourse, isSelected: boolean): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'map-marker';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    // Get the appropriate marker icon
    const iconPath = getMarkerIconPath(course);
    
    // Create the marker image
    const markerImg = document.createElement('img');
    markerImg.src = iconPath;
    markerImg.style.width = '32px'; // Base size - will be scaled by AdvancedMarkerElement
    markerImg.style.height = '32px';
    markerImg.style.display = 'block';
    
    // Add subtle selection indicator if selected
    if (isSelected) {
      // Apply subtle red drop shadow to the marker image itself
      markerImg.style.filter = 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.8)) drop-shadow(0 0 16px rgba(220, 38, 38, 0.4))';
      markerImg.style.transition = 'filter 0.2s ease';
    }

    container.appendChild(markerImg);
    return container;
  }, [getMarkerIconPath]);

  // Function to create marker icon for individual courses - UPDATED FOR CUSTOM IMAGES
  const createMarkerIcon = useCallback((course: GolfCourse, isSelected: boolean): { element: HTMLElement } => {
    // This now returns an object with element property to maintain compatibility
    // with the existing AdvancedMarkerElement content property
    return {
      element: createMarkerContent(course, isSelected)
    };
  }, [createMarkerContent]);

  const updateVisibleMarkers = useCallback((): void => {
    const map = mapRef.current;

    if (!map || !isLoaded) {
      return;
    }

    // Get zoom level directly inside the callback
    const currentZoom = map.getZoom();

    // Check zoom level DIRECTLY before deciding to show markers
    if (typeof currentZoom === 'number' && currentZoom <= MIN_ZOOM_FOR_MARKERS) {
      // CLUSTERING DISABLED - Clear markers directly instead of through clusterer
      // if (clustererRef.current) {
      //   clustererRef.current.clearMarkers();
      // }
      
      // Clear markers directly from map
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = [];
      
      setSelectedInfoWindowCourse(null);
      return;
    }

    if (!courses || courses.length === 0) {
      // CLUSTERING DISABLED - Clear markers directly instead of through clusterer
      // if (clustererRef.current && markersRef.current.length > 0) {
      //     clustererRef.current.clearMarkers();
      //     markersRef.current = [];
      // }
      
      // Clear markers directly from map
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
          markersRef.current = [];
      
      setSelectedInfoWindowCourse(null);
      return;
    }

    if (markersRef.current.length === 0 || markersRef.current.length !== courses.length) {
      
      // CLUSTERING DISABLED - Clear markers directly instead of through clusterer
      // if (clustererRef.current) {
      //   clustererRef.current.clearMarkers();
      // }
      
      // Clear existing markers directly from map
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      
      setSelectedInfoWindowCourse(null);

      const validCourses = courses
        .filter(course => {
          const valid = isValidCoordinate(course.location_coordinates_latitude, course.location_coordinates_longitude);
          if (!valid) {
            console.warn(`Invalid coordinates for course ${course.id}:`, course.location_coordinates_latitude, course.location_coordinates_longitude);
          }
          return valid;
        });

      const newMarkers = validCourses.map(course => {
        const isExplicitlyUnwalkable = course.course_isWalkable === false;
        const isSelected = course.id === selectedCourseId;
        const scale = getMarkerScale(isSelected, isExplicitlyUnwalkable);
        const zIndex = getMarkerZIndex(course, isSelected);
        const position = applyLocationOffset(course, validCourses);
        
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: map, // Add marker directly to map instead of clusterer
          position: position,
          title: course.courseName,
          content: createMarkerIcon(course, isSelected).element,
          zIndex: zIndex // Use calculated z-index for proper layering
        });

        // Apply scaling to the marker content
        if (marker.content instanceof HTMLElement) {
          marker.content.style.transform = `scale(${scale})`;
          marker.content.style.transformOrigin = 'center center';
        }

        marker.addEventListener('click', (event: MouseEvent) => {
          event.stopPropagation();
          onCourseSelect(course);
          setSelectedInfoWindowCourse(course);
        });

        return marker;
      });

      // CLUSTERING DISABLED - Markers are already added directly to map above
      // if (clustererRef.current && newMarkers.length > 0) {
      //   console.log(`[MapComponent LOG] updateVisibleMarkers: Adding ${newMarkers.length} markers to clusterer...`);
      //   clustererRef.current.addMarkers(newMarkers);
      //   console.log(`[MapComponent LOG] updateVisibleMarkers: Finished adding markers to clusterer.`);
      // } else {
      //   console.log("[MapComponent LOG] updateVisibleMarkers: No clusterer available or no valid markers to add.");
      // }
      
      markersRef.current = newMarkers;
    } else {
      markersRef.current.forEach((marker, index) => {
        if (courses[index]) {
          const course = courses[index];
          const isExplicitlyUnwalkable = course.course_isWalkable === false;
          const isSelected = course.id === selectedCourseId;
          const scale = getMarkerScale(isSelected, isExplicitlyUnwalkable);
          const zIndex = getMarkerZIndex(course, isSelected);
          const position = applyLocationOffset(course, courses);
          
          // Update marker content, position, and layering
          marker.content = createMarkerIcon(course, isSelected).element;
          marker.position = position;
          marker.zIndex = zIndex; // Update z-index for proper layering
          
          if (marker.content instanceof HTMLElement) {
            marker.content.style.transform = `scale(${scale})`;
            marker.content.style.transformOrigin = 'center center';
          }
        }
      });
    }
  }, [courses, selectedCourseId, isLoaded, createMarkerIcon, mapRef, onCourseSelect, setSelectedInfoWindowCourse]);

  const internalOnMapLoad = useCallback((map: google.maps.Map): void => {
    mapRef.current = map;
    onMapLoad(map);
    
    // CLUSTERING DISABLED FOR TESTING - Comment out cluster creation
    // if (!clustererRef.current) {
    //   clustererRef.current = createClusterer(map);
    // }

    map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChanged(convertToMapBounds(bounds, true, boundsBufferPercent));
        // Check zoom level on bounds_changed and update state/notify parent
        const currentZoom = map.getZoom();
        if (typeof currentZoom === 'number') {
          setCurrentMapZoom(currentZoom);
                  const isZoomedOut = currentZoom <= MIN_ZOOM_FOR_MARKERS;
        // Always update state and notify parent on bounds_changed
        setShowZoomMessage(isZoomedOut);
        onZoomStatusChange(isZoomedOut);
          setCurrentBounds(convertToMapBounds(bounds, true, boundsBufferPercent));
        } else {
           console.warn('[MapComponent LOG] useEffect[bounds_changed]: Could not get zoom after fitBounds.');
        }
      }
    });

  }, [onMapLoad, onBoundsChanged]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded) {
      return;
    }
    
    const map = mapRef.current;
    // Use bounds_changed listener to check zoom status and report bounds
    const boundsListener = map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        // Directly call onBoundsChanged with converted bounds
        onBoundsChanged(convertToMapBounds(bounds, true, boundsBufferPercent));
        // Check zoom level on bounds_changed and update state/notify parent
        const currentZoom = map.getZoom();
        if (typeof currentZoom === 'number') {
          setCurrentMapZoom(currentZoom);
          const isZoomedOut = currentZoom <= MIN_ZOOM_FOR_MARKERS;
          // Always update state and notify parent on bounds_changed
          setShowZoomMessage(isZoomedOut);
          onZoomStatusChange(isZoomedOut);
          setCurrentBounds(convertToMapBounds(bounds, true, boundsBufferPercent));
        } else {
          console.warn('[MapComponent LOG] bounds_changed listener: Could not get zoom.');
        }
      }
    });
    
    return () => {
      google.maps.event.removeListener(boundsListener); // Clean up bounds listener
    };
    // Dependencies: If any of these change, the listener needs to be reset
  }, [isLoaded, onBoundsChanged, onZoomStatusChange, setShowZoomMessage, setCurrentMapZoom]);

  useEffect(() => {
    if (mapRef.current && isLoaded && !loading) {
       updateVisibleMarkers();
    }
  }, [courses, isLoaded, loading, mapRef.current, updateVisibleMarkers]);

  const internalHandlePlaceSelect = useCallback((place: google.maps.places.PlaceResult): void => {
    onPlaceSelect(place);
  }, [onPlaceSelect]);

  // Effect to handle programmatic map fitting based on targetBounds prop
  useEffect(() => {
    if (targetBounds && mapRef.current) {
      const map = mapRef.current;
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(targetBounds.north, targetBounds.west),
        new google.maps.LatLng(targetBounds.south, targetBounds.east)
      );
      map.fitBounds(bounds);
      // Check zoom IMMEDIATELY after fitBounds and update state
      const newZoom = map.getZoom();
      if (typeof newZoom === 'number') {
        setCurrentMapZoom(newZoom); // Update zoom state for display
        const isNowZoomedOut = newZoom <= MIN_ZOOM_FOR_MARKERS;
        setShowZoomMessage(isNowZoomedOut);
        onZoomStatusChange(isNowZoomedOut); // Notify parent immediately
        const bounds = map.getBounds();
        if (bounds) {
          setCurrentBounds(convertToMapBounds(bounds, true, boundsBufferPercent));
        }
      } else {
         console.warn('[MapComponent LOG] useEffect[targetBounds]: Could not get zoom after fitBounds.');
      }
    }
  }, [targetBounds, mapRef.current, onZoomStatusChange, setShowZoomMessage, setCurrentMapZoom]);

  // Function to determine marker z-index based on course rating and selection
  const getMarkerZIndex = useCallback((course: GolfCourse, isSelected: boolean): number => {
    // Selected courses always on top
    if (isSelected) {
      return 1000;
    }

    // Determine rating for z-index calculation
    const isExplicitlyUnwalkable = course.course_isWalkable === false;
    const hasWalkabilityRating = typeof course.walkabilityRating_overall === 'number' && course.walkabilityRating_overall > 0;

    if (isExplicitlyUnwalkable) {
      return 1; // Unwalkable courses at bottom
    }

    if (hasWalkabilityRating) {
      const rating = Math.round(course.walkabilityRating_overall!);
      const clampedRating = Math.min(Math.max(rating, 1), 5);
      return clampedRating * 10; // 5-star = 50, 4-star = 40, etc.
    }

    return 5; // Unrated courses above unwalkable but below rated
  }, []);

  // Function to apply small offsets to courses at the same location
  const applyLocationOffset = useCallback((course: GolfCourse, allCourses: GolfCourse[]): { lat: number; lng: number } => {
    // Find other courses at the same location
    const sameLocationCourses = allCourses.filter(otherCourse => 
      otherCourse.id !== course.id &&
      Math.abs(otherCourse.location_coordinates_latitude - course.location_coordinates_latitude) < 0.000001 &&
      Math.abs(otherCourse.location_coordinates_longitude - course.location_coordinates_longitude) < 0.000001
    );

    if (sameLocationCourses.length === 0) {
      // No other courses at this location
      return {
        lat: course.location_coordinates_latitude,
        lng: course.location_coordinates_longitude
      };
    }

    // Calculate dynamic offset radius based on current zoom level
    const currentZoom = mapRef.current?.getZoom() || DEFAULT_ZOOM;
    
    // Much more aggressive offset for medium zoom visibility:
    // - Zoom 7: Very large offset (~4.4km)
    // - Zoom 8: Large offset (~2.2km) 
    // - Zoom 9: Large offset (~1.1km)
    // - Zoom 10: Medium offset (~550m)
    // - Zoom 12: Small offset (~140m)
    // - Zoom 14+: Minimal offset (~35m)
    const baseOffset = 0.02; // Doubled again for much better visibility
    const zoomFactor = Math.max(6, currentZoom); // Start scaling from zoom 6
    const offsetRadius = Math.max(0.001, baseOffset / Math.pow(2, zoomFactor - 6)); // Higher minimum too
    
    // Apply small circular offset based on course ID for consistency
    const allCoursesAtLocation = [course, ...sameLocationCourses].sort((a, b) => a.id.localeCompare(b.id));
    const courseIndex = allCoursesAtLocation.findIndex(c => c.id === course.id);
    const totalCourses = allCoursesAtLocation.length;
    
    const angle = (courseIndex / totalCourses) * 2 * Math.PI;
    
    return {
      lat: course.location_coordinates_latitude + offsetRadius * Math.cos(angle),
      lng: course.location_coordinates_longitude + offsetRadius * Math.sin(angle)
    };
  }, []);

  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
    return <div>Error loading maps. Please check console or API key.</div>;
  }

  if (!isLoaded) {
    return <div>Loading Map Script...</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Ensure SearchBox is above overlays */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-[600px] z-30">
        <SearchBox onPlaceSelect={internalHandlePlaceSelect} />
      </div>

      {/* Dimming Overlay and Zoom Message */}
      {showZoomMessage && (
        <>
          {/* Message */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                      bg-white/95 px-6 py-4 rounded-lg shadow-lg text-gray-800 text-center max-w-sm z-20 pointer-events-none">
            <h3 className="text-lg font-semibold mb-2">Too many courses to display</h3>
            <p className="text-sm">Please zoom in or search for a specific location.</p>
          </div>
        </>
      )}

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={defaultCenter}
        zoom={DEFAULT_ZOOM}
        onLoad={internalOnMapLoad}
        options={mapOptions}
        onClick={() => {
           setSelectedInfoWindowCourse(null);
        }}
      >
        {isLoading && <LoadingIndicator progress={progress} />}

        {selectedInfoWindowCourse && isValidCoordinate(selectedInfoWindowCourse.location_coordinates_latitude, selectedInfoWindowCourse.location_coordinates_longitude) && (
          <InfoWindow
            position={{
              lat: selectedInfoWindowCourse.location_coordinates_latitude,
              lng: selectedInfoWindowCourse.location_coordinates_longitude,
            }}
            onCloseClick={() => {
              setSelectedInfoWindowCourse(null);
            }}
            options={{
              pixelOffset: new google.maps.Size(0, -35),
              disableAutoPan: true,
              zIndex: 100
            }}
          >
            <div className="course-preview p-1 font-sans w-48">
              <h3 className="text-base font-semibold mb-0.5 text-gray-800 leading-tight">
                <span>{selectedInfoWindowCourse.courseName}</span>
                {selectedInfoWindowCourse.course_holes ? (
                  <span className="ml-1.5 text-xs font-normal text-gray-600">
                     {`(${selectedInfoWindowCourse.course_holes} holes)`}
                  </span>
                ) : ''}
              </h3>
              {selectedInfoWindowCourse.club_name && (
                <p className="text-xs mb-1 text-gray-600 leading-tight">
                  {selectedInfoWindowCourse.club_name}
                </p>
              )}
              {(selectedInfoWindowCourse.location_city || selectedInfoWindowCourse.location_state) && (
                <p className="text-xs mb-1 text-gray-600 leading-tight">
                  {selectedInfoWindowCourse.location_city}{selectedInfoWindowCourse.location_city && selectedInfoWindowCourse.location_state ? ', ' : ''}{selectedInfoWindowCourse.location_state}
                </p>
              )}
              <div className="flex items-center text-xs mb-1.5 text-gray-600">
                <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-500 flex-shrink-0" />
                <span className="leading-tight">
                  {typeof selectedInfoWindowCourse.walkabilityRating_overall === 'number' ?
                    `${selectedInfoWindowCourse.walkabilityRating_overall.toFixed(1)}/5 Walkability` :
                    'Walkability: Not rated'}
                </span>
              </div>
              <Link
                href={`/courses/${selectedInfoWindowCourse.id}?from=map&bounds=${encodeURIComponent(JSON.stringify(
                  mapRef.current?.getBounds() ? getRawMapBounds(mapRef.current.getBounds()!) : {}
                ))}`}
                className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                View Details &rarr;
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

// CLUSTERING DISABLED - Comment out the createClusterer function
// const createClusterer = (map: google.maps.Map): GoogleMarkerClusterer => {
//   return new GoogleMarkerClusterer({
//     map,
//     algorithm: new SuperClusterAlgorithm({
//       radius: 100,
//       maxZoom: 12,
//       minPoints: 3
//     }),
//     renderer: {
//       render: ({ count, position }) => {
//         const size = Math.min(Math.max(40, Math.log2(count) * 12), 70);
        
//         const outerDiv = document.createElement('div');
//         outerDiv.style.position = 'relative';
        
//         const div = document.createElement('div');
//         div.style.position = 'absolute';
//         div.style.left = '50%';
//         div.style.top = '50%';
//         div.style.transform = 'translate(-50%, -50%)';
//         div.style.width = `${size}px`;
//         div.style.height = `${size}px`;
//         div.style.borderRadius = '50%';
//         div.style.background = MARKER_COLORS.cluster;
//         div.style.border = '3px solid rgba(255, 255, 255, 0.9)';
//         div.style.display = 'flex';
//         div.style.alignItems = 'center';
//         div.style.justifyContent = 'center';
//         div.style.color = 'white';
//         div.style.fontSize = `${Math.max(14, Math.min(size/2.2, 20))}px`;
//         div.style.fontWeight = '500';
//         div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
//         div.style.transition = 'all 0.2s ease';
//         div.textContent = String(count);

//         if (count > 10) {
//           div.style.animation = 'pulse 2s infinite';
//           const style = document.createElement('style');
//           style.textContent = `
//             @keyframes pulse {
//               0% { transform: translate(-50%, -50%) scale(1); }
//               50% { transform: translate(-50%, -50%) scale(1.05); }
//               100% { transform: translate(-50%, -50%) scale(1); }
//             }
//           `;
//           outerDiv.appendChild(style);
//         }

//         div.onmouseenter = () => {
//           div.style.transform = 'translate(-50%, -50%) scale(1.1)';
//           div.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
//         };
//         div.onmouseleave = () => {
//           div.style.transform = 'translate(-50%, -50%) scale(1)';
//           div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
//         };

//         outerDiv.appendChild(div);
//         return new google.maps.marker.AdvancedMarkerElement({
//           position,
//           content: outerDiv
//         });
//       }
//     }
//   });
// };

