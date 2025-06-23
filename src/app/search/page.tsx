'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';
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

export default function CourseSearchPageWrapper() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <CourseSearchPage />
    </Suspense>
  );
}

function CourseSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [includeUnwalkable, setIncludeUnwalkable] = useState(false);
  
  // Club type filter state
  const [clubTypes, setClubTypes] = useState<string[]>(['Public', 'Semi-Private', 'Resort']); // Default to user-accessible courses
  
  // Course holes filter state  
  const [courseHoles, setCourseHoles] = useState<number[]>([18]); // Default to 18-hole courses

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('walkabilityRating_overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [results, setResults] = useState<SearchResultCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Track if we just restored from URL and if we've already searched
  const restoredFromUrl = useRef(false);
  const hasRestoredAndSearched = useRef(false);

  // Restore state from URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = searchParams.get('q') || '';
    const minRatingParam = searchParams.get('minRating');
    const includeUnwalkableParam = searchParams.get('includeUnwalkable') === 'true';
    const clubTypesParam = searchParams.get('clubTypes');
    const courseHolesParam = searchParams.get('courseHoles');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');
    
    if (q || minRatingParam || includeUnwalkableParam || clubTypesParam || courseHolesParam || sortByParam || sortOrderParam) {
      setSearchTerm(q);
      setMinRating(minRatingParam ? parseInt(minRatingParam, 10) : 0);
      setIncludeUnwalkable(includeUnwalkableParam);
      
      if (clubTypesParam) {
        setClubTypes(clubTypesParam.split(','));
      }
      
      if (courseHolesParam) {
        setCourseHoles(courseHolesParam.split(',').map(h => parseInt(h, 10)));
      }

      if (sortByParam) {
        setSortBy(sortByParam);
      }

      if (sortOrderParam && (sortOrderParam === 'asc' || sortOrderParam === 'desc')) {
        setSortOrder(sortOrderParam);
      }
      
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
        includeUnwalkable ||
        clubTypes.length !== 3 || !clubTypes.includes('Public') || !clubTypes.includes('Semi-Private') || !clubTypes.includes('Resort') ||
        courseHoles.length !== 1 || !courseHoles.includes(18)
      )
    ) {
      performSearch();
      hasRestoredAndSearched.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, minRating, includeUnwalkable, clubTypes, courseHoles, sortBy, sortOrder]);

  const performSearch = useCallback(async () => {
    const query = searchTerm;
    const ratingFilter = Math.max(0, Math.min(5, minRating));

    const hasSearchTerm = query.trim().length >= 2;
    const hasRatingFilter = ratingFilter > 0;
    const hasUnwalkableFilter = includeUnwalkable;
    const hasClubTypeFilter = clubTypes.length !== 3 || !clubTypes.includes('Public') || !clubTypes.includes('Semi-Private') || !clubTypes.includes('Resort');
    const hasCourseHolesFilter = courseHoles.length !== 1 || !courseHoles.includes(18);

    if (!hasSearchTerm && !hasRatingFilter && !hasUnwalkableFilter && !hasClubTypeFilter && !hasCourseHolesFilter) {
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
    if (hasUnwalkableFilter) {
        params.append('includeUnwalkable', 'true');
    }
    if (hasClubTypeFilter) {
        params.append('clubTypes', clubTypes.join(','));
    }
    if (hasCourseHolesFilter) {
        params.append('courseHoles', courseHoles.join(','));
    }
    // Add sorting parameters
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
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
  }, [searchTerm, minRating, includeUnwalkable, clubTypes, courseHoles, sortBy, sortOrder]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRatingChange = (newRating: number) => {
    setMinRating(newRating);
  };

  const handleUnwalkableChange = (checked: boolean | 'indeterminate') => {
    setIncludeUnwalkable(!!checked);
  };

  const handleClubTypeChange = (clubType: string, checked: boolean) => {
    if (checked) {
      setClubTypes(prev => [...prev, clubType]);
    } else {
      setClubTypes(prev => prev.filter(type => type !== clubType));
    }
  };

  const handleCourseHolesChange = (holes: number | 'any', checked: boolean) => {
    if (holes === 'any') {
      setCourseHoles([]); // Empty array means "any"
    } else {
      if (checked) {
        setCourseHoles(prev => [...prev, holes as number]);
      } else {
        setCourseHoles(prev => prev.filter(h => h !== holes));
      }
    }
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
    setIncludeUnwalkable(false);
    setClubTypes(['Public', 'Semi-Private', 'Resort']);
    setCourseHoles([18]);
    setSortBy('walkabilityRating_overall');
    setSortOrder('desc');
  };

  // Handle sorting change
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortBy === 'course_name' ? 'asc' : 'desc');
  };

  // Check if any filters (excluding search term) are active
  const hasActiveFilters = useMemo(() => {
    return (
      minRating > 0 || 
      includeUnwalkable || 
      clubTypes.length !== 3 || !clubTypes.includes('Public') || !clubTypes.includes('Semi-Private') || !clubTypes.includes('Resort') ||
      courseHoles.length !== 1 || !courseHoles.includes(18) ||
      sortBy !== 'walkabilityRating_overall' ||
      sortOrder !== 'desc'
    );
  }, [minRating, includeUnwalkable, clubTypes, courseHoles, sortBy, sortOrder]);

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

        {/* Sort Control */}
        <div className="mb-4 flex items-center justify-between">
          <Label className="text-sm font-medium">Sort by:</Label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="walkabilityRating_overall">Rating</option>
              <option value="course_name">Name (A-Z)</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filters Section */}
        <div className="space-y-4 mb-4">
             {/* Walkability Filters */}
             <div className="space-y-3">
                {/* Include Un-walkable Courses Checkbox */}
                <div className="flex items-center space-x-2">
                   <Checkbox 
                     id="unwalkableFilter"
                     checked={includeUnwalkable}
                     onCheckedChange={handleUnwalkableChange}
                     className="shrink-0"
                   />
                   <Label htmlFor="unwalkableFilter" className="text-sm font-medium cursor-pointer">
                      Include un-walkable courses
                   </Label>
                </div>
                
                {/* Min Walkability Rating */}
                <div className="flex items-center space-x-3">
                   <Label className="text-sm font-medium shrink-0">Min Walkability</Label> 
                   <StarRating 
                     rating={minRating}
                     interactive={true}
                     onRatingChange={handleRatingChange} 
                     starClassName="w-6 h-6"
                   />
                </div>
             </div> 
             
             {/* Club Type Filters */}
             <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Club Type
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                  {[
                    { label: 'Public', value: 'Public' },
                    { label: 'Semi-Private', value: 'Semi-Private' },
                    { label: 'Resort', value: 'Resort' },
                    { label: 'Private', value: 'Private' },
                    { label: 'Military', value: 'Military' },
                    { label: 'University', value: 'University' },
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`clubType_${option.value}`}
                        checked={clubTypes.includes(option.value)}
                        onCheckedChange={(checked) => handleClubTypeChange(option.value, !!checked)}
                      />
                      <Label htmlFor={`clubType_${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
             </div>

             {/* Course Holes Filters */}
             <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  Course Holes
                </Label>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                  {[
                    { label: '9-hole', value: 9 },
                    { label: '18-hole', value: 18 },
                    { label: 'Any', value: 'any' },
                  ].map(option => (
                    <div key={option.label} className="flex items-center space-x-2">
                      <Checkbox
                        id={`courseHoles_${option.label}`}
                        checked={
                          option.value === 'any'
                            ? courseHoles.length === 0
                            : courseHoles.includes(option.value as number)
                        }
                        onCheckedChange={(checked) => handleCourseHolesChange(option.value as number | 'any', !!checked)}
                      />
                      <Label htmlFor={`courseHoles_${option.label}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
             </div>
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
            if (includeUnwalkable) {
              params.append('includeUnwalkable', 'true');
            }
            if (clubTypes.length !== 3 || !clubTypes.includes('Public') || !clubTypes.includes('Semi-Private') || !clubTypes.includes('Resort')) {
              params.append('clubTypes', clubTypes.join(','));
            }
            if (courseHoles.length !== 1 || !courseHoles.includes(18)) {
              params.append('courseHoles', courseHoles.join(','));
            }
            if (sortBy !== 'walkabilityRating_overall') {
              params.append('sortBy', sortBy);
            }
            if (sortOrder !== 'desc') {
              params.append('sortOrder', sortOrder);
            }
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