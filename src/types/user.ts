export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    emailNotifications: boolean;
    newsletterSubscribed: boolean;
  };
  reviewCount: number;
  lastReviewDate?: string;
}

export interface UserReviewSummary {
  totalReviews: number;
  averageRating: number;
  averageWalkabilityRating: number;
  lastReviewDate: string | null;
  reviewedCourseIds: string[];
}
