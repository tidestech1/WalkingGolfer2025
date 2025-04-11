'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getUserReviews, getUserProfile, updateUserProfile } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CourseReview, DisplayNameType } from '@/types/review'
import type { UserProfile } from '@/types/user'

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ReviewItem from '../courses/[id]/ReviewItem';

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, loading: loadingAuth } = useAuth()
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  
  const [displayNameType, setDisplayNameType] = useState<DisplayNameType | '' >('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialDisplayNameType, setInitialDisplayNameType] = useState<DisplayNameType | '' >('');

  const loadUserData = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoadingData(true);
    try {
      const [userReviews, userProfile] = await Promise.all([
        getUserReviews(user.uid),
        getUserProfile(user.uid)
      ]);

      setReviews(userReviews)
      setProfile(userProfile)
      const currentType = userProfile?.reviewDisplayNameType || 'full';
      setDisplayNameType(currentType);
      setInitialDisplayNameType(currentType);

    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error("Failed to load your profile data. Please refresh the page.");
    } finally {
      setLoadingData(false)
    }
  }, [user])

  useEffect(() => {
    if (!loadingAuth && user) {
      loadUserData()
    }
    if (!loadingAuth && !user) {
        router.push('/login?returnUrl=/profile');
    }
  }, [user, loadingAuth, loadUserData, router])

  async function handleSignOut() {
    try {
      await signOut()
      toast.success("Signed out successfully.")
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error("Failed to sign out.");
    }
  }

  const handleSaveSettings = async () => {
    if (!user || !profile || displayNameType === '' || displayNameType === initialDisplayNameType) {
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { reviewDisplayNameType: displayNameType });
      setProfile(prevProfile => prevProfile ? { ...prevProfile, reviewDisplayNameType: displayNameType } : null);
      setInitialDisplayNameType(displayNameType);
      toast.success("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving profile settings:", error);
      toast.error("Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!user) {
      return null;
  }

  const hasChanges = displayNameType !== '' && displayNameType !== initialDisplayNameType;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{profile?.displayName || user.displayName || 'Your Profile'}</h1>
              <p className="text-gray-600">{profile?.email || user.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </div>
        </div>

        {/* Profile Settings Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
           <h2 className="text-xl font-bold mb-4">Preferences</h2>
           <fieldset disabled={loadingData} className="space-y-4 max-w-sm">
              <div>
                 <Label htmlFor="displayNameType">Review Display Name</Label>
                 <Select 
                    value={displayNameType} 
                    onValueChange={(value) => setDisplayNameType(value as DisplayNameType)}
                  >
                    <SelectTrigger id="displayNameType">
                       <SelectValue placeholder="Select display preference" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="full">Full Name (e.g., John Doe)</SelectItem>
                       <SelectItem value="first_initial">First Name, Last Initial (e.g., John D.)</SelectItem>
                       <SelectItem value="initials">Initials (e.g., J.D.)</SelectItem>
                       <SelectItem value="private">Private Reviewer</SelectItem>
                    </SelectContent>
                 </Select>
                 <p className="text-xs text-gray-500 mt-1">Choose how your name appears on your reviews.</p>
              </div>
              <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? (
                       <>
                         <span className="mr-2 h-4 w-4 inline-block">
                             <LoadingSpinner />
                         </span>
                         Saving...
                       </>
                     ) : (
                      'Save Preferences'
                     )}
                  </Button>
              </div>
           </fieldset>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Your Reviews ({reviews.length})</h2>

          {loadingData ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven&apos;t written any reviews yet.</p>
              <Link
                href="/map"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Find courses to review
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 