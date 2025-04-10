'use client';

import React, { useCallback } from 'react';

import { MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Virtuoso } from 'react-virtuoso';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { GolfCourse, CourseFilters, CourseType, CourseCategory } from '@/types/course';

interface SidebarProps {
  courses: GolfCourse[];
  filters: CourseFilters;
  onFilterChange: (filters: CourseFilters) => void;
  onCourseSelect: (course: GolfCourse) => void;
  selectedCourseId: string | null;
  totalCourses: number;
  filtersOnly?: boolean;
  listOnly?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  courses,
  filters,
  onFilterChange,
  onCourseSelect,
  selectedCourseId,
  totalCourses,
  filtersOnly = false,
  listOnly = false,
  onClose
}: SidebarProps) {
  const updateFilters = (updates: Partial<CourseFilters>) => {
    onFilterChange({ ...filters, ...updates });
  };

  // If filtersOnly is true, only render the filters
  if (filtersOnly) {
    // Check if any filters are active
    const hasActiveFilters = 
      filters.walkabilityRating_overall_min > 0 ||
      filters.course_types.length > 0 ||
      filters.course_categories.length > 0 ||
      filters.facilities_pushCarts ||
      filters.pricing_fee_min > 0 ||
      filters.pricing_fee_max > 0;

    return (
      <div className="h-full flex flex-col">
        {/* Mobile Header */}
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
                  course_types: [],
                  course_categories: [],
                  facilities_pushCarts: false,
                  pricing_fee_min: 0,
                  pricing_fee_max: 0
                })}
                className="text-sm text-blue-600"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block p-3">
          {hasActiveFilters && (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">Active filters</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex-1 overflow-y-auto",
          "lg:px-3 lg:space-y-3", // Desktop styling
          "px-4 space-y-6 lg:space-y-3" // Mobile styling
        )}>
          {/* Walkability Rating */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">
                Minimum Walkability Rating
              </label>
              {filters.walkabilityRating_overall_min > 0 && (
                <button
                  onClick={() => updateFilters({ walkabilityRating_overall_min: 0 })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <StarRating
              rating={filters.walkabilityRating_overall_min}
              interactive={true}
              onRatingChange={(rating) => updateFilters({ walkabilityRating_overall_min: rating })}
              label={filters.walkabilityRating_overall_min ? 
                `Show courses rated ${filters.walkabilityRating_overall_min} stars or higher` : 
                'Select minimum rating'
              }
              className="mt-1"
              starClassName="w-6 h-6"
            />
          </div>

          {/* Course Types */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">Course Types</label>
              {filters.course_types.length > 0 && (
                <button
                  onClick={() => updateFilters({ course_types: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {Object.values(CourseType).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={filters.course_types?.includes(type) || false}
                    onCheckedChange={(checked) => {
                      const currentTypes = filters.course_types || [];
                      updateFilters({ 
                        course_types: checked 
                          ? [...currentTypes, type]
                          : currentTypes.filter(t => t !== type)
                      });
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={type} className="text-xs">
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">Course Categories</label>
              {filters.course_categories.length > 0 && (
                <button
                  onClick={() => updateFilters({ course_categories: [] })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {Object.values(CourseCategory).map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={filters.course_categories?.includes(category) || false}
                    onCheckedChange={(checked) => {
                      const currentCategories = filters.course_categories || [];
                      updateFilters({ 
                        course_categories: checked 
                          ? [...currentCategories, category]
                          : currentCategories.filter(c => c !== category)
                      });
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={category} className="text-xs">
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">Facilities</label>
              {filters.facilities_pushCarts && (
                <button
                  onClick={() => updateFilters({ facilities_pushCarts: false })}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushCarts"
                  checked={filters.facilities_pushCarts || false}
                  onCheckedChange={(checked) => {
                    updateFilters({ 
                      facilities_pushCarts: checked === true
                    });
                  }}
                  className="h-3.5 w-3.5"
                />
                <label htmlFor="pushCarts" className="text-xs">
                  Push Carts Available
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // If listOnly is true, only render the course listings (Mobile List View)
  if (listOnly) {
    return (
      <div className="h-full flex flex-col">
        {/* Mobile List Header */}
        <div className="sticky top-0 bg-white border-b z-10 p-4">
          <div className="flex items-center mb-3">
            {onClose && (
              <button onClick={onClose} className="mr-3 p-1 -ml-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="flex-1 font-semibold text-center">{totalCourses} Courses Found</h2>
            {/* Add some spacing or element to balance the header if needed */}
            <div className="w-5"></div> 
          </div>
          {/* Search Input for Mobile List */}
          <Input 
            type="text"
            placeholder="Search courses by name or city"
            value={filters.searchQuery || ''}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="w-full"
          />
        </div>

        {/* Course List for Mobile */}
        <div className="flex-1 overflow-y-auto">
          {courses.length === 0 ? (
            <p className="text-center text-gray-500 p-4">No courses found matching your criteria.</p>
          ) : (
            <Virtuoso
              style={{ height: '100%' }}
              data={courses}
              itemContent={(index, course) => (
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

  // Default view (Desktop with list and potentially filters if not separated)
  return (
    <div className="h-full flex flex-col">
      {/* Desktop List Header and Search */}
      <div className="p-4 border-b">
         <h2 className="text-lg font-semibold mb-2">Course List <span className='text-sm text-gray-500'>({totalCourses} found)</span></h2>
         {/* Search Input for Desktop */}
         <Input 
           type="text"
           placeholder="Search courses by name or city"
           value={filters.searchQuery || ''}
           onChange={(e) => updateFilters({ searchQuery: e.target.value })}
           className="w-full"
         />
      </div>

      {/* Course List for Desktop */}
      <div className="flex-1 overflow-y-auto">
        {courses.length === 0 ? (
          <p className="text-center text-gray-500 p-4">No courses found matching your criteria.</p>
        ) : (
          <Virtuoso
            style={{ height: '100%' }}
            data={courses}
            itemContent={(index, course) => (
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

// Separate the course card into its own component for better performance
function CourseCard({ course, isSelected, onSelect }: {
  course: GolfCourse;
  isSelected: boolean;
  onSelect: (course: GolfCourse) => void;
}): JSX.Element {
  const { courseName, location_city, location_state, walkabilityRating_overall } = course;
  
  const handleClick = useCallback(() => {
    onSelect(course);
  }, [course, onSelect]);

  return (
    <div
      className={cn(
        'p-4 border-b transition-all cursor-pointer',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      )}
      onClick={handleClick}
    >
      <h3 className="font-semibold text-sm mb-1.5">{courseName}</h3>
      <div className="flex items-center text-xs text-gray-600 mb-1.5">
        <MapPin className="w-3.5 h-3.5 mr-1" />
        {location_city}, {location_state}
      </div>
      <div className="flex items-center text-xs mb-2">
        <StarRating 
          rating={walkabilityRating_overall || 0} 
          showDecimal={true}
          className="text-xs"
          starClassName="w-3.5 h-3.5"
        />
        <span className="ml-1">Walkability</span>
      </div>
      <Link 
        href={`/courses/${course.id}`}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        More course details...
      </Link>
    </div>
  );
}