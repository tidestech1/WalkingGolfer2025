import { Heart, Leaf, DollarSign, Star, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { IMAGES } from '@/lib/constants/images'

export default function Home() {
  return (
    <main className="min-h-screen font-outfit">
      {/* Hero Section */}
      <section className="relative h-[75vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/backgrounds/hero-walking-couple.png"
            alt="Man and woman walking on a scenic golf course"
            fill
            className="object-cover object-center brightness-[0.65]"
            priority
            sizes="100vw"
            quality={90}
          />
        </div>
        <div className="relative z-10 text-white px-4 sm:px-8 md:px-16 lg:px-24 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
            Find the Best Walkable Golf Courses in the USA
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 font-light">
            Use our interactive map to search walkable courses near you, and rate your favorites.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <Button 
              asChild
              className="w-full sm:flex-1 h-12 px-10 text-lg bg-[#00FFFF] text-[#0A3357] hover:bg-[#00FFFF]/60 transition-colors duration-150 ease-in-out"
            >
              <Link href="/coursefinder" className="flex items-center justify-center">
                FIND A COURSE
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="w-full sm:flex-1 h-12 px-10 text-lg bg-transparent border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/10 hover:text-[#00FFFF] transition-colors duration-150 ease-in-out"
            >
              <Link href="/add-review" className="flex items-center justify-center">
                <Star className="mr-2 h-5 w-5 text-yellow-500" fill="currentColor" />
                Rate a Course
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute z-10 bottom-8 right-8 md:bottom-12 md:right-12 lg:bottom-16 lg:right-16 hidden md:block">
          <Link href="/coursefinder" className="block group">
            <Image
              src="/icons/mini-map.png"
              alt="Mini map illustration"
              width={270}
              height={270}
              className="rounded-full border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mb-2 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Explore Nearby Courses
            </span>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-10 sm:mb-16 text-[#0A3357]">
            Why Choose Walking Golf?
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Heart 
                  className="w-12 h-12 text-[#0A3357]" 
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#0A3357]">Better Exercise</h3>
              <p className="text-gray-600 text-lg">
                Walk up to 5 miles per round and burn more calories while enjoying the game.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Leaf 
                  className="w-12 h-12 text-[#0A3357]" 
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#0A3357]">Connect with Nature</h3>
              <p className="text-gray-600 text-lg">
                Experience the course as it was meant to be enjoyed, at a natural pace.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <DollarSign 
                  className="w-12 h-12 text-[#0A3357]" 
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#0A3357]">Save Money</h3>
              <p className="text-gray-600 text-lg">
                Eliminate cart fees and reduce your cost per round.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 bg-[#0A3357]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-[#0A3357]">
            Join Our Walking Golf Community
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Discover walking-friendly courses, share your experiences, and connect with other walking golfers.
          </p>
          <Link 
            href="/signup" 
            className="bg-[#0A3357] hover:bg-[#0A3357]/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block min-w-[200px]"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </main>
  )
}
