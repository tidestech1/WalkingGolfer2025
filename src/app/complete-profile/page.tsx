'use client'

import { useState, useEffect, useCallback } from 'react'

import { Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { completeUserProfile, updateUserProfile, deriveStateFromZipcode } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import type { ProfileCompletionData } from '@/types/user'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [profileData, setProfileData] = useState<ProfileCompletionData | null>(null)
  const [completing, setCompleting] = useState<boolean>(false)
  const [completed, setCompleted] = useState<boolean>(false)

  // Check for stored profile data and complete profile automatically
  useEffect(() => {
    console.log('CompleteProfile useEffect - authLoading:', authLoading, 'user:', !!user);
    
    if (!authLoading && user) {
      const storedData = localStorage.getItem('pendingProfileData');
      console.log('Stored profile data:', storedData);
      
      if (storedData) {
        try {
          const parsedData: ProfileCompletionData = JSON.parse(storedData);
          console.log('Parsed profile data:', parsedData);
          setProfileData(parsedData);
          
          // Automatically complete the profile with stored data
          completeProfileWithStoredData(parsedData);
        } catch (err) {
          console.error('Error parsing stored profile data:', err);
          // If stored data is invalid, redirect to manual completion
          router.push('/complete-profile-manual');
        }
      } else {
        console.log('No stored profile data found, redirecting to manual completion');
        // No stored data, redirect to manual completion
        router.push('/complete-profile-manual');
      }
    }
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const completeProfileWithStoredData = useCallback(async (data: ProfileCompletionData) => {
    console.log('completeProfileWithStoredData called with:', data);
    console.log('User:', user?.uid, 'Loading:', loading);
    
    if (!user || loading) {
      console.log('Exiting early - no user or already loading');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Calling completeUserProfile with:', user.uid, data);
      await completeUserProfile(user.uid, data);
      
      // Clear the stored data
      localStorage.removeItem('pendingProfileData');
      
      console.log('Profile completed successfully for user:', user.uid);
      router.push('/welcome');
    } catch (err: unknown) {
      console.error('Failed to complete profile:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to complete profile.');
      } else {
        setError('An unknown error occurred while completing profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;

    const completeProfile = async () => {
      try {
        setError('');
        setCompleting(true);
        
        // Get stored profile data from signup
        const storedData = localStorage.getItem('pendingProfileData');
        if (!storedData) {
          console.log('No pending profile data found, redirecting to manual completion');
          router.push('/complete-profile-manual');
          return;
        }

        const profileData = JSON.parse(storedData);
        console.log('Completing profile with stored data:', profileData);

        // Basic profile completion with signup data
        const derivedState = profileData.zipcode ? deriveStateFromZipcode(profileData.zipcode) : null;
        const basicProfileData = {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          zipcode: profileData.zipcode || '',
          profileCompleted: true,
          profileCompletedAt: new Date().toISOString(),
          // Only include homeState if we successfully derived it
          ...(derivedState && { homeState: derivedState })
        };

        await updateUserProfile(user.uid, basicProfileData);
        
        // Clear the stored data
        localStorage.removeItem('pendingProfileData');
        
        setCompleting(false);
        setCompleted(true);
        
        // Redirect to profile page after a short delay
        setTimeout(() => {
          router.push('/profile?welcome=true');
        }, 2000);
        
      } catch (err) {
        console.error('Error completing profile:', err);
        setError('Failed to complete profile. Please try again.');
        setCompleting(false);
      }
    };

    completeProfile();
  }, [user, loading, router]);

  // Show loader during auth check, profile completion, or if user is null temporarily
  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A3357] mx-auto mb-4" />
          <p className="text-gray-600">
            {loading ? 'Completing your profile...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // If there's an error, show it with option to retry
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 font-sans">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              Profile Completion Failed
            </CardTitle>
            <CardDescription className="text-gray-600">
              There was an issue completing your profile.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={() => profileData && completeProfileWithStoredData(profileData)}
                disabled={loading || !profileData}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/complete-profile-manual')}
                className="w-full"
              >
                Complete Profile Manually
              </Button>
              
              <Button
                variant="link"
                onClick={() => router.push('/welcome')}
                className="w-full text-sm"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600">We're setting up your Walking Golfer profile...</p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Development Info</h3>
              <p className="text-xs text-yellow-700 mb-2">Profile data in localStorage:</p>
              <pre className="text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-32">
                {typeof window !== 'undefined' ? 
                  JSON.stringify(JSON.parse(localStorage.getItem('pendingProfileData') || '{}'), null, 2) : 
                  'N/A (server-side)'
                }
              </pre>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem('pendingProfileData', JSON.stringify({
                      firstName: 'Test',
                      lastName: 'User',
                      zipcode: '10001',
                      golfingExperience: 'intermediate',
                      preferredCarryMethod: 'carry_bag',
                      favoriteStates: ['CA', 'FL'],
                      marketingConsent: true
                    }));
                    window.location.reload();
                  }}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Load Test Data
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('pendingProfileData');
                    window.location.reload();
                  }}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear Data
                </button>
              </div>
            </div>
          )}

          <Card className="w-full max-w-md shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-[#0A3357]">
                Welcome to The Walking Golfer!
              </CardTitle>
              <CardDescription className="text-gray-600">
                We're setting up your profile with the information you provided.
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#0A3357] mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Completing your profile...
              </p>
              
              {profileData && (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3">
                  <p><strong>Name:</strong> {profileData.firstName} {profileData.lastName}</p>
                  <p><strong>Location:</strong> {profileData.zipcode}</p>
                  <p><strong>Experience:</strong> {profileData.golfingExperience}</p>
                  <p><strong>Walking Method:</strong> {profileData.preferredCarryMethod.replace('_', ' ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 