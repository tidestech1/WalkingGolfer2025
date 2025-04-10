'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import { MarkerClusterer as GoogleMarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import { GoogleMap, useLoadScript, Libraries, InfoWindow } from '@react-google-maps/api';
import { debounce } from 'lodash';
import Link from 'next/link';
import { Star } from 'lucide-react';

import { GolfCourse, MapBounds } from '@/types/course';

import { LoadingIndicator } from './LoadingIndicator';
import { LocationPrompt } from './LocationPrompt';
import { SearchBox } from './SearchBox';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import {} from '@/lib/utils';

const MIN_ZOOM_FOR_MARKERS = 5;
const DEFAULT_ZOOM = 8;

const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'marker'] as const;

interface MapProps {
  courses: GolfCourse[];
  selectedCourseId: string | null;
  onCourseSelect: (course: GolfCourse) => void;
  onBoundsChanged: (bounds: MapBounds) => void;
  loading?: boolean;
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
}: MapProps): JSX.Element | React.ReactNode {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [showZoomMessage, setShowZoomMessage] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
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
    zoom
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
    if (!mapRef.current || !isLoaded) {
return;
}

    const bounds = mapRef.current.getBounds();
    const zoom = mapRef.current.getZoom();
    
    if (!bounds || typeof zoom !== 'number') {
return;
}

    setShowZoomMessage(zoom < MIN_ZOOM_FOR_MARKERS);

    if (zoom < MIN_ZOOM_FOR_MARKERS) {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      // Close InfoWindow if markers are hidden
      setSelectedInfoWindowCourse(null);
      return;
    }

    // Only create new markers if we don't have any or if courses have changed
    // Added selectedInfoWindowCourse check to avoid recreating markers just for InfoWindow changes
    if (markersRef.current.length === 0 || markersRef.current.length !== courses.length) {
      // Clear existing markers
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      // Close any existing InfoWindow when rebuilding markers
      setSelectedInfoWindowCourse(null);

      // Create new markers only for courses that are passed in (already filtered)
      const newMarkers = courses
        .filter(course => {
          const valid = isValidCoordinate(course.location_coordinates_latitude, course.location_coordinates_longitude);
          if (!valid) {
            console.warn(`Invalid coordinates for course ${course.id}:`, course.location_coordinates_latitude, course.location_coordinates_longitude);
          }
          return valid;
        })
        .map(course => {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: {
              lat: course.location_coordinates_latitude,
              lng: course.location_coordinates_longitude
            },
            title: course.courseName,
            // Pass selectedCourseId for icon styling, not selectedInfoWindowCourse
            content: createMarkerIcon(course, course.id === selectedCourseId).element
          });

          // MODIFIED click listener
          marker.addEventListener('click', (event: MouseEvent) => {
            // Stop the click from bubbling up to the map
            event.stopPropagation();
            
            console.debug(`Marker clicked: ${course.courseName} (ID: ${course.id})`);
            onCourseSelect(course); // Still notify parent for list selection
            console.log('[MapComponent] Setting selectedInfoWindowCourse:', course);
            setSelectedInfoWindowCourse(course); // Set this marker for persistent InfoWindow
          });

          return marker;
        });

      // Add new markers to clusterer
      if (clustererRef.current && newMarkers.length > 0) {
        console.debug(`updateVisibleMarkers: Adding ${newMarkers.length} markers to clusterer.`);
        clustererRef.current.addMarkers(newMarkers);
      } else {
        console.debug("updateVisibleMarkers: No valid markers to add.");
      }

      // Update markers reference
      markersRef.current = newMarkers;
    } else {
      // Just update marker icons for selected state changes
      markersRef.current.forEach((marker, index) => {
        if (courses[index]) {
          // Update icon based on list selection (selectedCourseId)
          marker.content = createMarkerIcon(courses[index], courses[index].id === selectedCourseId).element;
        }
      });
    }
  }, [courses, selectedCourseId, onCourseSelect, isLoaded, createMarkerIcon, selectedInfoWindowCourse]);

  const onMapLoad = useCallback((map: google.maps.Map): void => {
    console.debug("onMapLoad: Map instance loaded.");
    mapRef.current = map;
    
    // Initialize marker clusterer
    if (!clustererRef.current) {
      console.debug("onMapLoad: Creating clusterer.");
      clustererRef.current = createClusterer(map);
    }

    // Set initial bounds if user location is available
    if (userLocation) {
      map.setCenter(userLocation);
      map.setZoom(12);
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(DEFAULT_ZOOM);
    }

    // Add bounds_changed listener
    map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (bounds) {
        console.debug("Map Idle: Bounds changed.");
        onBoundsChanged(convertToMapBounds(bounds));
        updateVisibleMarkers();
      }
    });

    // Initial update of visible markers
    updateVisibleMarkers();
  }, [userLocation, onBoundsChanged, updateVisibleMarkers]);

  const debouncedBoundsChanged = useMemo(
    () => debounce((bounds: google.maps.LatLngBounds) => {
      if (!mapRef.current) {
return;
}
      
      onBoundsChanged({
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      });
    }, 300),
    [onBoundsChanged]
  );

  useEffect(() => {
    if (!mapRef.current || !isLoaded) {
return;
}
    
    const map = mapRef.current;
    const listener = map.addListener('idle', () => {
      const bounds = map.getBounds();
      if (bounds) {
        debouncedBoundsChanged(bounds);
      }
    });
    
    return () => {
      google.maps.event.removeListener(listener);
      debouncedBoundsChanged.cancel();
    };
  }, [debouncedBoundsChanged, isLoaded]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded || loading) {
return;
}
    updateVisibleMarkers();
  }, [courses, selectedCourseId, updateVisibleMarkers, isLoaded, loading]);

  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult): void => {
    if (!place.geometry || !mapRef.current) {
      console.warn("handlePlaceSelect: Invalid place data or map not ready.");
      return;
    }

    if (place.geometry.viewport) {
      mapRef.current.fitBounds(place.geometry.viewport);
    } else if (place.geometry.location) {
      mapRef.current.setCenter(place.geometry.location);
      mapRef.current.setZoom(DEFAULT_ZOOM);
    }

    // Hide location prompt if it's still showing
    setShowLocationPrompt(false);
  }, []);

  const handleBoundsChanged = useCallback(() => {
    if (!mapRef.current) {
return;
}
    
    const bounds = mapRef.current.getBounds();
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const newBounds = {
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng()
      };
      setCurrentBounds(newBounds);
      onBoundsChanged(newBounds);
      setZoom(mapRef.current.getZoom() || DEFAULT_ZOOM);
      updateVisibleMarkers();
    }
  }, [onBoundsChanged, updateVisibleMarkers]);

  const handleLocationSelect = useCallback((location: google.maps.LatLngLiteral): void => {
    console.debug("handleLocationSelect: User location selected.", location);
    setUserLocation(location);
    setShowLocationPrompt(false);
    
    if (mapRef.current) {
      mapRef.current.panTo(location);
      mapRef.current.setZoom(12);
    }
  }, []);

  const handleSkipLocation = useCallback(() => {
    console.debug("handleSkipLocation: User skipped location prompt.");
    setShowLocationPrompt(false);
    setUserLocation(null);
  }, []);

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

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-[600px] z-10">
        <SearchBox onPlaceSelect={handlePlaceSelect} />
      </div>

      {showZoomMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white/90 px-6 py-4 rounded-lg shadow-lg text-gray-700 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Zoom In to View Courses</h3>
          <p>Zoom in or search for a specific location to view walkable golf courses in that area</p>
        </div>
      )}

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={userLocation || defaultCenter}
        zoom={DEFAULT_ZOOM}
        onLoad={(map) => {
          onMapLoad(map);
          setMapLoaded(true);
        }}
        onBoundsChanged={handleBoundsChanged}
        options={mapOptions}
        onClick={() => {
           console.log('[MapComponent] Map clicked, closing InfoWindow.');
           setSelectedInfoWindowCourse(null);
        }}
      >
        {mapLoaded && !userLocation && showLocationPrompt && (
          <LocationPrompt
            onLocationSelect={handleLocationSelect}
            onSkip={handleSkipLocation}
          />
        )}

        {isLoading && <LoadingIndicator progress={progress} />}

        {/* Persistent InfoWindow - Simplified conditional rendering */}
        {selectedInfoWindowCourse && isValidCoordinate(selectedInfoWindowCourse.location_coordinates_latitude, selectedInfoWindowCourse.location_coordinates_longitude) && (
          <InfoWindow
            position={{
              // No ! needed, type guaranteed by outer check
              lat: selectedInfoWindowCourse.location_coordinates_latitude,
              lng: selectedInfoWindowCourse.location_coordinates_longitude,
            }}
            onCloseClick={() => {
              console.log('[MapComponent] InfoWindow close clicked.');
              setSelectedInfoWindowCourse(null);
            }}
            options={{
              pixelOffset: new google.maps.Size(0, -35), 
              disableAutoPan: true, 
            }}
          >
            {/* No inner null check needed now */}
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
  console.debug("Creating MarkerClusterer instance");
  return new GoogleMarkerClusterer({
    map,
    algorithm: new SuperClusterAlgorithm({
      radius: 100, // Increased for more aggressive clustering
      maxZoom: 12, // Clusters remain longer while zooming
      minPoints: 3 // Only create clusters for 3 or more points
    }),
    renderer: {
      render: ({ count, position }) => {
        // More dramatic size scaling for better visual hierarchy
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

        // Add subtle pulse animation for larger clusters
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

