'use client'

import { useState, useEffect, useCallback } from 'react'

import { Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserProfile } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'


export default function CompleteProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [zipcode, setZipcode] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Redirect if not logged in or during auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!user || loading) {
return
}

    setError('')
    setLoading(true)

    // Basic US Zip Code validation (5 digits)
    if (zipcode && !/^\d{5}$/.test(zipcode)) {
        setError('Please enter a valid 5-digit US ZIP code.');
        setLoading(false);
        return;
    }

    try {
      await updateUserProfile(user.uid, { zipcode: zipcode || null });
      console.log('Profile updated successfully for user:', user.uid);
      router.push('/map') // Changed redirect to /map
    } catch (err: unknown) {
      console.error('Failed to update profile:', err)
      if (err instanceof Error) {
        setError(err.message || 'Failed to save profile information.')
      } else {
        setError('An unknown error occurred while saving profile.')
      }
    } finally {
      setLoading(false)
    }
  }, [user, zipcode, loading, router])

  const handleSkip = useCallback(() => {
    if (!user) {
return;
} // Should not happen due to useEffect redirect
    console.log('User skipped profile completion:', user.uid);
    router.push('/map') // Changed redirect to /map
  }, [user, router]);

  // Show loader during auth check or if user is null temporarily
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3357]" />
      </div>
    )
  }

  // Wrapper for form submission
  const onSubmitWrapper = (e: React.FormEvent) => {
    handleSubmit(e).catch(err => {
        console.error("Error during profile update submission:", err);
        setError("An unexpected error occurred while updating profile.");
        setLoading(false);
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 font-sans">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#0A3357]">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-gray-600">
            Help us find courses near you (optional).
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
              <Label htmlFor="zipcode" className="text-gray-700">
                ZIP Code (5 digits)
              </Label>
              <Input
                id="zipcode"
                name="zipcode"
                type="text" // Use text to allow leading zeros, validation handles format
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A3357] focus:border-transparent"
                placeholder="e.g. 90210"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-[#0A3357] text-white font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A3357] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={handleSkip}
              className="text-sm text-gray-600 hover:text-[#0A3357] px-0"
              disabled={loading}
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 