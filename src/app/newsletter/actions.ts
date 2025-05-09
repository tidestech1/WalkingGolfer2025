'use server'

import {
  getKlaviyoClient,
  createKlaviyoProfile,
  KlaviyoEvents,
} from '@/lib/klaviyo' // Assuming klaviyo.ts is in src/lib
import type { KlaviyoProfile } from '@/lib/klaviyo' // We might need to export this from klaviyo.ts

interface NewsletterPreferences {
  courseUpdates: boolean
  newsArticles: boolean
  tips: boolean
  offers: boolean
}

interface SubscribeResult {
  success: boolean
  message?: string
}

export async function subscribeToKlaviyo(
  email: string,
  preferences: NewsletterPreferences,
  firstName?: string,
  lastName?: string,
): Promise<SubscribeResult> {
  if (!email) {
    return { success: false, message: 'Email is required.' }
  }

  try {
    const klaviyoClient = getKlaviyoClient()

    const profileData: KlaviyoProfile = createKlaviyoProfile(
      email,
      firstName && lastName ? `${firstName} ${lastName}` : undefined,
    )
    profileData.properties = {
      ...(profileData.properties || {}),
      ...preferences,
      newsletter_consent: true, 
    }

    // Step 1: Create or update the profile's attributes and custom properties
    const profileId = await klaviyoClient.createOrUpdateProfileAttributes(profileData);

    if (profileId) {
      // Step 2: Subscribe the profile to marketing communications
      const subscribed = await klaviyoClient.subscribeProfileToMarketing(profileId, email);

      if (subscribed) {
        // Step 3: Track the "Signed Up" event if both profile and subscription were successful
        await klaviyoClient.trackEvent(KlaviyoEvents.SIGNED_UP, email, {
          ...preferences,
          klaviyo_profile_id: profileId,
        });
        return { success: true, message: 'Successfully subscribed to newsletter.' };
      } else {
        console.error(`Failed to subscribe profile ${profileId} to marketing.`);
        return { success: false, message: 'Profile updated, but subscription to marketing failed.' };
      }
    } else {
      console.error('Klaviyo profile creation or attribute update failed.');
      return { success: false, message: 'Failed to process profile. Please try again.' };
    }

  } catch (error) {
    console.error('Error in subscribeToKlaviyo action:', error)
    let errorMessage = 'Failed to subscribe. Please try again later.'
    if (error instanceof Error) {
      // You could customize messages for specific errors if needed
      // For now, a generic message is fine.
    }
    return { success: false, message: errorMessage }
  }
} 