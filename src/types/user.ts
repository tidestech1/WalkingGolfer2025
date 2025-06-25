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

  // Enhanced profile fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // YYYY-MM-DD format, optional for existing users
  
  // Golf-specific preferences
  golfingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  preferredCarryMethod?: 'carry' | 'push_cart' | 'electric_cart';
  golfHandicap?: number; // Numeric handicap, can be negative for scratch/plus handicaps
  
  // Location and travel preferences
  homeState?: string; // Derived from zipcode, US state code (e.g., 'CA', 'TX')
  favoriteStates?: string[]; // States user likes to visit/play golf in
  
  // Profile completion tracking
  profileCompleted?: boolean;
  profileCompletedAt?: string;
  
  // Marketing and consent
  marketingConsent?: boolean;

  // Existing fields
  emailVerified?: boolean;
  welcomeEmailSent?: boolean;
}

export interface UserReviewSummary {
  totalReviews: number;
  averageRating: number;
  averageWalkabilityRating: number;
  lastReviewDate: string | null;
  reviewedCourseIds: string[];
}

// Type for profile updates to ensure type safety
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'createdAt' | 'email'>>;

// Type for enhanced profile completion form
export interface ProfileCompletionData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | undefined;
  golfingExperience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  preferredCarryMethod: 'carry' | 'push_cart' | 'electric_cart';
  golfHandicap?: number;
  zipcode: string;
  favoriteStates?: string[];
  marketingConsent: boolean;
}
