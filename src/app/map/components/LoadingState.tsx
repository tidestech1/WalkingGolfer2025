import { MapIcon } from 'lucide-react';

export function LoadingState(): JSX.Element {
  return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated map icon */}
        <div className="relative">
          <MapIcon className="w-12 h-12 text-blue-500 animate-pulse" />
          <div className="absolute -top-1 -right-1">
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping" />
          </div>
        </div>
        
        {/* Loading text */}
        <div className="text-sm text-gray-600">Loading walkable golf courses...</div>
        
        {/* Loading bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-loading-bar" />
        </div>
      </div>

      {/* Skeleton UI for courses */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
} 