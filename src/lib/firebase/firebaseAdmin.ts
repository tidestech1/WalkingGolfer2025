import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Cached instance
let firebaseAdminApp: App | null = null;

/**
 * Initialize and return the Firebase Admin SDK app
 * This is used for server-side operations like auth verification
 */
export function getFirebaseAdmin(): App {
  // If already initialized, return the cached instance
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  // Check if any apps have been initialized
  const apps = getApps();
  if (apps.length > 0) {
    // Return the first initialized app
    firebaseAdminApp = apps[0] ?? null; // Use nullish coalescing to assign null if apps[0] is undefined
    // Ensure firebaseAdminApp is not null/undefined if apps[0] is falsy
    if (!firebaseAdminApp) {
        throw new Error('Failed to retrieve initialized Firebase Admin app.');
    }
    return firebaseAdminApp;
  }

  // Check for required environment variables
  const privateKey = process.env['FIREBASE_ADMIN_PRIVATE_KEY'];
  const clientEmail = process.env['FIREBASE_ADMIN_CLIENT_EMAIL'];
  const projectId = process.env['FIREBASE_ADMIN_PROJECT_ID'];

  // If any required configs are missing, throw an error
  if (!privateKey || !clientEmail || !projectId) {
    console.error('Firebase Admin SDK configuration missing in environment variables.');
    throw new Error('Firebase Admin SDK configuration missing.');
  }

  // Initialize the app with credentials
  try {
    // Process the private key
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // Basic validation - should be improved if possible
    if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedPrivateKey.includes('-----END PRIVATE KEY-----')) {
        console.warn('Firebase Admin private key format might be incorrect (missing delimiters).');
    }

    console.log('Initializing Firebase Admin SDK...');
    firebaseAdminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
    return firebaseAdminApp;

  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    firebaseAdminApp = null; // Reset on error
    // Throw a more informative error
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : String(error)}`);
  }
} 

/**
 * Gets the initialized Firebase Admin Firestore instance.
 * Throws an error if Admin SDK initialization failed.
 */
export function getAdminFirestore(): Firestore {
  const app = getFirebaseAdmin(); // This will throw if initialization fails
  return getFirestore(app);
}

/**
 * Gets the initialized Firebase Admin Auth instance.
 * Throws an error if Admin SDK initialization failed.
 */
export function getAdminAuth(): Auth {
  const app = getFirebaseAdmin(); // This will throw if initialization fails
  return getAuth(app);
} 