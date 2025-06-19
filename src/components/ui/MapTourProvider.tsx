'use client'

import React from 'react'
import { TourProvider } from '@reactour/tour'
import { handleTourComplete } from './MapTour'
import { handleMobileTourComplete } from './MapTourMobile'

interface MapTourProviderProps {
  children: React.ReactNode
}

export const MapTourProvider: React.FC<MapTourProviderProps> = ({ children }) => {
  return (
    <TourProvider
      steps={[]}
      onClickMask={({ setCurrentStep, currentStep, steps, setIsOpen }) => {
        if (steps && currentStep === steps.length - 1) {
          // Detect device and call appropriate completion handler
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
          if (isMobile) {
            handleMobileTourComplete()
          } else {
            handleTourComplete()
          }
          setIsOpen(false)
        } else {
          setCurrentStep((s) => (s === steps!.length - 1 ? 0 : s + 1))
        }
      }}
      onClickClose={({ setIsOpen }) => {
        // Detect device and call appropriate completion handler
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
        if (isMobile) {
          handleMobileTourComplete()
        } else {
          handleTourComplete()
        }
        setIsOpen(false)
      }}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#0A3357',
          borderRadius: 8,
          padding: '16px 24px 0 16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          lineHeight: '1.4',
          maxWidth: '280px',
          width: '280px',
          zIndex: 10000,
        }),
        maskArea: (base) => ({
          ...base,
          rx: 4,
        }),
        maskWrapper: (base) => ({
          ...base,
          color: '#0A3357',
          zIndex: 9999,
        }),
        badge: (base) => ({
          ...base,
          left: 'auto',
          right: '-0.8125em',
          background: '#0A3357',
        }),
        controls: (base) => ({
          ...base,
          marginTop: 12,
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }),
        close: (base) => ({
          ...base,
          right: 6,
          top: 6,
          width: 16,
          height: 16,
          opacity: 0.6,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }),
      }}
      padding={{
        mask: 10,
        popover: [20, 20],
      }}
      position="center"
      scrollSmooth
      showBadge={false}
      showCloseButton={true}
      showNavigation={true}
      showPrevNextButtons={true}
      showDots={false}
      disableDotsNavigation
      className="tour-popover"
      maskClassName="tour-mask"
      prevButton={({ currentStep, setCurrentStep, steps }) => (
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
      )}
      nextButton={({ currentStep, setCurrentStep, stepsLength, setIsOpen }) => (
        <button
          onClick={() => {
            if (currentStep === stepsLength - 1) {
              // Detect device and call appropriate completion handler
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
              if (isMobile) {
                handleMobileTourComplete()
              } else {
                handleTourComplete()
              }
              setIsOpen(false)
            } else {
              setCurrentStep(currentStep + 1)
            }
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#0A3357] border border-transparent rounded hover:bg-[#082945] ml-2"
        >
          {currentStep === stepsLength - 1 ? 'Got it!' : 'Next'}
        </button>
      )}
    >
      {children}
    </TourProvider>
  )
} 