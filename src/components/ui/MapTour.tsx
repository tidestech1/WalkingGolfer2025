'use client'

import React, { useEffect } from 'react'
import { useTour, StepType } from '@reactour/tour'

const TOUR_STORAGE_KEY = 'mapTourCompleted'

const steps: StepType[] = [
  {
    selector: 'body',
    position: 'center',
    content: "Welcome! This tour will quickly guide you through the key features for finding walkable golf courses.",
  },
  {
    selector: '.marker-key',
    content: 'Use the marker key to identify the different types and ratings of courses on the map.',
  },
  {
    selector: '.filter-controls',
    content: 'Use filters to narrow your search by walkability rating, course type, or number of holes at the club.',
  },
  {
    selector: '.filter-course-list',
    content: 'If you are looking for a specific course in the search area, type the name (or part of it) in this box.',
  },
  {
    selector: '.map-marker',
    content: 'Click on any course marker to see details, walkability ratings, and reviews from other golfers.',
    stepInteraction: true,
  },
  {
    selector: '.course-preview',
    content: 'Once you find a course, click the more course details link to view full course info, walkability scores, and reviews to help plan your next round.',
  },
]

export const MapTourSteps = steps

export const MapTour: React.FC = () => {
  const { setIsOpen, setSteps } = useTour()

  useEffect(() => {
    // Only run on client side and desktop devices
    if (typeof window !== 'undefined' && setIsOpen && setSteps) {
      const isDesktop = window.innerWidth >= 1024 // lg breakpoint
      const alreadySeen = localStorage.getItem(TOUR_STORAGE_KEY)
      
      if (isDesktop && !alreadySeen) {
        // Set the tour steps
        setSteps(steps)
        // Small delay to ensure elements are loaded
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [setIsOpen, setSteps])

  return null // The tour provider handles the UI
}

export const handleTourComplete = () => {
  localStorage.setItem(TOUR_STORAGE_KEY, 'true')
  
  // Re-show the location prompt after tour completion
  // Clear the session storage flag so the prompt appears again
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('walkingGolfer_hasSeenLocationPrompt')
    
    // Trigger a custom event to notify the map page to show the prompt
    window.dispatchEvent(new CustomEvent('showLocationPrompt'))
  }
}
