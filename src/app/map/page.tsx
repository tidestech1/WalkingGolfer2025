'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { getFunctions, httpsCallable } from "firebase/functions"; 
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import { useTour } from '@reactour/tour';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MapTourProvider } from '@/components/ui/MapTourProvider';
import { MapTour } from '@/components/ui/MapTour';
import { MapTourMobile } from '@/components/ui/MapTourMobile';
import { isFirebaseAvailable } from '@/lib/firebase/firebase';
import { cn } from '@/lib/utils';
import { GolfCourse, CourseFilters, MapBounds } from '@/types/course';

import { BottomNav } from './components/BottomNav';
import { FilterBottomSheet } from './components/FilterBottomSheet';
import { LocationPrompt } from './components/LocationPrompt';
import Sidebar from './components/Sidebar';
import { PlayCircle } from 'lucide-react';

// Constants
const LOCATION_PROMPT_SEEN_KEY = 'walkingGolfer_hasSeenLocationPrompt';
const MIN_ZOOM_FOR_MARKERS = 7.5;

// Configuration for map bounds buffer (safe zone)
// 0.1 = 10% buffer, 0.15 = 15% buffer, etc.
// Higher values create a smaller "safe zone" for course visibility
const MAP_BOUNDS_BUFFER_PERCENT = 0.1;

// Dynamically import the Map component with no SSR
const MapComponent = dynamic(
  () => import('./components/Map'),
  { ssr: false }
);

// UPDATED Default Filters - Omit optional fields instead of using undefined
const DEFAULT_FILTERS: CourseFilters = {
  walkabilityRating_overall_min: 0,
  clubTypes: ['Public', 'Semi-Private', 'Resort'], // Default to courses users can play without membership
  courseHoles: [18], // Default to full 18-hole courses
  sortBy: 'walkabilityRating_overall',
  sortOrder: 'desc',
  // searchQuery: undefined, // OMIT
  // state: undefined, // OMIT
  // mapBounds: undefined, // OMIT
  // simpleSearch: undefined, // OMIT
};

// Import Firebase Functions SDK

