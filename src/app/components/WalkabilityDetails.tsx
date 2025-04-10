'use client'

// External libraries
// Removed unused MapPin, Mountain
import { PieChart } from 'lucide-react'

// Internal types & utils (order fixed)
import { getHillinessDescription, getHoleDistanceDescription, getCostDescription } from '@/lib/utils/walkabilityRating'
import { GolfCourse } from '@/types/course'

// Local components (order fixed)
import CostRating from './CostRating'
import StarRating from './StarRating'
import TerrainRating from './TerrainRating'

interface WalkabilityDetailsProps {
  course: GolfCourse
  className?: string
  compact?: boolean
}

export default function WalkabilityDetails({
  course,
  className = '',
  compact = false
}: WalkabilityDetailsProps): JSX.Element | null {
  // Determine which ratings to show based on available data (null checks)
  const showOverall = course.walkabilityRating_overall !== null && typeof course.walkabilityRating_overall === 'number'
  const showHilliness = course.walkabilityRating_hilliness !== null && typeof course.walkabilityRating_hilliness === 'number'
  const showDistance = course.walkabilityRating_holeDistance !== null && typeof course.walkabilityRating_holeDistance === 'number'
  const showCost = course.walkabilityRating_cost !== null && typeof course.walkabilityRating_cost === 'number'

  // Early return if no ratings are available to display
  if (!showOverall && !showHilliness && !showDistance && !showCost) {
    return null
  }

  // Get descriptive text for ratings (provide default 0 if null)
  const hillinessDescription = getHillinessDescription(course.walkabilityRating_hilliness ?? 0)
  const distanceDescription = getHoleDistanceDescription(course.walkabilityRating_holeDistance ?? 0)
  const costDescription = getCostDescription(course.walkabilityRating_cost ?? 0)

  // Use weighted rating if available, otherwise fallback to overall
  const overallRatingValue = course.walkabilityRating_weightedRating ?? course.walkabilityRating_overall ?? 0

  return (
    <div className={`${className} space-y-4`}>
      {/* Overall Rating Section */}
      {showOverall && (
        <div className="pb-3 border-b border-gray-200">
          <h3 className={`font-semibold text-gray-800 mb-2 ${compact ? 'text-base' : 'text-lg'}`}>Overall Walkability</h3>
          <div className="flex items-center gap-2">
            <StarRating 
              rating={overallRatingValue} 
              size={compact ? 16 : 20} 
            />
            <span className={`font-medium text-gray-700 ${compact ? 'text-sm' : ''}`}>
              ({overallRatingValue.toFixed(1)}/5)
            </span>
          </div>
        </div>
      )}

      {/* Detailed Ratings Grid */}
      <div className={`grid grid-cols-1 gap-4 ${compact ? '' : 'md:grid-cols-2 pt-2'}`}>
        {/* Hilliness Rating */}
        {showHilliness && (
          <div className="flex items-start gap-2">
            <div>
              <h4 className={`font-medium text-gray-700 ${compact ? 'text-sm' : ''}`}>Hilliness</h4>
              <div className="flex items-center mt-1 gap-2">
                <TerrainRating 
                  rating={course.walkabilityRating_hilliness ?? 0}
                  hovered={0}
                  setRating={() => {}}
                  setHovered={() => {}}
                  size={compact ? 'sm' : 'md'}
                />
                {!compact && <span className="text-sm text-gray-600">({hillinessDescription})</span>}
              </div>
            </div>
          </div>
        )}

        {/* Hole Distance/Layout Rating */}
        {showDistance && (
          <div className="flex items-start gap-2">
            <PieChart className={`flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'} text-green-600 mt-0.5`} aria-hidden="true" />
            <div>
              <h4 className={`font-medium text-gray-700 ${compact ? 'text-sm' : ''}`}>Layout</h4>
              <div className="flex items-center mt-1 gap-2">
                <StarRating 
                  rating={course.walkabilityRating_holeDistance ?? 0} 
                  size={compact ? 14 : 16} 
                />
                {!compact && <span className="text-sm text-gray-600">({distanceDescription})</span>}
              </div>
            </div>
          </div>
        )}
        
        {/* Cost Rating */}
        {showCost && (
          <div className="flex items-start gap-2">
            <div>
              <h4 className={`font-medium text-gray-700 ${compact ? 'text-sm' : ''}`}>Cost Impact</h4>
              <div className="flex items-center mt-1 gap-2">
                <CostRating 
                  rating={course.walkabilityRating_cost ?? 0}
                  hovered={0}
                  setRating={() => {}}
                  setHovered={() => {}}
                  size={compact ? 'sm' : 'md'}
                />
                {!compact && <span className="text-sm text-gray-600">({costDescription})</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 