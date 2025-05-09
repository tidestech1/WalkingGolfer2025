'use client'

import { useState, useTransition } from 'react'
// import { subscribeToNewsletter } from '@/lib/firebase/newsletterUtils'
// import type { CreateNewsletterSubscription } from '@/types/newsletter'
import { subscribeToKlaviyo } from './actions' // Import the server action

// Define a type for the server action result to provide better UI feedback
interface SubmissionStatus {
  success: boolean | null;
  message: string | null;
}

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  // const [loading, setLoading] = useState(false) // Replaced by useTransition
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<SubmissionStatus>({ success: null, message: null })

  const [preferences, setPreferences] = useState({
    courseUpdates: true,
    newsArticles: true,
    tips: true,
    offers: false,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) {
      setStatus({ success: false, message: 'Email address is required.' })
      return
    }

    // setLoading(true)
    setStatus({ success: null, message: null }) // Reset status before new submission

    startTransition(async () => {
      try {
        // const subscriptionData: CreateNewsletterSubscription = {
        //   email,
        //   preferences,
        //   status: 'active'
        // }

        // const result = await subscribeToNewsletter(subscriptionData)
        const result = await subscribeToKlaviyo(email, preferences)

        if (result.success) {
          console.log('Newsletter subscription successful for:', email, result.message)
          setStatus({ success: true, message: result.message || 'Successfully subscribed!' })
          setEmail('') // Reset email on success
          // Reset preferences if needed, or keep them for next potential submission
          // setPreferences({
          //   courseUpdates: true,
          //   newsArticles: true,
          //   tips: true,
          //   offers: false
          // })
        } else {
          console.error('Subscription error:', result.message || 'Failed to subscribe')
          setStatus({ success: false, message: result.message || 'Failed to subscribe. Please try again.' })
        }
      } catch (err) {
        console.error('Subscription error:', err)
        let errorMessage = 'An unexpected error occurred.'
        if (err instanceof Error) {
          errorMessage = err.message
        }
        setStatus({ success: false, message: `Subscription failed: ${errorMessage}` })
      } finally {
        // setLoading(false)
      }
    })
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
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  courseUpdates: e.target.checked,
                }))
              }
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Course Updates</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.newsArticles}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  newsArticles: e.target.checked,
                }))
              }
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">News Articles</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.tips}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  tips: e.target.checked,
                }))
              }
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Walking Golf Tips</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.offers}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  offers: e.target.checked,
                }))
              }
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Partner Offers</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !email}
        className="w-full bg-[#0A3357] text-white py-3 px-4 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Subscribing...' : 'Subscribe to Newsletter'}
      </button>

      {/* Display success or error messages */}
      {status.message && (
        <p
          className={`text-sm text-center ${status.success ? 'text-green-600' : 'text-red-600'
            }`}
        >
          {status.message}
        </p>
      )}

      <p className="text-sm text-gray-500 text-center">
        By subscribing, you agree to receive marketing emails from The Walking
        Golfer. You can unsubscribe at any time.
      </p>
    </form>
  )
} 