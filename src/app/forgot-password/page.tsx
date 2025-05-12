'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' 
import { Label } from '@/components/ui/label'
import { sendPasswordReset } from '@/lib/firebase/authUtils' 

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handlePasswordReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const result = await sendPasswordReset(email)
      if (result.success) {
        setMessage('Password reset email sent! Please check your inbox (and spam folder).')
        setEmail('') // Clear email field on success
      } else {
        setError(result.error || 'Failed to send password reset email.')
      }
    } catch (err) {
      console.error('Password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, loading])

  return (
    <div className="flex flex-col items-center bg-gray-50 p-4 pt-16 sm:pt-20 font-sans mb-16">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0A3357]">Forgot Password?</h2>
          <p className="text-gray-600 mt-2">Enter your email address and we&apos;ll send you a link to reset your password.</p>
        </div>

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                {/* Simple error icon */} 
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.707-4.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordReset}>
          <div className="mb-4">
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
} 