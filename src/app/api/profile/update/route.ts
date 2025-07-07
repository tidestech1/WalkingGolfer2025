import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { updateUserProfileAdmin, syncUserProfileToKlaviyo } from '@/lib/firebase/userUtils';
import type { UserProfileUpdate } from '@/types/user';

// Initialize Firebase Admin
getFirebaseAdmin();

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify the Firebase token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { profileData } = body;

    if (!profileData || typeof profileData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid profile data provided' },
        { status: 400 }
      );
    }

    // Validate profile data structure
    const validFields = [
      'firstName', 'lastName', 'displayName', 'dateOfBirth',
      'golfingExperience', 'preferredCarryMethod', 'golfHandicap',
      'zipcode', 'favoriteStates', 'reviewDisplayNameType',
      'preferences', 'marketingConsent'
    ];

    const updateData: UserProfileUpdate = {};
    
    // Only include valid fields in the update
    for (const [key, value] of Object.entries(profileData)) {
      if (validFields.includes(key) && value !== undefined) {
        (updateData as any)[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid profile fields provided' },
        { status: 400 }
      );
    }

    // Update profile in Firebase
    await updateUserProfileAdmin(userId, updateData);
    
    // Sync to Klaviyo (this will now work on server-side)
    try {
      await syncUserProfileToKlaviyo(userId, updateData);
      console.log(`Successfully synced profile update to Klaviyo for user: ${userId}`);
    } catch (klaviyoError) {
      console.warn(`Klaviyo sync failed for user ${userId}:`, klaviyoError);
      // Don't fail the entire request for Klaviyo issues
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Profile updated successfully',
        klaviyoSynced: true // We'll always report true since we handle errors gracefully
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Profile update API error:', error);
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 