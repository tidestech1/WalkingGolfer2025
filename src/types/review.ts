// Define types for the new fields
export type ReviewStatus = "pending" | "verified" | "published";
export type DisplayNameType = "full" | "first_initial" | "initials" | "private";

export interface CourseReview {
  id: string;
  courseId: string;
  // User fields are now optional for pending reviews
  userId: string | null; 
  userDisplayName: string | null;
  userPhotoUrl: string | null;

  // Temporary fields for pre-verification storage
  submittedEmail?: string; 
  submittedName?: string;

  // New status and verification fields
  status: ReviewStatus;
  email_verified: boolean;
  display_name_type: DisplayNameType;
  
  // Ratings
  walkabilityRating: number;
  courseConditionRating: number;
  overallRating: number;
  
  // Detailed walkability ratings
  hillinessRating: number;
  distanceRating: number;
  costRating: number;
  
  // Review content
  comment: string;
  walkingDate: Date;
  pros: string[];
  cons: string[];
  imageUrls?: string[];
  
  // Timestamps (createdAt can represent submitted_at for pending reviews)
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewFilters {
  courseId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  minWalkabilityRating?: number;
  maxWalkabilityRating?: number;
  // REMOVED cart filters
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: keyof CourseReview;
  sortOrder?: 'asc' | 'desc';
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  averageWalkabilityRating: number;
  averageCourseConditionRating: number;
  ratingDistribution: {
    [key: number]: number; // 1-5 ratings
  };
  walkabilityRatingDistribution: {
    [key: number]: number; // 1-5 ratings
  };
  mostCommonPros: string[];
  mostCommonCons: string[];
  // REMOVED cart usage stats
  recentReviews: CourseReview[];
}

export interface CreateReviewInput {
  courseId: string;
  // userId is removed here, will be added later based on auth status
  // userDisplayName/PhotoUrl are also removed, derived later
  walkabilityRating: number;
  courseConditionRating: number;
  overallRating: number;
  hillinessRating: number;
  distanceRating: number;
  costRating: number;
  terrainRating?: number;
  comment: string;
  walkingDate: Date;
  pros: string[];
  cons: string[];
  imageUrls?: string[];
  // REMOVED cart fields

  // Add fields submitted by potentially non-logged-in user
  submittedEmail: string;
  submittedName?: string; // Optional name
  display_name_type: DisplayNameType;

  // Note: Other review fields like ratings, comments etc. come from the form
  // These fields match the required parts of CourseReview before verification
  // We don't include status, email_verified, userId etc. as they are set server-side
} 