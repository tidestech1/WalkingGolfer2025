// Main interface
export interface GolfCourse {
  // Basic Info
  id: string;
  courseName: string;
  imageUrl?: string;

  // Contact Info (flat)
  contact_email: string;
  contact_phone: string;
  contact_tollFreePhone: string;
  contact_website: string;

  // Course Details (flat)
  course_category: string;
  course_description: string;
  course_designer: string;
  course_holes: number;
  course_tees: number;
  course_type: string;
  course_yearEstablished: number;
  course_isWalkable: boolean | null;
  course_par: number;
  course_guestPolicy: string;

  // Club Details (related to the overall club/facility)
  club_totalHoles: number;
  club_name: string;
  club_type: string;

  // Location (flat)
  location_address1: string;
  location_address2: string;
  location_city: string;
  location_coordinates_latitude: number;
  location_coordinates_longitude: number;
  location_country: string;
  location_state: string;
  location_zip: string;

  // Facilities (all required with default false)
  // Main facilities
  facilities_proShop: boolean;
  facilities_restaurant: boolean;

  // Practice areas
  facilities_drivingRange: boolean;
  facilities_puttingGreen: boolean;
  facilities_chippingGreen: boolean;
  facilities_practiceBunker: boolean;

  // Rentals and services
  facilities_caddies: boolean;
  facilities_clubRental: boolean;
  facilities_golfCarts: boolean;
  facilities_pushCarts: boolean;

  // Pricing (New structure based on course costs)
  course_weekdayCost: number;
  course_weekendCost: number;
  course_twilightCost: number;

  // Ratings (all nullable)
  // --- NEW FIELDS FOR CALCULATING AVERAGES ---
  reviewCount: number;
  overallRatingSum: number;
  courseQualityRatingSum: number;
  costRatingSum: number;
  conditionRatingSum: number;
  hillinessRatingSum: number;
  distanceRatingSum: number; // Sum for walkabilityRating_holeDistance
  calculatedWeightedRatingSum: number; // Sum for walkabilityRating_weightedRating
  // --- END NEW FIELDS ---

  // Calculated average ratings
  twgRating: string;
  reviewerNotes: string;
  twgReviewerNotes: string;
  walkabilityRating_courseCondition: number | null;
  walkabilityRating_courseQuality: number | null;
  walkabilityRating_cost: number | null;
  walkabilityRating_hilliness: number | null;
  walkabilityRating_holeDistance: number | null;
  walkabilityRating_overall: number | null;
  walkabilityRating_weightedRating: number | null;

  // Timestamps
  lastRatingUpdate: Date | null; // Using Date for consistency, can be Firestore Timestamp on backend
  createdAt: Date;
  updatedAt: Date;

  // Data source tracking
  dataSource?: string; // e.g., "TWG-human-matched-2024-01-15"

  // Array of lowercase searchable terms
  searchableTerms: string[];

}

/**
 * TODO: Update this interface to match new review structure
 * This will be implemented when we add the review system
 */
export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userDisplayName: string;
  walkabilityRating: number;
  courseConditionRating: number;
  overallRating: number;
  comment: string;
  walkingDate: Date;
  pros: string[];
  cons: string[];
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for filtering and searching courses
 * Matches the new flat schema structure
 * Focused on walking-related criteria only
 */
export interface CourseFilters {
  walkabilityRating_overall_min: number;

  // Optional fields
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchQuery?: string;
  state?: string | undefined;
  mapBounds?: MapBounds;
  simpleSearch?: boolean;

  // Core walking-related filters
  filter_isWalkable?: boolean;

  // Club type filter (multi-select, e.g. ["Public", "Resort"])
  clubTypes?: string[];

  // Course holes filter (multi-select, e.g. [9, 18])
  // If empty or undefined, show all ("Any")
  courseHoles?: number[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}


