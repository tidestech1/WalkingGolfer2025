import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  progress: number;
}

export function LoadingIndicator({ progress }: LoadingIndicatorProps): JSX.Element | null {
  if (progress === 100) {
 return null; 
}

  return (
    <div className="absolute bottom-20 lg:bottom-24 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-[400px] 
                    bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-sm text-gray-700">Loading courses...</span>
        </div>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 