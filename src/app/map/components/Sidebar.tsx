'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';

import { MapPin, ArrowLeft, X} from 'lucide-react';
import Link from 'next/link';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { GolfCourse, CourseFilters, MapBounds } from '@/types/course';

interface SidebarProps {
  courses: GolfCourse[];
  filters: CourseFilters;
  onFilterChange: (filters: CourseFilters) => void;
  onCourseSelect: (course: GolfCourse) => void;
  selectedCourseId: string | null;
  totalInBounds?: number;
  filtersOnly?: boolean;
  onClose?: () => void;
  selectedCourseIndex?: number | null;
  isZoomedOut?: boolean;
  currentBounds: MapBounds | null;
  currentZoom: number | null;
}

/**
 * Animated Course Count Component
 * Displays the course count with typewriter effect and highlight animation
 */
function AnimatedCourseCount({ count }: { count: number }): JSX.Element {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevCountRef = useRef<number | null>(null);
  
  const fullText = `Showing ${count} within the map bounds`;
  
  useEffect(() => {
    // Initial load - show immediately
    if (!isInitialized) {
      setDisplayedText(fullText);
      setIsInitialized(true);
      prevCountRef.current = count;
      return;
    }
    
    // Only animate if count actually changed
    if (prevCountRef.current !== null && prevCountRef.current !== count) {
      console.log('Starting animation:', prevCountRef.current, '->', count);
      
      // Reset states
      setDisplayedText('');
      setIsTyping(true);
      setShowHighlight(true);
      
      // Start typing animation
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        charIndex++;
        setDisplayedText(fullText.substring(0, charIndex));
        
        if (charIndex >= fullText.length) {
          clearInterval(typingInterval);
          setIsTyping(false);
          
          // Remove highlight after delay
          setTimeout(() => {
            setShowHighlight(false);
          }, 1200);
        }
      }, 60); // Slower for more visible effect
      
      prevCountRef.current = count;
      
      // Cleanup function
      return () => {
        clearInterval(typingInterval);
      };
    }
  }, [count, fullText, isInitialized]);
  
  return (
    <p 
      className={cn(
        "text-sm transition-all duration-500",
        showHighlight 
          ? "text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200" 
          : "text-gray-600"
      )}
    >
      {displayedText}
      {isTyping && <span className="text-blue-500 animate-pulse ml-1">|</span>}
    </p>
  );
}

