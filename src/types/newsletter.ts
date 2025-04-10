export interface NewsletterSubscription {
  id: string;
  email: string;
  preferences: {
    courseUpdates: boolean;
    communityStories: boolean;
    tips: boolean;
    offers: boolean;
  };
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'unsubscribed';
}

export type CreateNewsletterSubscription = Omit<NewsletterSubscription, 'id' | 'createdAt' | 'updatedAt'>;
