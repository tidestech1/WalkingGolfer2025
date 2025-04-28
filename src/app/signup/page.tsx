'use client'

import { useState, useEffect, useCallback } from 'react'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' // Assuming Input is used, if not remove
import { Label } from '@/components/ui/label' // Assuming Label is used, if not remove
import { signUpWithEmail, formatAuthError } from '@/lib/firebase/authUtils'
import { useAuth } from '@/lib/hooks/useAuth'

export default function SignUpPage() {
  const router = useRouter()
  // user object from useAuth will reflect verified status after AuthContext updates
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) // Local loading state for form submission/profile check
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  const handleEmailSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || authLoading) {
return;
}

    setError('');
    setLoading(true);
    setShowVerificationMessage(false);

    try {
      const result = await signUpWithEmail(email, password, name);
      if (result.error) {
        setError(result.error);
      } else {
        setShowVerificationMessage(true);
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (error: unknown) {
      console.error('Unexpected Sign Up Error:', error);
      setError(formatAuthError(error) || 'An unknown error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  }, [email, password, name, loading, authLoading]);

  const handleGoogleSignUp = useCallback(async () => {
    if (loading || authLoading) {
return;
}
    setError('');
    setLoading(true);
    setShowVerificationMessage(false);

    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(formatAuthError(error) || 'An error occurred during Google Sign-In.');
    } finally {
      setLoading(false);
    }
  }, [loading, authLoading, signInWithGoogle]);

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-[#0A3357] mb-4">Thank You & Check Your Email!</h1>
          <p className="text-gray-700 mb-6">
            We've sent a verification link to your email address.
            Please click the link in the email to activate your account.
          </p>
          <p className="text-gray-600 mb-6">
            Once verified, you will be registered and can publish course reviews.
            The verification link will take you to the next step: completing your profile.
          </p>
          <Button asChild variant="outline" className="w-full mt-4 border-[#0A3357] text-[#0A3357] hover:bg-[#0A3357]/10">
            <Link href="/login">
              Go to Login (after verifying)
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-50 p-4 pt-16 sm:pt-20 font-sans mb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#0A3357]">Create your account</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
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
          <form onSubmit={handleEmailSignUp}>
            <div className="mb-4">
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full name"
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email address"
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || authLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || authLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <><Loader2 className="inline mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : 'Create account'}
            </Button>
          </form>

          <Button asChild variant="outline" className="w-full mt-4 border-[#0A3357] text-[#0A3357] hover:bg-[#0A3357]/10">
            <Link href="/login">
              Already have an account? Sign in
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={loading || authLoading}
              className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                loading || authLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="w-5 h-5 mr-2">{/* Google Icon */}</svg>}
              Sign up with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 