export default function Sidebar({
  courses,
  filters,
  onFilterChange,
  onCourseSelect,
  selectedCourseId,
  totalInBounds: _totalInBounds,
  filtersOnly = false,
  onClose,
  selectedCourseIndex,
  isZoomedOut,
  currentBounds,
  currentZoom
}: SidebarProps) {
  // Remove unused destructured variables from useTour
  const updateFilters = (updates: Partial<CourseFilters>) => {
    onFilterChange({ ...filters, ...updates });
  };

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (typeof selectedCourseIndex === 'number' && selectedCourseIndex >= 0 && virtuosoRef.current) {
      console.debug(`Scrolling list to index: ${selectedCourseIndex}`);
      virtuosoRef.current.scrollToIndex({
        index: selectedCourseIndex,
        align: 'center',
        behavior: 'smooth'
      });
    }
  }, [selectedCourseIndex]);

  if (filtersOnly) {
    // Calculate active filter count (matching mobile logic)
    const activeFilterCount = [
        filters.walkabilityRating_overall_min > 0,
        // Count clubTypes as active if different from default ['Public', 'Semi-Private', 'Resort']
        filters.clubTypes && (
          filters.clubTypes.length === 0 || // "All" selected
          (filters.clubTypes.length !== 3 || 
           !filters.clubTypes.includes('Public') || 
           !filters.clubTypes.includes('Semi-Private') || 
           !filters.clubTypes.includes('Resort'))
        ),
        // Count courseHoles as active if different from default [18]
        filters.courseHoles && (
          filters.courseHoles.length === 0 || // "Any" selected
          filters.courseHoles.length !== 1 || 
          !filters.courseHoles.includes(18)
        ),
        filters.filter_isWalkable === true, // Count if explicitly including un-walkable courses
    ].filter(Boolean).length;

    // Use activeFilterCount to determine if any filters are active
    const hasActiveFilters = activeFilterCount > 0;

    return (
      <div className="flex flex-col">
        <div className="lg:hidden sticky top-0 bg-white border-b z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              {onClose && (
                <button onClick={onClose} className="mr-3">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="font-semibold">Filter Courses</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => onFilterChange({
                  walkabilityRating_overall_min: 0,
                  clubTypes: ['Public', 'Semi-Private', 'Resort'],
                  courseHoles: [18],
                  filter_isWalkable: false,
                })}
                className="text-sm text-blue-600"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:block p-3 border-b mb-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {activeFilterCount > 0 ? (
                <span>{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</span>
              ) : (
                <span>No filters applied</span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => onFilterChange({
                  walkabilityRating_overall_min: 0,
                  clubTypes: ['Public', 'Semi-Private', 'Resort'],
                  courseHoles: [18],
                  filter_isWalkable: false,
                })}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Reset all
              </button>
            )}
          </div>
        </div>
        
        <div className={cn(
          "filter-controls overflow-y-auto",
          "lg:px-3 lg:space-y-3",
          "px-4 space-y-6 lg:space-y-3"
        )}>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">
                Minimum Walkability Rating
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <StarRating
                rating={filters.walkabilityRating_overall_min}
                interactive={true}
                onRatingChange={(rating) => updateFilters({ walkabilityRating_overall_min: rating })}
                starClassName="w-6 h-6"
              />
              {filters.walkabilityRating_overall_min > 0 && (
                <button
                  onClick={() => updateFilters({ walkabilityRating_overall_min: 0 })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {filters.walkabilityRating_overall_min > 0 ? 
                `Courses rated ${filters.walkabilityRating_overall_min} stars or higher` : 
                'Select minimum rating'
              }
            </p>
          </div>

          <div className="pt-3 lg:pt-0">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWalkableFilter"
                checked={filters.filter_isWalkable === true}
                onCheckedChange={checked => {
                  updateFilters({ filter_isWalkable: !!checked });
                }}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="isWalkableFilter" className="text-xs font-medium">
                Include un-walkable courses
              </label>
            </div>
          </div>

          <div className="pt-3 lg:pt-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">Club Type</label>
            </div>
            <div className="space-y-1.5">
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
                    checked={
                      // If clubTypes is empty, show all as checked (= "all")
                      // If clubTypes has values, check only those included
                      (filters.clubTypes?.length === 0) || (filters.clubTypes?.includes(option.value) ?? false)
                    }
                    onCheckedChange={checked => {
                      const allOptions = ['Public', 'Semi-Private', 'Resort', 'Private', 'Military', 'University'];
                      const prev = filters.clubTypes || [];
                      
                      let newClubTypes: string[];
                      if (prev.length === 0) {
                        // Currently showing "all", if unchecking one item, show all others
                        newClubTypes = checked ? allOptions : allOptions.filter(v => v !== option.value);
                      } else {
                        // Normal add/remove logic
                        newClubTypes = checked
                          ? [...prev, option.value]
                          : prev.filter(v => v !== option.value);
                      }
                      
                      // If all options are selected, use empty array (= "all")
                      if (newClubTypes.length === allOptions.length) {
                        newClubTypes = [];
                      }
                      
                      updateFilters({ clubTypes: newClubTypes });
                      
                      if (typeof window !== 'undefined' && window.gtag) {
                        window.gtag('event', 'ClubTypeChanged', {
                          event_category: 'MapFilters',
                          event_label: newClubTypes.length === 0 ? 'All' : newClubTypes.join(','),
                          value: newClubTypes.length === 0 ? 'All' : newClubTypes.length,
                        });
                      }
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={`clubType_${option.value}`} className="text-xs">{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 lg:pt-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">Number of Holes</label>
            </div>
            <div className="space-y-1.5">
              {[
                { label: '9', value: 9 },
                { label: '18+', value: 18 },
                { label: 'Any', value: 'any' },
              ].map(option => (
                <div key={option.label} className="flex items-center space-x-2">
                  <Checkbox
                    id={`courseHoles_${option.label}`}
                    checked={
                      option.value === 'any'
                        ? (filters.courseHoles?.length === 0) // Any is checked only when array is empty
                        : (filters.courseHoles?.includes(option.value as number) ?? false) // 9 or 18 checked if included in array
                    }
                    onCheckedChange={checked => {
                      let newHoles: number[] = filters.courseHoles ? [...filters.courseHoles] : [];
                      if (option.value === 'any') {
                        newHoles = []; // Set to empty array for "Any"
                      } else {
                        if (checked) {
                          newHoles = Array.from(new Set([...newHoles, option.value as number]));
                        } else {
                          newHoles = newHoles.filter(h => h !== option.value);
                        }
                      }
                      updateFilters({ courseHoles: newHoles });
                      if (typeof window !== 'undefined' && window.gtag) {
                        window.gtag('event', 'CourseHolesChanged', {
                          event_category: 'MapFilters',
                          event_label: newHoles.length === 0 ? 'Any' : newHoles.join(','),
                          value: newHoles.length === 0 ? 'Any' : newHoles.length,
                        });
                      }
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={`courseHoles_${option.label}`} className="text-xs">{option.label}</label>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white h-full flex flex-col", filtersOnly ? "w-full" : "w-full lg:w-[300px]")}>
      {/* Header */}
      {!filtersOnly && (
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <div className="mb-3">
            {/* Conditional Header Text */}
            {isZoomedOut ? (
              <p className="text-sm text-gray-600">Zoom in or search to find courses</p>
            ) : (
              <AnimatedCourseCount count={courses.length} />
            )}
          </div>
          <Input 
            type="text"
            placeholder="Type to filter results by name or city"
            value={filters.searchQuery || ''}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="w-full"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {courses.length === 0 ? (
          <p className="text-center text-gray-500 p-4">No courses found matching your criteria.</p>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            data={courses}
            itemContent={(_index, course) => (
              <CourseCard
                key={course.id}
                course={course}
                isSelected={selectedCourseId === course.id}
                onSelect={onCourseSelect}
                currentBounds={currentBounds}
                currentZoom={currentZoom}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, isSelected, onSelect, currentBounds, currentZoom }: {
  course: GolfCourse;
  isSelected: boolean;
  onSelect: (course: GolfCourse) => void;
  currentBounds: MapBounds | null;
  currentZoom: number | null;
}): JSX.Element {
  const {
    id,
    club_name,
    courseName,
    course_holes,
    location_city,
    location_state,
    walkabilityRating_overall
  } = course;

  const handleClick = useCallback(() => {
    onSelect(course);
  }, [course, onSelect]);

  // Get current map bounds from window.location.search if available
  const searchParams = new URLSearchParams(window.location.search);
  const boundsParam = searchParams.get('bounds');
  const _bounds = boundsParam ? JSON.parse(decodeURIComponent(boundsParam)) : null;

  // Helper to format the hole count string
  const holeText = course_holes ? `(${course_holes} holes)` : '';

  // Build the course details link with bounds and zoom
  let detailsHref = `/courses/${id}`;
  if (currentBounds && typeof currentZoom === 'number') {
    detailsHref += `?from=map&bounds=${encodeURIComponent(JSON.stringify(currentBounds))}&zoom=${currentZoom}`;
  } else if (currentBounds) {
    detailsHref += `?from=map&bounds=${encodeURIComponent(JSON.stringify(currentBounds))}`;
  }

  return (
    <div
      className={cn(
        'p-4 border-b transition-all cursor-pointer',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      )}
      onClick={handleClick}
    >
      {/* Line 1: Course Name and Hole Count */}
      <h3 className="font-semibold text-sm mb-1">
        {/* Wrap course name */}
        <span>{courseName}</span>
        {/* Wrap hole text and apply smaller style */}
        {holeText && (
          <span className="ml-1.5 text-xs font-normal text-gray-500">
            {holeText}
          </span>
        )}
      </h3>

      {/* Line 2: Club Name (De-emphasized) */}
      {club_name && (
        <p className="text-xs text-gray-600 mb-1.5">
          {club_name}
        </p>
      )}

      {/* Line 3: Location */}
      <div className="flex items-center text-xs text-gray-600 mb-1.5">
        <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> {/* Added flex-shrink-0 */}
        <span>{location_city}, {location_state}</span> {/* Wrapped text in span */}
      </div>

      {/* Line 4: Walkability Rating - Consistent Structure */}
      <div className="flex items-center text-xs mb-2">
        <StarRating
          rating={walkabilityRating_overall || 0}
          // Disable built-in decimal display as we handle it manually
          showDecimal={false} 
          className="text-xs"
          starClassName="w-3.5 h-3.5"
        />
        {/* Consistent structure: "Walkability: (Rating)" or "Walkability: Not rated" */}
        <span className="ml-1">
          Walkability:
          {(walkabilityRating_overall && walkabilityRating_overall > 0) ? (
            <span className="ml-1 font-medium text-gray-800">
              {`(${walkabilityRating_overall.toFixed(1)})`}
            </span>
          ) : (
            <span className="ml-1 text-gray-500">Not rated</span>
          )}
        </span>
      </div>

      {/* Line 5: Details Link */}
      <Link
        href={detailsHref}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        More course details...
      </Link>
    </div>
  );
}