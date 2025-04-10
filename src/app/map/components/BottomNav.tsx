import { Map, List, SlidersHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeView: 'map' | 'list' | 'filters';
  onViewChange: (view: 'map' | 'list' | 'filters') => void;
  activeFilterCount?: number;
  totalCourses?: number;
}

export function BottomNav({ 
  activeView, 
  onViewChange, 
  activeFilterCount = 0,
  totalCourses = 0
}: BottomNavProps): JSX.Element {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden">
      <nav className="flex justify-around items-center h-16">
        <button
          onClick={() => onViewChange('map')}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full relative',
            activeView === 'map' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <Map className="w-6 h-6" />
          <div className="flex flex-col items-center">
            <span className="text-xs">Map</span>
            {activeView === 'map' && (
              <span className="text-[10px] text-gray-500">{totalCourses} Courses</span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => onViewChange('list')}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full',
            activeView === 'list' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <List className="w-6 h-6" />
          <span className="text-xs mt-1">List</span>
        </button>
        
        <button
          onClick={() => onViewChange('filters')}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full relative',
            activeView === 'filters' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <SlidersHorizontal className="w-6 h-6" />
          <span className="text-xs mt-1">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute top-2 right-8 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
} 