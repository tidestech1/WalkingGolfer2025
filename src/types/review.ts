export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userDisplayName: string;
  userPhotoUrl: string | null;
  
  // Ratings
  walkabilityRating: number;
  courseConditionRating: number;
  overallRating: number;
  
  // Detailed walkability ratings
  hillinessRating: number;
  accessibilityRating: number;
  lengthRating: number;
  costRating: number;
  
  // Review content
  comment: string;
  walkingDate: Date;
  pros: string[];
  cons: string[];
  imageUrls?: string[];
  
  // Cart experience
  usedGolfCart: boolean;
  usedPushCart: boolean;
  cartExperience?: string;
  
  // Timestamps
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
  usedGolfCart?: boolean;
  usedPushCart?: boolean;
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
  cartUsageStats: {
    golfCartUsage: number;
    pushCartUsage: number;
  };
  recentReviews: CourseReview[];
}

export interface CreateReviewInput {
  courseId: string;
  userId: string;
  userDisplayName: string;
  userPhotoUrl: string | null;
  walkabilityRating: number;
  courseConditionRating: number;
  overallRating: number;
  hillinessRating: number;
  accessibilityRating: number;
  lengthRating: number;
  costRating: number;
  terrainRating?: number;
  comment: string;
  walkingDate: Date;
  pros: string[];
  cons: string[];
  imageUrls?: string[];
  usedGolfCart: boolean;
  usedPushCart: boolean;
  cartExperience?: string;
} 