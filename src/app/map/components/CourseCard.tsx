import { MapPin, Star } from 'lucide-react';

import type { GolfCourse } from '@/types/course';

interface CourseCardProps {
  course: GolfCourse;
  isSelected: boolean;
  onSelect: (course: GolfCourse) => void;
  compact?: boolean;
}

export function CourseCard({ course, isSelected, onSelect, compact = false }: CourseCardProps): JSX.Element | null {
  if (compact) {
    return (
      <div
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
        }`}
        onClick={() => onSelect(course)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm mb-1">{course.courseName}</h3>
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="w-3 h-3 mr-1" />
              {course.location_city}, {course.location_state}
            </div>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm ml-1">{course.walkabilityRating_overall || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // Original card design for non-compact view
  return (
    // TODO: Restore the original non-compact card implementation here
    null
  );
} 