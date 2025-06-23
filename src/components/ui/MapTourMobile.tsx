'use client'

import React, { useState, useEffect } from 'react'
import { useTour, StepType } from '@reactour/tour'

const MOBILE_TOUR_STORAGE_KEY = 'mapTourMobileCompleted'

// Mobile-specific tour steps that account for tabbed interface
const mobileSteps: StepType[] = [
  {
    selector: '.search-bar',
    content: 'Start by searching for a location to find walkable golf courses in that area.',
    action: () => {
      // Ensure we're on the map tab
      const mapButton = document.querySelector('[data-tab="map"]') as HTMLElement
      if (mapButton) mapButton.click()
    }
  },
  {
    selector: '.use-location-btn',
    content: 'Or tap here to use your current location to find nearby courses.',
    stepInteraction: true,
  },
  {
    selector: '[data-tab="filters"]',
    content: 'Tap here to access filters for walkability rating, course type, and more.',
    stepInteraction: true,
    action: () => {
      // Switch to filters tab for next step
      const filtersButton = document.querySelector('[data-tab="filters"]') as HTMLElement
      if (filtersButton) {
        setTimeout(() => filtersButton.click(), 500)
      }
    }
  },
  {
    selector: '.filter-controls',
    content: 'Use these filters to find exactly the type of walking golf experience you want.',
    action: () => {
      // Go back to map tab for marker demo
      const mapButton = document.querySelector('[data-tab="map"]') as HTMLElement
      if (mapButton) {
        setTimeout(() => mapButton.click(), 500)
      }
    }
  },
  {
    selector: '.map-marker',
    content: 'Tap any course marker to see walkability ratings and reviews from other golfers.',
    stepInteraction: true,
  },
  {
    selector: '[data-tab="list"]',
    content: 'Switch to list view to see course details in a scrollable format.',
    stepInteraction: true,
    action: () => {
      // Show list view
      const listButton = document.querySelector('[data-tab="list"]') as HTMLElement
      if (listButton) {
        setTimeout(() => listButton.click(), 500)
      }
    }
  },
  {
    selector: '.course-preview',
    content: 'Tap any course to see full details, reviews, and plan your walking golf experience.',
    stepInteraction: true,
  },
]

export const MobileTourSteps = mobileSteps

export const MapTourMobile: React.FC = () => {
  const { setIsOpen, setSteps } = useTour()

  useEffect(() => {
    // Only run on client side and mobile devices
    if (typeof window !== 'undefined' && setIsOpen && setSteps) {
      const isMobile = window.innerWidth < 1024 // lg breakpoint
      const alreadySeen = localStorage.getItem(MOBILE_TOUR_STORAGE_KEY)
      
      if (isMobile && !alreadySeen) {
        // Set the mobile tour steps
        setSteps(mobileSteps)
        // Small delay to ensure elements are loaded
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 2000) // Slightly longer delay for mobile
        return () => clearTimeout(timer)
      }
    }
  }, [setIsOpen, setSteps])

  return null
}

export const handleMobileTourComplete = () => {
  localStorage.setItem(MOBILE_TOUR_STORAGE_KEY, 'true')
} 