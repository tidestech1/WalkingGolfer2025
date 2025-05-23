import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/lib/firebase/firebase';

interface ValidationStats {
  totalRecords: number;
  invalidTypes: Record<string, number>;
  invalidCoordinates: number;
  invalidStateCodes: Record<string, number>;
  invalidFacilities: Record<string, number>;
  missingRequiredStrings?: Record<string, number>;
  invalidCosts?: Record<string, number>;
  dataQuality: {
    hasCoordinates: number;
    hasState: number;
    hasFacilities: number;
    hasContactInfo: number;
  };
}

// USA bounds for coordinate validation
const USA_BOUNDS = {
  north: 49.3457868,
  south: 24.396308,
  east: -66.93457,
  west: -124.848974
};

// Valid US state codes (including DC for golf courses)
const VALID_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Facility fields to check
const FACILITY_FIELDS = [
  'facilities_proShop',
  'facilities_restaurant',
  'facilities_drivingRange',
  'facilities_puttingGreen',
  'facilities_chippingGreen',
  'facilities_practiceBunker',
  'facilities_caddies',
  'facilities_clubRental',
  'facilities_golfCarts',
  'facilities_pushCarts'
];

async function validateCourseData() {
  console.log('Starting course data validation...');
  
  if (!db) {
    console.error('Firebase is not initialized');
    return;
  }

  const stats: ValidationStats = {
    totalRecords: 0,
    invalidTypes: {},
    invalidCoordinates: 0,
    invalidStateCodes: {},
    invalidFacilities: {},
    missingRequiredStrings: {},
    invalidCosts: {},
    dataQuality: {
      hasCoordinates: 0,
      hasState: 0,
      hasFacilities: 0,
      hasContactInfo: 0
    }
  };

  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    console.log(`Found ${snapshot.size} records to validate`);
    stats.totalRecords = snapshot.size;

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Track data quality
      if (data['location_coordinates_latitude'] && data['location_coordinates_longitude']) {
        stats.dataQuality.hasCoordinates++;
      }
      if (data['location_state']) {
        stats.dataQuality.hasState++;
      }
      if (FACILITY_FIELDS.some(field => field in data)) {
        stats.dataQuality.hasFacilities++;
      }
      if (data['contact_email'] || data['contact_phone']) {
        stats.dataQuality.hasContactInfo++;
      }

      // Validate coordinates are within USA bounds (only if present)
      if (data['location_coordinates_latitude'] && data['location_coordinates_longitude']) {
        const lat = data['location_coordinates_latitude'];
        const lng = data['location_coordinates_longitude'];
        if (lat < USA_BOUNDS.south || lat > USA_BOUNDS.north || 
            lng < USA_BOUNDS.west || lng > USA_BOUNDS.east) {
          stats.invalidCoordinates++;
        }
      }

      // Validate state code (only if present)
      if (data['location_state'] && !VALID_STATE_CODES.includes(data['location_state'])) {
        stats.invalidStateCodes[data['location_state']] = 
          (stats.invalidStateCodes[data['location_state']] || 0) + 1;
      }

      // Validate facility fields (only if present)
      FACILITY_FIELDS.forEach(field => {
        if (field in data && typeof data[field] !== 'boolean') {
          stats.invalidFacilities[field] = (stats.invalidFacilities[field] || 0) + 1;
        }
      });
    });

    // Print validation report
    console.log('\n=== Validation Report ===');
    console.log(`Total Records: ${stats.totalRecords}`);
    
    console.log('\nData Quality Overview:');
    console.log(`  Records with coordinates: ${stats.dataQuality.hasCoordinates} (${((stats.dataQuality.hasCoordinates/stats.totalRecords)*100).toFixed(2)}%)`);
    console.log(`  Records with state: ${stats.dataQuality.hasState} (${((stats.dataQuality.hasState/stats.totalRecords)*100).toFixed(2)}%)`);
    console.log(`  Records with facilities: ${stats.dataQuality.hasFacilities} (${((stats.dataQuality.hasFacilities/stats.totalRecords)*100).toFixed(2)}%)`);
    console.log(`  Records with contact info: ${stats.dataQuality.hasContactInfo} (${((stats.dataQuality.hasContactInfo/stats.totalRecords)*100).toFixed(2)}%)`);

    console.log('\nInvalid Coordinates:');
    console.log(`  ${stats.invalidCoordinates} records outside USA bounds (${((stats.invalidCoordinates/stats.totalRecords)*100).toFixed(2)}%)`);

    console.log('\nInvalid State Codes:');
    Object.entries(stats.invalidStateCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count} records`);
    });

    console.log('\nInvalid Facility Fields:');
    Object.entries(stats.invalidFacilities).forEach(([field, count]) => {
      console.log(`  ${field}: ${count} records (${((count/stats.totalRecords)*100).toFixed(2)}%)`);
    });

  } catch (error) {
    console.error('Error validating course data:', error);
  }
}

// Run validation
validateCourseData(); 