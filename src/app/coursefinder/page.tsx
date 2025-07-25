import Link from 'next/link';
import { Metadata } from 'next';
import { MapPin, Search } from 'lucide-react';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: 'Course Finder - Find Walkable Golf Courses | Walking Golfer',
  description: 'Find walking-friendly golf courses across the USA. Choose between interactive map search or text-based search to discover your next walkable golf experience.',
  keywords: ['golf course finder', 'walkable golf courses', 'golf course search', 'golf course map', 'find golf courses'],
  openGraph: {
    title: 'Course Finder - Find Walkable Golf Courses | Walking Golfer',
    description: 'Find walking-friendly golf courses across the USA. Choose between interactive map search or text-based search to discover your next walkable golf experience.',
    url: '/coursefinder',
    siteName: 'Walking Golfer',
    images: [
      {
        url: '/images/og-coursefinder.jpg',
        width: 1200,
        height: 630,
        alt: 'Walking Golfer Course Finder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Course Finder - Find Walkable Golf Courses | Walking Golfer',
    description: 'Find walking-friendly golf courses across the USA. Choose between interactive map search or text-based search.',
    images: ['/images/og-coursefinder.jpg'],
  },
  alternates: {
    canonical: '/coursefinder',
  },
}

export default function CourseFinderPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0A3357] mb-4">
          Find a Walking-Friendly Golf Course
        </h1>
        <p className="text-gray-600 md:text-lg">
          Choose how you'd like to discover great walking-friendly golf experiences across the USA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Card 1: Find Courses on Map */}
        <Card className="shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-300 rounded-lg flex flex-col overflow-hidden">
          <div className="relative h-48 w-full overflow-hidden border-b border-gray-200">
            <Image
              src="/course-finder/map-search-1.png"
              alt="Interactive map interface showing golf course locations"
              fill
              className="object-cover object-top transition-transform duration-300 hover:scale-105"
            />
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-[#0A3357] text-xl">
              <MapPin className="w-6 h-6 mr-2 flex-shrink-0" />
              Explore Visually on the Map
            </CardTitle>
            <CardDescription className="text-gray-700 pt-1">
              Best for discovering courses in a specific geographic area or exploring nearby options.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end">
            <Button asChild size="lg" className="w-full bg-[#0A3357] text-white hover:bg-[#082945] rounded-lg transition duration-150 ease-in-out py-3">
              <Link href="/map">
                Go to Interactive Map
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Search by Name/Filters */}
        <Card className="shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-300 rounded-lg flex flex-col overflow-hidden">
          <div className="relative h-48 w-full overflow-hidden border-b border-gray-200">
            <Image
              src="/course-finder/text-search1.png"
              alt="Search interface with filters and course listings"
              fill
              className="object-cover object-top transition-transform duration-300 hover:scale-105"
            />
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-[#0A3357] text-xl">
              <Search className="w-6 h-6 mr-2 flex-shrink-0" />
              Search by Name or Criteria
            </CardTitle>
            <CardDescription className="text-gray-700 pt-1">
              Ideal if you know the golf club or course name, and still want to filter by club facilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end">
            {/* Consider using a different color for variety? Using Accent Green for now */}
            <Button asChild size="lg" className="w-full bg-[#91FF87] text-[#0A3357] hover:bg-[#7fe673] rounded-lg transition duration-150 ease-in-out py-3">
              <Link href="/search">
                Go to List Search
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 