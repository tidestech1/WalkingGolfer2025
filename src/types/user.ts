import { DisplayNameType } from './review'; // Import the type

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    emailNotifications: boolean;
    newsletterSubscribed: boolean;
  };
  reviewCount: number;
  lastReviewDate?: string;
  zipcode?: string | null;

  // User's preferred display name setting for reviews
  reviewDisplayNameType?: DisplayNameType;
}

export interface UserReviewSummary {
  totalReviews: number;
  averageRating: number;
  averageWalkabilityRating: number;
  lastReviewDate: string | null;
  reviewedCourseIds: string[];
}
