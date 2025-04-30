'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  const performSearch = useCallback(async () => {
    const query = searchTerm;
    const ratingFilter = Math.max(0, Math.min(5, minRating));
    const walkableFilter = walkableOnly;

    const hasSearchTerm = query.trim().length >= 2;
    const hasRatingFilter = ratingFilter > 0;
    const hasWalkableFilter = walkableFilter;

    if (!hasSearchTerm && !hasRatingFilter && !hasWalkableFilter) {
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
  }, [searchTerm, minRating, walkableOnly]);

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
      <h1 className="text-3xl font-bold mb-6">Search Golf Courses</h1>
      
      <div className="mb-8 p-4 border rounded-lg bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 mb-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="courseSearchInput" className="text-sm font-medium">Search Term</Label>
            <Input 
              id="courseSearchInput"
              type="search"
              placeholder="Name, city, state... (min 2 chars)"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label className="text-sm font-medium">Min Walkability</Label>
            <StarRating 
              rating={minRating}
              interactive={true}
              onRatingChange={handleRatingChange} 
              className="mt-1"
              starClassName="w-6 h-6"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label className="text-sm font-medium invisible">Walkable Filter</Label>
            <div className="flex items-center space-x-2 h-[40px]">
              <Checkbox 
                id="walkableFilter"
                checked={walkableOnly}
                onCheckedChange={handleWalkableChange}
              />
              <Label htmlFor="walkableFilter" className="text-sm font-medium cursor-pointer pb-1">
                  Walkable Only
              </Label>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-2 block">
              Facilities & Amenities 
              <span className="text-xs text-red-600 font-normal ml-1">
                (NB: Filters below don't function yet!)
              </span>
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
              {showAllFacilities ? 'Show Less' : 'Show More Amenities'}
            </Button>
        </div>

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
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-1/4" />
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

      {!isLoading && !error && hasSearched && results.length === 0 && (
        <p>No courses found matching your search criteria.</p>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((course) => (
            <Link 
              href={`/courses/${course.id}`} 
              key={course.id} 
              className={cn(
                "block rounded-lg border bg-card text-card-foreground shadow-sm",
                "transition-all duration-150 ease-in-out",
                "hover:shadow-md hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              passHref
            >
              <div className="flex flex-col h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg mb-1">{course.course_name} Course</CardTitle>
                  <p className="text-sm text-muted-foreground mb-1">{course.club_name}</p>
                  <p className="text-sm text-muted-foreground">{course.location_city}, {course.location_state}</p>
                </CardHeader>
                <CardContent className="pt-0 flex-grow flex flex-col justify-end">
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t">
                    <span className="text-sm font-medium">Walkability:</span>
                    {course.walkabilityRating_overall && course.walkabilityRating_overall > 0 ? (
                      <>
                        <StarRating rating={course.walkabilityRating_overall} />
                        <span className="text-sm text-muted-foreground">({course.walkabilityRating_overall.toFixed(1)} / 5)</span>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Not yet rated. 
                        <Button 
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/courses/${course.id}/review`);
                          }}
                          className="text-blue-600 hover:underline ml-1 h-auto p-0"
                        >
                          Rate now
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 