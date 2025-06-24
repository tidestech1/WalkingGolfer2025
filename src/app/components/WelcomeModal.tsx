"use client"

import React, { useState, useEffect } from 'react'
import { AlertTriangle, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen the welcome message before
    const hasSeenWelcome = localStorage.getItem('walking-golfer-welcome-seen')
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem('walking-golfer-welcome-seen', 'true')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0A3357]">
            <Image
              src="/brand/WalkingGolfer-icon-blue-645px.png"
              alt="Walking Golfer Logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            Welcome to Walking Golfer!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Early Development Notice</p>
              <p>
                You're among our first users! This app is in early development, 
                so you may encounter bugs or incomplete features as we continue 
                to improve the experience.
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>What to expect:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>New features and improvements being added regularly</li>
              <li>Occasional bugs as we refine the platform</li>
              <li>Feedback requests to help shape the future of the app</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">We'd Love Your Feedback!</p>
              <p>
                Found a bug or have a suggestion? Your input is invaluable in 
                making Walking Golfer the best platform for finding walkable 
                courses so please do{' '}
                <Link 
                  href="/contact" 
                  className="text-blue-700 underline hover:text-blue-900 font-medium"
                >
                  contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleClose}
            className="bg-[#0A3357] hover:bg-[#0A3357]/90 text-white"
          >
            Let's Get Started!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default WelcomeModal 