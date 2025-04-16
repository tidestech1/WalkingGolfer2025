// Enums for fields with specific options
export enum CourseCategory {
  PR = 'PR', // Private
  PL = 'PL', // Private with Limited Guest Play
  DF = 'DF', // Daily Fee
  MU = 'MU'  // Municipal
}

export enum CourseType {
  JG = 'JG', // Just Golf
  RS = 'RS', // Resort
  RD = 'RD', // Real Estate Development
  RR = 'RR', // Resort & Real Estate Development
  MI = 'MI', // Military
  UN = 'UN', // University
  PK = 'PK'  // Park
}

export enum NFGCategory {
  A = 'A', // Premium facility (Over $70)
  B = 'B', // Standard facility ($40-$70)
  C = 'C', // Value facility ($1-$40)
  P = 'P'  // Private facility
}

// Main interface
export interface GolfCourse {
  // Basic Info
  id: string;
  courseName: string;
  nfgFacilityID: string;
  imageUrl?: string;
  
  // Contact Info (flat)
  contact_email: string;
  contact_phone: string;
  contact_tollFreePhone: string;
  contact_website: string;
  
  // Course Details (flat)
  course_category: CourseCategory;
  course_description: string;
  course_designer: string;
  course_holes: number;
  course_tees: number;
  course_type: CourseType;
  course_yearEstablished: number;
  
  // Location (flat)
  location_address1: string;
  location_address2: string;
  location_city: string;
  location_coordinates_latitude: number;
  location_coordinates_longitude: number;
  location_country: string;
  location_county: string;
  location_state: string;
  location_zip: string;
  
  // Facilities (all required with default false)
  // Main facilities
  facilities_proShop: boolean;
  facilities_barRestaurant: boolean;
  facilities_changingRoom: boolean;
  facilities_lockers: boolean;
  
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
  
  // Pricing
  pricing_fee: number;
  pricing_nfgCategory: NFGCategory;
  pricing_rating: number | null;
  
  // Ratings (all nullable)
  // --- NEW FIELDS FOR CALCULATING AVERAGES ---
  reviewCount: number;
  overallRatingSum: number;
  costRatingSum: number;
  conditionRatingSum: number;
  hillinessRatingSum: number;
  distanceRatingSum: number; // Sum for walkabilityRating_holeDistance
  calculatedWeightedRatingSum: number; // Sum for walkabilityRating_weightedRating
  // --- END NEW FIELDS ---
  
  // Calculated average ratings
  twgRating: string;
  reviewerNotes: string;
  walkabilityRating_courseCondition: number | null;
  walkabilityRating_cost: number | null;
  walkabilityRating_hilliness: number | null;
  walkabilityRating_holeDistance: number | null;
  walkabilityRating_overall: number | null;
  walkabilityRating_weightedRating: number | null;
  
  // Timestamps
  lastRatingUpdate: Date | null; // Using Date for consistency, can be Firestore Timestamp on backend
  createdAt: Date;
  updatedAt: Date;
  
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
 */
export interface CourseFilters {
  // Required fields with defaults
  course_types: string[];
  course_categories: string[];
  pricing_fee_min: number;
  pricing_fee_max: number;
  walkabilityRating_overall_min: number;

  // Optional fields
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  state?: string | undefined;
  mapBounds?: MapBounds;
  isWalkable?: boolean;
  simpleSearch?: boolean; // When true, only use basic search without complex filters
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Represents a cluster of golf courses on the map
 * Used for grouping nearby courses when zoomed out
 */
export interface CourseCluster {
  location_coordinates: {
    location_coordinates_latitude: number;   // Latitude of the cluster center
    location_coordinates_longitude: number;  // Longitude of the cluster center
  };
  courses: GolfCourse[];                    // Array of courses in this cluster
  count: number;                            // Total number of courses in the cluster
} 