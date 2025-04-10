'use client'

import { useState } from 'react'

import { subscribeToNewsletter } from '@/lib/firebase/newsletterUtils'
import type { CreateNewsletterSubscription } from '@/types/newsletter'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    courseUpdates: true,
    communityStories: true,
    tips: true,
    offers: false
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) { return }

    setLoading(true)

    try {
      const subscriptionData: CreateNewsletterSubscription = {
        email,
        preferences,
        status: 'active'
      }

      const result = await subscribeToNewsletter(subscriptionData)
      
      if (result.success) {
        console.log('Newsletter subscription successful for:', email)
        setEmail('')
        setPreferences({
          courseUpdates: true,
          communityStories: true,
          tips: true,
          offers: false
        })
      } else {
        console.error('Subscription error:', result.error || 'Failed to subscribe')
      }
    } catch (err) {
      console.error('Subscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-lg font-medium text-[#0A3357] mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email"
        />
      </div>

      <div className="space-y-4">
        <p className="text-lg font-medium text-[#0A3357]">
          I&apos;m interested in receiving:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.courseUpdates}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                courseUpdates: e.target.checked
              }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Course Updates</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.communityStories}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                communityStories: e.target.checked
              }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Community Stories</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.tips}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                tips: e.target.checked
              }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Walking Golf Tips</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.offers}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                offers: e.target.checked
              }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Partner Offers</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-[#0A3357] text-white py-3 px-4 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Subscribing...' : 'Subscribe to Newsletter'}
      </button>

      <p className="text-sm text-gray-500 text-center">
        By subscribing, you agree to receive marketing emails from The Walking
        Golfer. You can unsubscribe at any time.
      </p>
    </form>
  )
} 