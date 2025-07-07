"use client";

import { MapPin, Star, User as UserIcon } from 'lucide-react'; // Icons for actions
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth'; // To personalize the welcome message

export default function WelcomePage() {
  const { user } = useAuth();

  // Display name logic (could be improved with fetching profile if needed)
  const displayName = user?.displayName || 'Walking Golfer';

  return (
    <div className="bg-gray-100 min-h-full py-12 sm:py-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A3357] mb-4">
            Welcome, {displayName}!
          </h1>
          <p className="text-lg text-gray-900">
            Ready to discover and share the best walkable courses in the USA?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Find Courses */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-300 rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-[#0A3357]">
                <MapPin className="w-5 h-5 mr-2" />
                Find Great Walking Courses
              </CardTitle>
              <CardDescription className="text-gray-700 pt-1">
                Explore courses near you and see walkability ratings from fellow golfers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full bg-[#0A3357] text-white hover:bg-[#082945] rounded-lg transition duration-150 ease-in-out py-2 px-4">
                <Link href="/coursefinder">
                  Go to Course Finder
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Rate a Course */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-300 rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-[#0A3357]">
                <Star className="w-5 h-5 mr-2" />
                Rate a Course
              </CardTitle>
              <CardDescription className="text-gray-700 pt-1">
                Share your walking experience and help others by submitting a review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full bg-[#91FF87] text-[#0A3357] hover:bg-[#7fe673] rounded-lg transition duration-150 ease-in-out py-2 px-4">
                <Link href="/add-review">
                  Find a Course to Review
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: View Profile & Reviews */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-300 rounded-lg md:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-[#0A3357]">
                <UserIcon className="w-5 h-5 mr-2" />
                Your Profile, Reviews & Ratings
              </CardTitle>
              <CardDescription className="text-gray-700 pt-1">
                Manage your details and see your past contributions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full bg-[#0A3357] text-white hover:bg-[#082945] rounded-lg transition duration-150 ease-in-out py-2 px-4">
                <Link href="/profile">
                  View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need help? Please <Link href="/contact" className="text-[#0A3357] hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
} 