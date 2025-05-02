'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';

import { MapPin, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { GolfCourse, CourseFilters } from '@/types/course';

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
}

export default function Sidebar({
  courses,
  filters,
  onFilterChange,
  onCourseSelect,
  selectedCourseId,
  totalInBounds,
  filtersOnly = false,
  onClose,
  selectedCourseIndex,
  isZoomedOut
}: SidebarProps) {
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

  const [showAllFacilities, setShowAllFacilities] = useState(false);

  if (filtersOnly) {
    // Calculate active filter count (matching mobile logic)
    const activeFilterCount = [
        filters.walkabilityRating_overall_min > 0,
        filters.filter_isWalkable === true,
        filters.filter_drivingRange === true,
        filters.filter_golfCarts === true,
        filters.filter_pushCarts === true,
        filters.filter_restaurant === true,
        filters.filter_proShop === true,
        filters.filter_puttingGreen === true,
        filters.filter_chippingGreen === true,
        filters.filter_practiceBunker === true,
        filters.filter_caddies === true,
        filters.filter_clubRental === true,
    ].filter(Boolean).length;

    // Use activeFilterCount to determine if any filters are active
    const hasActiveFilters = activeFilterCount > 0;

    return (
      <div className="h-full flex flex-col">
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
          "flex-1 overflow-y-auto",
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

          <div className="pb-3 border-b lg:border-b-0 lg:pb-0">
            <div className="flex items-center space-x-2">
                  <Checkbox
                id="isWalkableFilter"
                checked={filters.filter_isWalkable === true} 
                    onCheckedChange={(checked) => {
                  updateFilters({ filter_isWalkable: !!checked }); 
                    }}
                    className="h-3.5 w-3.5"
                  />
              <label htmlFor="isWalkableFilter" className="text-xs font-medium">
                Walkable Courses Only
                  </label>
            </div>
          </div>

          <div className="pt-3 lg:pt-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">Facilities</label>
            </div>
            
            <div className="space-y-1.5">
              <FacilityCheckbox label="Driving Range" filterKey="filter_drivingRange" filters={filters} updateFilters={updateFilters} />
              <FacilityCheckbox label="Golf Cart Rental" filterKey="filter_golfCarts" filters={filters} updateFilters={updateFilters} />
              <FacilityCheckbox label="Push Cart Rental" filterKey="filter_pushCarts" filters={filters} updateFilters={updateFilters} />
              <FacilityCheckbox label="Restaurant" filterKey="filter_restaurant" filters={filters} updateFilters={updateFilters} />

              {showAllFacilities && (
                <>
                  <FacilityCheckbox label="Pro Shop" filterKey="filter_proShop" filters={filters} updateFilters={updateFilters} />
                  <FacilityCheckbox label="Putting Green" filterKey="filter_puttingGreen" filters={filters} updateFilters={updateFilters} />
                  <FacilityCheckbox label="Chipping Green" filterKey="filter_chippingGreen" filters={filters} updateFilters={updateFilters} />
                  <FacilityCheckbox label="Practice Bunker" filterKey="filter_practiceBunker" filters={filters} updateFilters={updateFilters} />
                  <FacilityCheckbox label="Caddies" filterKey="filter_caddies" filters={filters} updateFilters={updateFilters} />
                  <FacilityCheckbox label="Golf Club Rental" filterKey="filter_clubRental" filters={filters} updateFilters={updateFilters} />
                </>
              )}
              
                <button
                onClick={() => setShowAllFacilities(!showAllFacilities)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                {showAllFacilities ? 'Show Less' : 'Show More'}
                </button>
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
              <p className="text-sm text-gray-600">
                Showing {courses.length} within the map bounds
              </p>
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
              />
            )}
          />
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, isSelected, onSelect }: {
  course: GolfCourse;
  isSelected: boolean;
  onSelect: (course: GolfCourse) => void;
}): JSX.Element {
  // Destructure necessary fields, including club_name and course_holes
  const {
    id,
    club_name,
    courseName,
    course_holes, // Added field
    location_city,
    location_state,
    walkabilityRating_overall
  } = course;

  const handleClick = useCallback(() => {
    onSelect(course);
  }, [course, onSelect]);

  // Helper to format the hole count string
  const holeText = course_holes ? `(${course_holes} holes)` : '';

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
          Part of {club_name}
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
        href={`/courses/${id}`} // Use id directly
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        More course details...
      </Link>
    </div>
  );
}

// Helper component for Facility Checkboxes to reduce repetition
const FacilityCheckbox: React.FC<{
  label: string;
  filterKey: keyof Pick<CourseFilters, 
    'filter_drivingRange' | 'filter_golfCarts' | 'filter_pushCarts' | 'filter_restaurant' | 
    'filter_proShop' | 'filter_puttingGreen' | 'filter_chippingGreen' | 'filter_practiceBunker' | 
    'filter_caddies' | 'filter_clubRental'
  >;
  filters: CourseFilters;
  updateFilters: (updates: Partial<CourseFilters>) => void;
}> = ({ label, filterKey, filters, updateFilters }) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={filterKey}
        checked={filters[filterKey] === true}
        onCheckedChange={(checked) => {
          updateFilters({ [filterKey]: !!checked });
        }}
        className="h-3.5 w-3.5"
      />
      <label htmlFor={filterKey} className="text-xs">
        {label}
      </label>
    </div>
  );
};