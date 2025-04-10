import { useState, useEffect, useCallback } from 'react';

import { GolfCourse, MapBounds } from '@/types/course';

const BATCH_SIZE = 50; // Number of courses to load at once
const LOAD_DELAY = 100; // Delay between batches in ms

interface UseProgressiveLoadingProps {
  allCourses: GolfCourse[];
  bounds: MapBounds | null;
  zoom: number;
}

export function useProgressiveLoading({ 
  allCourses, 
  bounds, 
  zoom 
}: UseProgressiveLoadingProps) {
  const [visibleCourses, setVisibleCourses] = useState<GolfCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Function to check if a course is within bounds
  const isInBounds = useCallback((course: GolfCourse, bounds: MapBounds) => {
    const lat = Number(course.location_coordinates_latitude);
    const lng = Number(course.location_coordinates_longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
return false;
}
    
    return (
      lat <= bounds.north &&
      lat >= bounds.south &&
      lng <= bounds.east &&
      lng >= bounds.west
    );
  }, []);

  // Progressive loading effect
  useEffect(() => {
    if (!bounds || !allCourses.length) {
      setVisibleCourses([]);
      setProgress(0);
      return;
    }

    setIsLoading(true);
    let isCancelled = false;

    const loadCoursesProgressively = async () => {
      // First, load courses in the visible area
      const coursesInBounds = allCourses.filter(course => isInBounds(course, bounds));
      
      // Immediately set visible courses in bounds to maintain visibility
      setVisibleCourses(coursesInBounds);
      
      const coursesOutOfBounds = allCourses.filter(course => !isInBounds(course, bounds));
      
      // Start with courses in bounds
      let loadedCourses = [...coursesInBounds];
      let currentBatch = 0;

      // Then load courses out of bounds if zoom level is appropriate
      if (zoom < 8) {
        while (currentBatch * BATCH_SIZE < coursesOutOfBounds.length) {
          if (isCancelled) {
return;
}

          const start = currentBatch * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, coursesOutOfBounds.length);
          const newBatch = coursesOutOfBounds.slice(start, end);
          
          loadedCourses = [...loadedCourses, ...newBatch];
          setVisibleCourses(loadedCourses);
          
          const totalProgress = Math.min(100,
            (loadedCourses.length / allCourses.length) * 100
          );
          setProgress(Math.round(totalProgress));

          currentBatch++;
          await new Promise(resolve => setTimeout(resolve, LOAD_DELAY));
        }
      }

      if (!isCancelled) {
        setIsLoading(false);
        setProgress(100);
      }
    };

    loadCoursesProgressively();

    return () => {
      isCancelled = true;
    };
  }, [allCourses, bounds, zoom, isInBounds]);

  return {
    visibleCourses,
    isLoading,
    progress
  };
} 