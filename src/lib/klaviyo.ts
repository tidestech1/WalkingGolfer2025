// Types for Klaviyo API
export interface KlaviyoProfile {
  email: string;
  properties?: {
    first_name?: string;
    last_name?: string;
    zip?: string;
    state?: string;
    date_of_birth?: string;
    golf_experience?: string;
    preferred_carry_method?: string;
    golf_handicap?: number;
    favorite_states?: string[];
    profile_completed?: boolean;
    review_count?: number;
    walking_golfer_member?: boolean;
    signup_date?: string;
    marketing_consent?: boolean;
    [key: string]: any;
  };
}

interface KlaviyoSubscriptionInfo {
  email: string;
  // consent_timestamp?: string; // Optional: Klaviyo can set this
}

// For profile updates, this allows us to update specific fields
// without affecting the email subscription status
interface KlaviyoProfileAttributesForUpdate extends Omit<KlaviyoProfile, 'properties' | 'email'> {
  properties?: Omit<KlaviyoProfile['properties'], 'email'>;
  email?: KlaviyoSubscriptionInfo;
  // sms?: KlaviyoSubscriptionInfo; // If handling SMS in the future
}

// Type for tracking events in Klaviyo
interface KlaviyoEvent {
  unique_id?: string;
  value?: number;
  metric: {
    name: string;
  };
  profile: {
    email: string;
    [key: string]: any;
  };
  properties?: {
    [key: string]: any;
  };
  time?: string; // ISO 8601 timestamp
}

