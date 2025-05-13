'use client'

import React from 'react'

import { getWalkabilityLabel } from '@/lib/utils/walkabilityRating'
import { GolfCourse } from '@/types/course'
import { Mountain, Footprints, CircleDollarSign, Goal } from 'lucide-react'

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

  // Helper function to get hilliness description (rating 1=very hilly, 5=very flat)
  const getHillinessDescription = (rating: number): string => {
    // Data is now stored as 1=very hilly, 5=very flat.
    // Descriptions should align directly with this stored value.
    if (rating <= 1) return "Very hilly and challenging terrain" // Stored 1
    if (rating <= 2) return "Hilly with significant elevation changes" // Stored 2
    if (rating <= 3) return "Moderate hills and terrain" // Stored 3
    if (rating <= 4) return "Gentle slopes, mostly flat" // Stored 4
    if (rating > 4) return "Very flat and easy terrain" // Stored 5 (covers 5 and above)
    return "Not rated" // Fallback for 0 or unexpected values
  }

  // Helper function to get hole distance description (rating 1=very spread out, 5=very compact)
  const getDistanceDescription = (rating: number): string => {
    // Data is now stored as 1=very spread out, 5=very compact.
    // Descriptions should align directly with this stored value.
    if (rating <= 1) return "Very spread out" // Stored 1
    if (rating <= 2) return "Spread out layout" // Stored 2
    if (rating <= 3) return "Average distances" // Stored 3
    if (rating <= 4) return "Relatively compact" // Stored 4
    if (rating > 4) return "Very compact layout" // Stored 5 (covers 5 and above)
    return "Not rated" // Fallback for 0 or unexpected values
  }

  // Helper function to get value description (rating 1=poor value, 5=excellent value)
  const getValueDescription = (rating: number): string => {
    if (rating <= 1) return "Poor Value"
    if (rating <= 2) return "Below Average Value"
    if (rating <= 3) return "Average Value"
    if (rating <= 4) return "Good Value"
    if (rating > 4) return "Excellent Value" // Covers 5 and above
    return "Not rated" // Fallback
  }

  // Helper function to get condition description (rating 1=poor, 5=excellent)
  const getConditionDescription = (rating: number): string => {
    if (rating <= 1) return "Poor course quality"
    if (rating <= 2) return "Below average course quality"
    if (rating <= 3) return "Average course quality"
    if (rating <= 4) return "Good course quality"
    if (rating > 4) return "Excellent course quality" // Covers 5 and above
    return "Condition not rated" // Fallback
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
            <span className="text-gray-700 flex items-center">
              <Mountain className="w-4 h-4 mr-2 text-blue-600" />
              Hilliness & Terrain
            </span>
            <span className="font-medium">{formatRating(hilliness)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              // Logic for hilliness: higher rating = fuller bar (text description clarifies meaning)
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
            <span className="text-gray-700 flex items-center">
              <Footprints className="w-4 h-4 mr-2 text-amber-800" />
              Green to Tee Distance
            </span>
            <span className="font-medium">{formatRating(holeDistance)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              // Logic for distance: higher rating = fuller bar (text description clarifies meaning)
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
            <span className="text-gray-700 flex items-center">
              <CircleDollarSign className="w-4 h-4 mr-2 text-emerald-600" />
              Course Value
            </span>
            <span className="font-medium">{formatRating(cost)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              // Logic for value: higher rating = better value, so bar width increases with rating
              style={{ width: `${(cost / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {getValueDescription(cost)}
          </p>
        </div>
        
        {/* Course Condition - NEW */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 flex items-center">
              <Goal className="w-4 h-4 mr-2 text-teal-600" />
              Course Quality
            </span>
            <span className="font-medium">{formatRating(condition)}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              // Logic for condition: higher rating = better condition, so bar width increases with rating
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