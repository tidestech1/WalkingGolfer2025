'use client';

import { useState } from 'react';

import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  showDecimal?: boolean;
  className?: string;
  starClassName?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  label?: string;
}

export function StarRating({ 
  rating, 
  showDecimal = false, 
  className, 
  starClassName,
  interactive = false,
  onRatingChange,
  label
}: StarRatingProps): JSX.Element {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleStarClick = (index: number): void => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const handleStarHover = (index: number | null): void => {
    if (interactive) {
      setHoverRating(index !== null ? index + 1 : null);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1">
        <div 
          className={cn(
            'flex',
            interactive && 'cursor-pointer'
          )}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-4 h-4 transition-colors',
                i < Math.floor(displayRating) ? 'fill-[#FF9A00] text-[#FF9A00]' : 'text-gray-300',
                interactive && 'hover:scale-110',
                starClassName
              )}
              onClick={() => handleStarClick(i)}
              onMouseEnter={() => handleStarHover(i)}
              onMouseLeave={() => handleStarHover(null)}
            />
          ))}
        </div>
        {showDecimal && (
          <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
        )}
      </div>
      {label && (
        <span className="text-xs text-gray-600">{label}</span>
      )}
    </div>
  );
} 