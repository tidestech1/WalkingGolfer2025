import { initializeApp, getApps, getApp, FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let firebaseInitialized = false;

// Initialize Firebase lazily
export const initializeFirebase = (): boolean => {
  // Only initialize once
  if (firebaseInitialized) {
return true;
}

  // Check if Firebase configuration is complete
  const hasAllFirebaseConfig = 
    process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] && 
    process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] && 
    process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] &&
    process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] &&
    process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] &&
    process.env['NEXT_PUBLIC_FIREBASE_APP_ID'];

  if (!hasAllFirebaseConfig) {
    console.warn('Firebase configuration is incomplete. Firebase services will be disabled.');
    console.log('Missing Firebase environment variables:');
    if (!process.env['NEXT_PUBLIC_FIREBASE_API_KEY']) {
console.log('- NEXT_PUBLIC_FIREBASE_API_KEY');
}
    if (!process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN']) {
console.log('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
}
    if (!process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID']) {
console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
}
    if (!process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']) {
console.log('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
}
    if (!process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID']) {
console.log('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
}
    if (!process.env['NEXT_PUBLIC_FIREBASE_APP_ID']) {
console.log('- NEXT_PUBLIC_FIREBASE_APP_ID');
}
    return false;
  }

  // Firebase configuration
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] as string,
    authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] as string,
    projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] as string,
    storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] as string,
    messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] as string,
    appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] as string
  };

  try {
    if (!getApps().length) {
      console.log('Initializing Firebase with full configuration...');
      
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      
      firebaseInitialized = true;
      console.log('Firebase initialized successfully');
    } else {
      app = getApp();
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      firebaseInitialized = true;
    }
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    firebaseInitialized = false;
    // Reset all Firebase instances
    app = null;
    db = null;
    auth = null;
    storage = null;
    return false;
  }
};

// Check if we can actually use Firebase
export const isFirebaseAvailable = (): boolean => {
  console.log('isFirebaseAvailable called, current state:', {
    firebaseInitialized,
    appExists: !!app,
    dbExists: !!db,
    authExists: !!auth
  });
  
  if (!firebaseInitialized) {
    const result = initializeFirebase();
    console.log('Initialized Firebase with result:', result);
  }
  
  return firebaseInitialized && app !== null && db !== null;
};

// Export Firebase instances - these will be null if Firebase is not available
export { app, db, auth, storage };

// Add a helper function to check if Firebase is available
export const checkFirebaseAvailability = (): boolean => {
  const available = isFirebaseAvailable();
  if (!available) {
    console.warn('Firebase is not available. Make sure environment variables are properly set.');
  }
  return available;
};

// Initialize Firebase immediately (but still client-side only)
if (typeof window !== 'undefined') {
  initializeFirebase();
}
