import { collection, getDocs } from 'firebase/firestore';

import { db } from '../lib/firebase/firebase';
import { GolfCourse, MapBounds } from '../types/course';

// USA bounds from the MapBounds interface
const USA_BOUNDS: MapBounds = {
  north: 49.3457868,
  south: 24.396308,
  east: -66.93457,
  west: -124.848974
};

interface OutOfBoundsCourse {
  id: string;
  courseName: string;
  state: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  issue: string;
}

interface ValidationReport {
  totalCourses: number;
  outOfBoundsCount: number;
  courses: OutOfBoundsCourse[];
  stateCounts: Record<string, number>;
}

function validateCoordinates(course: GolfCourse): string[] {
  const issues: string[] = [];
  const { location_coordinates_latitude: lat, location_coordinates_longitude: lng } = course;

  if (lat > USA_BOUNDS.north) {
issues.push(`Latitude ${lat} is north of USA bounds (${USA_BOUNDS.north})`);
}
  if (lat < USA_BOUNDS.south) {
issues.push(`Latitude ${lat} is south of USA bounds (${USA_BOUNDS.south})`);
}
  if (lng > USA_BOUNDS.east) {
issues.push(`Longitude ${lng} is east of USA bounds (${USA_BOUNDS.east})`);
}
  if (lng < USA_BOUNDS.west) {
issues.push(`Longitude ${lng} is west of USA bounds (${USA_BOUNDS.west})`);
}

  return issues;
}

function generateReport(courses: GolfCourse[]): ValidationReport {
  const outOfBoundsCourses: OutOfBoundsCourse[] = [];

  courses.forEach(course => {
    const issues = validateCoordinates(course);
    if (issues.length > 0) {
      outOfBoundsCourses.push({
        id: course.id,
        courseName: course.courseName,
        state: course.location_state,
        coordinates: {
          lat: course.location_coordinates_latitude,
          lng: course.location_coordinates_longitude
        },
        issue: issues.join(', ')
      });
    }
  });

  const stateCounts = outOfBoundsCourses.reduce((acc, course) => {
    acc[course.state] = (acc[course.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCourses: courses.length,
    outOfBoundsCount: outOfBoundsCourses.length,
    courses: outOfBoundsCourses,
    stateCounts
  };
}

function printReport(report: ValidationReport): void {
  console.log('\n=== Out of Bounds Coordinates Report ===');
  console.log(`Total courses checked: ${report.totalCourses}`);
  console.log(`Courses with out-of-bounds coordinates: ${report.outOfBoundsCount}`);
  
  if (report.outOfBoundsCount > 0) {
    console.log('\nDetailed List:');
    console.log('----------------------------------------');
    
    report.courses.forEach(course => {
      console.log(`\nCourse: ${course.courseName}`);
      console.log(`ID: ${course.id}`);
      console.log(`State: ${course.state}`);
      console.log(`Coordinates: ${course.coordinates.lat}, ${course.coordinates.lng}`);
      console.log(`Issue: ${course.issue}`);
    });

    console.log('\nCount by State:');
    console.log('----------------------------------------');
    Object.entries(report.stateCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`${state}: ${count} courses`);
      });
  } else {
    console.log('\nNo out-of-bounds coordinates found!');
  }
}

async function findOutOfBoundsCoordinates(): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    console.log('Fetching course data...');
    const coursesRef = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GolfCourse[];
    
    const report = generateReport(courses);
    printReport(report);

  } catch (error) {
    console.error('Error finding out-of-bounds coordinates:', error);
    process.exit(1);
  }
}

// Run the script
findOutOfBoundsCoordinates(); 