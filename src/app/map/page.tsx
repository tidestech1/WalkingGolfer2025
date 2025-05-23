'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions"; 
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { buildFilterSortConstraints } from '@/lib/firebase/courseUtils';
import { db, isFirebaseAvailable } from '@/lib/firebase/firebase';
import { cn } from '@/lib/utils';
import { GolfCourse, CourseFilters, MapBounds } from '@/types/course';

import { BottomNav } from './components/BottomNav';
import { FilterBottomSheet } from './components/FilterBottomSheet';
import { LocationPrompt } from './components/LocationPrompt';
import Sidebar from './components/Sidebar';

// Constants
const LOCATION_PROMPT_SEEN_KEY = 'walkingGolfer_hasSeenLocationPrompt';
const MIN_ZOOM_FOR_MARKERS = 7.5;

// Dynamically import the Map component with no SSR
const MapComponent = dynamic(
  () => import('./components/Map'),
  { ssr: false }
);

// UPDATED Default Filters - Omit optional fields instead of using undefined
const DEFAULT_FILTERS: CourseFilters = {
  walkabilityRating_overall_min: 0, 
  filter_isWalkable: false, 
  filter_drivingRange: false,
  filter_golfCarts: false,
  filter_pushCarts: false,
  filter_restaurant: false,
  filter_proShop: false,
  filter_puttingGreen: false,
  filter_chippingGreen: false,
  filter_practiceBunker: false,
  filter_caddies: false,
  filter_clubRental: false,
  sortBy: 'walkabilityRating_overall',
  sortOrder: 'desc',
  // searchQuery: undefined, // OMIT
  // state: undefined, // OMIT
  // mapBounds: undefined, // OMIT 
  // simpleSearch: undefined, // OMIT
};

// Import Firebase Functions SDK

