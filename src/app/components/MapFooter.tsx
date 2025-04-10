'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

import Footer from './Footer'; // Import the standard Footer

export default function MapFooter(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed for map page

  return (
    <>
      {/* Spacer to prevent content from going under the footer when collapsed */}
      {!isExpanded && <div className="h-8" />}

      {/* Footer Container */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A3357] border-t border-[#1B4571] z-40">
        {/* Expanded Footer Content - Renders the standard Footer */}
        <div 
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <Footer /> {/* Render the actual standard footer content here */}
        </div>

        {/* Mini Footer Bar - Added 'relative' */}
        <div className="relative h-8 min-h-[32px] flex items-center justify-end px-4 text-xs text-white bg-[#0A3357]">
          
          {/* Centered Partnership Text (only when collapsed) - Added text-gray-300 */}
          {!isExpanded && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-300">
              In partnership with Stewart Golf
            </div>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 hover:text-[#00FFFF] relative z-10" // Added relative z-10 to ensure button is clickable over text
            aria-label={isExpanded ? 'Collapse footer' : 'Expand footer'}
          >
            <span>{isExpanded ? 'Less' : 'More'}</span>
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