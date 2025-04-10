'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { db, isFirebaseAvailable } from '@/lib/firebase/firebase';
import { cn } from '@/lib/utils';
import { GolfCourse, CourseFilters, MapBounds } from '@/types/course';

import { BottomNav } from './components/BottomNav';
import { FilterBottomSheet } from './components/FilterBottomSheet';
import Sidebar from './components/Sidebar';
import { LocationPrompt } from './components/LocationPrompt';

// Constants
const COURSES_PER_PAGE = 20;
const LOCATION_PROMPT_SEEN_KEY = 'walkingGolfer_hasSeenLocationPrompt';
const DEFAULT_ZOOM = 8;

// Dynamically import the Map component with no SSR
const MapComponent = dynamic(
  () => import('./components/Map'),
  { ssr: false }
);

const DEFAULT_FILTERS: CourseFilters = {
  course_types: [],
  course_categories: [],
  facilities_pushCarts: false,
  pricing_fee_min: 0,
  pricing_fee_max: 0,
  walkabilityRating_overall_min: 0,
  sortBy: 'walkabilityRating_overall',
  sortOrder: 'desc',
  searchQuery: ''
};

export default function MapPage(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number | null>(null);
  
  const [filteredCourses, setFilteredCourses] = useState<GolfCourse[]>([]);
  const [coursesInBoundsCount, setCoursesInBoundsCount] = useState<number>(0);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  const loadCourses = useCallback(async (bounds?: MapBounds, currentFilters?: CourseFilters) => {
    if (!isFirebaseAvailable() || !db) {
      console.error('Firebase not initialized or DB is null');
      setError('Unable to connect to the course database');
      return;
    }

    // Don't fetch if bounds are missing (unless we add filter-only logic later)
    if (!bounds) {
      console.debug("loadCourses skipped: no bounds provided.")
      // Optionally clear courses if bounds become null?
      // setFilteredCourses([]); 
      return; 
    }

    setLoading(true);
    setError(null);

    try {
      const coursesRef = collection(db, 'courses');
      let q;

      // === Query based on Bounds (Filter logic to be added later) ===
      // Basic bounds query
      q = query(
        coursesRef,
        where('location_coordinates_latitude', '>=', bounds.south),
        where('location_coordinates_latitude', '<=', bounds.north),
        orderBy('location_coordinates_latitude')
        // Add orderBy for longitude if needed for more complex queries
        // Potentially add limit here if needed for performance (e.g., limit(100))
      );
      // TODO: Add filter integration (where clauses for rating, type, category, facilities etc.)

      const snapshot = await getDocs(q);
      let fetchedCourses = snapshot.docs // Rename to fetchedCourses
        .map(doc => ({ id: doc.id, ...doc.data() } as GolfCourse))
        // Secondary filter for longitude needed because Firestore can only range filter on one field
        .filter((course: GolfCourse) =>
            course.location_coordinates_longitude >= bounds.west &&
            course.location_coordinates_longitude <= bounds.east
        );

      // Store count *before* client-side filters
      const countBeforeFiltering = fetchedCourses.length;
      setCoursesInBoundsCount(countBeforeFiltering);
      console.log(`Found ${countBeforeFiltering} courses within bounds before client filters.`);

      // === Apply Client-Side Filtering ===
      if (currentFilters) {
        console.log("Applying client-side filters:", currentFilters);
        fetchedCourses = fetchedCourses.filter((course: GolfCourse) => {
          // Walkability
          if (currentFilters.walkabilityRating_overall_min && 
              (course.walkabilityRating_overall || 0) < currentFilters.walkabilityRating_overall_min) {
            return false;
          }
          // Course Types (using 'in' requires separate queries or client-side filter)
          if (currentFilters.course_types && 
              currentFilters.course_types.length > 0 && 
              !currentFilters.course_types.includes(course.course_type)) {
            return false;
          }
          // Course Categories
          if (currentFilters.course_categories && 
              currentFilters.course_categories.length > 0 && 
              !currentFilters.course_categories.includes(course.course_category)) {
            return false;
          }
          // Facilities
          if (currentFilters.facilities_pushCarts && 
              !course.facilities_pushCarts) {
            return false;
          }
          // Add other filters (price, search query) here if needed
          if (currentFilters.searchQuery) { // Example: Client-side search filter
             const lowerSearch = currentFilters.searchQuery.toLowerCase();
             const nameMatch = course.courseName?.toLowerCase().includes(lowerSearch);
             const cityMatch = course.location_city?.toLowerCase().includes(lowerSearch);
             // Add state match etc.
             if (!nameMatch && !cityMatch) return false;
          }

          return true; // Course passes all filters
        });
        console.log(`Courses after client-side filtering: ${fetchedCourses.length}`);
      } else {
        console.log("No client-side filters to apply.");
      }
      // === End Client-Side Filtering ===

      console.log(`Setting filteredCourses with ${fetchedCourses.length} courses.`);
      // Set filteredCourses with the final list
      setFilteredCourses(fetchedCourses);

    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Error loading courses. Please try again.');
      setFilteredCourses([]); // Clear on error
      setCoursesInBoundsCount(0); // Clear count on error
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedLoadCourses = useMemo(
    () => debounce((bounds: MapBounds, currentFilters?: CourseFilters) => {
      loadCourses(bounds, currentFilters);
    }, 500),
    [loadCourses]
  );

  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
    // Trigger fetch with new bounds and current filters
    debouncedLoadCourses(bounds, filters); 
  }, [debouncedLoadCourses, filters]);

  useEffect(() => {
    if (mapBounds) {
        console.debug("mapBounds changed, triggering loadCourses:", mapBounds);
        // Directly call loadCourses or use debounced version?
        // Using debounced version seems safer if bounds change rapidly initially
        debouncedLoadCourses(mapBounds, filters);
    } else {
        // Optional: Clear courses if bounds become null (e.g., initial state)
        // setFilteredCourses([]);
    }
  // Watch mapBounds and filters
  }, [mapBounds, filters, debouncedLoadCourses]);

  const handleCourseSelect = useCallback((course: GolfCourse) => {
    setSelectedCourseId(course.id);
    const index = filteredCourses.findIndex(c => c.id === course.id);
    setSelectedCourseIndex(index !== -1 ? index : null);
    setShowLocationPrompt(false); 
  }, [filteredCourses]);

  const handleFilterChange = useCallback((newFilters: Partial<CourseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
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

  // handlePlaceSelect now uses component state mapRef
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
    setShowLocationPrompt(false);
  }, []); // No dependency on mapRef needed

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
            onMapLoad={(map: google.maps.Map) => {
              mapRef.current = map; 
              setMapLoaded(true);
            }}
            onPlaceSelect={handlePlaceSelect}
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
        </div>

        {/* List View */}
        <div className={cn(
          'fixed inset-x-0 top-10 bottom-24 bg-white transition-transform duration-300 transform',
           // Show list when activeMobileView is 'list'
           activeMobileView === 'list' ? 'translate-x-0' : '-translate-x-full'
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
            />
          </div>
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          allCourses={filteredCourses}
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
        {/* Left Column - Filters */}
        <div className="w-60 border-r">
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
          />
        </div>

        {/* Middle Column - Course Listings */}
        <div className="w-[360px] border-r">
          <Sidebar
            courses={filteredCourses}
            filters={filters}
            onFilterChange={handleFilterChange}
            onCourseSelect={handleCourseSelect}
            selectedCourseId={selectedCourseId || null}
            totalInBounds={coursesInBoundsCount}
            selectedCourseIndex={selectedCourseIndex}
          />
        </div>

        {/* Right Column - Map */}
        <div className="flex-1 lg:pb-10 relative">
          <MapComponent
            courses={filteredCourses}
            selectedCourseId={selectedCourseId || null}
            onCourseSelect={handleCourseSelect}
            onBoundsChanged={handleBoundsChanged}
            loading={loading}
            onMapLoad={(map: google.maps.Map) => {
              mapRef.current = map; 
              setMapLoaded(true);
            }}
            onPlaceSelect={handlePlaceSelect}
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
        </div>
      </div>
    </div>
  );
} 