import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Search, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Golf Course Walkability Ratings | Walking Golfer',
  description: 'Explore comprehensive walkability ratings for golf courses across the USA. Find the best walking-friendly courses based on terrain, distance, and real golfer reviews.',
  keywords: [
    'golf course walkability ratings',
    'walkable golf courses',
    'golf course ratings',
    'walking golf reviews',
    'golf course terrain ratings',
    'best walkable golf courses'
  ],
  openGraph: {
    title: 'Golf Course Walkability Ratings | Walking Golfer',
    description: 'Explore comprehensive walkability ratings for golf courses across the USA. Find the best walking-friendly courses based on terrain, distance, and real golfer reviews.',
    url: '/walkability-ratings',
    siteName: 'Walking Golfer',
    images: [
      {
        url: '/images/og-walkability-ratings.jpg',
        width: 1200,
        height: 630,
        alt: 'Golf Course Walkability Ratings',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Golf Course Walkability Ratings | Walking Golfer',
    description: 'Explore comprehensive walkability ratings for golf courses across the USA.',
    images: ['/images/og-walkability-ratings.jpg'],
  },
  alternates: {
    canonical: '/walkability-ratings',
  },
}

export default function WalkabilityRatingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A3357] to-[#0A3357]/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Golf Course Walkability Ratings
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light">
              Discover the best walkable golf courses across the USA with comprehensive ratings 
              based on terrain, layout, and real golfer experiences.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            Our walkability ratings help you find golf courses that are perfect for walking. 
            Each course is rated on key factors including terrain difficulty, distance between holes, 
            course conditions, and overall walking experience based on reviews from fellow walking golfers.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Star className="w-12 h-12 text-[#0A3357] mx-auto mb-4" />
              <CardTitle className="text-xl text-[#0A3357]">Rating System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Courses are rated 1-5 stars based on terrain, hole spacing, conditions, 
                and cost impact for walking golfers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-[#0A3357] mx-auto mb-4" />
              <CardTitle className="text-xl text-[#0A3357]">Real Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                All ratings come from verified golfers who have actually walked 
                these courses and shared their experiences.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MapPin className="w-12 h-12 text-[#0A3357] mx-auto mb-4" />
              <CardTitle className="text-xl text-[#0A3357]">Nationwide Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Find walkable courses across all 50 states with detailed information 
                about each course's walking experience.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call-to-Action Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="overflow-hidden">
            <CardHeader className="bg-[#0A3357] text-white">
              <CardTitle className="flex items-center">
                <Search className="w-6 h-6 mr-2" />
                Find Courses to Walk
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Use our interactive map to discover highly-rated walkable courses near you. 
                Filter by walkability rating, course type, and location.
              </p>
              <Button asChild className="w-full bg-[#0A3357] hover:bg-[#0A3357]/90">
                <Link href="/map">Explore Course Map</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-[#91FF87] text-[#0A3357]">
              <CardTitle className="flex items-center">
                <Star className="w-6 h-6 mr-2" />
                Share Your Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Help fellow walking golfers by rating courses you've walked. 
                Your reviews help build the most comprehensive walkability database.
              </p>
              <Button asChild className="w-full bg-[#91FF87] text-[#0A3357] hover:bg-[#91FF87]/90">
                <Link href="/add-review">Rate a Course</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Popular State Pages */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#0A3357] text-center mb-8">
            Popular Walking Destinations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'California', slug: 'california' },
              { name: 'Florida', slug: 'florida' },
              { name: 'Texas', slug: 'texas' },
              { name: 'Arizona', slug: 'arizona' },
              { name: 'North Carolina', slug: 'north-carolina' }
            ].map((state) => (
              <Button 
                key={state.slug}
                asChild
                variant="outline"
                className="h-16 border-[#0A3357] text-[#0A3357] hover:bg-[#0A3357] hover:text-white"
              >
                <Link href={`/courses/${state.slug}`}>
                  {state.name}
                </Link>
              </Button>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button asChild variant="ghost" className="text-[#0A3357]">
              <Link href="/courses/usa">View All States →</Link>
            </Button>
          </div>
        </div>

        {/* Additional Resources */}
        <Card className="bg-[#0A3357] text-white">
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">
                New to Walking Golf Courses?
              </h3>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Learn about the benefits of walking the course, tips for getting started, 
                and what to look for in walking-friendly facilities.
              </p>
              <Button asChild variant="secondary" className="bg-white text-[#0A3357] hover:bg-gray-100">
                <Link href="/news/benefits-of-walking-the-golf-course">
                  Benefits of Walking Golf Courses
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 