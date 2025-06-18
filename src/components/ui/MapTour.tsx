'use client'

import React, { useState, useEffect } from 'react'
import { useTour } from '@reactour/tour'

const TOUR_STORAGE_KEY = 'mapTourCompleted'

const steps = [
  {
    selector: '.search-bar',
    content: 'Start by searching for a specific location (state, city, or course name) to explore walkable golf courses in that area.',
  },
  {
    selector: '.use-location-btn',
    content: 'Or use your current location to automatically find nearby walkable golf courses.',
  },
  {
    selector: '.filter-controls',
    content: 'Use filters to narrow your search by walkability rating, course type, or number of holes.',
  },
  {
    selector: '.map-marker',
    content: 'Click on any course marker to see details, walkability ratings, and reviews from other walking golfers.',
  },
  {
    selector: '.course-preview',
    content: 'Here you will see course information, walkability scores, and can read reviews to help plan your walking golf experience.',
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
}
