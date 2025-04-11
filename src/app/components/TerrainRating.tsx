'use client';

import { Mountain } from 'lucide-react';

// Interface defining the props for the TerrainRating component
interface TerrainRatingProps {
  rating: number; // The currently selected rating (0-5)
  hovered: number; // The rating currently being hovered over (0-5)
  setRating: (rating: number) => void; // Callback to set the rating
  setHovered: (rating: number) => void; // Callback to set the hovered state
  size?: 'sm' | 'md' | 'lg'; // Size variant for the icons
  descriptions?: Record<number, string>; // Optional descriptions for each rating level
}

// Component to visually represent terrain difficulty using mountain icons
// Added return type: JSX.Element
export default function TerrainRating({
  rating,
  hovered,
  setRating,
  setHovered,
  size = 'md', // Default size is medium
  descriptions // Optional rating descriptions
}: TerrainRatingProps): JSX.Element {
  // Define size mappings for each rating level (1-5) and size variant
  const sizeMaps = {
    sm: [12, 14, 16, 18, 20], // Small sizes
    md: [16, 19, 22, 25, 28], // Medium sizes (default)
    lg: [20, 24, 28, 32, 36]  // Large sizes
  };

  // Get the array of sizes based on the selected size variant
  const sizes = sizeMaps[size];

  return (
    <div>
      {/* Container for the mountain icons */}
      <div className="flex gap-1 sm:gap-2 items-end"> {/* Adjust gap */}
        {[1, 2, 3, 4, 5].map((value) => {
          // Determine if the current mountain should be highlighted
          const isHighlighted = value <= (hovered || rating);
          // Get the specific size for this mountain value
          const iconSize = sizes[value - 1];

          return (
            <button
              key={value}
              type="button" // Ensure it's not treated as a submit button in a form
              onClick={() => setRating(value)} // Set rating on click
              onMouseEnter={() => setHovered(value)} // Set hover state on enter
              onMouseLeave={() => setHovered(0)} // Reset hover state on leave
              // Add accessibility attributes
              aria-label={`Set terrain rating to ${value}${descriptions ? `: ${descriptions[value]}` : ''}`}
              className={`p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${isHighlighted ? 'text-blue-600' : 'text-gray-300'} hover:scale-110 transition-transform duration-150 ease-in-out`} // Dynamic text color based on highlight, added focus ring
            >
              <Mountain
                // Apply dynamic size using style prop
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`
                }}
                // Use fill="currentColor" to make the SVG inherit the button's text color
                fill="currentColor"
                strokeWidth={1} // Adjust stroke width if needed
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}