"use client"

import React, { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

const DevelopmentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const isBannerDismissed = localStorage.getItem('dev-banner-dismissed')
    if (!isBannerDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('dev-banner-dismissed', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>
            <strong>Early Development:</strong> You're using an early version of the Walking Golfer. 
            Expect bugs and changes as we improve. We'd love your feedback!
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default DevelopmentBanner 