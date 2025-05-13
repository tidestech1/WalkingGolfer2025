// Types for Klaviyo API
export interface KlaviyoProfile {
  email: string;
  first_name?: string | undefined;
  last_name?: string | undefined;
  phone_number?: string | undefined;
  properties?: Record<string, any> | undefined;
}

interface KlaviyoSubscriptionInfo {
  marketing: {
    consent: "SUBSCRIBED" | "UNSUBSCRIBED" | "NEVER_SUBSCRIBED"; // Added more specific consent types
    // consent_timestamp?: string; // Optional: Klaviyo can set this
    // method?: string; // Optional: e.g., 'WEBSITE_FORM'
    // method_detail?: string; // Optional
  };
}

interface KlaviyoProfileAttributesForUpdate extends Omit<KlaviyoProfile, 'properties' | 'email'> {
  email?: string; // Email is optional for updates but good to include if available
  subscriptions?: {
    email?: KlaviyoSubscriptionInfo;
    // sms?: KlaviyoSubscriptionInfo; // If handling SMS in the future
  };
}

interface KlaviyoEvent {
  profile: {
    email: string;
    [key: string]: any;
  };
  metric: {
    name: string;
  };
  properties?: Record<string, any> | undefined;
}

// Klaviyo API client class
class KlaviyoClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://a.klaviyo.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Attempts to create a profile. If duplicate (409), it updates attributes/properties only.
  // Returns the Klaviyo Profile ID on success (either created or existing).
  // Subscription is handled by a separate call to subscribeProfileToMarketing.
  async createOrUpdateProfileAttributes(profile: KlaviyoProfile): Promise<string | null> {
    const payload = {
      data: {
        type: "profile",
        attributes: {
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          properties: profile.properties || {}
        }
      }
    };

    try {
      // Attempt to CREATE profile first
      const createResponse = await fetch(
        `${this.baseUrl}/profiles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
            'Content-Type': 'application/json',
            'revision': '2023-12-15'
          },
          body: JSON.stringify(payload)
        }
      );

      if (createResponse.ok) {
        const responseData = await createResponse.json();
        console.log("Profile created successfully:", responseData.data.id);
        return responseData.data.id; // Return the new profile ID
      }

      if (createResponse.status === 409) {
        const errorBody = await createResponse.json();
        console.warn('Klaviyo createProfile returned 409 (duplicate).', errorBody);
        const duplicateProfileId = errorBody?.errors?.[0]?.meta?.duplicate_profile_id;

        if (duplicateProfileId) {
          console.log(`Duplicate profile ID: ${duplicateProfileId}. Attempting to PATCH attributes/properties.`);
          // Profile exists, so PATCH its attributes and properties (excluding subscription here)
          const patchPayload = {
            data: {
              type: "profile",
              id: duplicateProfileId,
              attributes: payload.data.attributes
            }
          };
          const updateResponse = await fetch(
            `${this.baseUrl}/profiles/${duplicateProfileId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
                'Content-Type': 'application/json',
                'revision': '2023-12-15'
              },
              body: JSON.stringify(patchPayload)
            }
          );

          if (updateResponse.ok) {
            console.log(`Successfully PATCHED attributes/properties for profile ${duplicateProfileId}.`);
            return duplicateProfileId; // Return existing profile ID
          } else {
            const patchErrorBody = await updateResponse.text();
            console.error(`Klaviyo API Error Body (PATCH profile ${duplicateProfileId}):`, patchErrorBody);
            throw new Error(`HTTP error! status: ${updateResponse.status} PATCHING profile ${duplicateProfileId}`);
          }
        } else {
          console.error('Klaviyo API Error: 409 received but no duplicate_profile_id found.', errorBody);
          throw new Error(`HTTP error! status: ${createResponse.status}, msg: No duplicate_profile_id`);
        }
      }

      const errorText = await createResponse.text();
      console.error('Klaviyo API Error Body (createProfile):', errorText);
      throw new Error(`HTTP error! status: ${createResponse.status}`);

    } catch (error) {
      console.error('Error in createOrUpdateProfileAttributes:', error);
      return null;
    }
  }

  // Subscribes a profile to a specific list.
  async subscribeProfileToList(profileId: string, listId: string): Promise<boolean> {
    const payload = {
      data: [
        {
          type: "profile",
          id: profileId
        }
      ]
    };

    try {
      console.log(`Attempting to add profile ID: ${profileId} to list ID: ${listId}.`);
      // Note: The endpoint for adding profiles to a list is typically /api/lists/{LIST_ID}/relationships/profiles/
      // The Klaviyo API has different ways to manage subscriptions (profile level, list level, bulk jobs).
      // This targets adding/subscribing to a specific list.
      const response = await fetch(
        `${this.baseUrl}/lists/${listId}/relationships/profiles/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
            'Content-Type': 'application/json',
            'revision': '2023-12-15'
          },
          body: JSON.stringify(payload)
        }
      );

      // According to Klaviyo docs, a successful add to list returns 204 No Content
      if (response.status === 204) {
        console.log(`Successfully added profile ${profileId} to list ${listId}.`);
        return true;
      } else if (response.ok) {
        // Handle other success statuses if Klaviyo API returns them (e.g., 200, 202 for jobs)
        // For direct list add, 204 is most common.
        console.log(`Profile ${profileId} processed for list ${listId} with status ${response.status}.`);
        return true;
      }
      else {
        const errorBody = await response.text();
        console.error(`Klaviyo API Error Body (add profile ${profileId} to list ${listId}):`, errorBody);
        throw new Error(`HTTP error! status: ${response.status} adding profile ${profileId} to list ${listId}`);
      }
    } catch (error) {
      console.error(`Error adding profile ${profileId} to list ${listId}:`, error);
      return false;
    }
  }

  // Sets the general marketing consent for a profile.
  async setProfileMarketingConsent(profileId: string, email: string): Promise<boolean> {
    const payload = {
      data: {
        type: "profile-subscription-bulk-create-job", // Using the bulk job endpoint for general subscription
        attributes: {
          // No list_id here, for general subscription
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email: email,
                  // We could also pass profileId here if the API supports it as an identifier for the job
                  // but email is a primary identifier for subscription jobs.
                },
                // Optionally, define subscription channels and consent status if needed
                // e.g., meta: { patch_profile_attributes: { subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }
                // For now, relying on the endpoint to set default email marketing consent.
              }
            ]
          }
        }
      }
    };

    try {
      console.log(`Attempting to set general marketing consent for email: ${email} (Profile ID: ${profileId}).`);
      const response = await fetch(
        `${this.baseUrl}/profile-subscription-bulk-create-jobs/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
            'Content-Type': 'application/json',
            'revision': '2023-12-15'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 202 || response.ok) { // 202 Accepted for jobs
        console.log(`Marketing consent job submitted for email ${email}. Status: ${response.status}`);
        return true;
      } else {
        const errorBody = await response.text();
        console.error(`Klaviyo API Error Body (setProfileMarketingConsent for ${email}):`, errorBody);
        throw new Error(`HTTP error! status: ${response.status} setting marketing consent for ${email}`);
      }
    } catch (error) {
      console.error(`Error setting marketing consent for ${email}:`, error);
      return false;
    }
  }

  // Track an event using the v2 API
  async trackEvent(eventName: string, email: string, properties?: Record<string, any>): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Klaviyo API key not found in Replit Secrets');
    }
    const payload = {
      data: {
        type: "event",
        attributes: {
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: email
              }
            }
          },
          metric: {
            data: {
              type: "metric",
              attributes: {
                name: eventName
              }
            }
          },
          properties: properties || {}
        }
      }
    };
    const response = await fetch('https://a.klaviyo.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'revision': '2023-12-15',
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo API error:', errorText);
      throw new Error(`Klaviyo API error! status: ${response.status}, message: ${errorText}`);
    }
  }

  // Track a metric (simplified event tracking)
  async trackMetric(metricName: string, email: string, properties?: Record<string, any>): Promise<void> {
    const event: KlaviyoEvent = {
      profile: { email },
      metric: { name: metricName },
      properties: properties || undefined
    };
    await this.trackEvent(event.metric.name, event.profile.email, event.properties);
  }
}

// Helper function to get Klaviyo client instance
export function getKlaviyoClient(): KlaviyoClient {
  const apiKey = process.env['KLAVIYO_PRIVATE_KEY'];
  if (!apiKey) {
    throw new Error('KLAVIYO_PRIVATE_KEY environment variable is not set');
  }
  return new KlaviyoClient(apiKey);
}

// Predefined event names
export const KlaviyoEvents = {
  SIGNED_UP: 'Signed Up',
  EMAIL_VERIFIED: 'Email Verified',
  REVIEW_SUBMITTED: 'Review Submitted',
  REVIEW_VERIFIED: 'Review Verified',
  REVIEW_PUBLISHED: 'Review Published',
  CONTACT_FORM_SUBMITTED: 'Contact Form Submitted'
} as const;

// Helper function to create a profile from user data
export function createKlaviyoProfile(email: string, displayName?: string): KlaviyoProfile {
  const [firstName, lastName] = (displayName || '').split(' ');
  return {
    email,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    properties: {
      signup_source: 'walkinggolfer.com'
    }
  };
} 