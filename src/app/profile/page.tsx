'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getUserReviews, getUserProfile, getProfileCompletionPercentage } from '@/lib/firebase/userUtils'
import { updateProfileViaAPI } from '@/lib/api/profileApi'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CourseReview, DisplayNameType } from '@/types/review'
import type { UserProfile, UserProfileUpdate } from '@/types/user'
import type { GolfCourse } from '@/types/course';
import { getCourseById } from '@/lib/firebase/courseUtils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageUpload from '@/app/components/ImageUpload';

import ProfileReviewCard from './ProfileReviewCard';

// US states for favorite states selection
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington D.C.' }
];

function ProfilePageContent() {
  const router = useRouter()
  const { user, signOut, loading: loadingAuth } = useAuth()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [coursesDetails, setCoursesDetails] = useState<Record<string, GolfCourse>>({});
  const [activeTab, setActiveTab] = useState('overview')

  // Form states for editing
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingGolf, setEditingGolf] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [editingCommunications, setEditingCommunications] = useState(false)
  
  // Personal info editing
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  
  // Golf preferences editing
  const [golfingExperience, setGolfingExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'professional' | ''>('')
  const [preferredCarryMethod, setPreferredCarryMethod] = useState<'carry' | 'push_cart' | 'electric_cart' | ''>('')
  const [golfHandicap, setGolfHandicap] = useState('')
  
  // Location editing
  const [zipcode, setZipcode] = useState('')
  const [favoriteStates, setFavoriteStates] = useState<string[]>([])
  
  // Communications editing
  const [displayNameType, setDisplayNameType] = useState<DisplayNameType | '' >('');
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false);

  // Welcome state for new users
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);

  // Profile photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

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
      
      if (userProfile) {
        // Initialize form states with existing data
        setFirstName(userProfile.firstName || '');
        setLastName(userProfile.lastName || '');
        setDateOfBirth(userProfile.dateOfBirth || '');
        setGolfingExperience(userProfile.golfingExperience || '');
        setPreferredCarryMethod(userProfile.preferredCarryMethod || '');
        setGolfHandicap(userProfile.golfHandicap?.toString() || '');
        setZipcode(userProfile.zipcode || '');
        setFavoriteStates(userProfile.favoriteStates || []);
        setDisplayNameType(userProfile.reviewDisplayNameType || 'full');
        setEmailNotifications(userProfile.preferences?.emailNotifications || false);
        setNewsletterSubscribed(userProfile.preferences?.newsletterSubscribed || false);
        setMarketingConsent(userProfile.marketingConsent || false);
      }

      // Fetch course details for each review
      if (userReviews.length > 0) {
        const courseIds = Array.from(new Set(userReviews.map(r => r.courseId)));
        const coursePromises = courseIds.map(id => getCourseById(id));
        const fetchedCoursesArray = await Promise.all(coursePromises);
        
        const details: Record<string, GolfCourse> = {};
        fetchedCoursesArray.forEach(course => {
          if (course) {
            details[course.id] = course;
          }
        });
        setCoursesDetails(details);
      }

    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error loading user data or course details:', error)
      }
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

  useEffect(() => {
    if (isWelcome && user && !loadingAuth) {
      setShowWelcomePrompt(true);
      // Remove the welcome parameter from URL
      router.replace('/profile', { scroll: false });
    }
  }, [isWelcome, user, loadingAuth, router]);

  async function handleSignOut() {
    try {
      await signOut()
      toast.success("Signed out successfully.")
      router.push('/')
    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error signing out:', error)
      }
      toast.error("Failed to sign out.");
    }
  }

  const handleSavePersonal = async () => {
    if (!user || !profile || isSaving) return;
    
    setIsSaving(true);
    try {
      const updateData: UserProfileUpdate = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      };
      
      if (dateOfBirth) {
        updateData.dateOfBirth = dateOfBirth;
      }
      
      await updateProfileViaAPI(updateData);
      await loadUserData(); // Reload profile data
      setEditingPersonal(false);
      toast.success("Personal information updated successfully!");
    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error saving personal info:", error);
      }
      toast.error("Failed to update personal information.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGolf = async () => {
    if (!user || !profile || isSaving) return;
    
    setIsSaving(true);
    try {
      const updateData: UserProfileUpdate = {};
      
      // Only update if values are valid enum values (not empty strings)
      if (['beginner', 'intermediate', 'advanced', 'professional'].includes(golfingExperience)) {
        updateData.golfingExperience = golfingExperience as 'beginner' | 'intermediate' | 'advanced' | 'professional';
      }
      
      if (['carry', 'push_cart', 'electric_cart'].includes(preferredCarryMethod)) {
        updateData.preferredCarryMethod = preferredCarryMethod as 'carry' | 'push_cart' | 'electric_cart';
      }
      
      if (golfHandicap) {
        updateData.golfHandicap = Number(golfHandicap);
      }
      
      await updateProfileViaAPI(updateData);
      await loadUserData();
      setEditingGolf(false);
      toast.success("Golf preferences updated successfully!");
    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error saving golf preferences:", error);
      }
      toast.error("Failed to update golf preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!user || !profile || isSaving) return;
    
    setIsSaving(true);
    try {
      const updateData: UserProfileUpdate = {
        zipcode: zipcode.trim(),
        favoriteStates,
      };
      
      await updateProfileViaAPI(updateData);
      await loadUserData();
      setEditingLocation(false);
      toast.success("Location preferences updated successfully!");
    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error saving location:", error);
      }
      toast.error("Failed to update location.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCommunications = async () => {
    if (!user || !profile || isSaving) return;
    
    setIsSaving(true);
    try {
      const updateData: UserProfileUpdate = {
        reviewDisplayNameType: displayNameType as DisplayNameType,
        preferences: {
          emailNotifications,
          newsletterSubscribed,
        },
        marketingConsent,
      };
      
      await updateProfileViaAPI(updateData);
      await loadUserData();
      setEditingCommunications(false);
      toast.success("Communication preferences updated successfully!");
    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error saving communications:", error);
      }
      toast.error("Failed to update communication preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFavoriteStateChange = (stateCode: string, checked: boolean) => {
    if (checked) {
      setFavoriteStates(prev => [...prev, stateCode]);
    } else {
      setFavoriteStates(prev => prev.filter(code => code !== stateCode));
    }
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file || !user) return;
    
    setUploadingPhoto(true);
    try {
      const { uploadUserProfilePhoto } = await import('@/lib/firebase/userUtils');
      const photoURL = await uploadUserProfilePhoto(user.uid, file);
      
      // Reload user data to get the updated profile
      await loadUserData();
      
      toast.success("Profile photo updated successfully!");
      setShowPhotoUpload(false);
    } catch (error) {
      // Log error for debugging but don't expose details in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error uploading photo:', error);
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to upload photo";
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading your profile..." />
      </div>
    );
  }
  
  if (!user) {
      return null;
  }

  const completionPercentage = profile ? getProfileCompletionPercentage(profile) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Dialog for New Users */}
      <Dialog open={showWelcomePrompt} onOpenChange={setShowWelcomePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Welcome to Walking Golfer! 🏌️‍♀️</DialogTitle>
            <DialogDescription className="text-center">
              Your account has been created successfully! To get personalized course recommendations, 
              we'd love to learn about your golf preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={() => {
                setShowWelcomePrompt(false);
                setActiveTab('golf');
              }}
              className="w-full"
            >
              Complete Golf Preferences
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowWelcomePrompt(false)}
              className="w-full"
            >
              I'll do this later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={() => setShowPhotoUpload(true)}
                    className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                    title="Change profile photo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-2">{profile?.displayName || user.displayName || 'Your Profile'}</h1>
                <p className="text-gray-600 mb-4">{profile?.email || user.email}</p>
                
                {/* Profile Completion Progress */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                      {completionPercentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${completionPercentage}%`}}
                    ></div>
                  </div>
                  {completionPercentage < 100 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Complete your profile to get better course recommendations
                    </p>
                  )}
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="flex-shrink-0">
                <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
              </div>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1 bg-gray-100 rounded-lg border border-gray-200">
              <TabsTrigger 
                value="overview" 
                className="text-sm font-medium py-2.5 px-3 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="personal" 
                className="text-sm font-medium py-2.5 px-3 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Personal
              </TabsTrigger>
              <TabsTrigger 
                value="golf" 
                className="text-sm font-medium py-2.5 px-3 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Golf
              </TabsTrigger>
              <TabsTrigger 
                value="location" 
                className="text-sm font-medium py-2.5 px-3 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Location
              </TabsTrigger>
              <TabsTrigger 
                value="communications" 
                className="text-sm font-medium py-2.5 px-3 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Communications
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                  <CardDescription>Overview of your Walking Golfer profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#0A3357]">{reviews.length}</div>
                      <div className="text-sm text-gray-600">Reviews Written</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#0A3357]">{profile?.homeState || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Home State</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#0A3357]">
                        {profile?.preferredCarryMethod?.replace('_', ' ') || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Walking Style</div>
                    </div>
                  </div>
                  
                  {/* Profile Completion Progress */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Profile Completion</h3>
                      <span className="text-sm font-medium text-blue-600">{completionPercentage}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    
                    {/* Contextual Prompts for Missing Information */}
                    <div className="space-y-3">
                      {!profile?.golfingExperience && (
                        <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-shrink-0 mr-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900">Share Your Golf Experience</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Help us recommend courses that match your skill level and preferences.
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-2" 
                              onClick={() => setActiveTab('golf')}
                            >
                              Add Golf Info
                            </Button>
                          </div>
                        </div>
                      )}

                      {!profile?.preferredCarryMethod && (
                        <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex-shrink-0 mr-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-green-900">Walking Method Preference</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Tell us how you prefer to carry your clubs for better course recommendations.
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-2" 
                              onClick={() => setActiveTab('golf')}
                            >
                              Set Walking Method
                            </Button>
                          </div>
                        </div>
                      )}

                      {(!profile?.favoriteStates || profile?.favoriteStates.length === 0) && (
                        <div className="flex items-start p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex-shrink-0 mr-3">
                            <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-purple-900">Travel Preferences</h4>
                            <p className="text-sm text-purple-700 mt-1">
                              Share your favorite states for golf travel to discover new courses.
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-2" 
                              onClick={() => setActiveTab('location')}
                            >
                              Add Travel Preferences
                            </Button>
                          </div>
                        </div>
                      )}

                      {completionPercentage === 100 && (
                        <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-green-900">
                            Profile complete! You're all set to get personalized recommendations.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Favorite Courses Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Courses</CardTitle>
                  <CardDescription>Courses you've bookmarked for future visits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-gray-600 mb-4">You haven't bookmarked any courses yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Bookmark courses while browsing to save them for later
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/map">Explore Courses</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Reviews ({reviews.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="text-center py-8">
                      <LoadingSpinner text="Loading profile..." />
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => {
                        const course = coursesDetails[review.courseId];
                        if (!course) {
                          // Log warning for debugging but don't expose details in production
                          if (process.env.NODE_ENV !== 'production') {
                            console.warn(`Course data for review ${review.id} (courseId: ${review.courseId}) not found.`);
                          }
                          return null;
                        }
                        return <ProfileReviewCard key={review.id} review={review} course={course} />;
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">You haven&apos;t written any reviews yet.</p>
                      <Link
                        href="/coursefinder"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Find a Course to Review
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              {/* Profile Photo Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <CardDescription>Add a photo to personalize your profile and connect with other golfers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      {profile?.photoURL ? (
                        <img 
                          src={profile.photoURL} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {profile?.photoURL ? 'Update your photo' : 'Add a profile photo'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        A profile photo helps other golfers recognize you and makes your reviews more personal.
                      </p>
                      <Button onClick={() => setShowPhotoUpload(true)}>
                        {profile?.photoURL ? 'Change Photo' : 'Add Photo'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Manage your basic account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPersonal ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First name"
                            autoComplete="off"
                            data-1p-ignore
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                            autoComplete="off"
                            data-1p-ignore
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          autoComplete="off"
                          data-1p-ignore
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSavePersonal} disabled={isSaving}>
                          {isSaving ? <LoadingSpinner text="" size="sm" /> : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingPersonal(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">First Name</Label>
                          <p className="font-medium">{profile?.firstName || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Last Name</Label>
                          <p className="font-medium">{profile?.lastName || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Date of Birth</Label>
                        <p className="font-medium">{profile?.dateOfBirth || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Email Address</Label>
                        <p className="font-medium">{profile?.email || user.email}</p>
                      </div>
                      
                      <Button onClick={() => setEditingPersonal(true)}>
                        Edit Personal Information
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Golf Preferences Tab */}
            <TabsContent value="golf">
              <Card>
                <CardHeader>
                  <CardTitle>Golf Preferences</CardTitle>
                  <CardDescription>Your golf experience and walking preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingGolf ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Golf Experience Level</Label>
                          <Select value={golfingExperience} onValueChange={(value) => setGolfingExperience(value as any)}>
                            <SelectTrigger data-1p-ignore>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Preferred Walking Method</Label>
                          <Select value={preferredCarryMethod} onValueChange={(value) => setPreferredCarryMethod(value as any)}>
                            <SelectTrigger data-1p-ignore>
                              <SelectValue placeholder="Select walking method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="carry">Carry Bag</SelectItem>
                              <SelectItem value="push_cart">Push/Pull Cart</SelectItem>
                              <SelectItem value="electric_cart">Electric Cart/Trolley</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="golfHandicap">Golf Handicap</Label>
                        <Input
                          id="golfHandicap"
                          type="number"
                          min="-10"
                          max="54"
                          step="0.1"
                          value={golfHandicap}
                          onChange={(e) => setGolfHandicap(e.target.value)}
                          placeholder="e.g. 12.5"
                          className="max-w-xs"
                          autoComplete="off"
                          data-1p-ignore
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSaveGolf} disabled={isSaving}>
                          {isSaving ? <LoadingSpinner text="" size="sm" /> : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingGolf(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">Experience Level</Label>
                          <p className="font-medium capitalize">{profile?.golfingExperience || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Walking Method</Label>
                          <p className="font-medium">{profile?.preferredCarryMethod?.replace('_', ' ') || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Golf Handicap</Label>
                        <p className="font-medium">{profile?.golfHandicap || 'Not provided'}</p>
                      </div>
                      
                      <Button onClick={() => setEditingGolf(true)}>
                        Edit Golf Preferences
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Location & Travel</CardTitle>
                  <CardDescription>Your location and travel preferences for golf</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingLocation ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="zipcode">ZIP Code</Label>
                        <Input
                          id="zipcode"
                          value={zipcode}
                          onChange={(e) => setZipcode(e.target.value)}
                          placeholder="12345"
                          maxLength={5}
                          className="max-w-xs"
                          autoComplete="off"
                          data-1p-ignore
                        />
                      </div>
                      
                      <div>
                        <Label>Favorite States for Golf Travel</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 mt-2">
                          {US_STATES.map((state) => (
                            <div key={state.code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`state-${state.code}`}
                                checked={favoriteStates.includes(state.code)}
                                onCheckedChange={(checked) => handleFavoriteStateChange(state.code, checked as boolean)}
                              />
                              <Label htmlFor={`state-${state.code}`} className="text-sm cursor-pointer">
                                {state.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSaveLocation} disabled={isSaving}>
                          {isSaving ? <LoadingSpinner text="" size="sm" /> : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingLocation(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">ZIP Code</Label>
                          <p className="font-medium">{profile?.zipcode || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Home State</Label>
                          <p className="font-medium">{profile?.homeState || 'Not available'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Favorite States for Golf Travel</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profile?.favoriteStates && profile.favoriteStates.length > 0 ? (
                            profile.favoriteStates.map(stateCode => {
                              const state = US_STATES.find(s => s.code === stateCode);
                              return (
                                <Badge key={stateCode} variant="secondary">
                                  {state?.name || stateCode}
                                </Badge>
                              );
                            })
                          ) : (
                            <p className="text-gray-500">None selected</p>
                          )}
                        </div>
                      </div>
                      
                      <Button onClick={() => setEditingLocation(true)}>
                        Edit Location Preferences
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent value="communications">
              <Card>
                <CardHeader>
                  <CardTitle>Communication Preferences</CardTitle>
                  <CardDescription>Manage how you appear in reviews and email preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingCommunications ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Review Display Name</Label>
                        <Select value={displayNameType} onValueChange={(value) => setDisplayNameType(value as DisplayNameType)}>
                          <SelectTrigger data-1p-ignore>
                            <SelectValue placeholder="Select display preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Name (e.g., John Doe)</SelectItem>
                            <SelectItem value="first_initial">First Name, Last Initial (e.g., John D.)</SelectItem>
                            <SelectItem value="initials">Initials (e.g., J.D.)</SelectItem>
                            <SelectItem value="private">Private Reviewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="emailNotifications"
                            checked={emailNotifications}
                            onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                          />
                          <Label htmlFor="emailNotifications">Receive email notifications</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="newsletterSubscribed"
                            checked={newsletterSubscribed}
                            onCheckedChange={(checked) => setNewsletterSubscribed(checked as boolean)}
                          />
                          <Label htmlFor="newsletterSubscribed">Subscribe to newsletter</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="marketingConsent"
                            checked={marketingConsent}
                            onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                          />
                          <Label htmlFor="marketingConsent">Receive marketing emails and offers</Label>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSaveCommunications} disabled={isSaving}>
                          {isSaving ? <LoadingSpinner text="" size="sm" /> : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingCommunications(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-500">Review Display Name</Label>
                        <p className="font-medium">{profile?.reviewDisplayNameType || 'Full name'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Email Preferences</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={profile?.preferences?.emailNotifications ? "default" : "secondary"}>
                              {profile?.preferences?.emailNotifications ? "Enabled" : "Disabled"}
                            </Badge>
                            <span className="text-sm">Email notifications</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={profile?.preferences?.newsletterSubscribed ? "default" : "secondary"}>
                              {profile?.preferences?.newsletterSubscribed ? "Subscribed" : "Not subscribed"}
                            </Badge>
                            <span className="text-sm">Newsletter</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={profile?.marketingConsent ? "default" : "secondary"}>
                              {profile?.marketingConsent ? "Opted in" : "Opted out"}
                            </Badge>
                            <span className="text-sm">Marketing emails</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button onClick={() => setEditingCommunications(true)}>
                        Edit Communication Preferences
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Choose a photo to personalize your profile and connect with other golfers.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ImageUpload
              initialImage={profile?.photoURL || ''}
              onImageChange={handlePhotoUpload}
              aspectRatio="square"
              maxSizeMB={2}
            />
          </div>
          {uploadingPhoto && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner text="Uploading photo..." size="sm" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
} 