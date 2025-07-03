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

    console.log('Profile data being sent to KlaviyoClient:', JSON.stringify(profileData, null, 2)); // Added for debugging

    // Step 1: Create or update the profile's attributes and custom properties
    const profileId = await klaviyoClient.createOrUpdateProfileAttributes(profileData);

    if (profileId) {
      // Step 2: Subscribe the profile to the specific newsletter list
      const subscribedToList = await klaviyoClient.subscribeProfileToList(profileId, "VfjFup");

      if (subscribedToList) {
        // Step 3: Set general marketing consent for the profile
        const consentSet = await klaviyoClient.setProfileMarketingConsent(profileId, email);

        if (consentSet) {
          // Step 4: Track 'Signed Up' event only if all previous steps were successful
          await klaviyoClient.trackEvent(KlaviyoEvents.SIGNED_UP, email, {
            ...preferences,
            klaviyo_profile_id: profileId,
          });
          return { success: true, message: 'Subscription request to newsletter received, please check your email to complete the process.' };
        } else {
          console.error(`Failed to set marketing consent for profile ${profileId}.`);
          // Profile created/updated & added to list, but general consent failed.
          // Decide if this is a partial success or full failure for user feedback.
          return { success: false, message: 'Subscription processed, but consent update failed.' };
        }
      } else {
        console.error(`Failed to subscribe profile ${profileId} to list VfjFup.`);
        return { success: false, message: 'Failed to subscribe to newsletter list.' };
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