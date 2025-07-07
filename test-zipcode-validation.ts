// Temporary test script for zipcode validation
import { deriveStateFromZipcode, isValidZipcode } from './src/lib/firebase/userUtils';

console.log('Testing zipcode validation and state derivation...\n');

// Test valid zipcodes
const testCases = [
  { zipcode: '10001', expectedState: 'NY' },
  { zipcode: '90210', expectedState: 'CA' },
  { zipcode: '60601', expectedState: 'IL' },
  { zipcode: '33101', expectedState: 'FL' },
  { zipcode: '78701', expectedState: 'TX' },
  { zipcode: '20001', expectedState: 'DC' },
  { zipcode: '97201', expectedState: 'OR' },
  { zipcode: '02101', expectedState: 'MA' },
];

// Test invalid zipcodes
const invalidCases = [
  '1234',     // too short
  '123456',   // too long
  'abcde',    // non-numeric
  '00000',    // potentially invalid
  '',         // empty
];

console.log('=== Testing valid zipcodes ===');
testCases.forEach(({ zipcode, expectedState }) => {
  const isValid = isValidZipcode(zipcode);
  const derivedState = deriveStateFromZipcode(zipcode);
  
  console.log(`ZIP: ${zipcode}`);
  console.log(`  Valid: ${isValid}`);
  console.log(`  Expected State: ${expectedState}`);
  console.log(`  Derived State: ${derivedState}`);
  console.log(`  Match: ${derivedState === expectedState ? '✅' : '❌'}`);
  console.log();
});

console.log('=== Testing invalid zipcodes ===');
invalidCases.forEach(zipcode => {
  const isValid = isValidZipcode(zipcode);
  const derivedState = deriveStateFromZipcode(zipcode);
  
  console.log(`ZIP: "${zipcode}"`);
  console.log(`  Valid: ${isValid}`);
  console.log(`  Derived State: ${derivedState}`);
  console.log(`  Expected: Should be invalid`);
  console.log(`  Test: ${!isValid && derivedState === null ? '✅' : '❌'}`);
  console.log();
});

console.log('Testing complete!'); 