import { GolfCourse } from '@/types/course';

export const FALLBACK_COURSES: GolfCourse[] = [
  {
    id: 'fallback-1',
    courseName: 'Fallback Golf Course',
    imageUrl: '/images/fallback-course.jpg',
    
    // Contact Info
    contact_email: 'info@fallbackgolf.com',
    contact_phone: '555-FALLBACK',
    contact_tollFreePhone: '1-800-FALLBACK',
    contact_website: 'https://www.fallbackgolf.com',
    
    // Course Details
    course_category: 'Municipal',
    course_description: 'A reliable fallback course for display purposes.',
    course_designer: 'Fallback Designer Inc.',
    course_holes: 18,
    course_tees: 3,
    course_type: 'Parkland',
    course_yearEstablished: 1988,
    course_isWalkable: true,
    course_par: 71,
    course_guestPolicy: 'Public course, guests welcome anytime.',

    // Club Details
    club_totalHoles: 18,
    club_name: 'Fallback Municipal Golf',
    
    // Location
    location_address1: '1 Fallback Way',
    location_address2: '',
    location_city: 'Fallback City',
    location_coordinates_latitude: 40.7128,
    location_coordinates_longitude: -74.0060,
    location_country: 'USA',
    location_state: 'NY',
    location_zip: '10001',
    
    // Facilities
    facilities_proShop: true,
    facilities_restaurant: true,
    facilities_drivingRange: true,
    facilities_puttingGreen: true,
    facilities_chippingGreen: false,
    facilities_practiceBunker: false,
    facilities_caddies: false,
    facilities_clubRental: true,
    facilities_golfCarts: true,
    facilities_pushCarts: true,
    
    // Pricing
    course_weekdayCost: 50,
    course_weekendCost: 65,
    course_twilightCost: 35,
    
    // Ratings
    reviewCount: 5,
    overallRatingSum: 18,
    costRatingSum: 22,
    conditionRatingSum: 17,
    hillinessRatingSum: 15,
    distanceRatingSum: 19,
    calculatedWeightedRatingSum: 18,
    
    twgRating: '3.6',
    reviewerNotes: 'Decent fallback course, playable condition.',
    twgReviewerNotes: 'Used as placeholder when main data fails.',
    walkabilityRating_courseCondition: 3.4,
    walkabilityRating_cost: 4.4,
    walkabilityRating_hilliness: 3.0,
    walkabilityRating_holeDistance: 3.8,
    walkabilityRating_overall: 3.6,
    walkabilityRating_weightedRating: 3.5,
    
    // Timestamps
    lastRatingUpdate: new Date('2023-05-01T00:00:00Z'),
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-05-01T00:00:00Z'),
    
    // Search terms
    searchableTerms: ['fallback', 'golf', 'municipal', 'new york']
  }
]; 