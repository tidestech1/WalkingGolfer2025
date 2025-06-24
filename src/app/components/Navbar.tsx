'use client'

import { useState, useEffect } from 'react'

import { Search, Star, User, ChevronDown, ChevronUp, LogOut, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useMobileMenu } from '@/lib/contexts/MobileMenuContext'
import { useAdmin } from '@/lib/hooks/useAdmin'
import { useAuth } from '@/lib/hooks/useAuth'

export default function Navbar(): JSX.Element {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()
  const { isMenuOpen, toggleMenu } = useMobileMenu()

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as HTMLElement
      if (isUserMenuOpen && !target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return (): void => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  return (
    <nav className="bg-[#0A3357] shadow-md font-outfit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Logo - positioned absolutely to span both rows (desktop only) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 hidden md:block">
          <Link href="/" className="flex-shrink-0 flex items-center select-none">
            <Image
              src="/brand/WalkingGolferLogo.svg"
              alt="The Walking Golfer"
              width={351}
              height={220}
              className="h-[110px] w-auto"
              priority
            />
          </Link>
        </div>

        {/* Mobile Header - Increased height */}
        <div className="md:hidden py-3">
          <div className="flex items-center justify-between">
            {/* Logo - increased size by ~15% */}
            <Link href="/" className="flex-shrink-0 select-none">
              <Image
                src="/brand/WalkingGolferLogo.svg"
                alt="The Walking Golfer"
                width={276}
                height={173}
                className="h-[4.6rem] w-auto"
                priority
              />
            </Link>
            
            {/* Right side controls: RATE button and hamburger menu */}
            <div className="flex items-center space-x-2">
              {/* Mobile Rate a Course Button */}
              <Link
                href="/add-review"
                className="bg-white rounded-lg px-3 py-1.5 flex items-center gap-1 hover:bg-[#00FFFF] transition-colors"
              >
                <span className="font-medium text-[#0A3357] text-sm">RATE</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-[#FF9A00] text-[#FF9A00]"
                    />
                  ))}
                </div>
              </Link>
              
              {/* Hamburger menu button */}
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#00FFFF] transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Top row with Rate a Course - Desktop */}
        <div className="hidden md:flex justify-end pt-4 pb-2">
          <Link
            href="/add-review"
            className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-[#00FFFF] transition-colors"
          >
            <span className="font-medium text-[#0A3357]">RATE A COURSE</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-[#FF9A00] text-[#FF9A00]"
                />
              ))}
            </div>
          </Link>
        </div>

        {/* Main navbar row - desktop only */}
        <div className="hidden md:flex justify-end h-16 items-center">
          {/* Desktop Navigation */}
          <div className="md:flex md:items-center md:space-x-8">
            <Link href="/about" className="text-white hover:text-[#00FFFF] font-medium transition-colors">
              About Us
            </Link>
            <div className="relative group">
              <Link href="/coursefinder" className="text-white hover:text-[#00FFFF] font-medium inline-flex items-center transition-colors">
                Course Finder
                <Search className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <Link href="/news" className="text-white hover:text-[#00FFFF] font-medium transition-colors">
              News & Articles
            </Link>
            {/* Temporarily hidden for launch - uncomment when shop is ready */}
            {/* <Link href="/shop" className="text-white hover:text-[#00FFFF] font-medium transition-colors">
              Shop
            </Link> */}
            {user ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-white hover:text-[#00FFFF] font-medium transition-colors"
                >
                  <User className="w-5 h-5 mr-1" />
                  <span className="max-w-[100px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                  {isUserMenuOpen ? (
                    <ChevronUp className="ml-1 w-4 h-4" />
                  ) : (
                    <ChevronDown className="ml-1 w-4 h-4" />
                  )}
                </button>
                
                {/* Desktop User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    
                    {/* Only show admin link if user is an admin */}
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        void signOut()
                        setIsUserMenuOpen(false)
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-white hover:text-[#00FFFF] font-medium transition-colors"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0A3357] absolute w-full left-0 z-50 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-3 sm:px-5">
            <Link
              href="/about"
              className="block px-3 py-2 text-white hover:text-[#00FFFF] font-medium transition-colors"
              onClick={() => toggleMenu()}
            >
              About Us
            </Link>
            <Link
              href="/coursefinder"
              className="block px-3 py-2 text-white hover:text-[#00FFFF] font-medium transition-colors"
              onClick={() => toggleMenu()}
            >
              Course Finder
            </Link>
            <Link
              href="/news"
              className="block px-3 py-2 text-white hover:text-[#00FFFF] font-medium transition-colors"
              onClick={() => toggleMenu()}
            >
              News & Articles
            </Link>
            {/* Temporarily hidden for launch - uncomment when shop is ready */}
            {/* <Link
              href="/shop"
              className="block px-3 py-2 text-white hover:text-[#00FFFF] font-medium transition-colors"
              onClick={() => toggleMenu()}
            >
              Shop
            </Link> */}
            
            {/* Mobile User Menu (no dropdown, just expanded menu items) */}
            {user ? (
              <>
                {/* User info header in mobile menu */}
                <div className="block px-3 py-2 text-white font-medium border-t border-blue-700 mt-3 pt-3">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    <span className="max-w-[200px] truncate">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                </div>
                
                <Link
                  href="/profile"
                  className="block px-3 py-2 pl-8 text-white hover:text-[#00FFFF] font-medium transition-colors"
                  onClick={() => toggleMenu()}
                >
                  Profile
                </Link>
                
                {/* Only show admin link if user is an admin */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 pl-8 text-white hover:text-[#00FFFF] font-medium transition-colors"
                    onClick={() => toggleMenu()}
                  >
                    Admin Dashboard
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    void signOut()
                    toggleMenu()
                  }}
                  className="block w-full text-left px-3 py-2 pl-8 text-white hover:text-[#00FFFF] font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 bg-white text-[#0A3357] rounded-lg hover:bg-[#00FFFF] transition-colors"
                onClick={() => toggleMenu()}
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 