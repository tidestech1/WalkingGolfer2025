'use client'

import { useState } from 'react'
import { Mail, Check, X } from 'lucide-react'
import { subscribeToNewsletter } from '@/lib/firebase/newsletterUtils'

interface ArticleNewsletterSignupProps {
  className?: string
}

export default function ArticleNewsletterSignup({ className = '' }: ArticleNewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')
    
    try {
      const result = await subscribeToNewsletter({
        email,
        preferences: {
          courseUpdates: true,
          newsArticles: true,
          tips: true,
          offers: false
        },
        status: 'active'
      })
      
      if (result.success) {
        setStatus('success')
        setMessage('Successfully subscribed! Thank you for joining our community.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(result.error || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetStatus = () => {
    setStatus('idle')
    setMessage('')
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Get More Walking Golf Insights
          </h3>
          
          <p className="text-gray-600 mb-4 text-sm">
            Join our community of golfers who walk the course. Get weekly updates on new walkable courses, 
            walking tips, and equipment reviews delivered to your inbox.
          </p>

          {status === 'success' ? (
            <div className="flex items-center space-x-2 text-green-700 bg-green-50 rounded-md p-3">
              <Check className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status !== 'idle') resetStatus()
                  }}
                  placeholder="Enter your email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              
              {status === 'error' && (
                <div className="flex items-center space-x-2 text-red-700 bg-red-50 rounded-md p-3">
                  <X className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{message}</span>
                </div>
              )}
            </form>
          )}
          
          <p className="text-xs text-gray-500 mt-3">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  )
} 