import { collection, getDocs } from 'firebase/firestore';

import { db } from '../lib/firebase/firebase';

async function checkDatabase() {
  if (!db) {
    console.error('Firebase is not initialized');
    return;
  }

  try {
    // Check courses collection
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    console.log(`Number of courses in database: ${coursesSnapshot.size}`);
    
    if (coursesSnapshot.size > 0) {
      console.log('Warning: There are still courses in the database');
      coursesSnapshot.forEach(doc => {
        console.log(`Course ID: ${doc.id}`);
      });
    } else {
      console.log('Database is clean and ready for new data');
    }

    // Check reviews collection
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
    console.log(`Number of reviews in database: ${reviewsSnapshot.size}`);
    
    if (reviewsSnapshot.size > 0) {
      console.log('Warning: There are still reviews in the database');
      reviewsSnapshot.forEach(doc => {
        console.log(`Review ID: ${doc.id}`);
      });
    } else {
      console.log('Reviews collection is clean');
    }

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase(); 