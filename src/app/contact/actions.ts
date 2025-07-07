'use server'

import {
  getKlaviyoClient,
  KlaviyoEvents,
} from '@/lib/klaviyo'

interface ContactSubmissionData {
  email: string;
  name: string;
  subject: string;
  message: string;
  submittedAt: string;
}

interface TrackEventResult {
  success: boolean;
  message?: string;
}

export async function trackContactSubmissionEvent(
  data: ContactSubmissionData
): Promise<TrackEventResult> {
  if (!data.email) {
    return { success: false, message: 'Email is required for Klaviyo event tracking.' };
  }

  try {
    const klaviyoClient = getKlaviyoClient();
    await klaviyoClient.trackEvent(
      KlaviyoEvents.CONTACT_FORM_SUBMITTED,
      data.email,
      {
        name: data.name,
        subject: data.subject,
        message: data.message,
        submittedAt: data.submittedAt,
      }
    );
    console.log(`Klaviyo event ${KlaviyoEvents.CONTACT_FORM_SUBMITTED} tracked successfully for ${data.email}`);
    return { success: true, message: 'Klaviyo event tracked.' };
  } catch (error) {
    console.error('Error in trackContactSubmissionEvent action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to track Klaviyo event.';
    return { success: false, message: errorMessage };
  }
} 