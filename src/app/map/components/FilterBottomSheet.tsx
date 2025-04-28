import React, { useState, useEffect } from 'react';

import { X } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { StarRating } from '@/components/ui/star-rating';
import { CourseFilters, GolfCourse } from '@/types/course';

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
    // Initialize with valid defaults, respecting incoming props if available
    walkabilityRating_overall_min: filters.walkabilityRating_overall_min ?? 0,
    filter_isWalkable: filters.filter_isWalkable ?? false, 
    filter_drivingRange: filters.filter_drivingRange ?? false,
    filter_golfCarts: filters.filter_golfCarts ?? false,
    filter_pushCarts: filters.filter_pushCarts ?? false,
    filter_restaurant: filters.filter_restaurant ?? false,
    filter_proShop: filters.filter_proShop ?? false,
    filter_puttingGreen: filters.filter_puttingGreen ?? false,
    filter_chippingGreen: filters.filter_chippingGreen ?? false,
    filter_practiceBunker: filters.filter_practiceBunker ?? false,
    filter_caddies: filters.filter_caddies ?? false,
    filter_clubRental: filters.filter_clubRental ?? false,
    // Handle optional fields carefully
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
      // Create a new state object based on incoming filters
      const newState: CourseFilters = {
        walkabilityRating_overall_min: filters.walkabilityRating_overall_min ?? 0,
        filter_isWalkable: filters.filter_isWalkable ?? false,
        filter_drivingRange: filters.filter_drivingRange ?? false,
        filter_golfCarts: filters.filter_golfCarts ?? false,
        filter_pushCarts: filters.filter_pushCarts ?? false,
        filter_restaurant: filters.filter_restaurant ?? false,
        filter_proShop: filters.filter_proShop ?? false,
        filter_puttingGreen: filters.filter_puttingGreen ?? false,
        filter_chippingGreen: filters.filter_chippingGreen ?? false,
        filter_practiceBunker: filters.filter_practiceBunker ?? false,
        filter_caddies: filters.filter_caddies ?? false,
        filter_clubRental: filters.filter_clubRental ?? false,
        // Only include optional fields if they exist in the incoming filters
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

  // Check if any NEW filters are active
  const hasActiveFilters = 
    localFilters.walkabilityRating_overall_min > 0 ||
    localFilters.filter_isWalkable === true ||
    localFilters.filter_drivingRange === true ||
    localFilters.filter_golfCarts === true ||
    localFilters.filter_pushCarts === true ||
    localFilters.filter_restaurant === true ||
    localFilters.filter_proShop === true ||
    localFilters.filter_puttingGreen === true ||
    localFilters.filter_chippingGreen === true ||
    localFilters.filter_practiceBunker === true ||
    localFilters.filter_caddies === true ||
    localFilters.filter_clubRental === true ||
    !!localFilters.searchQuery ||
    !!localFilters.state ||
    !!localFilters.mapBounds ||
    !!localFilters.sortBy ||
    !!localFilters.sortOrder ||
    localFilters.simpleSearch === true;

  // Count active NEW filters
  const activeFilterCount = [
    localFilters.walkabilityRating_overall_min > 0,
    localFilters.filter_isWalkable === true,
    localFilters.filter_drivingRange === true,
    localFilters.filter_golfCarts === true,
    localFilters.filter_pushCarts === true,
    localFilters.filter_restaurant === true,
    localFilters.filter_proShop === true,
    localFilters.filter_puttingGreen === true,
    localFilters.filter_chippingGreen === true,
    localFilters.filter_practiceBunker === true,
    localFilters.filter_caddies === true,
    localFilters.filter_clubRental === true,
    !!localFilters.searchQuery,
    !!localFilters.state,
    !!localFilters.mapBounds,
    !!localFilters.sortBy,
    !!localFilters.sortOrder,
    localFilters.simpleSearch === true,
  ].filter(Boolean).length;

  // ADD state for facility filters visibility
  const [showAllFacilities, setShowAllFacilities] = useState(false);

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
              {hasActiveFilters && (
                <button
                  onClick={() => setLocalFilters({
                    // Reset: Only specify fields being reset to defaults
                    // Omit optional fields entirely when resetting
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
                    // searchQuery: undefined, // OMIT
                    // state: undefined, // OMIT
                    // mapBounds: undefined, // OMIT
                    // sortBy: undefined, // OMIT
                    // sortOrder: undefined, // OMIT
                    // simpleSearch: undefined, // OMIT
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

              {/* === NEW FILTER UI SECTION START === */} 
              {/* Replace old Course Types/Categories/Price sections */}
              <div className="space-y-3 border-t pt-4">
                
                {/* Walkable Checkbox */} 
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter_isWalkable_bottomsheet"
                    checked={localFilters.filter_isWalkable ?? false}
                    onCheckedChange={(checked) => {
                      updateLocalFilters({ filter_isWalkable: !!checked }); 
                    }}
                  />
                  <label htmlFor="filter_isWalkable_bottomsheet" className="text-sm font-medium">
                    Walkable Courses Only
                  </label>
                </div>
                
                {/* Facilities Section */} 
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-1.5">Facilities</label>
                  <div className="space-y-1.5">
                    {/* Always Shown Facilities */}
                    <FacilityCheckbox label="Driving Range" filterKey="filter_drivingRange" filters={localFilters} updateFilters={updateLocalFilters} />
                    <FacilityCheckbox label="Golf Cart Rental" filterKey="filter_golfCarts" filters={localFilters} updateFilters={updateLocalFilters} />
                    <FacilityCheckbox label="Push Cart Rental" filterKey="filter_pushCarts" filters={localFilters} updateFilters={updateLocalFilters} />
                    <FacilityCheckbox label="Restaurant" filterKey="filter_restaurant" filters={localFilters} updateFilters={updateLocalFilters} />

                    {/* Conditionally Render Hidden Facilities */} 
                    {showAllFacilities && (
                      <>
                        <FacilityCheckbox label="Pro Shop" filterKey="filter_proShop" filters={localFilters} updateFilters={updateLocalFilters} />
                        <FacilityCheckbox label="Putting Green" filterKey="filter_puttingGreen" filters={localFilters} updateFilters={updateLocalFilters} />
                        <FacilityCheckbox label="Chipping Green" filterKey="filter_chippingGreen" filters={localFilters} updateFilters={updateLocalFilters} />
                        <FacilityCheckbox label="Practice Bunker" filterKey="filter_practiceBunker" filters={localFilters} updateFilters={updateLocalFilters} />
                        <FacilityCheckbox label="Caddies" filterKey="filter_caddies" filters={localFilters} updateFilters={updateLocalFilters} />
                        <FacilityCheckbox label="Golf Club Rental" filterKey="filter_clubRental" filters={localFilters} updateFilters={updateLocalFilters} />
                      </>
                    )}
                    
                    {/* Toggle Button */}
                    <button 
                      onClick={() => setShowAllFacilities(!showAllFacilities)}
                      className="text-xs text-blue-600 hover:text-blue-800 pt-1"
                    >
                      {showAllFacilities ? 'Show Less' : 'Show More'}
                    </button>
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

// Copied Helper component for Facility Checkboxes
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
  // Use unique IDs for bottom sheet context
  const id = `${filterKey}_bottomsheet`; 
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        // Provide default for checked state
        checked={filters[filterKey] === true} 
        onCheckedChange={(checked) => {
          // Ensure boolean type for update
          updateFilters({ [filterKey]: !!checked }); 
        }}
      />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
};
