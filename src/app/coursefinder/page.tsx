'use client'; // Assuming client components for potential future interactive elements or hooks

import Link from 'next/link';
import { MapPin, Search } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CourseFinderPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0A3357] mb-4">
          Find a Walking-Friendly Golf Course
        </h1>
        <p className="text-gray-600 md:text-lg">
          Choose how you'd like to discover great walking golf experiences across the USA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Card 1: Find Courses on Map */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-300 rounded-lg flex flex-col">
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
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-300 rounded-lg flex flex-col">
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