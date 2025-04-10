'use client';

import { useEffect } from 'react';

import { isFirebaseAvailable } from '@/lib/firebase/firebase';

export const FirebaseInitializer = (): null => {
  useEffect(() => {
    try {
      const available = isFirebaseAvailable();
      if (!available) {
        console.error('Firebase initialization failed - services may be unavailable');
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }, []);

  return null;
};

export default FirebaseInitializer;