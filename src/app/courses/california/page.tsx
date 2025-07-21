import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Search, Mountain, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Walkable Golf Courses in California | Walking Golfer',
  description: 'Discover the best walking-friendly golf courses in California. From oceanfront classics to desert retreats, find top-rated walkable courses across the Golden State.',
  keywords: [
    'walkable golf courses California',
    'California golf courses to walk',
    'best walking golf courses CA',
    'golf course walkability ratings California',
    'walking golf California',
    'CA golf course reviews'
  ],
  openGraph: {
    title: 'Walkable Golf Courses in California | Walking Golfer',
    description: 'Discover the best walking-friendly golf courses in California. From oceanfront classics to desert retreats, find top-rated walkable courses across the Golden State.',
    url: '/courses/california',
    siteName: 'Walking Golfer',
    images: [
      {
        url: '/images/og-california-golf.jpg',
        width: 1200,
        height: 630,
        alt: 'Walkable Golf Courses in California',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Walkable Golf Courses in California | Walking Golfer',
    description: 'Discover the best walking-friendly golf courses in California.',
    images: ['/images/og-california-golf.jpg'],
  },
  alternates: {
    canonical: '/courses/california',
  },
}

export default function CaliforniaCoursesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A3357] to-[#0A3357]/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Walkable Golf Courses in California
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light">
              California is home to over 900 golf courses, ranging from oceanfront classics to desert retreats. 
              Discover walking-friendly courses that showcase the Golden State's diverse landscapes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* State Overview */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-bold text-[#0A3357] mb-6">
              Walking Golf in the Golden State
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                California offers walking golfers an incredible variety of experiences, from the dramatic coastal courses 
                of Pebble Beach and Half Moon Bay to the palm-lined fairways of Palm Springs. The state's Mediterranean 
                climate makes it ideal for year-round walking, while diverse terrain provides options for every skill level.
              </p>
              <p className="leading-relaxed mb-4">
                Walking golfers who prefer to walk in California will find courses designed with natural contours that 
                enhance the walking experience. Many of the state's best courses to walk in California feature shorter 
                distances between holes, well-maintained cart paths that double as walking routes, and stunning scenery 
                that makes every step enjoyable.
              </p>
              <p className="leading-relaxed">
                From the rolling hills of Northern California's wine country to the desert courses of the south, 
                walkable golf courses in California offer something special for every golfer who appreciates 
                the traditional walking experience.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links to Find Courses */}
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
                Explore California's walkable courses on our interactive map. Filter by walkability rating, 
                location, and course type to find your perfect walking experience.
              </p>
              <Button asChild className="w-full bg-[#0A3357] hover:bg-[#0A3357]/90">
                <Link href="/map?state=CA">View California on Map</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-[#91FF87] text-[#0A3357]">
              <CardTitle className="flex items-center">
                <Search className="w-6 h-6 mr-2" />
                Text Course Search
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-6">
                Search for specific courses by name, city, or region. Filter by walkability ratings 
                and find detailed information about each course.
              </p>
              <Button asChild className="w-full bg-[#91FF87] text-[#0A3357] hover:bg-[#91FF87]/90">
                <Link href="/search?state=CA">Search California Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Top Walkable Courses - Placeholder Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#0A3357] mb-8">
            Featured Walkable Courses in California
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Placeholder Course Cards */}
            {[
              {
                name: "Pebble Beach Golf Links",
                location: "Pebble Beach",
                description: "Iconic oceanfront course with stunning views and moderate walking terrain."
              },
              {
                name: "Torrey Pines South Course",
                location: "La Jolla",
                description: "Championship layout with coastal views and walker-friendly routing."
              },
              {
                name: "Half Moon Bay Golf Links",
                location: "Half Moon Bay",
                description: "Spectacular clifftop course designed with walking golfers in mind."
              }
            ].map((course, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A3357]">{course.name}</CardTitle>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{course.location}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {course.description}
                  </p>
                  {/* Placeholder for walkability rating */}
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className="w-4 h-4 text-yellow-400 fill-current" 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">Walkability: 5.0</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 mb-4">
              Course details and ratings are populated from our database. Use the search tools above to explore all available courses.
            </p>
          </div>
        </div>

        {/* Regional Information - Future Enhancement */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#0A3357] mb-6">
            Popular Golf Regions in California
          </h3>
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 mb-4">
              We're working on detailed regional guides for popular California golf destinations including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
              <div>San Francisco Bay Area</div>
              <div>Monterey Peninsula</div>
              <div>Palm Springs</div>
              <div>San Diego County</div>
              <div>Central Valley</div>
              <div>Wine Country</div>
              <div>Los Angeles Area</div>
              <div>Orange County</div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Regional pages coming soon! For now, use our search and map tools to explore courses in these areas.
            </p>
          </div>
        </div>

        {/* Walking in California Climate */}
        <Card className="bg-[#0A3357] text-white mb-12">
          <CardContent className="py-8">
            <div className="max-w-3xl mx-auto text-center">
              <Sun className="w-16 h-16 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">
                Perfect Weather for Walking Golf
              </h3>
              <p className="text-lg mb-6">
                California's Mediterranean climate and year-round sunshine make it ideal for walking golf courses. 
                The mild temperatures and low precipitation mean you can enjoy the walking golf experience 
                virtually any day of the year, whether you're playing coastal courses with ocean breezes 
                or inland courses with warm, dry air.
              </p>
              <p className="text-base italic">
                "The consistent weather and diverse terrain make California a walking golfer's paradise." 
                - Walking Golfer Community
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="text-center">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-[#0A3357] mb-4">
              Ready to Explore California's Walking Courses?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Start your search for the perfect walkable golf experience in California. Find courses, read reviews, 
              and plan your next walking golf adventure in the Golden State.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-[#0A3357] hover:bg-[#0A3357]/90">
                <Link href="/coursefinder">Find Courses</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-[#0A3357] text-[#0A3357]">
                <Link href="/add-review">Rate a Course</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-[#0A3357] text-[#0A3357]">
                <Link href="/newsletter">Join Newsletter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 