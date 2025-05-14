import { MapPin, Users, Award, ArrowRight } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About Us | Walking Golfer',
  description: 'Learn about the Walking Golfer community and our mission to promote walking golf across the United States.',
}

export default function AboutPage(): JSX.Element {
  return (
    <main className="bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0A3357] mb-6">
            About The Walking Golfer
          </h1>
          <p className="text-xl text-gray-600">
            Promoting the purest form of the game, one step at a time.
          </p>
        </div>

        {/* Our Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-3xl font-bold text-[#0A3357] mb-6">Our Story</h2>
            <div className="prose prose-lg space-y-6">
              <p className="text-gray-600">
                The Walking Golfer was founded by <span className="font-semibold">Rob Rigg</span>, 
                an avid golfer with a vision to celebrate the traditional walking 
                experience in golf. What began as a passionate personal project has 
                evolved into a thriving community dedicated to preserving and promoting 
                the walking tradition in golf.
              </p>
              <p className="text-gray-600">
                Rob&apos;s vision was simple yet profound: create a platform where walking 
                golfers could connect, share experiences, and discover courses designed 
                with walkers in mind. Today, The Walking Golfer serves as the definitive 
                resource for thousands of players across the United States who believe 
                that golf is best enjoyed one step at a time.
              </p>
            </div>
          </div>
          <div className="relative h-[500px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src="https://placehold.co/1000x1200/0A3357/FFFFFF?text=Image+Placeholder%0ARob+Rigg%0AFounder+of+The+Walking+Golfer"
              alt="Rob Rigg, founder of The Walking Golfer"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Mission Section */}
        <div className="relative rounded-xl overflow-hidden mb-24">
          <div className="absolute inset-0">
            <Image
              alt="Golfer walking on a course"
              className="rounded-lg object-cover w-full h-full"
              height={1080}
              src="/images/about-page/sghero-about.webp"
              style={{
                aspectRatio: "1920/1080",
                objectFit: "cover",
              }}
              width={1920}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A3357]/90 to-transparent" />
          </div>
          <div className="relative py-16 px-8">
            <div className="max-w-xl text-white">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg leading-relaxed">
                The Walking Golfer is dedicated to promoting and preserving the tradition
                of walking golf across the United States, enhancing the connection between
                players, the course, and the game&apos;s rich history.
              </p>
            </div>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-24">
          <h2 className="text-3xl font-bold text-[#0A3357] mb-8 text-center">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Course Information</h3>
                  <p className="text-gray-600">
                    Provide detailed information about walking-friendly golf courses
                    across the USA
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Award className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reviews & Ratings</h3>
                  <p className="text-gray-600">
                    Share reviews and ratings focused on course walkability
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Users className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Community Building</h3>
                  <p className="text-gray-600">
                    Build a community of walking golfers and promote the health benefits
                    of walking golf
                  </p>
                </div>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden h-[300px]">
              <Image
                src="/images/about-page/course-info-page.png"
                alt="Course Info Page"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* Partnership Section */}
        <div className="bg-[#0A3357] rounded-xl shadow-md p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">Our Partnership with Stewart Golf</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="relative h-[200px] rounded-lg overflow-hidden">
              <Image
                src="/images/about-page/StewartGolf-15.jpg"
                alt="Stewart Golf Q Follow Electric Trolley and walking golfers"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg leading-relaxed mb-6">
                We&apos;re proud to partner with Stewart Golf, a company that shares our
                passion for walking golf. Together, we&apos;re working to make walking golf
                more accessible and enjoyable for players of all skill levels.
              </p>
              <a 
                href="https://www.stewartgolfusa.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-white hover:text-blue-200 transition-colors"
              >
                Visit Stewart Golf USA
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 