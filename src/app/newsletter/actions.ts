'use server'

import {
  getKlaviyoClient,
  createKlaviyoProfile,
  KlaviyoEvents,
} from '@/lib/klaviyo' // Assuming klaviyo.ts is in src/lib
import type { KlaviyoProfile } from '@/lib/klaviyo' // We might need to export this from klaviyo.ts
import { getUserProfile } from '@/lib/firebase/userUtils'
import { getAuth } from 'firebase-admin/auth'
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin'

interface NewsletterPreferences {
  golfTips: boolean;
  courseUpdates: boolean;
  weeklyDigest: boolean;
}

interface NewsletterSignupResult {
  success: boolean;
  message: string;
}

export async function subscribeToKlaviyo(
  email: string,
  preferences: NewsletterPreferences,
  userId?: string
): Promise<NewsletterSignupResult> {
  try {
    console.log('Starting Klaviyo subscription process for:', email);
    
    const klaviyoClient = getKlaviyoClient()
    
    // Try to get enhanced user profile data if userId is provided
    let userProfile = null;
    if (userId) {
      try {
        userProfile = await getUserProfile(userId);
        console.log('Found user profile for enhanced Klaviyo data');
      } catch (error) {
        console.warn('Could not fetch user profile for Klaviyo, continuing with basic data:', error);
      }
    }

    // Create profile data with enhanced information if available
    const profileData: KlaviyoProfile = createKlaviyoProfile(
      email,
      userProfile?.displayName,
      userProfile
    );

    // Add newsletter-specific properties
    profileData.properties = {
      ...profileData.properties,
      newsletter_subscribed: true,
      newsletter_preferences: {
        golf_tips: preferences.golfTips,
        course_updates: preferences.courseUpdates,
        weekly_digest: preferences.weeklyDigest
      },
      newsletter_signup_date: new Date().toISOString(),
      signup_source: 'newsletter_form'
    };

    console.log('Profile data being sent to KlaviyoClient:', JSON.stringify(profileData, null, 2)); // Added for debugging

    // Create or update the profile with enhanced data
    const profileId = await klaviyoClient.createOrUpdateProfileAttributes(profileData);

    if (!profileId) {
      console.error('Failed to create/update Klaviyo profile');
      return { success: false, message: 'Failed to create profile in Klaviyo' };
    }

    // Subscribe to the main newsletter list
    const subscribedToList = await klaviyoClient.subscribeProfileToList(profileId, "VfjFup");

    if (!subscribedToList) {
      console.error('Failed to subscribe profile to newsletter list');
      return { success: false, message: 'Failed to subscribe to newsletter list' };
    }

    // Set marketing consent if user has consented
    if (userProfile?.marketingConsent) {
      await klaviyoClient.setProfileMarketingConsent(email, true);
    }

    // Track the newsletter signup event
    await klaviyoClient.trackEvent(
      KlaviyoEvents.NEWSLETTER_SIGNUP,
      email,
      {
        preferences: preferences,
        source: 'newsletter_form',
        golf_experience: userProfile?.golfingExperience,
        preferred_carry_method: userProfile?.preferredCarryMethod,
        home_state: userProfile?.homeState,
        profile_completed: userProfile?.profileCompleted || false
      }
    );

    // Store newsletter subscription in Firestore for our records
    try {
      const db = getAdminFirestore();
      await db.collection('newsletters').add({
        email,
        preferences,
        subscribedAt: new Date(),
        source: 'newsletter_form',
        klaviyoProfileId: profileId,
        userId: userId || null
      });
    } catch (firestoreError) {
      console.warn('Failed to store newsletter subscription in Firestore:', firestoreError);
      // Don't fail the whole operation for this
    }

    console.log(`Successfully subscribed ${email} to newsletter with enhanced profile data`);
    return { success: true, message: 'Successfully subscribed to newsletter!' };

  } catch (error) {
    console.error('Error in subscribeToKlaviyo:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
} 