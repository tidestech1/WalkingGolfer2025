'use client'

import React from 'react'

import { getWalkabilityLabel } from '@/lib/utils/walkabilityRating'
import { GolfCourse } from '@/types/course'

interface CourseRatingsProps {
  course: GolfCourse;
  className?: string
}

export default function CourseRatings({ course, className = '' }: CourseRatingsProps): JSX.Element {
  // Overall walkability rating (1-5 scale, higher is better)
  const walkabilityRating = course.walkabilityRating_overall || 0
  
  // Format fractional ratings
  const formatRating = (rating: number | null | undefined): string => {
    if (rating === undefined || rating === null) {
      return 'N/A'
    }
    return rating.toFixed(1)
  }

  // Get walkability label based on rating
  const walkabilityLabel = getWalkabilityLabel(walkabilityRating)

  // Get detailed ratings from the new flat schema
  const hilliness = course.walkabilityRating_hilliness || 0
  const holeDistance = course.walkabilityRating_holeDistance || 0
  const cost = course.walkabilityRating_cost || 0
  const condition = course.walkabilityRating_courseCondition || 0

  // Helper function to get hilliness description (higher is better/flatter)
  const getHillinessDescription = (rating: number): string => {
    if (rating >= 4) {
      return 'Mostly flat course'
    }
    if (rating >= 3) {
      return 'Moderately hilly'
    }
    return 'Challenging hills'
  }

  // Helper function to get hole distance description (higher is better/more compact)
  const getDistanceDescription = (rating: number): string => {
    if (rating >= 4) {
      return 'Compact layout'
    }
    if (rating >= 3) {
      return 'Average distance between holes'
    }
    return 'Long walks between holes'
  }

  // Helper function to get cost description (higher is better/more affordable)
  const getCostDescription = (rating: number): string => {
    if (rating >= 4) {
      return 'Very affordable'
    }
    if (rating >= 3) {
      return 'Reasonably priced'
    }
    return 'Premium pricing'
  }

  // Helper function to get condition description
  const getConditionDescription = (rating: number): string => {
    if (rating >= 4.5) return 'Excellent condition'
    if (rating >= 3.5) return 'Good condition'
    if (rating >= 2.5) return 'Fair condition'
    if (rating >= 1.5) return 'Poor condition'
    return 'Condition not rated'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-3">Walkability Ratings</h2>
      
      {/* Overall Walkability Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-700 font-medium">Overall Walkability</span>
          <div>
            <span className="font-bold text-lg">{formatRating(walkabilityRating)}/5</span>
            <span className="ml-2 text-sm text-gray-500">({walkabilityLabel})</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${(walkabilityRating / 5) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Rating Factors */}
      <div className="space-y-3">
        {/* Hilliness */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700">Hilliness</span>
            <span className="font-medium">{formatRating(hilliness)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${(hilliness / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getHillinessDescription(hilliness)}
          </p>
        </div>
        
        {/* Hole Distance */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700">Hole Distance</span>
            <span className="font-medium">{formatRating(holeDistance)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${(holeDistance / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getDistanceDescription(holeDistance)}
          </p>
        </div>
        
        {/* Cost */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700">Cost</span>
            <span className="font-medium">{formatRating(cost)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${(cost / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getCostDescription(cost)}
          </p>
        </div>
        
        {/* Course Condition - NEW */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700">Course Condition</span>
            <span className="font-medium">{formatRating(condition)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              // TODO: Consider a different color scale for condition (e.g., greens?)
              style={{ width: `${(condition / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getConditionDescription(condition)}
          </p>
        </div>
      </div>
    </div>
  )
} 