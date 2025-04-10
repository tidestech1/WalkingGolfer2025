'use client';

import { useEffect, useState } from 'react';

import { FaArrowUp } from 'react-icons/fa';

const ScrollToTop = (): JSX.Element | null => {
  const [isVisible, setIsVisible] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);

  // Show button when page is scrolled and check if near footer
  const toggleVisibility = (): void => {
    const scrolled = window.pageYOffset > 100;
    setIsVisible(scrolled);
    
    // Check if user is near the footer
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.scrollY + windowHeight;
    const footerProximity = documentHeight - scrollPosition;
    
    // If within 400px of the bottom, consider it "near footer" (increased from 150px)
    setIsNearFooter(footerProximity < 400);
  };

  // Scroll to top function
  const scrollToTop = (): void => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    
    // Clean up listener
    return (): void => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Define button styles based on position
  const buttonStyle = isNearFooter 
    ? "fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#00FFFF] text-[#0A3357] shadow-lg hover:bg-[#b3ffff] transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3357] h-11 w-11 flex items-center justify-center"
    : "fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#0A3357] text-white shadow-lg hover:bg-[#08294A] transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00FFFF] h-11 w-11 flex items-center justify-center";

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={buttonStyle}
        >
          <FaArrowUp size={20} />
        </button>
      )}
    </>
  );
};

export default ScrollToTop; 