// Klaviyo API client class
class KlaviyoClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://a.klaviyo.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Creates or updates a Klaviyo profile with enhanced data
  // Returns the Klaviyo Profile ID on success (either created or existing).
  // Returns null on failure.
  async createOrUpdateProfileAttributes(profile: KlaviyoProfile): Promise<string | null> {
    try {
      // First, try to create the profile
      const createPayload = {
        data: {
          type: 'profile',
          attributes: {
            email: profile.email,
            ...profile.properties
          }
        }
      };

      console.log('Klaviyo createProfile payload:', JSON.stringify(createPayload, null, 2));

      const createResponse = await fetch(`${this.baseUrl}/profiles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-07-15'
        },
        body: JSON.stringify(createPayload)
      });

      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('Klaviyo profile created successfully:', createResult.data.id);
        return createResult.data.id;
      }

      // If creation failed with 409 (duplicate), get the existing profile ID and update it
      if (createResponse.status === 409) {
        const errorBody = await createResponse.json();
        console.warn('Klaviyo createProfile returned 409 (duplicate).', errorBody);

        const duplicateProfileId = errorBody?.errors?.[0]?.meta?.duplicate_profile_id;
        if (duplicateProfileId) {
          console.log(`Found duplicate profile ID: ${duplicateProfileId}. Attempting to update.`);
          
          // Update the existing profile
          const updatePayload = {
            data: {
              type: 'profile',
              id: duplicateProfileId,
              attributes: profile.properties || {}
            }
          };

          const updateResponse = await fetch(`${this.baseUrl}/profiles/${duplicateProfileId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
              'revision': '2024-07-15'
            },
            body: JSON.stringify(updatePayload)
          });

          if (updateResponse.ok) {
            console.log('Klaviyo profile updated successfully');
            return duplicateProfileId;
          } else {
            const patchErrorBody = await updateResponse.text();
            console.error(`Klaviyo API Error Body (PATCH profile ${duplicateProfileId}):`, patchErrorBody);
          }
        } else {
          const errorText = await createResponse.text();
          console.error('Klaviyo API Error: 409 received but no duplicate_profile_id found.', errorBody);
        }
      } else {
        const errorText = await createResponse.text();
        console.error('Klaviyo API Error Body (createProfile):', errorText);
      }

      return null;
    } catch (error) {
      console.error('Error in Klaviyo createOrUpdateProfileAttributes:', error);
      return null;
    }
  }

  // Add profile to a Klaviyo list (for newsletter subscriptions)
  async subscribeProfileToList(profileId: string, listId: string): Promise<boolean> {
    try {
      const payload = {
        data: [
          {
            type: 'profile',
            id: profileId
          }
        ]
      };

      // The Klaviyo API has different ways to manage subscriptions (profile level, list level, bulk jobs).
      // This endpoint is specifically for adding profiles to lists.
      // See: https://developers.klaviyo.com/en/reference/subscribe_profiles
      const response = await fetch(`${this.baseUrl}/lists/${listId}/relationships/profiles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-07-15'
        },
        body: JSON.stringify(payload)
      });

      // According to Klaviyo docs, a successful add to list returns 204 No Content
      if (response.status === 204) {
        console.log(`Profile ${profileId} added to list ${listId} successfully`);
        return true;
      }

      // Handle other success statuses if Klaviyo API returns them (e.g., 200, 202 for jobs)
      if (response.ok) {
        const result = await response.json();
        console.log(`Profile ${profileId} added to list ${listId}:`, result);
        return true;
      }

      const errorBody = await response.text();
      console.error(`Klaviyo API Error Body (add profile ${profileId} to list ${listId}):`, errorBody);
      return false;
    } catch (error) {
      console.error(`Error adding profile ${profileId} to list ${listId}:`, error);
      return false;
    }
  }

  // Set email marketing consent for a profile
  async setProfileMarketingConsent(email: string, consented: boolean): Promise<boolean> {
    try {
      const payload = {
        data: {
          type: 'profile',
          attributes: {
            email: email,
            properties: {
              email_marketing_consent: consented ? 'opted_in' : 'opted_out',
              email_marketing_consent_timestamp: new Date().toISOString()
            }
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/profiles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
          'revision': '2024-07-15'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 409) {
        console.log(`Marketing consent for ${email} set to: ${consented}`);
        return true;
      }

      const errorBody = await response.text();
      console.error(`Klaviyo API Error Body (setProfileMarketingConsent for ${email}):`, errorBody);
      return false;
    } catch (error) {
      console.error(`Error setting marketing consent for ${email}:`, error);
      return false;
    }
  }

  // Track events (like course reviews, profile completions, etc.)
  async trackEvent(event: KlaviyoEvent): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Klaviyo API key not found in Replit Secrets');
    }

    console.log('Tracking Klaviyo event:', event.metric.name);

    // Ensure the event has a timestamp
    if (!event.time) {
      event.time = new Date().toISOString();
    }

    const payload = {
      data: {
        type: 'event',
        attributes: event
      }
    };

    const response = await fetch('https://a.klaviyo.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo API error:', errorText);
      throw new Error(`Klaviyo API error! status: ${response.status}, message: ${errorText}`);
    }
  }
}

// Create a Klaviyo event object
export function createKlaviyoEvent(eventName: string, email: string, properties: Record<string, any> = {}): KlaviyoEvent {
  const event: KlaviyoEvent = {
    metric: {
      name: eventName
    },
    profile: {
      email: email
    },
    properties: properties,
    time: new Date().toISOString()
  };
  return event;
}

// Helper function to get Klaviyo client instance
export function getKlaviyoClient(): KlaviyoClient {
  const apiKey = process.env['KLAVIYO_PRIVATE_KEY'];
  if (!apiKey) {
    throw new Error('KLAVIYO_PRIVATE_KEY environment variable is not set');
  }
  return new KlaviyoClient(apiKey);
}

// Event names for tracking
export const KlaviyoEvents = {
  REVIEW_SUBMITTED: 'Course Review Submitted',
  PROFILE_COMPLETED: 'Profile Completed',
  PROFILE_UPDATED: 'Profile Updated',
  NEWSLETTER_SIGNUP: 'Newsletter Signup',
  CONTACT_FORM_SUBMITTED: 'Contact Form Submitted',
  COURSE_SEARCHED: 'Course Searched',
  USER_REGISTERED: 'User Registered',
} as const;

// Helper function to create a Klaviyo profile from user data
export function createKlaviyoProfile(email: string, displayName?: string, userProfile?: any): KlaviyoProfile {
  const [firstName, lastName] = displayName ? displayName.split(' ') : ['', ''];
  
  return {
    email: email,
    properties: {
      first_name: userProfile?.firstName || firstName || undefined,
      last_name: userProfile?.lastName || lastName || undefined,
      zip: userProfile?.zipcode || undefined,
      state: userProfile?.homeState || undefined,
      date_of_birth: userProfile?.dateOfBirth || undefined,
      golf_experience: userProfile?.golfingExperience || undefined,
      preferred_carry_method: userProfile?.preferredCarryMethod || undefined,
      golf_handicap: userProfile?.golfHandicap || undefined,
      favorite_states: userProfile?.favoriteStates || undefined,
      profile_completed: userProfile?.profileCompleted || false,
      review_count: userProfile?.reviewCount || 0,
      walking_golfer_member: true,
      signup_date: userProfile?.createdAt || new Date().toISOString(),
      marketing_consent: userProfile?.marketingConsent || false,
    }
  };
} 