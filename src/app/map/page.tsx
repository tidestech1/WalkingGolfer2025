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
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number | null>(null);
  
  const [filteredCourses, setFilteredCourses] = useState<GolfCourse[]>([]);
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

  const loadCourses = useCallback(async (bounds?: MapBounds) => {
    if (!isFirebaseAvailable() || !db) {
      console.error('Firebase not initialized or DB is null');
      setError('Unable to connect to the course database');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coursesRef = collection(db, 'courses');
      let q;

      if (bounds) {
        q = query(
          coursesRef,
          where('location_coordinates_latitude', '>=', bounds.south),
          where('location_coordinates_latitude', '<=', bounds.north),
          orderBy('location_coordinates_latitude')
        );
      } else {
        q = query(
          coursesRef,
          orderBy('walkabilityRating_overall', 'desc'),
          limit(COURSES_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      const loadedCourses = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GolfCourse))
        .filter((course: GolfCourse) =>
          !bounds || (
            course.location_coordinates_longitude >= bounds.west &&
            course.location_coordinates_longitude <= bounds.east
          )
        );

      console.log(`Loaded ${loadedCourses.length} courses`);
      setCourses(loadedCourses);
      setFilteredCourses(loadedCourses);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Error loading courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedLoadCourses = useMemo(
    () => debounce((bounds: MapBounds) => {
      loadCourses(bounds);
    }, 500),
    [loadCourses]
  );

  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
    debouncedLoadCourses(bounds);
  }, [debouncedLoadCourses]);

  useEffect(() => {
    let result = courses;

    if (filters.searchQuery) {
      const lowerSearchTerm = filters.searchQuery.toLowerCase();
      result = result.filter((course: GolfCourse) =>
        course.courseName.toLowerCase().includes(lowerSearchTerm) ||
        course.location_city.toLowerCase().includes(lowerSearchTerm) ||
        course.location_state.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (mapBounds) {
      result = result.filter((course: GolfCourse) => {
        const { location_coordinates_latitude: lat, location_coordinates_longitude: lng } = course;
        return (
          lat >= mapBounds.south &&
          lat <= mapBounds.north &&
          lng >= mapBounds.west &&
          lng <= mapBounds.east
        );
      });
    }

    result = result.filter((course: GolfCourse) => {
      if (filters.walkabilityRating_overall_min && (course.walkabilityRating_overall || 0) < filters.walkabilityRating_overall_min) {
        return false;
      }
      if (filters.course_types && filters.course_types.length > 0 && !filters.course_types.includes(course.course_type)) {
        return false;
      }
      if (filters.course_categories && filters.course_categories.length > 0 && !filters.course_categories.includes(course.course_category)) {
        return false;
      }
      if (filters.facilities_pushCarts && !course.facilities_pushCarts) {
        return false;
      }
      return true;
    });

    setFilteredCourses(result);
    setSelectedCourseIndex(null);
    if (selectedCourseId && !result.some(c => c.id === selectedCourseId)) {
      setSelectedCourseId(null);
    }
  }, [courses, filters, mapBounds, selectedCourseId]);

  // handleCourseSelect now uses component state mapRef
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

  useEffect(() => {
    loadCourses();
    return () => {
      debouncedLoadCourses.cancel();
    };
  }, [loadCourses, debouncedLoadCourses]);

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
              totalCourses={courses.length}
               // The sidebar doesn't strictly need an onClose for this mobile pattern
               // We control visibility via the parent's activeMobileView state
              onClose={() => {}} // Provide a no-op or remove if not required by Sidebar props
            />
          </div>
        </div>

        {/* Filter Bottom Sheet */}
        <FilterBottomSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          allCourses={filteredCourses} // Pass filtered courses, or all courses if filters should apply to the full set
        />

        {/* Bottom Navigation */}
        <BottomNav
          // Pass the active view state and the handler
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
            selectedCourseId={selectedCourseId || null}
            totalCourses={courses.length}
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
            totalCourses={courses.length}
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