'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import React from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { signInWithEmail } from '@/lib/firebase/authUtils'
import { useAuth } from '@/lib/hooks/useAuth'

// Wrap the component logic in a separate function to use hooks
const LoginContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || ''

  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle navigation after successful auth
  useEffect(() => {
    if (!authLoading && user) {
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/welcome');
      }
    }
  }, [user, authLoading, router, returnUrl]);

  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) {
      return;
    }

    setError('')
    setLoading(true)

    try {
      const result = await signInWithEmail(email, password)
      if (result.error) {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }, [email, password, loading])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const onSubmitWrapper = (e: React.FormEvent) => {
    handleEmailLogin(e).catch(err => {
      console.error("Error during email login submission:", err);
      setError("An unexpected error occurred during login.");
      setLoading(false);
    });
  }

  return (
    <div className="flex flex-col items-center bg-gray-50 p-4 pt-16 sm:pt-20 font-sans mb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#0A3357]">Welcome back</h2>
          <p className="text-gray-600 mt-2">Sign in to your Walking Golfer account</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form onSubmit={onSubmitWrapper}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </form>

          <Button asChild variant="outline" className="w-full mt-4 border-[#0A3357] text-[#0A3357] hover:bg-[#0A3357]/10">
            <Link href="/signup">
              Don&apos;t have an account? Sign up
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(): JSX.Element {
  // Define a simple loading fallback UI
  const fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <LoginContent />
    </Suspense>
  );
} 