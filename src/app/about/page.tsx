import { MapPin, Users, Award, ArrowRight } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'

import FAQSchema from '@/app/components/FAQSchema'

export const metadata: Metadata = {
  title: 'About Us | Walking Golfer',
  description: 'Learn about the Walking Golfer community and our mission to support golfers who appreciate the physical, mental, and strategic benefits of walking the course.',
}

// FAQ data for schema markup
const aboutFAQs = [
  {
    question: "What is Walking Golfer?",
    answer: "Walking Golfer is a platform dedicated to helping golfers find and review golf courses that are suitable for walking, promoting the traditional experience of playing golf on foot across the United States."
  },
  {
    question: "Who founded Walking Golfer?",
    answer: "Walking Golfer was founded by Rob Rigg, an avid golfer with a vision to celebrate the traditional walking experience in golf and create a community for walking golfers."
  },
  {
    question: "How does walking improve the golf experience?",
    answer: "Walking the course provides better exercise, allows you to experience golf the authentic way, and can help improve your health and fitness."
  },
  {
    question: "What geographic area does Walking Golfer cover?",
    answer: "Walking Golfer focuses specifically on golf courses within the United States, providing detailed information about walkable courses across all 50 states."
  },
  {
    question: "How does Walking Golfer work with partners in the golf industry?",
    answer: "We partner with companies like Stewart Golf who share our passion for walking the course, working together to make playing traditional golf more enjoyable for players of all skill levels."
  }
]

export default function AboutPage(): JSX.Element {
  return (
    <>
      <FAQSchema faqs={aboutFAQs} />
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
          <div className="bg-white rounded-xl shadow-md p-8 mb-24">
            <h2 className="text-3xl font-bold text-[#0A3357] mb-8">Our Story</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <div className="prose prose-lg space-y-6">
                  <p className="text-gray-600">
                    The Walking Golfer was founded by <span className="font-semibold">Rob Rigg</span>, 
                    an avid golfer with a vision to celebrate the traditional walking 
                    experience in golf. What began as a passionate personal project has 
                    evolved into a thriving community dedicated to preserving and promoting 
                    the walking tradition in golf.
                  </p>
                  <blockquote className="border-l-4 border-blue-600 pl-6 italic text-gray-700">
                    "Rob's vision was simple yet profound: create a platform where walking golfers could connect..."
                  </blockquote>
                  <p className="text-gray-600">
                  Rob&apos;s vision was simple yet profound: create a platform where walking 
                  golfers could connect, share experiences, and discover courses designed 
                  with walkers in mind. Today, The Walking Golfer serves as the definitive 
                  resource for thousands of players across the United States who believe 
                  that golf is best enjoyed one step at a time.
                  </p>
                </div>
              </div>
              <div>
                <div className="relative h-[280px] rounded-lg overflow-hidden border-2 border-gray-100">
                  <Image
                    src="/images/about-page/Rob-at-BB.jpg"
                    alt="Rob Rigg, founder of The Walking Golfer"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Rob Rigg, Founder
                </p>
              </div>
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
                  The Walking Golfer is dedicated to preserving the tradition of experiencing the course on foot across the United States, enhancing the connection between
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
                      Build a community of golfers who appreciate the many benefits of walking the course
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden h-[300px] border-2 border-gray-100">
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
                  passion for walking the course. Together, we&apos;re working to make playing the traditional game more enjoyable for players of all skill levels.
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
    </>
  )
} 