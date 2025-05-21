'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from '@/components/ui/star-rating';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from "@/lib/utils";
import { CourseFilters } from "@/types/course";

// Define the shape of the course data expected from the API
interface SearchResultCourse {
  id: string;
  club_name: string;
  course_name: string;
  location_city: string;
  location_state: string;
  walkabilityRating_overall: number | null;
  course_holes: number;
}

// Define keys for facility filters
type FacilityFilterKey = keyof Pick<CourseFilters, 
  'filter_drivingRange' | 'filter_golfCarts' | 'filter_pushCarts' | 'filter_restaurant' | 
  'filter_proShop' | 'filter_puttingGreen' | 'filter_chippingGreen' | 'filter_practiceBunker' | 
  'filter_caddies' | 'filter_clubRental'
>;

// Helper component for Facility Checkboxes (similar to map sidebar)
const FacilityCheckbox: React.FC<{
  label: string;
  filterKey: FacilityFilterKey;
  filters: Record<FacilityFilterKey, boolean>;
  onChange: (key: FacilityFilterKey, checked: boolean) => void;
}> = ({ label, filterKey, filters, onChange }) => {
  const id = `facility-filter-${filterKey}`;
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={filters[filterKey]}
        onCheckedChange={(checked) => onChange(filterKey, !!checked)}
      />
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
        {label}
      </label>
    </div>
  );
};

