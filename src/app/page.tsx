import { Heart, Leaf, DollarSign } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { IMAGES } from '@/lib/constants/images'

export default function Home() {
  return (
    <main className="min-h-screen font-outfit">
      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[68vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={IMAGES.backgrounds.hero}
            alt="Beautiful golf course landscape"
            fill
            className="object-cover object-[center_65%] brightness-[0.65]"
            priority
            sizes="100vw"
            quality={90}
          />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 tracking-tight">
            The Walking Golfer
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl mb-8 sm:mb-10 font-light">
            Your Ultimate Guide to Walking-Friendly Golf Courses in the USA
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link 
              href="/courses" 
              className="bg-[#0A3357] hover:bg-[#0A3357]/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors w-full sm:w-auto min-w-[200px]"
            >
              Find Courses
            </Link>
            <Link 
              href="/map" 
              className="bg-white hover:bg-[#00FFFF] text-[#0A3357] px-8 py-4 rounded-lg font-semibold text-lg transition-colors w-full sm:w-auto min-w-[200px]"
            >
              View Map
            </Link>
          </div>
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
