'use client';

import React from 'react';

import { GolfCourse, CourseCategory, CourseType, NFGCategory } from '@/types/course';

/**
 * This component provides a reference sample of a course object
 * with all the required fields properly formatted
 */
export default function SampleCourseReference(): JSX.Element {
  // Sample course updated to match the GolfCourse interface from src/types/course.ts
  const sampleCourse: GolfCourse = {
    id: 'sample-course-id', // Keep ID for reference
    courseName: 'Sample Golf Club', // Renamed from name
    nfgFacilityID: 'NFG-SAMPLE-123', // Added required field
    imageUrl: '/images/sample-course.jpg', // Use the new optional field

    // Contact Info (flat)
    contact_email: 'info@samplegolfclub.com',
    contact_phone: '555-123-4567',
    contact_tollFreePhone: '800-555-GOLF', // Added for completeness
    contact_website: 'https://samplegolfclub.com',

    // Course Details (flat)
    course_category: CourseCategory.DF, // Used enum, assuming Daily Fee
    course_description: 'A beautiful sample golf course for testing purposes.',
    course_designer: 'Sample Designer', // Added example
    course_holes: 18,
    course_tees: 4, // Added example
    course_type: CourseType.JG, // Used enum, assuming Just Golf
    course_yearEstablished: 1985,

    // Location (flat)
    location_address1: '123 Fairway Drive', // Use address1
    location_address2: '', // Use address2 (optional)
    location_city: 'Anytown',
    location_coordinates_latitude: 37.7749,
    location_coordinates_longitude: -122.4194,
    location_country: 'USA', // Added required field
    location_county: 'Sample County', // Added example
    location_state: 'CA',
    location_zip: '90210', // Added example

    // Facilities (all required with default false)
    facilities_proShop: true,
    facilities_barRestaurant: true,
    facilities_changingRoom: false,
    facilities_lockers: false,
    facilities_drivingRange: true,
    facilities_puttingGreen: true,
    facilities_chippingGreen: true,
    facilities_practiceBunker: true,
    facilities_caddies: false,
    facilities_clubRental: true,
    facilities_golfCarts: true,
    facilities_pushCarts: true, // Relates to old allowedCartTypes

    // Pricing
    pricing_fee: 65, // Added example
    pricing_nfgCategory: NFGCategory.B, // Used enum, Standard facility
    pricing_rating: 4.0, // Added example (nullable)

    // Ratings (all nullable)
    twgRating: 'Sample TWG Rating', // Added example string
    reviewerNotes: 'Sample reviewer notes.', // Added example string
    walkabilityRating_cost: 3.8, // Kept from old ratings.walkability.cost
    walkabilityRating_hilliness: 4.0, // Kept from old ratings.walkability.hilliness
    walkabilityRating_holeDistance: 4.5, // Kept from old ratings.walkability.holeDistance
    walkabilityRating_overall: 4.2, // Kept from old walkabilityRating
    walkabilityRating_weightedRating: 4.2, // Kept from old ratings.walkability.weightedRating

    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),

    // Searchable Terms (example - typically generated server-side)
    searchableTerms: ['sample', 'golf', 'club', 'anytown', 'ca', 'public'],
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

      <h2 className="text-xl font-semibold mb-2">Required Fields</h2>
      <ul className="list-disc list-inside mb-6 text-gray-700">
        <li><code className="bg-gray-100 px-1">id</code>: Unique identifier (automatically added by Firestore)</li>
        <li><code className="bg-gray-100 px-1">name</code>: Course name</li>
        <li><code className="bg-gray-100 px-1">location</code>: Object with city, state, and coordinates</li>
        <li><code className="bg-gray-100 px-1">walkabilityRating</code>: Numeric rating (1-5)</li>
        <li><code className="bg-gray-100 px-1">walkingAllowed</code>: Boolean indicating if walking is allowed</li>
        <li><code className="bg-gray-100 px-1">ratings.walkability.overall</code>: Overall walkability rating (1-5)</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">Walkability Rating Components</h2>
      <ul className="list-disc list-inside mb-6 text-gray-700">
        <li><code className="bg-gray-100 px-1">ratings.walkability.hilliness</code>: Terrain rating (1: Very hilly, 5: Flat)</li>
        <li><code className="bg-gray-100 px-1">ratings.walkability.holeDistance</code>: Distance between holes (1: Long walks, 5: Compact)</li>
        <li><code className="bg-gray-100 px-1">ratings.walkability.cost</code>: Cost rating (1: Expensive, 5: Affordable)</li>
        <li><code className="bg-gray-100 px-1">ratings.walkability.weightedRating</code>: Calculated weighted average</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">Optional but Recommended Fields</h2>
      <ul className="list-disc list-inside mb-6 text-gray-700">
        <li><code className="bg-gray-100 px-1">imageUrls</code>: Array of image URLs</li>
        <li><code className="bg-gray-100 px-1">description</code>: Course description</li>
        <li><code className="bg-gray-100 px-1">contact</code>: Contact information (phone, email, website)</li>
      </ul>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Complete Sample Course Object</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[600px]">
          {formattedJSON}
        </pre>
      </div>
    </div>
  );
}