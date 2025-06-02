import React, { useState, useEffect } from 'react';

import { X } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { StarRating } from '@/components/ui/star-rating';
import { CourseFilters } from '@/types/course';

import { BottomSheet } from './BottomSheet';



interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CourseFilters;
  onFilterChange: (filters: CourseFilters) => void;
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}: FilterBottomSheetProps): JSX.Element {
  // Track local filter state
  const [localFilters, setLocalFilters] = useState<CourseFilters>(() => ({
    walkabilityRating_overall_min: filters.walkabilityRating_overall_min ?? 0,
    clubTypes: filters.clubTypes ?? ['Public', 'Semi-Private', 'Resort'], // Default to selective defaults
    courseHoles: filters.courseHoles ?? [18], // Default to 18-hole courses
    filter_isWalkable: filters.filter_isWalkable ?? false,
    ...(filters.searchQuery && { searchQuery: filters.searchQuery }),
    ...(filters.state && { state: filters.state }),
    ...(filters.mapBounds && { mapBounds: filters.mapBounds }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
    ...(filters.simpleSearch !== undefined && { simpleSearch: filters.simpleSearch }),
  }));

  // Update local filters: This sync logic needs to be more robust
  useEffect(() => {
    if (isOpen) {
      const newState: CourseFilters = {
        walkabilityRating_overall_min: filters.walkabilityRating_overall_min ?? 0,
        clubTypes: filters.clubTypes ?? ['Public', 'Semi-Private', 'Resort'],
        courseHoles: filters.courseHoles ?? [18],
        filter_isWalkable: filters.filter_isWalkable ?? false,
        ...(filters.searchQuery && { searchQuery: filters.searchQuery }),
        ...(filters.state && { state: filters.state }),
        ...(filters.mapBounds && { mapBounds: filters.mapBounds }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        ...(filters.simpleSearch !== undefined && { simpleSearch: filters.simpleSearch }),
      };
      setLocalFilters(newState);
    }
  }, [isOpen, filters]);

  const updateLocalFilters = (updates: Partial<CourseFilters>): void => {
    setLocalFilters(prev => ({ ...prev, ...updates }));
  };

  // Apply filters and close sheet
  const handleApply = (): void => {
    onFilterChange(localFilters);
    onClose();
  };

  // Calculate active filter count (matching mobile logic)
  const activeFilterCount = [
    localFilters.walkabilityRating_overall_min > 0,
    // Count clubTypes as active if different from default ['Public', 'Semi-Private', 'Resort']
    localFilters.clubTypes && (
      localFilters.clubTypes.length === 0 || // "All" selected
      (localFilters.clubTypes.length !== 3 || 
       !localFilters.clubTypes.includes('Public') || 
       !localFilters.clubTypes.includes('Semi-Private') || 
       !localFilters.clubTypes.includes('Resort'))
    ),
    // Count courseHoles as active if different from default [18]
    localFilters.courseHoles && (
      localFilters.courseHoles.length === 0 || // "Any" selected
      localFilters.courseHoles.length !== 1 || 
      !localFilters.courseHoles.includes(18)
    ),
    localFilters.filter_isWalkable === true, // Count if explicitly including un-walkable courses
  ].filter(Boolean).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[100]}
      initialSnap={0}
      title="Filter Courses"
    >
      <div className="flex flex-col h-full">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-2 pb-4 space-y-4">
            {/* Header with filter count and reset */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {activeFilterCount > 0 ? (
                  <span>{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</span>
                ) : (
                  <span>No filters applied</span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setLocalFilters({
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

            {/* Filter sections */}
            <div className="space-y-4">
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

              {/* After walkability rating, before club type */}
              <div className="pt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isWalkableFilter_bottomsheet"
                    checked={localFilters.filter_isWalkable === true}
                    onCheckedChange={checked => {
                      updateLocalFilters({ filter_isWalkable: !!checked });
                    }}
                  />
                  <label htmlFor="isWalkableFilter_bottomsheet" className="text-sm font-medium">
                    Include un-walkable courses
                  </label>
                </div>
              </div>

              {/* === NEW FILTER UI SECTION START === */} 
              {/* Replace old Course Types/Categories/Price sections */}
              <div className="space-y-3 border-t pt-4">
                
                {/* Walkability Rating Section - moved from bottom */}
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-1.5">Minimum Walkability Rating</label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Poor</span>
                    <span className="text-xs text-gray-500">Excellent</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={localFilters.walkabilityRating_overall_min}
                    onChange={e => updateLocalFilters({ walkabilityRating_overall_min: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center text-sm font-medium mt-1">
                    {localFilters.walkabilityRating_overall_min === 0 ? 'Any' : localFilters.walkabilityRating_overall_min.toFixed(1)}
                  </div>
                </div>
              </div>
              {/* === NEW FILTER UI SECTION END === */} 

              {/* Keep other filter inputs like Search Query, State, etc. below */}
              {/* Search Query */} 
              {/* ... existing Input ... */}
              {/* State */} 
              {/* ... existing Input ... */}
              {/* Map Bounds */} 
              {/* ... existing Input ... */}
              {/* Sort By */} 
              {/* ... existing Input ... */}
              {/* Sort Order */} 
              {/* ... existing Input ... */}
              {/* Simple Search */} 
              {/* ... existing Checkbox ... */}
              
            </div>

            <div className="pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Club Type</label>
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
                      id={`clubType_${option.value}_bottomsheet`}
                      checked={
                        // If clubTypes is empty, show all as checked (= "all")
                        // If clubTypes has values, check only those included
                        (localFilters.clubTypes?.length === 0) || (localFilters.clubTypes?.includes(option.value) ?? false)
                      }
                      onCheckedChange={checked => {
                        const allOptions = ['Public', 'Semi-Private', 'Resort', 'Private', 'Military', 'University'];
                        const prev = localFilters.clubTypes || [];
                        
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
                        
                        updateLocalFilters({ clubTypes: newClubTypes });
                        
                        if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'ClubTypeChanged', {
                            event_category: 'MapFilters',
                            event_label: newClubTypes.length === 0 ? 'All' : newClubTypes.join(','),
                            value: newClubTypes.length === 0 ? 'All' : newClubTypes.length,
                          });
                        }
                      }}
                    />
                    <label htmlFor={`clubType_${option.value}_bottomsheet`} className="text-sm">{option.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Course Holes</label>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: '9', value: 9 },
                  { label: '18', value: 18 },
                  { label: 'Any', value: 'any' },
                ].map(option => (
                  <div key={option.label} className="flex items-center space-x-2">
                    <Checkbox
                      id={`courseHoles_${option.label}_bottomsheet`}
                      checked={
                        option.value === 'any'
                          ? (localFilters.courseHoles?.length === 0) // Any is checked only when array is empty
                          : (localFilters.courseHoles?.includes(option.value as number) ?? false) // 9 or 18 checked if included in array
                      }
                      onCheckedChange={checked => {
                        let newHoles: number[] = localFilters.courseHoles ? [...localFilters.courseHoles] : [];
                        if (option.value === 'any') {
                          newHoles = []; // Set to empty array for "Any"
                        } else {
                          if (checked) {
                            newHoles = Array.from(new Set([...newHoles, option.value as number]));
                          } else {
                            newHoles = newHoles.filter(h => h !== option.value);
                          }
                        }
                        updateLocalFilters({ courseHoles: newHoles });
                        if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'CourseHolesChanged', {
                            event_category: 'MapFilters',
                            event_label: newHoles.length === 0 ? 'Any' : newHoles.join(','),
                            value: newHoles.length === 0 ? 'Any' : newHoles.length,
                          });
                        }
                      }}
                    />
                    <label htmlFor={`courseHoles_${option.label}_bottomsheet`} className="text-sm">{option.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-white px-4 pt-2 pb-4">
          {/* REMOVED matchingCoursesCount display */}
          {/* <div className="text-sm text-gray-600 text-center mb-2"> ... </div> */}
          
          <button
            onClick={handleApply}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2" // Added mt-2 for spacing
          >
            Apply Filters
          </button>
        </div>
      </div>
    </BottomSheet>
  );
} 
