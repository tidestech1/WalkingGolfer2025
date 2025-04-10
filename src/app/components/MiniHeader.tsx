'use client';

import { Star, Menu, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useMobileMenu } from '@/lib/contexts/MobileMenuContext';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MiniHeader(): JSX.Element {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { isMenuOpen, toggleMenu } = useMobileMenu();

  return (
    <>
      <header className="h-12 bg-[#0A3357] text-white fixed top-0 left-0 right-0 z-50 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          {/* Left section - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              {/* Logo - responsive sizing */}
              <div className="relative h-10 w-40 sm:w-60">
                <Image
                  src="/brand/WalkingGolfer-landscape-white.svg"
                  alt="The Walking Golfer"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Center section - Essential Navigation */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <Link href="/courses" className="hover:text-[#00FFFF]">Course Finder</Link>
            <Link href="/about" className="hover:text-[#00FFFF]">About Us</Link>
            <Link href="/news" className="hover:text-[#00FFFF]">News</Link>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/rate-course"
              className="flex items-center bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0A3357] rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-150"
            >
              <Star className="w-3 h-3 mr-1" />
              <span>Rate</span>
            </Link>
            
            {/* Login/Profile for desktop */}
            {user ? (
              <Link 
                href="/profile"
                className="hidden md:block text-xs hover:text-[#00FFFF]"
              >
                Profile
              </Link>
            ) : (
              <Link 
                href="/login"
                className="hidden md:block text-xs hover:text-[#00FFFF]"
              >
                Login
              </Link>
            )}

            {/* Hamburger menu for mobile */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-1 hover:text-[#00FFFF] transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0A3357] fixed top-12 left-0 right-0 z-50 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-3 sm:px-5">
            <Link
              href="/about"
              className="block px-3 py-2 text-white hover:text-[#00FFFF] font-medium transition-colors"
              onClick={() => toggleMenu()}
            >
              About Us
            </Link>
            <Link
              href="/courses"
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
            <Link
              href="/shop"
              className="block px-3 py-2 text-white hover:text-[#00FFFF] font-medium transition-colors"
              onClick={() => toggleMenu()}
            >
              Shop
            </Link>
            
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
                    void signOut();
                    toggleMenu();
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
    </>
  );
} 