'use client'

import React, { useState, useEffect } from 'react'
import { useTour } from '@reactour/tour'

const TOUR_STORAGE_KEY = 'mapTourCompleted'

const steps = [
   {
    selector: '.tour-target',
    content: 'Start by using your current location to automatically show nearby walkable golf courses or use the search bar to look up a specific location.',
    doMask: true,
  },
 {
    selector: '.search-bar',
    content: 'Use this search bar to search for a specific location by state or city to focus the map on courses in that area.',
    doMask: true,
  },
  {
    selector: '.marker-key',
    content: 'Use the marker key to see the different types of courses on the map.',
    doMask: true,
  },
  {
    selector: '.filter-controls',
    content: 'Use filters to narrow your search by walkability rating, course type, or number of holes at the club.',
    doMask: true,
  },
  {
    selector: '.filter-course-list',
    content: 'If you are looking for a specific course in the search area, type the name (or part if it) in this box.',
    doMask: true,
  },
  {
    selector: '.map-marker',
    content: 'Click on any course marker to see details, walkability ratings, and reviews from other golfers.',
    doMask: false,
  },
  {
    selector: '.course-preview',
    content: 'Here you will see course information, walkability scores, and can read reviews to help plan your walking golf experience.',
    doMask: false,
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
        
        // Wait for location prompt to be dismissed AND search bar to be available
        const checkElementsAndStart = () => {
          const searchBar = document.querySelector('.search-bar')
          const locationPrompt = document.querySelector('.location-prompt-overlay')
          
          // Only start tour when location prompt is gone and search bar is available
          if (searchBar && !locationPrompt) {
            setIsOpen(true)
          } else {
            // Retry after a short delay
            setTimeout(checkElementsAndStart, 500)
          }
        }
        
        // Initial delay to allow map to load, then check for elements
        const timer = setTimeout(() => {
          checkElementsAndStart()
        }, 2500) // Increased delay for map loading
        
        return () => clearTimeout(timer)
      }
    }
  }, [setIsOpen, setSteps])

  return null // The tour provider handles the UI
}

export const handleTourComplete = () => {
  localStorage.setItem(TOUR_STORAGE_KEY, 'true')
}
