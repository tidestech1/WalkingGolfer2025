'use client';

import { useState } from 'react';
import Image from 'next/image'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer(): JSX.Element {
  const pathname = usePathname();
  const isMapPage = pathname.startsWith('/map');
  const [isExpanded, setIsExpanded] = useState(!isMapPage); // Default to expanded, unless on map page

  return (
    <footer className="bg-[#0A3357] text-white font-outfit">
      <div className="max-w-7xl mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* About Section */}
          <div className="col-span-1 md:col-span-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">The Walking Golfer</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Your trusted resource for finding walking-friendly golf courses across the USA.
            </p>
            <div className="flex space-x-4 justify-center sm:justify-start">
              <a
                href="https://x.com/walkinggolfer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#00FFFF]"
              >
                <span className="sr-only">X (Twitter)</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://facebook.com/thewalkinggolfer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#00FFFF]"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://instagram.com/thewalkinggolfer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#00FFFF]"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li>
                <Link href="/courses" className="text-gray-300 hover:text-[#00FFFF]">
                  Find Courses
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-gray-300 hover:text-[#00FFFF]">
                  Course Map
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-300 hover:text-[#00FFFF]">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-[#00FFFF]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-[#00FFFF]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter - Simplified */}
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center justify-center sm:justify-start">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              Stay Updated
            </h4>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Get the latest walking golf news and course updates delivered to your inbox.
            </p>
            
            {/* Elegant newsletter button */}
            <Link 
              href="/newsletter" 
              className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-transparent border border-[#00FFFF]/60 text-[#00FFFF]/90 hover:bg-[#00FFFF]/10 hover:border-[#00FFFF]/80 hover:text-[#00FFFF] font-medium rounded-md text-sm transition-all duration-200"
            >
              Subscribe to Newsletter
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </Link>
          </div>

          {/* Legal Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Legal</h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-[#00FFFF]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-[#00FFFF]">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Stewart Golf Partnership */}
        <div className="mt-8 pt-8 border-t border-gray-700 relative">
          {/* Stewart Golf partnership section */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-4 sm:gap-6 mb-6 md:mb-0">
            <div className="text-center sm:text-right order-2 sm:order-1">
              <p className="text-gray-300 text-sm sm:text-base">Provided in partnership with Stewart Golf</p>
              <p className="text-gray-300 text-sm italic">Experience the greatest walk in golf</p>
            </div>
            <a 
              href="https://www.stewartgolf.co.uk/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center order-1 sm:order-2"
            >
              <Image 
                src="/brand/stewart-golf-logo-footer.svg"
                alt="Stewart Golf"
                width={180}
                height={45}
                className="h-14 w-auto"
              />
            </a>
          </div>
          
          {/* Desktop copyright (side by side with partnership) */}
          <div className="hidden md:block absolute bottom-0 left-4">
            <p className="text-gray-300 text-left text-xs">
              © {new Date().getFullYear()} The Walking Golfer. All rights reserved.
            </p>
          </div>
           {/* Copyright for mobile/small screens */}
          <div className="md:hidden mt-6 pt-6 border-t border-gray-700/30">
            <p className="text-gray-300 text-center text-xs">
              © {new Date().getFullYear()} The Walking Golfer. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 