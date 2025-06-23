'use client'

import React, { useState, useEffect } from 'react'
import { useTour, StepType } from '@reactour/tour'

const MOBILE_TOUR_STORAGE_KEY = 'mapTourMobileCompleted'

// Mobile-specific tour steps that account for tabbed interface
const mobileSteps: StepType[] = [
  {
    selector: 'body',
    position: 'center',
    content: "Welcome! This quick tour will show you how to find walkable golf courses on mobile.",
  },
  {
    selector: '[data-tab="map"]',
    content: 'You\'re currently on the map view. This shows golf courses as markers based on their walkability ratings.',
    stepInteraction: true,
  },
  {
    selector: '.map-marker',
    content: 'Tap any course marker to see details, walkability ratings, and reviews from other golfers.',
    stepInteraction: true,
          action: () => {
        // First, dismiss the location popup if it's open by finding "Search Instead" button
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Search Instead')) {
            button.click();
            break;
          }
        }
      }
  },
  {
    selector: '[data-tab="list"]',
    content: 'Tap here to switch to list view for a scrollable list of courses in the area. In list view, you can scroll through courses and tap any course for full details.',
    stepInteraction: true,
    action: () => {
      // Show list view for next step
      const listButton = document.querySelector('[data-tab="list"]') as HTMLElement
      if (listButton) {
        setTimeout(() => listButton.click(), 1000)
      }
    }
  },
  {
    selector: '[data-tab="filters"]',
    content: 'Use filters to narrow your search by walkability rating, course type, and number of holes.',
    action: () => {
      // Give users time to see the filters, then go back to map tab for the final step Show the filters
      const filtersButton = document.querySelector('[data-tab="filters"]') as HTMLElement
      if (filtersButton) {
        setTimeout(() => filtersButton.click(), 1000)
      }
    }
  },
  {
    selector: '.filter-controls',
    content: 'Set your filter preferences here to narrow your search.',
    action: () => {
      // Give users time to see the filters, then go back to map tab for the final step
      const mapButton = document.querySelector('[data-tab="map"]') as HTMLElement
      if (mapButton) {
        setTimeout(() => mapButton.click(), 3000)
      }
    }
  },
  {
    selector: 'nav button:last-child',
    content: 'Tap the help button anytime to see a key to course markers, re-run this tour, and more.',
    stepInteraction: true,
    action: () => {
      // Ensure we're on the map tab and wait for transition
      const mapButton = document.querySelector('[data-tab="map"]') as HTMLElement
      if (mapButton && !mapButton.classList.contains('text-blue-600')) {
        mapButton.click()
      }
      
      // Then open the help modal after ensuring we're on map view
      setTimeout(() => {
        const helpButton = document.querySelector('nav button:last-child') as HTMLElement
        if (helpButton) {
          helpButton.click()
        }
      }, 1000)
    }
  },
  {
    selector: '.fixed.inset-0.bg-black\\/50',
    content: 'Great! You\'ve completed the tour. This help modal contains the marker key and restart tour option. Tap anywhere outside to close and start exploring!',
    stepInteraction: true,
    action: () => {
      // Close the modal after a delay to let users read the final message
      setTimeout(() => {
        const modalOverlay = document.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement
        if (modalOverlay) {
          modalOverlay.click()
        }
      }, 3000)
    }
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
  
  // Re-show the location prompt after tour completion
  // Clear the session storage flag so the prompt appears again
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('walkingGolfer_hasSeenLocationPrompt')
    
    // Trigger a custom event to notify the map page to show the prompt
    window.dispatchEvent(new CustomEvent('showLocationPrompt'))
  }
} 