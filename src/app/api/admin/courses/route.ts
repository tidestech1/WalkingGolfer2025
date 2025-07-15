import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { authenticateAdminRequest } from '@/lib/auth/adminAuth';
import { GolfCourse } from '@/types/course';
import { generateSearchableTerms } from '@/lib/firebase/courseUtils';

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin request
    const authResult = await authenticateAdminRequest(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const courseData = body.course;

    if (!courseData) {
      return NextResponse.json(
        { error: 'Course data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!courseData.courseName || !courseData.club_name || !courseData.location_city || !courseData.location_state) {
      return NextResponse.json(
        { error: 'Course name, club name, city, and state are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Generate searchable terms
    const searchableTerms = generateSearchableTerms(courseData);

    // Prepare course data for creation
    const newCourseData: Omit<GolfCourse, 'id'> = {
      ...courseData,
      searchableTerms,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdatedBy: authResult.userId,
      
      // Ensure required fields have defaults
      reviewCount: 0,
      overallRatingSum: 0,
      costRatingSum: 0,
      conditionRatingSum: 0,
      hillinessRatingSum: 0,
      distanceRatingSum: 0,
      calculatedWeightedRatingSum: 0,
      walkabilityRating_courseCondition: null,
      walkabilityRating_cost: null,
      walkabilityRating_hilliness: null,
      walkabilityRating_holeDistance: null,
      walkabilityRating_overall: null,
      walkabilityRating_weightedRating: null,
      lastRatingUpdate: null,
      
      // Default values for optional fields
      imageUrl: courseData.imageUrl || '',
      contact_email: courseData.contact_email || '',
      contact_phone: courseData.contact_phone || '',
      contact_tollFreePhone: courseData.contact_tollFreePhone || '',
      contact_website: courseData.contact_website || '',
      course_category: courseData.course_category || '',
      course_description: courseData.course_description || '',
      course_designer: courseData.course_designer || '',
      course_type: courseData.course_type || '',
      course_guestPolicy: courseData.course_guestPolicy || '',
      location_address1: courseData.location_address1 || '',
      location_address2: courseData.location_address2 || '',
      location_zip: courseData.location_zip || '',
      location_country: courseData.location_country || 'USA',
      location_coordinates_latitude: courseData.location_coordinates_latitude || 0,
      location_coordinates_longitude: courseData.location_coordinates_longitude || 0,
      twgRating: courseData.twgRating || '',
      reviewerNotes: courseData.reviewerNotes || '',
      twgReviewerNotes: courseData.twgReviewerNotes || '',
      
      // Numeric fields with defaults
      course_holes: courseData.course_holes || 18,
      course_tees: courseData.course_tees || 4,
      course_yearEstablished: courseData.course_yearEstablished || new Date().getFullYear(),
      course_par: courseData.course_par || 72,
      club_totalHoles: courseData.club_totalHoles || 18,
      course_weekdayCost: courseData.course_weekdayCost || 0,
      course_weekendCost: courseData.course_weekendCost || 0,
      course_twilightCost: courseData.course_twilightCost || 0,
      
      // Boolean fields with defaults
      course_isWalkable: courseData.course_isWalkable ?? null,
      facilities_proShop: courseData.facilities_proShop || false,
      facilities_restaurant: courseData.facilities_restaurant || false,
      facilities_drivingRange: courseData.facilities_drivingRange || false,
      facilities_puttingGreen: courseData.facilities_puttingGreen || false,
      facilities_chippingGreen: courseData.facilities_chippingGreen || false,
      facilities_practiceBunker: courseData.facilities_practiceBunker || false,
      facilities_caddies: courseData.facilities_caddies || false,
      facilities_clubRental: courseData.facilities_clubRental || false,
      facilities_golfCarts: courseData.facilities_golfCarts || false,
      facilities_pushCarts: courseData.facilities_pushCarts || false,
    };

    // Create the course
    const courseRef = await db.collection('courses').add(newCourseData);

    // Get the created course
    const createdCourse = {
      id: courseRef.id,
      ...newCourseData
    };

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      course: createdCourse,
      id: courseRef.id
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 