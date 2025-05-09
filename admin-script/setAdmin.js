const admin = require('firebase-admin');

// ---- CONFIGURATION ----
// Path to your service account key JSON file
const serviceAccount = require('./serviceAccountKey.json'); // Update path if needed

// UID of the user you want to make an admin (replace with the UID you copied)
const uidToMakeAdmin = 'c8lZz2swkPPMjo6WYe40JaaXGlB3';
// ---- END CONFIGURATION ----

if (uidToMakeAdmin === 'USER_UID_TO_MAKE_ADMIN') {
  console.error("Please update 'uidToMakeAdmin' in the script with the actual User UID.");
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  admin.auth().setCustomUserClaims(uidToMakeAdmin, { admin: true })
    .then(() => {
      console.log(`Successfully set admin claim for user: ${uidToMakeAdmin}`);
      console.log('Please wait a few moments for the claim to propagate, then have the user sign out and sign back in to see the effect.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error setting custom claims:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('Ensure your serviceAccountKey.json path is correct and the file is valid.');
  process.exit(1);
}
