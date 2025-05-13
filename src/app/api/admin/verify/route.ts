import crypto from 'crypto';

import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

import { getFirebaseAdmin } from '@/lib/firebase/firebaseAdmin';


// Add a type declaration for the global object
declare global {
  // eslint-disable-next-line no-var -- var is standard for declare global
  var adminTokens: Map<string, number> | undefined;
}

// Server-side function to verify a Firebase ID token
async function verifyAuthToken(token: string): Promise<DecodedIdToken | null> {
  try {
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
      return null;
    }
    
    const auth = getAuth(firebaseAdmin);
    const decodedToken: DecodedIdToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Generate a temporary admin token (valid for 1 hour)
function generateTemporaryAdminToken(): { token: string; expiration: number } {
  // Generate random bytes for the token
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString('hex');
  
  // Store the token with an expiration time
  const expiration = Date.now() + 60 * 60 * 1000; // 1 hour from now
  
  // In a production app, you would store this in a database or cache
  // For simplicity, we'll use a server-side Map (note: this won't persist across serverless function invocations)
  // To make this more robust, consider using Redis or another distributed cache
  global.adminTokens = global.adminTokens || new Map();
  global.adminTokens.set(token, expiration);
  
  return { token, expiration };
}

// Clean up expired tokens
function cleanupExpiredTokens(): void {
  if (!global.adminTokens) {
    return;
  }
  
  const now = Date.now();
  for (const [token, expiration] of global.adminTokens.entries()) {
    if (expiration < now) {
      global.adminTokens.delete(token);
    }
  }
}

// POST endpoint to verify admin status and issue a temporary token
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the Firebase ID token from the request
    const { idToken } = await req.json() as { idToken: string };
    
    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }
    
    // Verify the Firebase ID token
    const decodedToken = await verifyAuthToken(idToken);
    if (!decodedToken) {
      console.error('Admin verify: Invalid ID token received or verification failed.');
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
    }
    
    // Log the entire decoded token to inspect its contents, especially custom claims
    console.log('Admin verify: Decoded ID token:', JSON.stringify(decodedToken, null, 2));

    // Check if the user is an admin
    // You can customize this check based on your admin criteria
    // This example uses email for simplicity, but in production you should
    // use custom claims or check against a database of admin users
    // Accessing potential index signature properties with bracket notation

    // Check for custom claims
    // First, check for claims nested under a 'customClaims' object
    const nestedCustomClaims = decodedToken['customClaims'] as { admin?: boolean } | undefined;
    console.log('Admin verify: Extracted nestedCustomClaims:', JSON.stringify(nestedCustomClaims, null, 2));
    let hasAdminClaim = typeof nestedCustomClaims?.admin === 'boolean' && nestedCustomClaims.admin === true;
    console.log('Admin verify: hasAdminClaim (from nested check) evaluated to:', hasAdminClaim);

    // If not found in nested, check for 'admin' claim at the root of the decodedToken,
    // as observed in token structure from logs.
    if (!hasAdminClaim) {
      const adminClaimFromRoot = decodedToken['admin'];
      console.log('Admin verify: adminClaimFromRoot:', JSON.stringify(adminClaimFromRoot, null, 2));
      if (typeof adminClaimFromRoot === 'boolean' && adminClaimFromRoot === true) {
        hasAdminClaim = true;
        console.log('Admin verify: hasAdminClaim (from root check) now set to true');
      }
    }
    // Log final status of admin claim check
    console.log('Admin verify: Final hasAdminClaim evaluated to:', hasAdminClaim);

    const isAdmin = decodedToken.email === "neilrossstewart@gmail.com" ||
                   decodedToken.email?.endsWith('@admin.golfwalker.com') ||
                   hasAdminClaim; // Use the safely checked claim
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 403 });
    }
    
    // Clean up expired tokens
    cleanupExpiredTokens();
    
    // Generate a temporary admin token
    const { token, expiration } = generateTemporaryAdminToken();
    
    // Return the token and expiration
    return NextResponse.json({
      adminToken: token,
      expiration,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify admin status' },
      { status: 500 }
    );
  }
}

// Endpoint to validate an admin token
export function GET(req: NextRequest): NextResponse {
  // Get the admin token from the request headers
  const adminToken = req.headers.get('x-admin-token');
  
  if (!adminToken) {
    return NextResponse.json({ valid: false, error: 'Missing admin token' }, { status: 400 });
  }
  
  // Check if the token exists and is not expired
  const tokenExpiration = global.adminTokens?.get(adminToken);
  const isValid = tokenExpiration && tokenExpiration > Date.now();
  
  if (!isValid) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired admin token' }, { status: 401 });
  }
  
  return NextResponse.json({ valid: true });
} 