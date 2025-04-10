'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';

import {
    DocumentData, // Added back DocumentData import
    QueryDocumentSnapshot // Re-add QueryDocumentSnapshot
} from 'firebase/firestore';
import { MapPin, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Added blank line

// Added blank line
// Import CourseFilters type along with GolfCourse
import { CompactStarRating } from '@/app/components/StarRating'; // Local components grouped
import { US_STATES } from '@/lib/constants'; // Constants grouped

// Added blank line
import { IMAGES } from '@/lib/constants/images';
import { getCourses } from '@/lib/firebase/courseUtils'; // Firebase utils
import { useAnalytics } from '@/lib/hooks/useAnalytics'; // Hooks grouped
import type { GolfCourse, CourseFilters } from '@/types/course';

// Added blank line

import CoursePageAnalytics from './CoursePageAnalytics'; // Local component (relative path)


// Constants
// Removed unused COURSES_PER_PAGE constant
// const COURSES_PER_PAGE = 12;

// Define the type for the pagination cursor more explicitly
// Using the imported DocumentData
type CourseDocSnapshot = QueryDocumentSnapshot<DocumentData>;


// Main page component for browsing/searching courses
export default function CoursesPage(): JSX.Element {
  // State Management
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  // Use the explicit CourseDocSnapshot type alias
  const [lastVisible, setLastVisible] = useState<CourseDocSnapshot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [minWalkabilityRating, setMinWalkabilityRating] = useState<number | undefined>(undefined);

  // Analytics hook
  const { trackSearch } = useAnalytics();

  // Callback to fetch courses based on current filters and pagination
  // Removed unused 'page' parameter
  // Added return type: Promise<void>
  const searchCourses = useCallback(async (startAfterDoc: CourseDocSnapshot | null = null): Promise<void> => {
    // Basic check - removed as it prevented loading initial state without filters
    // if (!searchQuery.trim() && !selectedState && !minWalkabilityRating) {
    //   setError('Please enter a search term or select filters to begin.');
    //   setCourses([]); // Clear courses if no search initiated
    //   setHasNextPage(false);
    //   setLastVisible(null);
    //   return;
    // }

    setLoading(true);
    setError(null); // Clear previous errors on new search/pagination

    try {
      // Construct the filters object matching the CourseFilters type
      // Start with required fields using defaults
      const filters: CourseFilters = {
        walkabilityRating_overall_min: minWalkabilityRating ?? 0, // Default to 0 if undefined
        course_types: [], // Default to empty array
        course_categories: [], // Default to empty array
        facilities_pushCarts: false, // Default to false
        pricing_fee_min: 0, // Default to 0
        pricing_fee_max: 9999, // Default to a high value
        // Conditionally add optional fields if they have values
        ...(searchQuery.trim() && { searchQuery: searchQuery.trim() }),
        ...(selectedState && { state: selectedState }),
        // Add sortBy and sortOrder if they are part of CourseFilters and have values
        // ...(sortByValue && { sortBy: sortByValue }),
        // ...(sortOrderValue && { sortOrder: sortOrderValue }),
      };

      // Call the utility function to get courses
      // Pass undefined instead of null for startAfterDoc
      const result = await getCourses(filters, startAfterDoc ?? undefined);

      // Update state based on results
      // Append courses if paginating, replace if it's a new search (page 1)
      if (startAfterDoc) {
        setCourses(prevCourses => [...prevCourses, ...result.courses]);
      } else {
        setCourses(result.courses); // Replace courses for a new search/filter application
      }

      setHasNextPage(result.hasMore);
      setLastVisible(result.lastVisible as CourseDocSnapshot | null); // Assert type if needed

      if (!startAfterDoc && result.courses.length === 0) {
        // Show 'no results' only on the first page of a search
        setError('No courses found matching your search criteria.');
      }

      // Track search only on the first page load for that search
      if (!startAfterDoc) {
          trackSearch(searchQuery.trim(), result.courses.length);
      }

    } catch (err) {
        // eslint-disable-next-line no-console -- Keep for dev debugging
      console.error('Error searching courses:', err);
      setError(err instanceof Error ? err.message : 'Database connection error. Please try again or contact support.');
      setCourses([]); // Clear courses on error
      setHasNextPage(false);
      setLastVisible(null);
    } finally {
      setLoading(false);
    }
  // Dependencies for the search callback
  }, [searchQuery, selectedState, minWalkabilityRating, trackSearch]);

  // Initial load effect
  useEffect(() => {
    // Load initial set of courses on component mount without specific filters
    searchCourses(null).catch(err => console.error("Initial course load failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCourses]); // Run once on mount, searchCourses has its own deps

  // Handle search form submission
  // Added return type: void
  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setLastVisible(null); // Clear pagination cursor
    setCourses([]); // Clear existing courses before new search
    searchCourses(null).catch(err => console.error("Search failed:", err)); // Start search from scratch
  };

  // Handle fetching the next page
  // Added return type: void
  const handleLoadMore = (): void => {
    if (hasNextPage && lastVisible && !loading) {
      searchCourses(lastVisible).catch(err => console.error("Load more failed:", err)); // Fetch next page
    }
  };

  // JSX for the component
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Wrap client component using client hooks in Suspense */}
      <Suspense fallback={null}> 
        <CoursePageAnalytics />
      </Suspense>

      <main className="min-h-screen pt-6 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A3357] mb-4">Find Walking-Friendly Golf Courses</h1>
          <p className="text-lg mb-8 text-gray-600">Search for golf courses across the USA that are great for walking.</p>

          {/* Search Section */}
          <section className="mb-8 bg-white p-6 rounded-lg shadow">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Main Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                    <label htmlFor="search" className="sr-only">Search courses</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                       </div>
                       <input
                          type="text"
                          id="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by course name, city..."
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                 </div>
                 <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0A3357] hover:bg-[#0A3357]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3357] disabled:opacity-50"
                 >
                    {loading ? 'Searching...' : 'Search'}
                 </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {/* State Filter */}
                <div>
                   <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                   <select
                     id="state"
                     value={selectedState}
                     onChange={(e) => setSelectedState(e.target.value)}
                     className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                   >
                     <option value="">All States</option>
                     {US_STATES.map((state) => (
                       <option key={state.code} value={state.code}>{state.name}</option>
                     ))}
                   </select>
                 </div>

                {/* Walkability Rating Filter */}
                 <div>
                   <label htmlFor="walkability" className="block text-sm font-medium text-gray-700 mb-1">Minimum Walkability</label>
                   <select
                     id="walkability"
                     value={minWalkabilityRating === undefined ? '' : minWalkabilityRating}
                     onChange={(e) => setMinWalkabilityRating(e.target.value ? Number(e.target.value) : undefined)}
                     className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                   >
                     <option value="">Any Rating</option>
                     <option value="3">3.0+</option>
                     <option value="3.5">3.5+</option>
                     <option value="4">4.0+</option>
                     <option value="4.5">4.5+</option>
                   </select>
                 </div>
              </div>
            </form>
          </section>

          {/* Error Message */}
          {error && !loading && ( // Show error only if not loading
            <div role="alert" className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  {/* Error Icon */}
                   <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                   </svg>
                 </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          <section>
            {/* Loading State */}
            {loading && courses.length === 0 && ( // Show spinner only on initial load
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A3357]"></div>
              </div>
            )}

            {/* Course Grid */}
            {courses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => ( // Added index for priority
                  <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out h-full flex flex-col group" // Added group for hover effects
                    >
                    {/* Course Image */}
                    <div className="relative h-48 w-full">
                      <Image
                          src={IMAGES.placeholders.course} // Use placeholder
                          alt={course.courseName ?? 'Golf course'} // Use nullish coalescing
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index < 6} // Prioritize images in the first ~two rows
                        />
                    </div>

                    {/* Course Details */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h2 className="text-lg font-semibold text-[#0A3357] mb-1 group-hover:text-blue-700 transition-colors">
                          {course.courseName ?? 'Unnamed Course'}
                       </h2>

                      {/* Location */}
                      {(course.location_city || course.location_state) && (
                         <div className="flex items-center mb-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
                            <span>
                               {course.location_city}{course.location_city && course.location_state ? ', ' : ''}{course.location_state}
                            </span>
                         </div>
                       )}

                      {/* Walkability Rating */}
                      {typeof course.walkabilityRating_overall === 'number' && (
                        <div className="mt-auto pt-2 border-t border-gray-100"> {/* Push to bottom */}
                           <div className="flex items-center text-sm">
                              <span className="text-gray-700 mr-2">Walkability:</span>
                              <CompactStarRating rating={course.walkabilityRating_overall} />
                           </div>
                        </div>
                       )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

             {/* No Results Message (after loading, if applicable) */}
             {!loading && courses.length === 0 && error && ( // Only show if error caused no results
                <div className="text-center py-12 text-gray-500">
                    <p>No courses found matching your criteria.</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                </div>
             )}
             {!loading && courses.length === 0 && !error && ( // Show if initial load yielded nothing (and no error occurred)
                <div className="text-center py-12 text-gray-500">
                    <p>Enter a search term or select filters to find courses.</p>
                </div>
             )}


            {/* Load More Button */}
            {!loading && hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading} // Disable while loading next page
                  className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Load More Courses
                </button>
              </div>
            )}
             {/* Loading indicator specifically for pagination */}
             {loading && courses.length > 0 && (
                 <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0A3357]"></div>
                 </div>
             )}

          </section>
        </div>
      </main>
    </div>
  );
} 