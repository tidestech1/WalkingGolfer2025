'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import { MarkerClusterer as GoogleMarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { GoogleMap, useLoadScript, Libraries, InfoWindow } from '@react-google-maps/api';
import { debounce } from 'lodash';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { GolfCourse, MapBounds } from '@/types/course';

import { LoadingIndicator } from './LoadingIndicator';
import { LocationPrompt } from './LocationPrompt';
import { SearchBox } from './SearchBox';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import {} from '@/lib/utils';

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

const convertToMapBounds = (bounds: google.maps.LatLngBounds): MapBounds => {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng()
  };
};

const MARKER_COLORS = {
  walkable: 'rgba(5, 150, 105, 0.85)',    // Darker green with transparency
  default: 'rgba(30, 64, 175, 0.85)',     // Darker blue (blue-800) with transparency
  selected: 'rgba(37, 99, 235, 0.95)',    // Selected state more opaque
  cluster: 'rgba(37, 99, 235, 0.95)'      // Cluster blue
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
}: MapProps): JSX.Element | React.ReactNode {
  const [showZoomMessage, setShowZoomMessage] = useState<boolean>(false);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [selectedInfoWindowCourse, setSelectedInfoWindowCourse] = useState<GolfCourse | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<GoogleMarkerClusterer | null>(null);
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
  const getMarkerScale = useCallback((isSelected: boolean): number => {
    // Return default scale if map isn't ready yet
    if (!mapRef.current) {
      return isSelected ? 1.2 : 1.0;
    }
    const currentZoom = mapRef.current.getZoom();
    // Return default scale if zoom level isn't available
    if (!currentZoom) {
      return isSelected ? 1.2 : 1.0;
    }

    // Adjust scale based on zoom ranges
    if (currentZoom <= 8) {
      return isSelected ? 0.9 : 0.7; // Smaller at far zoom levels
    }
    if (currentZoom <= 10) {
      return isSelected ? 1.1 : 0.9; // Medium size
    }
    return isSelected ? 1.2 : 1.0; // Larger scale when zoomed in or selected
  }, []);

  // Function to create marker icon for individual courses
  const createMarkerIcon = useCallback((course: GolfCourse, isSelected: boolean): google.maps.marker.PinElement => {
    const scale = getMarkerScale(isSelected);
    const pinGlyph = document.createElement("span");
    pinGlyph.style.fontSize = '14px';
    pinGlyph.style.color = '#FFFFFF';
    pinGlyph.textContent = isWalkable(course) ? 'W' : 'G';

    return new google.maps.marker.PinElement({
      background: isWalkable(course) ? MARKER_COLORS.walkable : MARKER_COLORS.default,
      borderColor: isSelected ? MARKER_COLORS.selected : 'rgba(255, 255, 255, 0.9)',
      glyphColor: '#FFFFFF',
      scale: scale,
      glyph: pinGlyph
    });
  }, [getMarkerScale]);

  const updateVisibleMarkers = useCallback((): void => {
    console.log('[MapComponent LOG] updateVisibleMarkers called.');
    const map = mapRef.current;

    if (!map || !isLoaded) {
      console.log('[MapComponent LOG] updateVisibleMarkers exiting: map or isLoaded false.');
      return;
    }

    // Get zoom level directly inside the callback
    const currentZoom = map.getZoom();
    console.log(`[MapComponent LOG] updateVisibleMarkers: Direct zoom check=${currentZoom}, courses.length=${courses?.length ?? 'undefined'}`);

    // Check zoom level DIRECTLY before deciding to show markers
    if (typeof currentZoom === 'number' && currentZoom <= MIN_ZOOM_FOR_MARKERS) {
      console.log(`[MapComponent LOG] updateVisibleMarkers: Zoom (${currentZoom}) <= threshold, clearing markers.`);
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      setSelectedInfoWindowCourse(null);
      return;
    }

    if (!courses || courses.length === 0) {
      console.log('[MapComponent LOG] updateVisibleMarkers: No courses or empty array, clearing markers and returning.');
      if (clustererRef.current && markersRef.current.length > 0) {
          clustererRef.current.clearMarkers();
          markersRef.current = [];
      }
      setSelectedInfoWindowCourse(null);
      return;
    }

    console.log('[MapComponent LOG] updateVisibleMarkers: Proceeding to marker creation/update.');
    if (markersRef.current.length === 0 || markersRef.current.length !== courses.length) {
      console.log(`[MapComponent LOG] updateVisibleMarkers: Recreating markers. Initial courses count: ${courses.length}`);
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      setSelectedInfoWindowCourse(null);

      const validCourses = courses
        .filter(course => {
          const valid = isValidCoordinate(course.location_coordinates_latitude, course.location_coordinates_longitude);
          if (!valid) {
            console.warn(`Invalid coordinates for course ${course.id}:`, course.location_coordinates_latitude, course.location_coordinates_longitude);
          }
          return valid;
        });

      console.log(`[MapComponent LOG] updateVisibleMarkers: Found ${validCourses.length} courses with valid coordinates.`);

      const newMarkers = validCourses.map(course => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: {
            lat: course.location_coordinates_latitude,
            lng: course.location_coordinates_longitude
          },
          title: course.courseName,
          content: createMarkerIcon(course, course.id === selectedCourseId).element
        });

        marker.addEventListener('click', (event: MouseEvent) => {
          event.stopPropagation();
          console.debug(`Marker clicked: ${course.courseName} (ID: ${course.id})`); 
          onCourseSelect(course);
          setSelectedInfoWindowCourse(course);
        });

        return marker;
      });

      console.log(`[MapComponent LOG] updateVisibleMarkers: Created ${newMarkers.length} marker elements.`);

      if (clustererRef.current && newMarkers.length > 0) {
        console.log(`[MapComponent LOG] updateVisibleMarkers: Adding ${newMarkers.length} markers to clusterer...`);
        clustererRef.current.addMarkers(newMarkers);
        console.log(`[MapComponent LOG] updateVisibleMarkers: Finished adding markers to clusterer.`);
      } else {
        console.log("[MapComponent LOG] updateVisibleMarkers: No clusterer available or no valid markers to add.");
      }
      markersRef.current = newMarkers;
    } else {
      markersRef.current.forEach((marker, index) => {
        if (courses[index]) {
          marker.content = createMarkerIcon(courses[index], courses[index].id === selectedCourseId).element;
        }
      });
    }
  }, [courses, selectedCourseId, isLoaded, createMarkerIcon, mapRef, onCourseSelect, setSelectedInfoWindowCourse]);

  const internalOnMapLoad = useCallback((map: google.maps.Map): void => {
    mapRef.current = map;
    onMapLoad(map);
    
    if (!clustererRef.current) {
      clustererRef.current = createClusterer(map);
    }

    map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChanged(convertToMapBounds(bounds));
        // Check zoom level on bounds_changed and update state/notify parent
        const currentZoom = map.getZoom();
        if (typeof currentZoom === 'number') {
          setCurrentMapZoom(currentZoom);
          const isZoomedOut = currentZoom <= MIN_ZOOM_FOR_MARKERS;
          // Always update state and notify parent on bounds_changed
          console.log(`[MapComponent LOG] useEffect[bounds_changed]: fitBounds complete. New zoom=${currentZoom}, isNowZoomedOut=${isZoomedOut}. Calling setShowZoomMessage & onZoomStatusChange.`);
          setShowZoomMessage(isZoomedOut);
          onZoomStatusChange(isZoomedOut);
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
        onBoundsChanged(convertToMapBounds(bounds));
      }

      // Check zoom level on bounds_changed and update state/notify parent
      const currentZoom = map.getZoom();
      if (typeof currentZoom === 'number') {
        setCurrentMapZoom(currentZoom);
        const isZoomedOut = currentZoom <= MIN_ZOOM_FOR_MARKERS;
        // Always update state and notify parent on bounds_changed
        console.log(`[MapComponent LOG] bounds_changed listener: zoom=${currentZoom}, isZoomedOut=${isZoomedOut}. Current state showZoomMessage=${showZoomMessage}. Calling setShowZoomMessage(${isZoomedOut})`);
        setShowZoomMessage(isZoomedOut);
        onZoomStatusChange(isZoomedOut);
      } else {
        console.warn('[MapComponent LOG] bounds_changed listener: Could not get zoom.');
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
        console.log(`[MapComponent LOG] useEffect[targetBounds]: fitBounds complete. New zoom=${newZoom}, isNowZoomedOut=${isNowZoomedOut}. Calling setShowZoomMessage & onZoomStatusChange.`);
        setShowZoomMessage(isNowZoomedOut);
        onZoomStatusChange(isNowZoomedOut); // Notify parent immediately
      } else {
         console.warn('[MapComponent LOG] useEffect[targetBounds]: Could not get zoom after fitBounds.');
      }
    }
  }, [targetBounds, mapRef.current, onZoomStatusChange, setShowZoomMessage, setCurrentMapZoom]);

  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
    return <div>Error loading maps. Please check console or API key.</div>;
  }

  if (!isLoaded) {
    console.debug("Google Maps script loading...");
    return <div>Loading Map Script...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border text-sm">
        {courses.length} courses
      </div>

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
            <div className="p-1 font-sans text-sm">
              <h3 className="text-base font-semibold mb-1 text-gray-800">
                {selectedInfoWindowCourse.courseName}
              </h3>
              {(selectedInfoWindowCourse.location_city || selectedInfoWindowCourse.location_state) && (
                <p className="mb-1 text-gray-600">
                  {selectedInfoWindowCourse.location_city}{selectedInfoWindowCourse.location_city && selectedInfoWindowCourse.location_state ? ', ' : ''}{selectedInfoWindowCourse.location_state}
                </p>
              )}
              <div className="flex items-center text-xs mb-2 text-gray-600">
                <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-500" />
                <span>
                  {typeof selectedInfoWindowCourse.walkabilityRating_overall === 'number' ?
                    `${selectedInfoWindowCourse.walkabilityRating_overall.toFixed(1)}/5 Walkability` :
                    'Walkability: Not rated yet'}
                </span>
              </div>
              <Link
                href={`/courses/${selectedInfoWindowCourse.id}`}
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

// Function to determine if a course is walkable based on rating
const isWalkable = (course: GolfCourse): boolean => {
  return typeof course.walkabilityRating_overall === 'number' && 
         course.walkabilityRating_overall >= 2.5;
};

const createClusterer = (map: google.maps.Map): GoogleMarkerClusterer => {
  return new GoogleMarkerClusterer({
    map,
    algorithm: new SuperClusterAlgorithm({
      radius: 100,
      maxZoom: 12,
      minPoints: 3
    }),
    renderer: {
      render: ({ count, position }) => {
        const size = Math.min(Math.max(40, Math.log2(count) * 12), 70);
        
        const outerDiv = document.createElement('div');
        outerDiv.style.position = 'relative';
        
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '50%';
        div.style.top = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.width = `${size}px`;
        div.style.height = `${size}px`;
        div.style.borderRadius = '50%';
        div.style.background = MARKER_COLORS.cluster;
        div.style.border = '3px solid rgba(255, 255, 255, 0.9)';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = 'white';
        div.style.fontSize = `${Math.max(14, Math.min(size/2.2, 20))}px`;
        div.style.fontWeight = '500';
        div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        div.style.transition = 'all 0.2s ease';
        div.textContent = String(count);

        if (count > 10) {
          div.style.animation = 'pulse 2s infinite';
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.05); }
              100% { transform: translate(-50%, -50%) scale(1); }
            }
          `;
          outerDiv.appendChild(style);
        }

        div.onmouseenter = () => {
          div.style.transform = 'translate(-50%, -50%) scale(1.1)';
          div.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
        };
        div.onmouseleave = () => {
          div.style.transform = 'translate(-50%, -50%) scale(1)';
          div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        };

        outerDiv.appendChild(div);
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: outerDiv
        });
      }
    }
  });
};

