'use client';

import { useState } from 'react';

import { ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function MiniFooter(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Spacer to prevent content from going under the footer */}
      <div className="h-8" />
      
      {/* Footer Container */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A3357] border-t border-[#1B4571] z-40">
        {/* Expanded Footer */}
        <div 
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-64' : 'max-h-0'
          } bg-[#0A3357] border-t border-[#1B4571]`}
        >
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white">
            <div>
              <h4 className="font-semibold mb-2">About Us</h4>
              <ul className="space-y-1">
                <li><Link href="/about" className="hover:text-[#00FFFF]">About TWG</Link></li>
                <li><Link href="/contact" className="hover:text-[#00FFFF]">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-[#00FFFF]">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Golf Courses</h4>
              <ul className="space-y-1">
                <li><Link href="/courses" className="hover:text-[#00FFFF]">All Courses</Link></li>
                <li><Link href="/submit-course" className="hover:text-[#00FFFF]">Submit Course</Link></li>
                <li><Link href="/reviews" className="hover:text-[#00FFFF]">Recent Reviews</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Community</h4>
              <ul className="space-y-1">
                <li><Link href="/blog" className="hover:text-[#00FFFF]">Blog</Link></li>
                <li><Link href="/forum" className="hover:text-[#00FFFF]">Forum</Link></li>
                <li><Link href="/newsletter" className="hover:text-[#00FFFF]">Newsletter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Connect</h4>
              <ul className="space-y-1">
                <li><Link href="/twitter" className="hover:text-[#00FFFF]">Twitter</Link></li>
                <li><Link href="/facebook" className="hover:text-[#00FFFF]">Facebook</Link></li>
                <li><Link href="/instagram" className="hover:text-[#00FFFF]">Instagram</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mini Footer Bar */}
        <div className="h-8 min-h-[32px] flex items-center justify-between px-4 text-xs text-white">
          <div className="flex items-center space-x-4">
            <span>© {new Date().getFullYear()} The Walking Golfer</span>
            <Link href="/privacy" className="hover:text-[#00FFFF]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#00FFFF]">Terms</Link>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 hover:text-[#00FFFF]"
          >
            <span>More</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
} 