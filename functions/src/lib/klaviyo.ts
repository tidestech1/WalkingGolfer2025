import * as functions from 'firebase-functions';

// Types for Klaviyo API
interface KlaviyoProfile {
  email: string;
  first_name?: string | undefined;
  last_name?: string | undefined;
  phone_number?: string | undefined;
  properties?: Record<string, any> | undefined;
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
  private readonly baseUrl = 'https://a.klaviyo.com/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Create or update a profile
  async createProfile(profile: KlaviyoProfile): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/profiles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
            'Content-Type': 'application/json',
            'revision': '2023-12-15'
          },
          body: JSON.stringify(profile)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating Klaviyo profile:', error);
      throw error;
    }
  }

  // Track an event
  async trackEvent(event: KlaviyoEvent): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/track`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
            'Content-Type': 'application/json',
            'revision': '2023-12-15'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error tracking Klaviyo event:', error);
      throw error;
    }
  }

  // Track a metric (simplified event tracking)
  async trackMetric(metricName: string, email: string, properties?: Record<string, any>): Promise<void> {
    const event: KlaviyoEvent = {
      profile: { email },
      metric: { name: metricName },
      properties: properties || undefined
    };
    await this.trackEvent(event);
  }
}

// Helper function to get Klaviyo client instance
export function getKlaviyoClient(): KlaviyoClient {
  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  if (!apiKey) {
    throw new Error('Klaviyo private key not found in Replit Secrets');
  }
  return new KlaviyoClient(apiKey);
}

// Predefined event names
export const KlaviyoEvents = {
  SIGNED_UP: 'Signed Up',
  EMAIL_VERIFIED: 'Email Verified',
  REVIEW_SUBMITTED: 'Review Submitted',
  REVIEW_VERIFIED: 'Review Verified',
  REVIEW_PUBLISHED: 'Review Published'
} as const;

// Helper function to create a profile from user data
export function createKlaviyoProfile(email: string, displayName?: string): KlaviyoProfile {
  const [firstName, lastName] = (displayName || '').split(' ');
  return {
    email,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    properties: {
      source: 'walkinggolfer.com'
    }
  };
} 