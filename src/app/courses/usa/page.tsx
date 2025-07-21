import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Search, Flag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Walkable Golf Courses Across the USA | Walking Golfer',
  description: 'Explore walkable golf courses across all 50 states. Find the best walking-friendly courses from coast to coast with comprehensive ratings and reviews.',
  keywords: [
    'walkable golf courses USA',
    'American walkable golf courses',
    'golf courses to walk United States',
    'best walking golf courses America',
    'US golf course walkability ratings'
  ],
  openGraph: {
    title: 'Walkable Golf Courses Across the USA | Walking Golfer',
    description: 'Explore walkable golf courses across all 50 states. Find the best walking-friendly courses from coast to coast with comprehensive ratings and reviews.',
    url: '/courses/usa',
    siteName: 'Walking Golfer',
    images: [
      {
        url: '/images/og-usa-golf.jpg',
        width: 1200,
        height: 630,
        alt: 'Walkable Golf Courses Across the USA',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Walkable Golf Courses Across the USA | Walking Golfer',
    description: 'Explore walkable golf courses across all 50 states.',
    images: ['/images/og-usa-golf.jpg'],
  },
  alternates: {
    canonical: '/courses/usa',
  },
}

export default function USACoursesPage() {
  // State data with routing information
  const featuredStates = [
    { name: 'California', slug: 'california', courses: '900+', description: 'Oceanfront to desert courses' },
    { name: 'Florida', slug: 'florida', courses: '1000+', description: 'Year-round golfing paradise' },
    { name: 'Texas', slug: 'texas', courses: '900+', description: 'Everything is bigger in Texas' },
    { name: 'Arizona', slug: 'arizona', courses: '300+', description: 'Desert golf at its finest' },
    { name: 'North Carolina', slug: 'north-carolina', courses: '600+', description: 'Mountain and coastal options' },
    { name: 'South Carolina', slug: 'south-carolina', courses: '350+', description: 'Lowcountry and upstate gems' },
    { name: 'New York', slug: 'new-york', courses: '800+', description: 'Historic courses and modern designs' },
    { name: 'Illinois', slug: 'illinois', courses: '500+', description: 'Prairie and lakefront golf' },
    { name: 'Massachusetts', slug: 'massachusetts', courses: '350+', description: 'New England golf tradition' }
  ]

  const allStates = [
    'Alabama', 'Alaska', 'Arkansas', 'Colorado', 'Connecticut', 'Delaware', 'Georgia', 'Hawaii',
    'Idaho', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Dakota', 'Tennessee', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A3357] to-[#0A3357]/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Flag className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Walkable Golf Courses Across the USA
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light">
              From coast to coast, discover America's best walking-friendly golf courses. 
              Explore thousands of courses across all 50 states with detailed walkability ratings.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Overview Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-bold text-[#0A3357] mb-6">
              Discover Walking Golf Across America
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                The United States offers walking golfers an incredible diversity of experiences. From the 
                rugged coastal links of the Pacific Northwest to the rolling hills of the Southeast, from 
                desert courses in the Southwest to mountain layouts in Colorado, every region provides 
                unique walking challenges and rewards.
              </p>
              <p className="leading-relaxed mb-4">
                Our comprehensive database covers walkable golf courses in all 50 states, featuring detailed 
                ratings for terrain, layout, conditions, and overall walking experience. Whether you're 
                planning a golf vacation or looking for local courses, we help you find the perfect 
                walking-friendly options.
              </p>
            </div>
          </div>
        </div>

        {/* Search Tools */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="overflow-hidden">
            <CardHeader className="bg-[#0A3357] text-white">
              <CardTitle className="flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                Interactive Course Map
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Explore walkable courses nationwide on our interactive map. Zoom into any region, 
                filter by walkability rating, and discover courses in your area.
              </p>
              <Button asChild className="w-full bg-[#0A3357] hover:bg-[#0A3357]/90">
                <Link href="/map">Explore National Map</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-[#91FF87] text-[#0A3357]">
              <CardTitle className="flex items-center">
                <Search className="w-6 h-6 mr-2" />
                Course Search
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Search for courses by name, location, or specific criteria. Filter by state, 
                walkability rating, and course type to find your ideal match.
              </p>
              <Button asChild className="w-full bg-[#91FF87] text-[#0A3357] hover:bg-[#91FF87]/90">
                <Link href="/search">Search All Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured States with Dedicated Pages */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#0A3357] mb-8 text-center">
            Featured Golf Destinations
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredStates.map((state) => (
              <Card key={state.slug} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A3357] flex justify-between items-start">
                    <span>{state.name}</span>
                    <span className="text-sm text-gray-500 font-normal">{state.courses}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {state.description}
                  </p>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-[#0A3357] text-[#0A3357] hover:bg-[#0A3357] hover:text-white"
                  >
                    <Link href={`/courses/${state.slug}`}>
                      Explore {state.name} →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Other States */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#0A3357] mb-8 text-center">
            All States
          </h3>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <p className="text-center text-gray-600 mb-6">
              We're continuously expanding our state-specific guides. For now, use our search and map tools 
              to explore courses in these states:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
              {allStates.map((state) => (
                <div 
                  key={state} 
                  className="text-center p-2 rounded border border-gray-200 hover:border-[#0A3357] transition-colors cursor-pointer"
                >
                  <Link 
                    href={`/search?state=${state}`}
                    className="text-gray-700 hover:text-[#0A3357]"
                  >
                    {state}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Click any state to search for courses, or use the tools above for broader exploration.
            </p>
          </div>
        </div>

        {/* Walking Golf Benefits */}
        <Card className="bg-[#0A3357] text-white mb-12">
          <CardContent className="py-8">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-4">
                Why Walk Golf Courses?
              </h3>
              <p className="text-lg mb-6">
                Walking golf courses offers numerous benefits: better exercise, enhanced course appreciation, 
                cost savings, and the traditional golf experience as it was meant to be played. Discover 
                why more golfers are choosing to walk the course.
              </p>
              <Button asChild variant="secondary" className="bg-white text-[#0A3357] hover:bg-gray-100">
                <Link href="/news/benefits-of-walking-the-golf-course">
                  Learn About Walking Benefits
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="text-center">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-[#0A3357] mb-4">
              Start Your Walking Golf Journey
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of golfers who have discovered the joy of walking the course. 
              Find your perfect walking experience and share your own reviews with our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-[#0A3357] hover:bg-[#0A3357]/90">
                <Link href="/coursefinder">Find Courses</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-[#0A3357] text-[#0A3357]">
                <Link href="/walkability-ratings">View Ratings Guide</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-[#0A3357] text-[#0A3357]">
                <Link href="/signup">Join Community</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 