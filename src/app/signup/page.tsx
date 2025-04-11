'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { signUpWithEmail } from '@/lib/firebase/authUtils'
import { createUserProfile, getUserProfile } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true)
      createUserProfile(user)
        .then(() => {
          return getUserProfile(user.uid)
        })
        .then(profile => {
          if (!profile?.zipcode) {
            console.log('Redirecting to complete profile for user:', user.uid)
            router.push('/complete-profile')
          } else {
            console.log('User profile complete, redirecting to courses:', user.uid)
            router.push('/map')
          }
        })
        .catch(err => {
          console.error('Failed to check user profile, redirecting to courses as fallback:', err)
          setError('Could not verify profile status. Redirecting...')
          router.push('/map')
        })
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, router])

  const handleEmailSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || authLoading) return

    setError('')
    setLoading(true)

    try {
      const result = await signUpWithEmail(email, password, name)
      if (result.error) {
        setError(result.error)
      }
    } catch (error: unknown) {
      console.error('Unexpected Sign Up Error:', error)
      if (error instanceof Error) {
        setError(error.message || 'An unexpected error occurred during sign up.')
      } else {
        setError('An unknown error occurred during sign up.')
      }
    } finally {
      setLoading(false)
    }
  }, [email, password, name, loading, authLoading, router])

  const handleGoogleSignUp = useCallback(async () => {
    if (loading || authLoading) return

    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [loading, authLoading, signInWithGoogle, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3357]" />
      </div>
    )
  }

  const onSubmitWrapper = (e: React.FormEvent) => {
    handleEmailSignUp(e).catch(err => {
      console.error("Error during email signup submission:", err)
      setError("An unexpected error occurred during signup.")
      setLoading(false)
    })
  }

  const onGoogleClickWrapper = () => {
    handleGoogleSignUp().catch(err => {
      console.error("Error during Google signup click:", err)
      setError("An unexpected error occurred during Google signup.")
      setLoading(false)
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 pt-16 sm:pt-20 font-sans">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-[#0A3357]">
            Create your account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-[#0A3357] hover:underline"
            >
              sign in to your existing account
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-500 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-4" onSubmit={onSubmitWrapper}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3357] focus:border-transparent"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-address" className="text-gray-700">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3357] focus:border-transparent"
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3357] focus:border-transparent"
                placeholder="Password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || authLoading}
              className="w-full py-2 px-4 rounded-lg bg-[#0A3357] text-white font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3357] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : 'Create account'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={onGoogleClickWrapper}
                disabled={loading || authLoading}
                className="w-full flex items-center justify-center py-2 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3357] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Sign up with Google
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 