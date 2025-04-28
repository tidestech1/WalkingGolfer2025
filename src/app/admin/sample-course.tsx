'use client';

import React from 'react';

import { GolfCourse } from '@/types/course';

/**
 * This component provides a reference sample of a course object
 * with all the required fields properly formatted
 */
export default function SampleCourseReference(): JSX.Element {
  // Sample course updated to match the NEW GolfCourse interface
  const sampleCourse: GolfCourse = {
    id: 'sample-course-id', 
    courseName: 'Sample Golf Course',
    imageUrl: '/images/sample-course.jpg',

    // Contact Info (flat)
    contact_email: 'info@samplegolfclub.com',
    contact_phone: '555-123-4567',
    contact_tollFreePhone: '800-555-GOLF',
    contact_website: 'https://samplegolfclub.com',

    // Course Details (flat)
    course_category: 'Public Daily Fee',
    course_description: 'A beautiful sample golf course for testing purposes.',
    course_designer: 'Sample Designer',
    course_holes: 18,
    course_tees: 4,
    course_type: 'Resort Course',
    course_yearEstablished: 1985,
    course_isWalkable: true,
    course_par: 72,
    course_guestPolicy: 'Guests welcome anytime with member',

    // Club Details (related to the overall club/facility)
    club_totalHoles: 36,
    club_name: 'Sample Golf Club & Resort',

    // Location (flat)
    location_address1: '123 Fairway Drive',
    location_address2: 'Suite 100',
    location_city: 'Anytown',
    location_coordinates_latitude: 37.7749,
    location_coordinates_longitude: -122.4194,
    location_country: 'USA',
    location_state: 'CA',
    location_zip: '90210',

    // Facilities (all required with default false)
    facilities_proShop: true,
    facilities_restaurant: true,
    facilities_drivingRange: true,
    facilities_puttingGreen: true,
    facilities_chippingGreen: true,
    facilities_practiceBunker: true,
    facilities_caddies: false,
    facilities_clubRental: true,
    facilities_golfCarts: true,
    facilities_pushCarts: true,

    // Pricing (New structure based on course costs)
    course_weekdayCost: 80,
    course_weekendCost: 100,
    course_twilightCost: 50,

    // Ratings (all nullable)
    reviewCount: 15,
    overallRatingSum: 60,
    costRatingSum: 55,
    conditionRatingSum: 62,
    hillinessRatingSum: 65,
    distanceRatingSum: 68,
    calculatedWeightedRatingSum: 63,
    
    twgRating: 'Sample TWG Rating',
    reviewerNotes: 'Sample reviewer notes.',
    twgReviewerNotes: 'Additional notes from TWG admin.',
    walkabilityRating_courseCondition: 4.1,
    walkabilityRating_cost: 3.8,
    walkabilityRating_hilliness: 4.0,
    walkabilityRating_holeDistance: 4.5,
    walkabilityRating_overall: 4.2,
    walkabilityRating_weightedRating: 4.2,

    // Timestamps
    lastRatingUpdate: new Date('2023-10-26T10:00:00Z'),
    createdAt: new Date('2023-01-15T08:00:00Z'),
    updatedAt: new Date(),

    // Array of lowercase searchable terms
    searchableTerms: ['sample', 'golf', 'club', 'resort', 'anytown', 'ca', 'public'],
  };

  // Format the JSON for display with specific spacing and handling for undefined
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formattedJSON = JSON.stringify(sampleCourse, (_key: string, value: unknown): unknown => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sample Course Data Reference</h1>
      <p className="mb-6 text-gray-600">
        Use this sample data as a reference for creating test courses in Firebase. The below 
        fields represent all the data needed for proper display in the course finder and details pages.
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Complete Sample Course Object</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[600px]">
          {formattedJSON}
        </pre>
      </div>
    </div>
  );
}