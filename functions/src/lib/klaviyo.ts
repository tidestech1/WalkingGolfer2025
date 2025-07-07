// import * as functions from 'firebase-functions'; // Remove unused import

// Types for Klaviyo API
interface KlaviyoProfile {
  email: string;
  first_name?: string | undefined;
  last_name?: string | undefined;
  phone_number?: string | undefined;
  properties?: Record<string, unknown> | undefined;
}

interface KlaviyoEvent {
  profile: {
    email: string;
    [key: string]: unknown;
  };
  metric: {
    name: string;
  };
  properties?: Record<string, unknown> | undefined;
  time?: string; // ISO 8601 timestamp
}

// Klaviyo API client class
class KlaviyoClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://a.klaviyo.com/api";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Create or update a profile
  async createProfile(profile: KlaviyoProfile): Promise<void> {
    try {
      const payload = {
        data: {
          type: 'profile',
          attributes: {
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone_number: profile.phone_number,
            ...profile.properties
          }
        }
      };

      const response = await fetch(
        `${this.baseUrl}/profiles/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Klaviyo-API-Key ${this.apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "revision": "2024-07-15",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Klaviyo API error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating Klaviyo profile:", error);
      throw error;
    }
  }

  // Track an event
  async trackEvent(event: KlaviyoEvent): Promise<void> {
    try {
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

      const response = await fetch(
        `${this.baseUrl}/events`,
        {
          method: "POST",
          headers: {
            "Authorization": `Klaviyo-API-Key ${this.apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "revision": "2024-07-15",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Klaviyo API error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error tracking Klaviyo event:", error);
      throw error;
    }
  }

  // Track a metric (simplified event tracking)
  async trackMetric(metricName: string, email: string, properties?: Record<string, unknown>): Promise<void> {
    const event: KlaviyoEvent = {
      profile: {email},
      metric: {name: metricName},
      properties: properties || undefined,
      time: new Date().toISOString()
    };
    await this.trackEvent(event);
  }
}

// Helper function to get Klaviyo client instance
export function getKlaviyoClient(): KlaviyoClient {
  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  if (!apiKey) {
    throw new Error("Klaviyo private key not found in Replit Secrets");
  }
  return new KlaviyoClient(apiKey);
}

// Predefined event names
export const KlaviyoEvents = {
  SIGNED_UP: "Signed Up",
  EMAIL_VERIFIED: "Email Verified",
  REVIEW_SUBMITTED: "Review Submitted",
  REVIEW_VERIFIED: "Review Verified",
  REVIEW_PUBLISHED: "Review Published",
  USER_REGISTERED: "User Registered",
  PROFILE_COMPLETED: "Profile Completed",
  PROFILE_UPDATED: "Profile Updated",
} as const;

// Helper function to create a profile from user data
export function createKlaviyoProfile(email: string, displayName?: string): KlaviyoProfile {
  const [firstName, lastName] = (displayName || "").split(" ");
  return {
    email,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    properties: {
      source: "walkinggolfer.com",
      walking_golfer_member: true,
    },
  };
}
