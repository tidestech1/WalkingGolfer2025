'use client'

import { useState, useEffect, useCallback } from 'react'

import { Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from "@/components/ui/checkbox"
import { completeUserProfile, getUserProfile } from '@/lib/firebase/userUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import type { ProfileCompletionData, UserProfile } from '@/types/user'

// US states for favorite states selection
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington D.C.' }
];

export default function CompleteProfileManualPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [zipcode, setZipcode] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [golfingExperience, setGolfingExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'professional' | ''>('')
  const [preferredCarryMethod, setPreferredCarryMethod] = useState<'carry' | 'push_cart' | 'electric_cart' | ''>('')
  const [golfHandicap, setGolfHandicap] = useState('')
  const [favoriteStates, setFavoriteStates] = useState<string[]>([])
  const [marketingConsent, setMarketingConsent] = useState(false)
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null)

  // Load existing profile data if available
  useEffect(() => {
    if (!authLoading && user) {
      loadExistingProfile();
    }
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadExistingProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setExistingProfile(profile);
        
        // Pre-fill form with existing data
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setZipcode(profile.zipcode || '');
        setDateOfBirth(profile.dateOfBirth || '');
        setGolfingExperience(profile.golfingExperience || '');
        setPreferredCarryMethod(profile.preferredCarryMethod || '');
        setGolfHandicap(profile.golfHandicap?.toString() || '');
        setFavoriteStates(profile.favoriteStates || []);
        setMarketingConsent(profile.marketingConsent || false);
      }
    } catch (err) {
      console.error('Error loading existing profile:', err);
    }
  }, [user]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || authLoading || !user) {
      return;
    }

    setError('');
    setLoading(true);

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      setLoading(false);
      return;
    }
    
    if (!zipcode.trim()) {
      setError('ZIP code is required.');
      setLoading(false);
      return;
    }
    
    if (!golfingExperience) {
      setError('Please select your golf experience level.');
      setLoading(false);
      return;
    }
    
    if (!preferredCarryMethod) {
      setError('Please select your preferred carry method.');
      setLoading(false);
      return;
    }

    try {
      const profileData: ProfileCompletionData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        zipcode: zipcode.trim(),
        golfingExperience,
        preferredCarryMethod,
        favoriteStates,
        marketingConsent,
        ...(dateOfBirth && { dateOfBirth }),
        ...(golfHandicap && { golfHandicap: Number(golfHandicap) })
      };

      await completeUserProfile(user.uid, profileData);
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
  }, [user, firstName, lastName, zipcode, dateOfBirth, golfingExperience, preferredCarryMethod, golfHandicap, favoriteStates, marketingConsent, loading, authLoading, router]);

  const handleFavoriteStateChange = (stateCode: string, checked: boolean) => {
    if (checked) {
      setFavoriteStates(prev => [...prev, stateCode]);
    } else {
      setFavoriteStates(prev => prev.filter(code => code !== stateCode));
    }
  };

  const handleSkip = useCallback(() => {
    if (!user) return;
    console.log('User skipped manual profile completion:', user.uid);
    router.push('/welcome');
  }, [user, router]);

  // Show loader during auth check
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3357]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-2xl">
        <Card className="shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[#0A3357]">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-gray-600">
              {existingProfile?.profileCompleted 
                ? "Update your profile information"
                : "Help us personalize your experience and find the best walking courses for you"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </Label>
                    <Input
                      id="zipcode"
                      name="zipcode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{5}"
                      maxLength={5}
                      required
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      className="w-full"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Golf Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Golf Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Golf Experience Level *
                    </Label>
                    <Select value={golfingExperience} onValueChange={(value) => setGolfingExperience(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (New to golf)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (Regular player)</SelectItem>
                        <SelectItem value="advanced">Advanced (Low handicap)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Walking Method *
                    </Label>
                    <Select value={preferredCarryMethod} onValueChange={(value) => setPreferredCarryMethod(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="How do you carry your clubs?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carry">Carry Bag</SelectItem>
                        <SelectItem value="push_cart">Push/Pull Cart</SelectItem>
                        <SelectItem value="electric_cart">Electric Cart/Trolley</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="golfHandicap" className="block text-sm font-medium text-gray-700 mb-1">
                    Golf Handicap <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="golfHandicap"
                    name="golfHandicap"
                    type="number"
                    min="-10"
                    max="54"
                    step="0.1"
                    value={golfHandicap}
                    onChange={(e) => setGolfHandicap(e.target.value)}
                    className="w-full max-w-xs"
                    placeholder="e.g. 12.5"
                  />
                </div>
              </div>

              {/* Travel Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Preferences <span className="text-gray-400 font-normal">(Optional)</span></h3>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Favorite states to visit for golf:
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
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

              {/* Marketing Consent */}
              <div className="border-t pt-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketingConsent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="marketingConsent" className="text-sm font-medium text-gray-700 cursor-pointer">
                      I agree to receive email updates about new courses, golf tips, and special offers
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">You can unsubscribe at any time</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 text-white bg-[#0A3357] hover:bg-[#0A3357]/90 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Completing Profile...</>
                  ) : (
                    existingProfile?.profileCompleted ? 'Update Profile' : 'Complete Profile'
                  )}
                </Button>
                
                {!existingProfile?.profileCompleted && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={loading}
                    className="px-6"
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 