export default function CourseSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [walkableOnly, setWalkableOnly] = useState(false);
  // --- Facility Filter State ---
  const [facilityFilters, setFacilityFilters] = useState<Record<FacilityFilterKey, boolean>>({
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
  });
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  // --- End Facility Filter State ---
  const [results, setResults] = useState<SearchResultCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Track if we just restored from URL and if we've already searched
  const restoredFromUrl = useRef(false);
  const hasRestoredAndSearched = useRef(false);

  // Restore state from URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = searchParams.get('q') || '';
    const minRating = searchParams.get('minRating');
    const isWalkable = searchParams.get('isWalkable') === 'true';
    const facilityKeys = [
      'filter_drivingRange', 'filter_golfCarts', 'filter_pushCarts', 'filter_restaurant',
      'filter_proShop', 'filter_puttingGreen', 'filter_chippingGreen', 'filter_practiceBunker',
      'filter_caddies', 'filter_clubRental'
    ];
    const facilities: Record<string, boolean> = {};
    facilityKeys.forEach(key => {
      facilities[key] = searchParams.get(key) === 'true';
    });
    if (
      q || minRating || isWalkable || facilityKeys.some(key => searchParams.get(key))
    ) {
      setSearchTerm(q);
      setMinRating(minRating ? parseInt(minRating, 10) : 0);
      setWalkableOnly(isWalkable);
      setFacilityFilters(prev => ({ ...prev, ...facilities }));
      setShowFilters(
        !!(minRating || isWalkable || facilityKeys.some(key => searchParams.get(key)))
      );
      restoredFromUrl.current = true;
      hasRestoredAndSearched.current = false;
    }
  }, []);

  // Trigger search after restoring from URL, only once, and only if params are present
  useEffect(() => {
    if (
      restoredFromUrl.current &&
      !hasRestoredAndSearched.current &&
      (
        searchTerm.trim().length >= 2 ||
        minRating > 0 ||
        walkableOnly ||
        Object.values(facilityFilters).some(Boolean)
      )
    ) {
      performSearch();
      hasRestoredAndSearched.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, minRating, walkableOnly, facilityFilters]);

  const performSearch = useCallback(async () => {
    const query = searchTerm;
    const ratingFilter = Math.max(0, Math.min(5, minRating));
    const walkableFilter = walkableOnly;

    const activeFacilityFilters = Object.entries(facilityFilters)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key as FacilityFilterKey);

    const hasSearchTerm = query.trim().length >= 2;
    const hasRatingFilter = ratingFilter > 0;
    const hasWalkableFilter = walkableFilter;
    const hasFacilityFilters = activeFacilityFilters.length > 0;

    if (!hasSearchTerm && !hasRatingFilter && !hasWalkableFilter && !hasFacilityFilters) {
        setResults([]);
        setIsLoading(false);
        setError('Please enter a search term or select a filter.');
        setHasSearched(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    const params = new URLSearchParams();
    if (hasSearchTerm) {
        params.append('q', query.trim());
    }
    if (hasRatingFilter) {
        params.append('minRating', ratingFilter.toString());
    }
    if (hasWalkableFilter) {
        params.append('isWalkable', 'true');
    }
    activeFacilityFilters.forEach(filterKey => {
        params.append(filterKey, 'true');
    });
    
    const queryString = params.toString();

    try {
      console.log(`Performing search with query: /api/courses/search?${queryString}`);
      const response = await fetch(`/api/courses/search?${queryString}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.courses || []);
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during search.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, minRating, walkableOnly, facilityFilters]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRatingChange = (newRating: number) => {
    setMinRating(newRating);
  };

  const handleWalkableChange = (checked: boolean | 'indeterminate') => {
    setWalkableOnly(!!checked);
  };

  const handleFacilityChange = (key: FacilityFilterKey, checked: boolean) => {
    setFacilityFilters(prev => ({ ...prev, [key]: checked }));
  };

  const handleSearchClick = () => {
    performSearch();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      performSearch();
    }
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setMinRating(0);
    setWalkableOnly(false);
    setFacilityFilters({
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
    });
  };

  // Check if any filters (excluding search term) are active
  const hasActiveFilters = useMemo(() => {
    return (
      minRating > 0 || 
      walkableOnly || 
      Object.values(facilityFilters).some(value => value === true)
    );
  }, [minRating, walkableOnly, facilityFilters]);

  // Define which facilities are always visible vs hidden
  const alwaysVisibleFacilities: FacilityFilterKey[] = [
    'filter_drivingRange',
    'filter_golfCarts',
    'filter_pushCarts',
    'filter_restaurant',
  ];
  const hiddenFacilities: FacilityFilterKey[] = [
    'filter_proShop',
    'filter_puttingGreen',
    'filter_chippingGreen',
    'filter_practiceBunker',
    'filter_caddies',
    'filter_clubRental',
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4">Search Golf Courses</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
         Enter a course name, city, or state, or use the filters to find walking-friendly courses. Click 'Search Courses' to begin.
      </p>
      
      <div className="mb-8 p-4 border rounded-lg bg-card">
        <div className="mb-4">
          <Label htmlFor="courseSearchInput" className="text-sm font-medium">Search Term</Label>
          <Input 
            id="courseSearchInput"
            type="search"
            placeholder="Name, city, state... (min 2 chars)"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="mt-1"
          />
        </div>

        <Button 
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="mb-4 w-full sm:w-auto"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

        {/* Collapsible Filters Section */}
        {showFilters && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
             {/* Walkability Filters - Stacked Vertically */}
             <div className="mb-4 space-y-3"> {/* Container with spacing */}
                {/* Line 1: Walkable Only Checkbox */}
                <div className="flex items-center space-x-2">
                   <Checkbox 
                     id="walkableFilter"
                     checked={walkableOnly}
                     onCheckedChange={handleWalkableChange}
                     className="shrink-0"
                   />
                   <Label htmlFor="walkableFilter" className="text-sm font-medium cursor-pointer">
                      Walkable Only
                   </Label>
                </div>
                
                {/* Line 2: Min Walkability Label + Stars */}
                <div className="flex items-center space-x-3"> {/* Use space-x for label/stars gap */} 
                   <Label className="text-sm font-medium shrink-0">Min Walkability</Label> 
                   <StarRating 
                     rating={minRating}
                     interactive={true}
                     onRatingChange={handleRatingChange} 
                     starClassName="w-6 h-6"
                   />
                </div>
             </div> 
             
             {/* Row 2: Facility Filters */}
             <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Facilities
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                  {alwaysVisibleFacilities.map(key => (
                     <FacilityCheckbox 
                       key={key} 
                       label={key.replace('filter_', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                       filterKey={key} 
                       filters={facilityFilters} 
                       onChange={handleFacilityChange} 
                     />
                  ))}

                  {showAllFacilities && hiddenFacilities.map(key => (
                     <FacilityCheckbox 
                       key={key} 
                       label={key.replace('filter_', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                       filterKey={key} 
                       filters={facilityFilters} 
                       onChange={handleFacilityChange} 
                     />
                  ))}
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowAllFacilities(!showAllFacilities)} 
                  className="text-blue-600 hover:text-blue-800 px-0 mt-2 h-auto"
                >
                  {showAllFacilities ? 'Show Less' : 'Show More Facilities'}
                </Button>
             </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-between items-center border-t pt-4">
          <div>
             {hasActiveFilters && (
               <Button 
                 variant="ghost"
                 onClick={handleResetFilters}
                 disabled={isLoading}
                 className="text-sm text-muted-foreground"
               >
                 Reset Filters
               </Button>
             )}
          </div>
          <Button 
             onClick={handleSearchClick} 
             disabled={isLoading}
             className="bg-[#0A3357] text-white hover:bg-[#082945] rounded-lg transition duration-150 ease-in-out"
          >
            {isLoading ? 'Searching...' : 'Search Courses'}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={`loading-${i}`}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-1/4 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && !hasSearched && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
               <Card key={`placeholder-${i}`}>
                 <CardHeader>
                   <Skeleton className="h-6 w-[85%]" />
                   <Skeleton className="h-4 w-[60%] mt-1" />
                   <Skeleton className="h-4 w-[40%] mt-1" />
                 </CardHeader>
                 <CardContent>
                   <Skeleton className="h-5 w-[30%] mt-3" />
                 </CardContent>
               </Card>
            ))}
         </div>
      )}

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <p>No courses found matching your search criteria.</p>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((course) => {
            // Build query string for preserving search state
            const params = new URLSearchParams();
            params.append('from', 'search');
            if (searchTerm.trim().length >= 2) {
              params.append('q', searchTerm.trim());
            }
            if (minRating > 0) {
              params.append('minRating', minRating.toString());
            }
            if (walkableOnly) {
              params.append('isWalkable', 'true');
            }
            Object.entries(facilityFilters).forEach(([key, value]) => {
              if (value) params.append(key, 'true');
            });
            const queryString = params.toString();
            const courseHref = `/courses/${course.id}${queryString ? `?${queryString}` : ''}`;
            return (
              <Link
                href={courseHref}
                key={course.id}
                className={cn(
                  "block rounded-lg border bg-card text-card-foreground shadow-sm",
                  "transition-colors duration-150 ease-in-out",
                  "hover:bg-gray-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                passHref
              >
                <div className="p-4 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-0.5">
                      {course.course_name}
                      {course.course_holes && (
                        <span className="text-sm text-muted-foreground font-normal ml-1.5">
                          ({course.course_holes} holes)
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">Part of {course.club_name}</p>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                      {course.location_city}, {course.location_state}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t"> 
                      {course.walkabilityRating_overall && course.walkabilityRating_overall > 0 ? (
                        <>
                          <StarRating 
                            rating={course.walkabilityRating_overall} 
                            starClassName="w-5 h-5"
                          />
                          <span className="text-sm text-muted-foreground">
                            Walkability: ({course.walkabilityRating_overall.toFixed(1)})
                          </span>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Course not yet rated.
                        </div>
                      )}
                    </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 