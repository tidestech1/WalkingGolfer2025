import type { NewsletterSubscription, CreateNewsletterSubscription } from '@/types/newsletter';

import { addDocument, getDocuments, updateDocument } from './firebaseUtils';

export async function subscribeToNewsletter(data: CreateNewsletterSubscription): Promise<{ success: boolean; error?: string }> {
  try {
    const subscriptions = await getDocuments('newsletters');
    
    // Check for existing subscription
    const existingSubscription = subscriptions.find(sub => sub.email === data.email);
    if (existingSubscription) {
      if (existingSubscription.status === 'unsubscribed') {
        // Reactivate subscription
        await updateDocument('newsletters', existingSubscription.id, {
          status: 'active',
          preferences: data.preferences,
          updatedAt: new Date().toISOString()
        });
        return { success: true };
      }
      return { success: false, error: 'Email already subscribed' };
    }

    // Create new subscription
    await addDocument('newsletters', {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    } as NewsletterSubscription);

    return { success: true };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return { success: false, error: 'Failed to subscribe. Please try again.' };
  }
}
