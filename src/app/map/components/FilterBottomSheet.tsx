import React, { useState, useEffect, useMemo } from 'react';

import { X } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { StarRating } from '@/components/ui/star-rating';
import { CourseFilters, CourseType, CourseCategory, GolfCourse } from '@/types/course';

import { BottomSheet } from './BottomSheet';



interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CourseFilters;
  onFilterChange: (filters: CourseFilters) => void;
  allCourses: GolfCourse[];
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  allCourses
}: FilterBottomSheetProps): JSX.Element {
  // Track local filter state
  const [localFilters, setLocalFilters] = useState<CourseFilters>({
    walkabilityRating_overall_min: filters.walkabilityRating_overall_min,
    course_types: filters.course_types || [],
    course_categories: filters.course_categories || [],
    facilities_pushCarts: filters.facilities_pushCarts,
    pricing_fee_min: filters.pricing_fee_min,
    pricing_fee_max: filters.pricing_fee_max
  });

  // Calculate matching courses based on current local filters
  const matchingCoursesCount = useMemo(() => {
    return allCourses.filter(course => {
      // Walkability Rating
      if (localFilters.walkabilityRating_overall_min > 0 && 
          (!course.walkabilityRating_overall || 
           course.walkabilityRating_overall < localFilters.walkabilityRating_overall_min)) {
        return false;
      }

      // Course Types
      if (localFilters.course_types.length > 0 && 
          !localFilters.course_types.includes(course.course_type)) {
        return false;
      }

      // Course Categories
      if (localFilters.course_categories.length > 0 && 
          !localFilters.course_categories.includes(course.course_category)) {
        return false;
      }

      // Facilities - Push Carts
      if (localFilters.facilities_pushCarts && !course.facilities_pushCarts) {
        return false;
      }

      // Price Range
      if (localFilters.pricing_fee_min > 0 && typeof course.pricing_fee === 'number' && course.pricing_fee < localFilters.pricing_fee_min) {
        return false;
      }
      if (localFilters.pricing_fee_max > 0 && typeof course.pricing_fee === 'number' && course.pricing_fee > localFilters.pricing_fee_max) {
        return false;
      }

      return true;
    }).length;
  }, [localFilters, allCourses]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({
      walkabilityRating_overall_min: filters.walkabilityRating_overall_min,
      course_types: filters.course_types || [],
      course_categories: filters.course_categories || [],
      facilities_pushCarts: filters.facilities_pushCarts,
      pricing_fee_min: filters.pricing_fee_min,
      pricing_fee_max: filters.pricing_fee_max
    });
  }, [filters]);

  const updateLocalFilters = (updates: Partial<CourseFilters>): void => {
    setLocalFilters(prev => ({ ...prev, ...updates }));
  };

  // Apply filters and close sheet
  const handleApply = (): void => {
    onFilterChange(localFilters);
    onClose();
  };

  // Check if any filters are active
  const hasActiveFilters = 
    localFilters.walkabilityRating_overall_min > 0 ||
    (localFilters.course_types && localFilters.course_types.length > 0) ||
    (localFilters.course_categories && localFilters.course_categories.length > 0) ||
    localFilters.facilities_pushCarts ||
    localFilters.pricing_fee_min > 0 ||
    localFilters.pricing_fee_max > 0;

  // Count active filters
  const activeFilterCount = [
    localFilters.walkabilityRating_overall_min > 0,
    (localFilters.course_types && localFilters.course_types.length > 0),
    (localFilters.course_categories && localFilters.course_categories.length > 0),
    localFilters.facilities_pushCarts,
    localFilters.pricing_fee_min > 0 || localFilters.pricing_fee_max > 0
  ].filter(Boolean).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[100]}
      initialSnap={0}
      title="Filter Courses"
    >
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)'}}>
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-2 pb-2 space-y-6">
            {/* Header with filter count and reset */}
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
                  onClick={() => setLocalFilters({
                    walkabilityRating_overall_min: 0,
                    course_types: [],
                    course_categories: [],
                    facilities_pushCarts: false,
                    pricing_fee_min: 0,
                    pricing_fee_max: 0
                  })}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Reset all
                </button>
              )}
            </div>

            {/* Filter sections */}
            <div className="space-y-6">
              {/* Walkability Rating */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Minimum Walkability</label>
                  {localFilters.walkabilityRating_overall_min > 0 && (
                    <button
                      onClick={() => updateLocalFilters({ walkabilityRating_overall_min: 0 })}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Slider
                      value={[localFilters.walkabilityRating_overall_min]}
                      onValueChange={(values) => {
                        const value = values[0];
                        if (typeof value === 'number') {
                          updateLocalFilters({ walkabilityRating_overall_min: value });
                        }
                      }}
                      min={0}
                      max={5}
                      step={1}
                      className="py-2"
                    />
                  </div>
                  <div className="w-24 flex justify-end">
                    <StarRating
                      rating={localFilters.walkabilityRating_overall_min}
                      showDecimal={false}
                      className="text-sm"
                      starClassName="w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              {/* Course Types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Course Types</label>
                  {localFilters.course_types.length > 0 && (
                    <button
                      onClick={() => updateLocalFilters({ course_types: [] })}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(CourseType).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={localFilters.course_types?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = localFilters.course_types || [];
                          const updatedTypes = checked
                              ? [...currentTypes, type]
                              : currentTypes.filter(t => t !== type);
                          updateLocalFilters({ course_types: updatedTypes });
                        }}
                      />
                      <label htmlFor={`type-${type}`} className="text-sm">
                        {type === CourseType.JG ? 'Just Golf' :
                         type === CourseType.RS ? 'Resort' :
                         type === CourseType.RD ? 'Real Estate Development' :
                         type === CourseType.RR ? 'Resort & Real Estate' :
                         type === CourseType.MI ? 'Military' :
                         type === CourseType.UN ? 'University' :
                         type === CourseType.PK ? 'Park' : type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Course Categories</label>
                  {localFilters.course_categories.length > 0 && (
                    <button
                      onClick={() => updateLocalFilters({ course_categories: [] })}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(CourseCategory).map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={localFilters.course_categories?.includes(category) || false}
                        onCheckedChange={(checked) => {
                          const currentCategories = localFilters.course_categories || [];
                          const updatedCategories = checked
                              ? [...currentCategories, category]
                              : currentCategories.filter(c => c !== category);
                          updateLocalFilters({ course_categories: updatedCategories });
                        }}
                      />
                      <label htmlFor={`category-${category}`} className="text-sm">
                        {category === CourseCategory.PR ? 'Private' :
                         category === CourseCategory.PL ? 'Private Limited' :
                         category === CourseCategory.DF ? 'Daily Fee' :
                         category === CourseCategory.MU ? 'Municipal' : category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Facilities</label>
                  {localFilters.facilities_pushCarts && (
                    <button
                      onClick={() => updateLocalFilters({ facilities_pushCarts: false })}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pushCarts"
                    checked={localFilters.facilities_pushCarts || false}
                    onCheckedChange={(checked) => {
                      updateLocalFilters({ 
                        facilities_pushCarts: checked === true
                      });
                    }}
                  />
                  <label htmlFor="pushCarts" className="text-sm">
                    Push Carts Available
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Price Range</label>
                  {(localFilters.pricing_fee_min > 0 || localFilters.pricing_fee_max > 0) && (
                    <button
                      onClick={() => updateLocalFilters({ 
                        pricing_fee_min: 0,
                        pricing_fee_max: 0
                      })}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full p-2 border rounded text-sm"
                      value={localFilters.pricing_fee_min || ''}
                      min="0"
                      onChange={(e) => updateLocalFilters({
                        pricing_fee_min: e.target.value ? Number(e.target.value) : 0
                      })}
                    />
                  </div>
                  <span className="text-sm text-gray-400">to</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full p-2 border rounded text-sm"
                      value={localFilters.pricing_fee_max || ''}
                      min="0"
                      onChange={(e) => updateLocalFilters({
                        pricing_fee_max: e.target.value ? Number(e.target.value) : 0
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom section */}
        <div className="flex-shrink-0 border-t bg-white px-4 pt-2 pb-24">
          <div className="text-sm text-gray-600 text-center mb-2">
            {matchingCoursesCount} course{matchingCoursesCount !== 1 ? 's' : ''} match filters
          </div>
          
          <button
            onClick={handleApply}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </BottomSheet>
  );
} 