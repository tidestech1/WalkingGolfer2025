'use client'

import { Goal } from 'lucide-react'

interface ConditionsRatingProps {
  rating: number
  hovered: number
  setRating: (rating: number) => void
  setHovered: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  descriptions?: Record<number, string>
}

export default function ConditionsRating({
  rating,
  hovered,
  setRating,
  setHovered,
  size = 'md',
  descriptions
}: ConditionsRatingProps): JSX.Element {
  // Define size multipliers for each rating level (1-5)
  // Note: We display them in order where 1 is "Poor conditions" (small goal) and 5 is "Excellent conditions" (large goal)
  const sizeMaps = {
    sm: [12, 14, 16, 18, 20], // Small base sizes
    md: [16, 19, 22, 25, 28], // Medium base sizes
    lg: [20, 24, 28, 32, 36]  // Large base sizes
  }

  const sizes = sizeMaps[size]

  return (
    <div>
      <div className="flex gap-2 items-end">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Goal
              className={`${
                value <= (hovered || rating)
                  ? 'text-teal-600'
                  : 'text-gray-300'
              }`}
              style={{
                width: `${sizes[value - 1]}px`,
                height: `${sizes[value - 1]}px`
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
} 