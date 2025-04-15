'use client'

import { useState, useEffect, useCallback } from 'react'

import { getAuth } from 'firebase/auth'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail } from '@/lib/firebase/authUtils'
import { getFirestoreDB } from '@/lib/firebase/firebaseUtils'
import { createUserProfile, getUserProfile, updateUserProfile } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'

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
      const auth = getAuth(getFirestoreDB().app)
      const currentUser = auth.currentUser

      currentUser?.reload().then(async () => {
        const freshUser = auth.currentUser
        const isVerified = freshUser?.emailVerified ?? false

        console.log(`User ${user.uid} emailVerified status after reload: ${isVerified}`)

        if (!isVerified) {
          console.log('User detected in signup flow is not verified. Redirecting to /verify-email')
          router.push('/verify-email')
          return
        }

        setLoading(true)

        try {
          const profile = await getUserProfile(user.uid)

          if (profile && !profile.emailVerified) {
            console.log(`Updating Firestore emailVerified status for user: ${user.uid}`)
            await updateUserProfile(user.uid, { emailVerified: true })
          }

          await createUserProfile(user)
          const finalProfile = profile?.emailVerified ? profile : await getUserProfile(user.uid)

          if (!finalProfile?.zipcode) {
            console.log('Redirecting verified user to complete profile:', user.uid)
            router.push('/complete-profile')
          } else {
            console.log('Verified user profile complete, redirecting to map:', user.uid)
            router.push('/map')
          }
        } catch (err) {
          console.error('Error during profile check/update after verification:', err)
          setError('Could not verify profile status after verification. Redirecting...')
          router.push('/map')
        } finally {
          setLoading(false)
        }

      }).catch(reloadError => {
        console.error("Failed to reload user state:", reloadError)
        setError("Failed to update verification status. Please try logging in again.")
        setLoading(false)
      })
    }
  }, [user, authLoading, router])

  const handleEmailSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || authLoading) {
return
}

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
  }, [email, password, name, loading, authLoading])

  const handleGoogleSignUp = useCallback(async () => {
    if (loading || authLoading) {
return
}

    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message || 'An error occurred during Google Sign-In.')
    } finally {
      setLoading(false)
    }
  }, [loading, authLoading, signInWithGoogle])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
    <div className="flex flex-col items-center bg-gray-50 p-4 pt-16 sm:pt-20 font-sans mb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#0A3357]">Create your account</h2>
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
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </Label>
              <input
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
              <input
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
              <input
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

            <button
              type="submit"
              disabled={loading || authLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || authLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create account'}
            </button>
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
            <button
              onClick={onGoogleClickWrapper}
              disabled={loading || authLoading}
              className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                loading || authLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
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
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 