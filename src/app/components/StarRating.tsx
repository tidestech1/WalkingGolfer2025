'use client'

import { Star } from 'lucide-react'

import { getStarRating } from '@/lib/utils/walkabilityRating'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
  color?: string
  showNumeric?: boolean
  className?: string
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  color = '#FF9A00',
  showNumeric = false,
  className = '',
}: StarRatingProps): JSX.Element {
  const { whole, half, empty } = getStarRating(rating, maxStars)

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: whole }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={size}
            fill={color}
            strokeWidth={0}
            className="text-transparent"
          />
        ))}

        {/* Half star */}
        {half > 0 && (
          <div className="relative">
            <Star
              size={size}
              className="text-gray-300 fill-gray-300"
              strokeWidth={0}
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                size={size}
                fill={color}
                strokeWidth={0}
                className="text-transparent absolute inset-0"
              />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={size}
            className="text-gray-300 fill-gray-300"
            strokeWidth={0}
          />
        ))}
      </div>

      {showNumeric && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}
        </span>
      )}
    </div>
  )
}

// Smaller version for use in compact displays
export function CompactStarRating({
  rating,
  showNumeric = true,
  className = '',
}: Omit<StarRatingProps, 'maxStars' | 'size' | 'color'> & { showNumeric?: boolean }): JSX.Element {
  return (
    <StarRating
      rating={rating}
      size={16}
      showNumeric={showNumeric}
      className={`inline-flex items-center ${className}`}
      color="#FF9A00"
      maxStars={5}
    />
  )
} 