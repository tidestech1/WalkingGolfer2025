import { Metadata } from 'next'

import NewsletterForm from './NewsletterForm'

export const metadata: Metadata = {
  title: 'Newsletter | The Walking Golfer',
  description: 'Subscribe to our newsletter for the latest updates about courses, tips, and Walking Golfer community news.',
}

export default function NewsletterPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-[#0A3357] mb-4">
          Stay Connected with the Walking Golfer
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Get the latest updates about walking-friendly courses, news articles,
          and exclusive content delivered to your inbox.
        </p>

        <div className="bg-white shadow-lg rounded-lg p-8 mb-12">
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-[#0A3357] mb-2">
              Course Updates
            </h3>
            <p className="text-gray-600">
              Be the first to know about new walking-friendly courses and
              updates to existing course information.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-[#0A3357] mb-2">
              News Articles
            </h3>
            <p className="text-gray-600">
              Read the latest news articles and insights about the world of 
              golf and playing the game on foot.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-[#0A3357] mb-2">
              Exclusive Content
            </h3>
            <p className="text-gray-600">
              Get access to golf tips, course reviews, and special offers 
              from our partners focused on golfers who prefer to walk.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 