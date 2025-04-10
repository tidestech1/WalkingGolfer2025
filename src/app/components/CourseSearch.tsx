'use client';

import { Fragment, useState, ChangeEvent, useEffect } from 'react';

import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

import { searchCourses } from '@/lib/firebase/courseUtils';
import { checkFirebaseAvailability } from '@/lib/firebase/firebase';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { GolfCourse } from '@/types/course';

interface CourseSearchProps {
  onSelect: (course: GolfCourse) => void;
  selectedCourse: GolfCourse | null;
}

interface ComboboxOptionRenderProps {
  selected: boolean;
  active: boolean;
}

export default function CourseSearch({ onSelect, selectedCourse }: CourseSearchProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    const checkFirebase = (): void => {
      try {
        const isAvailable = checkFirebaseAvailability();
        setIsFirebaseReady(isAvailable);
        if (!isAvailable) {
          setError('Firebase initialization failed. Please try again later.');
        }
      } catch (err) {
        setError('Failed to initialize Firebase. Please try again later.');
        console.error('Firebase initialization error:', err);
      }
    };

    checkFirebase();
  }, []);
  
  const debouncedSearch = useDebounce(async (searchQuery: string) => {
    if (!searchQuery.trim() || !isFirebaseReady) {
      setCourses([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchCourses({
        searchQuery,
        course_types: [],
        course_categories: [],
        facilities_pushCarts: false,
        pricing_fee_min: 0,
        pricing_fee_max: 0,
        walkabilityRating_overall_min: 0,
        sortBy: 'courseName',
        simpleSearch: true
      });
      setCourses(results);
    } catch (error) {
      console.error('Error searching courses:', error);
      setError('Failed to search courses. Please try again.');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
    debouncedSearch(event.target.value);
  };

  if (!isFirebaseReady) {
    return (
      <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <div className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-500">
          Loading course search...
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Combobox value={selectedCourse} onChange={onSelect} nullable>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              placeholder="Search for a golf course..."
              displayValue={(course: GolfCourse | null) => course?.courseName || ''}
              onChange={handleSearch}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {error ? (
                <div className="relative cursor-default select-none px-4 py-2 text-red-600">
                  {error}
                </div>
              ) : isLoading ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  Searching courses...
                </div>
              ) : courses.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                  No courses found.
                </div>
              ) : (
                courses.map((course) => (
                  <Combobox.Option
                    key={course.id}
                    className={({ active }: { active: boolean }) =>
                      `relative cursor-default select-none py-3 pl-4 pr-4 ${
                        active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                      }`
                    }
                    value={course}
                  >
                    {({ selected, active }: ComboboxOptionRenderProps) => (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className={`block truncate font-medium ${selected ? 'font-semibold' : ''}`}>
                            {course.courseName}
                          </span>
                          {selected && (
                            <CheckIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                          )}
                        </div>
                        <span className={`block truncate text-sm ${
                          active ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {course.location_city}, {course.location_state}
                        </span>
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
} 