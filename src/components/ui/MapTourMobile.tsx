'use client'

import React, { useState, useEffect } from 'react'
import { useTour } from '@reactour/tour'

const MOBILE_TOUR_STORAGE_KEY = 'mapTourMobileCompleted'

// Mobile-specific tour steps that account for tabbed interface
const steps = [
  {
    selector: '.tour-target',
    content: 'Start by using your current location to automatically show nearby walkable golf courses or use the search bar to look up a specific location.',
    doMask: true, // Try enabling mask with the tour-target class
    action: () => {
      // Auto-switch to Map tab if not already there
      setTimeout(() => {
        const mapTab = document.querySelector('[data-tab="map"]') as HTMLElement;
        if (mapTab) mapTab.click();
      }, 500);
    },
  },
  {
    selector: '.search-bar',
    content: 'Use this search bar to search for a specific location by state or city to focus the map on courses in that area.',
    doMask: true, // This element should always exist
    action: () => {
      // Auto-switch to Map tab if not already there
      setTimeout(() => {
        const mapTab = document.querySelector('[data-tab="map"]') as HTMLElement;
        if (mapTab) mapTab.click();
      }, 500);
    },
  },
  {
    selector: '[data-tab="list"]',
    content: 'Switch to the List tab to browse all courses in the area and apply filters.',
    doMask: true, // This element should always exist
    action: () => {
      // Auto-switch to List tab
      setTimeout(() => {
        const listTab = document.querySelector('[data-tab="list"]') as HTMLElement;
        if (listTab) listTab.click();
      }, 500);
    },
  },
  {
    selector: '.filter-controls',
    content: 'Use filters to narrow your search by walkability rating, course type, or number of holes at the club.',
    doMask: true, // This element should always exist
    action: () => {
      // Auto-switch to Filters tab
      setTimeout(() => {
        const filtersTab = document.querySelector('[data-tab="filters"]') as HTMLElement;
        if (filtersTab) filtersTab.click();
      }, 500);
    },
  },
  {
    selector: '[data-tab="map"]',
    content: 'Switch back to the Map tab to see course markers on the interactive map.',
    doMask: true, // This element should always exist
    action: () => {
      // Auto-switch to Map tab
      setTimeout(() => {
        const mapTab = document.querySelector('[data-tab="map"]') as HTMLElement;
        if (mapTab) mapTab.click();
      }, 1000); // Longer delay for loading
    },
  },
  {
    selector: '.map-marker',
    content: 'Click on any course marker to see details, walkability ratings, and reviews from other golfers.',
    doMask: false, // These are dynamically created and might not exist
  },
  {
    selector: '.course-preview',
    content: 'Here you will see course information, walkability scores, and can read reviews to help plan your walking golf experience.',
    doMask: false, // This only exists when InfoWindow is open
  },
]

export const MobileTourSteps = steps

export const MapTourMobile: React.FC = () => {
  const { setIsOpen, setSteps } = useTour()

  useEffect(() => {
    // Only run on client side and mobile devices
    if (typeof window !== 'undefined' && setIsOpen && setSteps) {
      const isMobile = window.innerWidth < 1024 // lg breakpoint
      const alreadySeen = localStorage.getItem(MOBILE_TOUR_STORAGE_KEY)
      
      if (isMobile && !alreadySeen) {
        // Set the mobile tour steps
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
        }, 3000) // Longer delay for mobile + map loading
        
        return () => clearTimeout(timer)
      }
    }
  }, [setIsOpen, setSteps])

  return null
}

export const handleMobileTourComplete = () => {
  localStorage.setItem(MOBILE_TOUR_STORAGE_KEY, 'true')
} 