export default function MapPage(): JSX.Element {
  const { setIsOpen, setCurrentStep, setSteps } = useTour();
  const [isManualTourRestart, setIsManualTourRestart] = useState(false);
  const [tourKey, setTourKey] = useState(0); // Force re-render of tour
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
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Initialize showLocationPrompt state based on sessionStorage
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(() => {
    // sessionStorage is only available in the browser
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(LOCATION_PROMPT_SEEN_KEY) !== 'true'; // Use sessionStorage
    }
    // Default to true if not in browser (e.g., SSR, though this page is client-side)
    return true; 
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
  const handleViewChange = useCallback((view: 'map' | 'list' | 'filters' | 'key') => {
    if (view === 'filters') {
      setFilterSheetOpen(true);
    } else if (view === 'key') {
      setKeyModalOpen(true);
      // Don't change the underlying view when showing key modal
    } else {
      setActiveMobileView(view);
      setFilterSheetOpen(false);
      setKeyModalOpen(false); // Close key modal when switching views
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
    <MapTourProvider key={tourKey}>
      <div className="fixed inset-x-0 top-10 bottom-0 bg-white">
        {/* Tour Components - Desktop and Mobile - Only render if not manually restarting */}
        {!isManualTourRestart && <MapTour />}
        {!isManualTourRestart && <MapTourMobile />}
        
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
            boundsBufferPercent={MAP_BOUNDS_BUFFER_PERCENT}
          />

          {/* Render LocationPrompt overlay here for mobile */}
          {hasMounted && mapLoaded && !userLocation && showLocationPrompt && (
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
          activeView={keyModalOpen ? 'key' : (filterSheetOpen ? 'filters' : activeMobileView)}
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
          <div className="marker-key p-4 mt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Marker Key</h4>
            <div className="space-y-1.5">
              {/* 5-Star Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-5star.svg" alt="5-star marker" className="w-4 h-4" />
                <span className="text-xs">5-Star Course</span>
              </div>
              {/* 4-Star Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-4star.svg" alt="4-star marker" className="w-4 h-4" />
                <span className="text-xs">4-Star Course</span>
              </div>
              {/* 3-Star Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-3star.svg" alt="3-star marker" className="w-4 h-4" />
                <span className="text-xs">3-Star Course</span>
              </div>
              {/* 2-Star Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-2star.svg" alt="2-star marker" className="w-4 h-4" />
                <span className="text-xs">2-Star Course</span>
              </div>
              {/* 1-Star Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-1star.svg" alt="1-star marker" className="w-4 h-4" />
                <span className="text-xs">1-Star Course</span>
              </div>
              {/* Unrated Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-unrated.svg" alt="unrated marker" className="w-4 h-4" />
                <span className="text-xs">Unrated Course</span>
              </div>
              {/* Unwalkable Course */}
              <div className="flex items-center gap-2">
                <img src="/images/map/map-marker-unwalkable.svg" alt="unwalkable marker" className="w-4 h-4" />
                <span className="text-xs">Unwalkable Course</span>
              </div>
              {/* Selected Course Indicator */}
               <div className="flex items-center gap-2">
                 <div className="relative w-4 h-4 flex items-center justify-center">
                   <img src="/images/map/map-marker-5star.svg" alt="selected example" className="w-4 h-4" style={{filter: 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.8))'}} />
                 </div>
                 <span className="text-xs">Selected Course (red glow)</span>
               </div>
            </div>
            <hr className="my-4" />
            <div>
              <button
                onClick={async () => {
                  // Check if tour functions are available
                  if (!setSteps || !setCurrentStep || !setIsOpen) {
                    console.warn('Tour functions not available');
                    return;
                  }
                  
                  console.log('Restart tour clicked');
                  
                  // Set manual restart flag to prevent automatic tour components from interfering
                  setIsManualTourRestart(true);
                  
                  // Force complete re-render of tour provider
                  setTourKey(prev => prev + 1);
                  console.log('Forcing tour provider re-render');
                  
                  // Clear the tour completion flags
                  localStorage.removeItem('mapTourCompleted');
                  localStorage.removeItem('mapTourMobileCompleted');
                  console.log('Cleared localStorage flags');
                  
                  // Determine if mobile or desktop and set appropriate steps
                  const isMobile = window.innerWidth < 1024;
                  console.log('Device type:', isMobile ? 'mobile' : 'desktop');
                  
                  // Import the appropriate steps
                  const steps = isMobile 
                    ? (await import('@/components/ui/MapTourMobile')).MobileTourSteps
                    : (await import('@/components/ui/MapTour')).MapTourSteps;
                  
                  console.log('Loaded steps:', steps.length);
                  
                  // Debug: Check if selectors exist and filter out missing ones
                  const availableSteps = steps.filter((step, index) => {
                    const selector = typeof step.selector === 'string' ? step.selector : step.selector?.toString() || 'unknown';
                    const element = document.querySelector(selector);
                    const found = !!element;
                    console.log(`Step ${index + 1} selector "${selector}":`, found ? 'FOUND' : 'NOT FOUND');
                    return found;
                  });
                  
                  console.log(`Using ${availableSteps.length} out of ${steps.length} steps`);
                  
                  // Wait for tour provider to re-render, then start fresh
                  setTimeout(() => {
                    console.log('Setting up fresh tour');
                    
                    // Set the available steps and start from beginning
                    setSteps(availableSteps);
                    setCurrentStep(0);
                    
                    console.log('Set steps to', availableSteps.length, 'steps and current step to 0');
                    
                    // Small delay then open the tour
                    setTimeout(() => {
                      console.log('Opening fresh tour');
                      setIsOpen(true);
                      
                      // Reset the manual restart flag after tour starts
                      setTimeout(() => {
                        setIsManualTourRestart(false);
                      }, 1000);
                    }, 100);
                  }, 300);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 w-full"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Restart Tour</span>
              </button>
            </div>
          </div>
          {/* --- END: Marker Key Section --- */}
        </div>

        {/* Middle Column - Course Listings */}
        <div className="filter-course-list w-[300px] border-r">
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
            boundsBufferPercent={MAP_BOUNDS_BUFFER_PERCENT}
          />

          {/* Location Prompt for Desktop */}
          {hasMounted && mapLoaded && !userLocation && showLocationPrompt && (
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

      {/* Key Modal - Show on top of everything */}
      {keyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Marker Key</h3>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content - Same marker key as desktop */}
            <div className="p-4">
              <div className="space-y-3">
                {/* 5-Star Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-5star.svg" alt="5-star marker" className="w-5 h-5" />
                  <span className="text-sm">5-Star Course</span>
                </div>
                {/* 4-Star Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-4star.svg" alt="4-star marker" className="w-5 h-5" />
                  <span className="text-sm">4-Star Course</span>
                </div>
                {/* 3-Star Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-3star.svg" alt="3-star marker" className="w-5 h-5" />
                  <span className="text-sm">3-Star Course</span>
                </div>
                {/* 2-Star Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-2star.svg" alt="2-star marker" className="w-5 h-5" />
                  <span className="text-sm">2-Star Course</span>
                </div>
                {/* 1-Star Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-1star.svg" alt="1-star marker" className="w-5 h-5" />
                  <span className="text-sm">1-Star Course</span>
                </div>
                {/* Unrated Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-unrated.svg" alt="unrated marker" className="w-5 h-5" />
                  <span className="text-sm">Unrated Course</span>
                </div>
                {/* Unwalkable Course */}
                <div className="flex items-center gap-3">
                  <img src="/images/map/map-marker-unwalkable.svg" alt="unwalkable marker" className="w-5 h-5" />
                  <span className="text-sm">Unwalkable Course</span>
                </div>
                {/* Selected Course Indicator */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <img src="/images/map/map-marker-5star.svg" alt="selected example" className="w-5 h-5" style={{filter: 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.8))'}} />
                  </div>
                  <span className="text-sm">Selected Course (red glow)</span>
                </div>
              </div>
            </div>
          </div>
          {/* Tap outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setKeyModalOpen(false)}
          />
        </div>
      )}
      </div>
    </MapTourProvider>
  );
} 