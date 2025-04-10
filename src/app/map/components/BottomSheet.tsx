'use client';

import React, { useRef, useEffect, useState } from 'react';

import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
  snapPoints?: number[]; // Heights in vh where sheet can snap to
  initialSnap?: number; // Index of snapPoints to start at
}

const springConfig = {
  type: "spring" as const,
  damping: 20,
  stiffness: 300
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
  snapPoints = [25, 50, 90], // Default snap points at 25%, 50%, and 90% of viewport height
  initialSnap = 0
}: BottomSheetProps): JSX.Element | null {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [snapPointsPixels, setSnapPointsPixels] = useState<number[]>([]);
  const [windowHeight, setWindowHeight] = useState(0);
  
  // Setup motion values
  const y = useMotionValue(0);

  // Initialize window height and snap points
  useEffect(() => {
    const height = window.innerHeight;
    setWindowHeight(height);
    setSnapPointsPixels(snapPoints.map(point => (height * point) / 100));
  }, [snapPoints]);
  
  // Reset position when sheet opens
  useEffect(() => {
    if (!isOpen || windowHeight === 0 || snapPointsPixels.length === 0) {
return;
}
    
    const snapPosition = snapPointsPixels[initialSnap] ?? snapPointsPixels[0];
    if (typeof snapPosition === 'number') {
      y.set(windowHeight - snapPosition);
    }
  }, [isOpen, initialSnap, snapPointsPixels, y, windowHeight]);

  // Handle drag gesture
  const onDragEnd = (): void => {
    if (windowHeight === 0 || snapPointsPixels.length === 0) {
return;
}
    
    const currentY = y.get();
    
    // Find the closest snap point
    const distances = snapPointsPixels.map((snap, index) => ({
      distance: Math.abs(windowHeight - currentY - snap),
      index
    }));
    
    const closest = distances.reduce((prev, curr) => 
      curr.distance < prev.distance ? curr : prev
    );

    setCurrentSnap(closest.index);
    const targetSnap = snapPointsPixels[closest.index];
    if (typeof targetSnap === 'number') {
      y.set(windowHeight - targetSnap);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = (): void => {
      const height = window.innerHeight;
      setWindowHeight(height);
      const newSnapPoints = snapPoints.map(point => (height * point) / 100);
      setSnapPointsPixels(newSnapPoints);
      
      // Update position to maintain current snap point
      if (isOpen && newSnapPoints.length > 0) {
        const snapPosition = newSnapPoints[currentSnap] ?? newSnapPoints[0];
        if (typeof snapPosition === 'number') {
          y.set(height - snapPosition);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return (): void => window.removeEventListener('resize', handleResize);
  }, [snapPoints, isOpen, currentSnap, y]);

  if (windowHeight === 0 || snapPointsPixels.length === 0) {
return null;
}

  const currentSnapPoint = snapPointsPixels[currentSnap] ?? snapPointsPixels[0];
  if (typeof currentSnapPoint !== 'number') {
return null;
}

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 touch-none z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: windowHeight }}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            style={{ y }}
            initial={{ y: windowHeight }}
            animate={{ y: windowHeight - currentSnapPoint }}
            exit={{ y: windowHeight }}
            transition={springConfig}
            className={cn(
              "fixed left-0 right-0 bottom-0 z-50",
              "bg-white rounded-t-xl shadow-lg",
              "touch-pan-y"
            )}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex flex-col items-center pt-2 pb-4"
                style={{ touchAction: 'none' }}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="px-4 pb-4 flex items-center justify-between border-b border-gray-200">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button 
                  onClick={onClose}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close sheet"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: `${currentSnapPoint - (showHandle ? 40 : 0) - (title ? 60 : 0)}px` }}
            >
              <div className="p-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 