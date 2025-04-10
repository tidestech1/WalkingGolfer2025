import { GolfCourse, CourseCategory, CourseType, NFGCategory } from '@/types/course';

export const FALLBACK_COURSES: GolfCourse[] = [
  {
    id: 'fallback-1',
    courseName: 'Sample Golf Club',
    nfgFacilityID: 'SAMPLE001',
    
    // Contact Info
    contact_email: 'info@samplegolf.com',
    contact_phone: '555-0123',
    contact_tollFreePhone: '1-800-555-0123',
    contact_website: 'https://www.samplegolf.com',
    
    // Course Details
    course_category: CourseCategory.DF,
    course_description: 'A beautiful walking-friendly course with scenic views.',
    course_designer: 'John Doe',
    course_holes: 18,
    course_tees: 4,
    course_type: CourseType.JG,
    course_yearEstablished: 1990,
    
    // Location
    location_address1: '123 Golf Course Road',
    location_address2: '',
    location_city: 'Sample City',
    location_coordinates_latitude: 37.7749,
    location_coordinates_longitude: -122.4194,
    location_country: 'USA',
    location_county: 'Sample County',
    location_state: 'CA',
    location_zip: '12345',
    
    // Facilities
    facilities_proShop: true,
    facilities_barRestaurant: true,
    facilities_changingRoom: true,
    facilities_lockers: true,
    facilities_drivingRange: true,
    facilities_puttingGreen: true,
    facilities_chippingGreen: true,
    facilities_practiceBunker: true,
    facilities_caddies: true,
    facilities_clubRental: true,
    facilities_golfCarts: true,
    facilities_pushCarts: true,
    
    // Pricing
    pricing_fee: 75,
    pricing_nfgCategory: NFGCategory.B,
    pricing_rating: 4,
    
    // Ratings
    twgRating: '4.5',
    reviewerNotes: 'Great walking course with well-maintained facilities.',
    walkabilityRating_cost: 4,
    walkabilityRating_hilliness: 3,
    walkabilityRating_holeDistance: 4,
    walkabilityRating_overall: 4,
    walkabilityRating_weightedRating: 3.75,
    
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Search terms
    searchableTerms: ['sample', 'golf', 'club', 'california', 'walking', 'friendly']
  }
]; 