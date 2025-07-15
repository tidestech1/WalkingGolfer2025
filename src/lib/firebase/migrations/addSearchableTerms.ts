import { getFirestore } from 'firebase-admin/firestore'

import { GolfCourse } from '@/types/course'

const BATCH_SIZE = 500 // Firestore batch limit is 500 operations

/**
 * Updates all existing courses with searchable terms
 * This is a one-time migration script
 */
export async function migrateSearchableTerms() {
  const db = getFirestore()
  
  try {
    // console.log('Starting searchable terms migration...')
    
    // Get all courses
    const coursesRef = db.collection('courses')
    const snapshot = await coursesRef.get()
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GolfCourse[]
    
    // console.log(`Found ${courses.length} courses to update`)
    
    // Process in batches
    for (let i = 0; i < courses.length; i += BATCH_SIZE) {
      const batch = db.batch()
      const batchCourses = courses.slice(i, i + BATCH_SIZE)
      
      batchCourses.forEach(course => {
        const courseRef = db.doc(`courses/${course.id}`)
        const searchableTerms = generateSearchableTerms(course)
        batch.update(courseRef, { searchableTerms })
      })
      
      await batch.commit()
      // console.log(`Updated batch of ${batchCourses.length} courses (${i + batchCourses.length}/${courses.length})`)
    }
    
    // console.log('Migration completed successfully')
    return {
      success: true,
      coursesUpdated: courses.length
    }
  } catch (error) {
    // console.error('Migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function generateSearchableTerms(course: Omit<GolfCourse, 'searchableTerms' | 'id'>): string[] {
  const terms = new Set<string>()
  
  // Add full terms
  terms.add(course.courseName.toLowerCase())
  terms.add(course.location_city.toLowerCase())
  terms.add(course.location_state.toLowerCase())
  
  // Add club name if it exists and is different from course name
  if (course.club_name && course.club_name.toLowerCase() !== course.courseName.toLowerCase()) {
    terms.add(course.club_name.toLowerCase())
  }
  
  // Add individual words from course name
  course.courseName.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) { // Only add words longer than 2 characters
      terms.add(word)
    }
  })
  
  // Add city name words
  course.location_city.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) {
      terms.add(word)
    }
  })
  
  // Add club name words if it exists
  if (course.club_name) {
    course.club_name.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) {
        terms.add(word)
      }
    })
  }
  
  return Array.from(terms)
}

// Example usage:
// import { migrateSearchableTerms } from './migrations/addSearchableTerms'
// await migrateSearchableTerms() 