export default function MapPage(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number | null>(null);
  
  const [filteredCourses, setFilteredCourses] = useState<GolfCourse[]>([]);
  const [coursesInBoundsCount, setCoursesInBoundsCount] = useState<number>(0);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [targetMapBounds, setTargetMapBounds] = useState<MapBounds | null>(null);
  const [targetMapZoom, setTargetMapZoom] = useState<number | null>(null);
  const [isZoomedOut, setIsZoomedOut] = useState<boolean>(false);

  // Initialize showLocationPrompt state based on sessionStorage
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(() => {
    // sessionStorage is only available in the browser
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(LOCATION_PROMPT_SEEN_KEY) !== 'true'; // Use sessionStorage
    }
    // Default to true if not in browser (e.g., SSR, though this page is client-side)
    return true; 
  });

  // Define mapRef here in MapPage
  const mapRef = useRef<google.maps.Map | null>(null);

  // Get a reference to the Cloud Function
  const getCoursesForMapFn = useMemo(() => {
    if (typeof window !== 'undefined') { // Ensure runs client-side
      const functions = getFunctions(); // Use default region
      return httpsCallable<{ filters: CourseFilters; bounds: MapBounds }, { courses: GolfCourse[] }>(
        functions, 
        'getCoursesForMap'
      );
    } 
    return null; // Return null during SSR or if functions not ready
  }, []);

  // Get bounds from URL if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const boundsParam = searchParams.get('bounds');
      const zoomParam = searchParams.get('zoom');
      if (boundsParam) {
        try {
          const bounds = JSON.parse(decodeURIComponent(boundsParam));
          setTargetMapBounds(bounds);
          if (zoomParam) {
            setTargetMapZoom(Number(zoomParam));
          }
        } catch (e) {
          console.error('Error parsing bounds from URL:', e);
        }
      }
    }
  }, []);

  const loadCourses = useCallback(async (bounds?: MapBounds) => {
    const currentZoom = mapRef.current?.getZoom(); 
    if (typeof currentZoom === 'number' && currentZoom <= MIN_ZOOM_FOR_MARKERS) {
        console.log(`loadCourses skipped: Current zoom (${currentZoom}) is below threshold (${MIN_ZOOM_FOR_MARKERS}).`);
        setFilteredCourses([]);
        setCoursesInBoundsCount(0); 
        return; 
    }

    // Keep the Firebase availability check
    if (!isFirebaseAvailable()) {
      console.error('Firebase not initialized.');
      setError('Unable to connect to the course database');
      return;
    }
    
    // Check if function reference is ready
    if (!getCoursesForMapFn) {
      console.error('getCoursesForMap Cloud Function reference not available.');
      setError('Course loading service is unavailable.');
      return;
    }

    // Keep the bounds check
    if (!bounds) {
      console.debug("loadCourses skipped: no bounds provided.")
      return; 
    }

    setLoading(true);
    setError(null);

    console.log(`[page.tsx LOG] Calling getCoursesForMap Cloud Function`);
    console.log(`[page.tsx LOG] Filters:`, JSON.stringify(filters));
    console.log(`[page.tsx LOG] Bounds:`, JSON.stringify(bounds));

    try {
      // === Call the Cloud Function ===
      const result = await getCoursesForMapFn({ filters, bounds });
      const coursesInView = result.data.courses;
      
      // Update state with results from the Cloud Function
      setFilteredCourses(coursesInView);
      setCoursesInBoundsCount(coursesInView.length); // Count is now accurate server-side
      console.log(`Received ${coursesInView.length} courses from Cloud Function.`);
      
      // --- Remove direct Firestore query logic --- 
      // const coursesRef = collection(db, 'courses');
      // const filterConstraints = buildFilterSortConstraints(filters);
      // const q = query(coursesRef, ...filterConstraints); 
      // const snapshot = await getDocs(q);
      // const coursesMatchingFilters = snapshot.docs.map(...);
      // setCoursesInBoundsCount(coursesMatchingFilters.length); 
      // const coursesInView = coursesMatchingFilters.filter(...);
      // --- End of removed logic --- 

    } catch (err: any) { // Use any or specific FirebaseError type
      console.error('Error calling getCoursesForMap Cloud Function:', err);
      // Handle HTTPS callable errors (e.g., permissions, invalid args)
      if (err.code && err.message) {
        setError(`Error loading courses: ${err.message} (code: ${err.code})`);
      } else {
        setError('An unexpected error occurred while loading courses.');
      }
      setFilteredCourses([]); 
      setCoursesInBoundsCount(0); 
    } finally {
      setLoading(false);
    }
  // Dependencies: Reload when filters, bounds (via debounced call), or function ref changes
  }, [filters, getCoursesForMapFn]); // bounds trigger is handled by debouncedLoadCourses

  const debouncedLoadCourses = useMemo(
    () => debounce((bounds: MapBounds) => {
      loadCourses(bounds);
    }, 500),
    [loadCourses]
  );

  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
    // Trigger fetch with new bounds (filters are handled by useEffect watching filters state)
    debouncedLoadCourses(bounds); // REMOVED filters argument
  }, [debouncedLoadCourses]);

  useEffect(() => {
    console.debug('[MapPage LOG] useEffect[mapLoaded, mapBounds, filters] TRIGGERED.'); // Log entry
    if (!mapLoaded || !mapBounds || !mapRef.current) {
        console.debug('[MapPage LOG] useEffect[mapLoaded, mapBounds, filters]: Skipping load (map/bounds not ready).')
        return; 
    }
    console.debug('[MapPage LOG] useEffect[mapLoaded, mapBounds, filters]: Filters changed, current filters:', filters);
    console.debug(`[MapPage LOG] useEffect[mapLoaded, mapBounds, filters]: Calling debouncedLoadCourses`);
    debouncedLoadCourses(mapBounds); 

  }, [mapLoaded, mapBounds, filters, debouncedLoadCourses]); // Keep filters dependency here

  const handleCourseSelect = useCallback((course: GolfCourse) => {
    setSelectedCourseId(course.id);
    const index = filteredCourses.findIndex(c => c.id === course.id);
    setSelectedCourseIndex(index !== -1 ? index : null);
    setShowLocationPrompt(false); 
  }, [filteredCourses]);

  const handleFilterChange = useCallback((newFilters: Partial<CourseFilters>) => {
    console.log('[MapPage LOG] handleFilterChange called with:', newFilters);
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      console.log('[MapPage LOG] Filters state updated to:', updated);
      return updated;
    });
  }, []);

  // Handle view changes from BottomNav
  const handleViewChange = useCallback((view: 'map' | 'list' | 'filters') => {
    if (view === 'filters') {
      setFilterSheetOpen(true);
      // Keep the underlying map/list view state as is
    } else {
      setActiveMobileView(view);
      setFilterSheetOpen(false); // Close filter sheet when switching main views
    }
  }, []);

  // handlePlaceSelect: Calculate target bounds and update state, let MapComponent handle view
  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult): void => {
    if (!place.geometry) {
      console.warn("handlePlaceSelect: Invalid place data.");
      return;
    }

    let newBounds: MapBounds | null = null;

    if (place.geometry?.viewport) {
        console.log("handlePlaceSelect: Calculating bounds from viewport");
        const ne = place.geometry.viewport.getNorthEast();
        const sw = place.geometry.viewport.getSouthWest();
        if (ne && sw) {
            newBounds = {
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng()
            };
        }
    } else {
        console.warn("handlePlaceSelect: Viewport not available for place. Cannot set target bounds.");
    }

    if (newBounds) {
        console.log("handlePlaceSelect: Setting targetMapBounds and mapBounds states:", newBounds);
        setTargetMapBounds(newBounds); // Update state for MapComponent prop
        setMapBounds(newBounds);      // Update state to trigger data loading effect
    } else {
        console.warn("handlePlaceSelect: Could not determine new bounds for place selection.");
    }

    setShowLocationPrompt(false); 
  }, [setTargetMapBounds, setMapBounds]); // Depends only on setters

  // handleLocationSelect now uses component state mapRef
  const handleLocationSelect = useCallback((location: google.maps.LatLngLiteral): void => {
    console.debug("handleLocationSelect: User location selected.", location);
    setUserLocation(location);
    setShowLocationPrompt(false);
    // Persist the choice in sessionStorage
    sessionStorage.setItem(LOCATION_PROMPT_SEEN_KEY, 'true'); // Use sessionStorage
    
    if (mapRef.current) {
      mapRef.current.panTo(location);
      mapRef.current.setZoom(12);
    }
  }, []); // No dependency on mapRef needed

  // handleSkipLocation now uses component state mapRef
  const handleSkipLocation = useCallback(() => {
    console.debug("handleSkipLocation: User skipped location prompt.");
    setShowLocationPrompt(false);
    setUserLocation(null);
    // Persist the choice in sessionStorage
    sessionStorage.setItem(LOCATION_PROMPT_SEEN_KEY, 'true'); // Use sessionStorage
  }, []);

  // Callback for MapComponent to report zoom status
  const handleZoomStatusChange = useCallback((status: boolean) => {
    setIsZoomedOut(status);
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);

    // If we have target bounds from URL, set them
    if (targetMapBounds && map) {
      const bounds = new google.maps.LatLngBounds(
        { lat: targetMapBounds.south, lng: targetMapBounds.west },
        { lat: targetMapBounds.north, lng: targetMapBounds.east }
      );
      map.fitBounds(bounds);
      if (targetMapZoom !== null) {
        map.setZoom(targetMapZoom);
      }
      // Clear the target bounds and zoom after applying
      setTargetMapBounds(null);
      setTargetMapZoom(null);
    }
  }, [targetMapBounds, targetMapZoom]);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="fixed inset-x-0 top-10 bottom-0 bg-white">
      {/* Mobile Views */}
      <div className="lg:hidden h-full">
        {/* Map View */}
        <div className={cn(
          'fixed inset-x-0 top-10 bottom-24 transition-transform duration-300 transform',
          // Corrected logic: Show map when activeMobileView is 'map'
          activeMobileView === 'map' ? 'translate-x-0' : 'translate-x-full' 
        )}>
          <MapComponent
            courses={filteredCourses}
            selectedCourseId={selectedCourseId || null}
            onCourseSelect={handleCourseSelect}
            onBoundsChanged={handleBoundsChanged}
            loading={loading}
            onMapLoad={handleMapLoad}
            onPlaceSelect={handlePlaceSelect}
            targetBounds={targetMapBounds}
            onZoomStatusChange={handleZoomStatusChange}
          />
          {/* Render LocationPrompt overlay here for mobile */}
          {mapLoaded && !userLocation && showLocationPrompt && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-sm">
              <LocationPrompt 
                onLocationSelect={handleLocationSelect} 
                onSkip={handleSkipLocation} 
              />
            </div>
          )}
          {/* Loading Indicator Overlay */}
          {mapLoaded && loading && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10 pointer-events-none">
              {/* Style using tokens/Tailwind according to brandguide.md */}
              <div className="bg-white p-4 rounded-lg shadow-xl">
                <p className="text-lg font-semibold text-gray-800">Loading courses...</p>
                {/* Optional: Add a spinner component here if available */}
              </div>
            </div>
          )}
        </div>

        {/* List View */}
        <div className={cn(
          'fixed inset-x-0 top-10 bottom-24 bg-white transition-transform duration-300 transform',
           // Show list when activeMobileView is 'list'
           activeMobileView === 'list' ? 'translate-x-0' : '-translate-x-full', 
           isZoomedOut ? 'hidden' : ''
        )}>
          <div className="h-full">
            <Sidebar
              courses={filteredCourses}
              filters={filters}
              onFilterChange={handleFilterChange}
              onCourseSelect={handleCourseSelect}
              selectedCourseId={selectedCourseId || null}
              totalInBounds={coursesInBoundsCount}
              selectedCourseIndex={selectedCourseIndex}
              onClose={() => {}}
              isZoomedOut={isZoomedOut}
              currentBounds={mapBounds}
              currentZoom={mapRef.current?.getZoom() || 0}
            />
          </div>
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Bottom Navigation */}
        <BottomNav
          activeView={filterSheetOpen ? 'filters' : activeMobileView}
          onViewChange={handleViewChange}
          totalCourses={filteredCourses.length}
        />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        {/* Left Column - Filters & Key - Add overflow-y-auto */}
        <div className="w-60 border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          <Sidebar
            courses={[]}
            filters={filters}
            onFilterChange={handleFilterChange}
            onCourseSelect={handleCourseSelect}
            selectedCourseId={null}
            filtersOnly={true}
            currentBounds={mapBounds}
            currentZoom={mapRef.current?.getZoom() || 0}
          />
          
          {/* --- START: Marker Key Section --- */}
          <div className="p-4 mt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Marker Key</h4>
            <div className="space-y-1.5">
              {/* Rated Course */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'rgba(5, 150, 105, 0.85)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#FBBF24', fontVariationSettings: "'FILL' 1", fontSize: '12px' }}>star</span>
                </div>
                <span className="text-xs">Rated Course</span>
              </div>
              {/* Walkable Course */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'rgba(5, 150, 105, 0.85)' }}>
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 0" }}>directions_walk</span>
                </div>
                <span className="text-xs">Walkable Course</span>
              </div>
              {/* Other Course */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: 'rgba(30, 64, 175, 0.85)' }}>
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 0" }}>golf_course</span>
                </div>
                <span className="text-xs">Other Course</span>
              </div>
              {/* Selected Course */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#DC2626' }}></div>
                <span className="text-xs">Selected Course</span>
              </div>
            </div>
          </div>
          {/* --- END: Marker Key Section --- */}
        </div>

        {/* Middle Column - Course Listings */}
        <div className="w-[300px] border-r">
          {/* Conditionally render sidebar based on zoom */}
          {!isZoomedOut ? (
            <Sidebar
              courses={filteredCourses}
              filters={filters}
              onFilterChange={handleFilterChange}
              onCourseSelect={handleCourseSelect}
              selectedCourseId={selectedCourseId || null}
              totalInBounds={coursesInBoundsCount}
              selectedCourseIndex={selectedCourseIndex}
              isZoomedOut={isZoomedOut}
              currentBounds={mapBounds}
              currentZoom={mapRef.current?.getZoom() || 0}
            />
          ) : (
            // Placeholder or message when zoomed out for desktop list column
            <div className="p-4 text-center text-gray-500">
              <p>Zoom in on the map to view courses.</p>
            </div>
          )}
        </div>

        {/* Right Column - Map */}
        <div className="flex-1 lg:pb-10 relative">
          <MapComponent
            courses={filteredCourses}
            selectedCourseId={selectedCourseId || null}
            onCourseSelect={handleCourseSelect}
            onBoundsChanged={handleBoundsChanged}
            loading={loading}
            onMapLoad={handleMapLoad}
            onPlaceSelect={handlePlaceSelect}
            targetBounds={targetMapBounds}
            onZoomStatusChange={handleZoomStatusChange}
          />
          {/* Render LocationPrompt overlay here for desktop */}
          {mapLoaded && !userLocation && showLocationPrompt && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-sm"> 
              <LocationPrompt 
                onLocationSelect={handleLocationSelect} 
                onSkip={handleSkipLocation} 
              />
            </div>
          )}
          {/* Loading Indicator Overlay */}
          {mapLoaded && loading && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10 pointer-events-none">
              {/* Style using tokens/Tailwind according to brandguide.md */}
              <div className="bg-white p-4 rounded-lg shadow-xl">
                <p className="text-lg font-semibold text-gray-800">Loading courses...</p>
                {/* Optional: Add a spinner component here if available */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 