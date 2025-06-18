import { Map, List, SlidersHorizontal, HelpCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeView: 'map' | 'list' | 'filters' | 'key';
  onViewChange: (view: 'map' | 'list' | 'filters' | 'key') => void;
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
    <div className="fixed bottom-8 left-0 right-0 bg-white border-t shadow-lg lg:hidden z-30">
      <nav className="flex justify-around items-center h-16">
        <button
          onClick={() => onViewChange('map')}
          data-tab="map"
          className={cn(
            'flex flex-col items-center justify-center w-full h-full relative',
            activeView === 'map' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <Map className="w-5 h-5" />
          <div className="flex flex-col items-center">
            <span className="text-xs">Map</span>
            {activeView === 'map' && (
              <span className="text-[10px] text-gray-500">{totalCourses} Courses</span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => onViewChange('list')}
          data-tab="list"
          className={cn(
            'flex flex-col items-center justify-center w-full h-full',
            activeView === 'list' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <List className="w-5 h-5" />
          <span className="text-xs mt-1">List</span>
        </button>
        
        <button
          onClick={() => onViewChange('filters')}
          data-tab="filters"
          className={cn(
            'flex flex-col items-center justify-center w-full h-full relative',
            activeView === 'filters' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-xs mt-1">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute top-2 right-6 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onViewChange('key')}
          className={cn(
            'flex flex-col items-center justify-center w-full h-full',
            activeView === 'key' ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs mt-1">Key</span>
        </button>
      </nav>
    </div>
  );
} 