import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';

import { getFirebaseAdmin } from '@/lib/firebase/firebaseAdmin';

interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Authenticates a request as an admin user
 * Checks for a valid Firebase Auth token and that the user has admin role
 */
export async function authenticateAdminRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Initialize Firebase Admin if not already initialized
    const adminApp = getFirebaseAdmin();
    if (!adminApp) {
      return {
        isAuthenticated: false,
        error: 'Firebase Admin SDK not initialized'
      };
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        isAuthenticated: false,
        error: 'Missing or invalid authorization header'
      };
    }

    // Extract and verify the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return {
        isAuthenticated: false,
        error: 'Invalid authorization header format'
      };
    }
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Get the user ID from the token
    const userId = decodedToken.uid;
    
    // Check if user has admin role
    // Check for custom claims safely
    const customClaims = decodedToken['customClaims'] as { admin?: boolean } | undefined;
    const hasAdminClaim = typeof customClaims?.admin === 'boolean' && customClaims.admin === true;

    // Check if user has admin role using safe checks
    if (!hasAdminClaim) { // Check the combined safe claim first
      // If no admin claim on the token, get the full user record and check claims there
      const user = await getAuth().getUser(userId);
      
      if (user.customClaims?.['admin'] !== true) { // Use bracket notation for custom claims check on user object
        return {
          isAuthenticated: false,
          userId,
          error: 'User does not have admin privileges'
        };
      }
    }

    // User is authenticated and has admin role
    return {
      isAuthenticated: true,
      userId
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return {
      isAuthenticated: false,
      error: String(error)
    };
  }
} 