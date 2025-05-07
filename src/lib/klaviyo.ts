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