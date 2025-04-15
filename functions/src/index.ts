/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {
  onDocumentUpdated,
  FirestoreEvent, // Import FirestoreEvent here
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Change} from "firebase-functions"; // Still need Change
// Import QueryDocumentSnapshot for V2 event types
import {QueryDocumentSnapshot} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Initialize Firebase Admin SDK
// This ensures the function can interact with Firestore
admin.initializeApp();

// Get a reference to the Firestore database
const db = admin.firestore();

/**
 * V2 Firestore trigger on user update.
 * Sends welcome email placeholder post-verification.
 */
export const onUserUpdateSendWelcomeEmail = onDocumentUpdated(
  "users/{userId}",
  ( // Event handler start. Use correct V2 Event type
    event: FirestoreEvent< // V2 Firestore Event
      Change<QueryDocumentSnapshot> | undefined, // Data is Change or undefined
      {userId: string} // Params include userId
    >
  ): Promise<void> | undefined => { // Explicit return type
    const userId = event.params.userId;
    logger.log("Starting V2 onUserUpdateSendWelcomeEmail for user: " + userId);

    const change = event.data; // This can be undefined
    if (!change) {
      logger.warn(
        "Event data (Change object) missing for user: " + userId + ". Exiting.",
      );
      return; // Exit if change data is missing
    }

    // Snapshots should exist for onUpdate, use QueryDocumentSnapshot methods
    const beforeData = change.before.data() ?? {}; // guaranteed by QueryDocSnap
    const afterData = change.after.data() ?? {}; // guaranteed by QueryDocSnap

    const justVerified = !beforeData.emailVerified && afterData.emailVerified;
    const notSentYet = !afterData.welcomeEmailSent;

    logger.log(
      "Checking conditions for " + userId + ": " +
      "justVerified=" + String(justVerified) + ", " +
      "notSentYet=" + String(notSentYet),
    );

    if (justVerified && notSentYet) {
      logger.info(
        "Conditions met for sending welcome email to user: " + userId,
        {structuredData: true},
      );

      // --- Placeholder for Email Sending Logic ---
      // TODO: Add email sending logic using your chosen provider
      // (e.g., SendGrid). Use user's email (afterData.email)
      // and name (afterData.displayName). Configure API keys securely.
      // Example:
      // try {
      //   await sendWelcomeEmail(afterData.email, afterData.displayName);
      //   logger.info("Sent welcome email for user: " + userId);
      // } catch (emailError) {
      //   logger.error(
      //      "Failed sending welcome email user: " + userId, emailError);
      //   return;
      // }
      // --- End Placeholder ---

      const userRef = db.collection("users").doc(userId);
      return userRef.update({
        welcomeEmailSent: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).then(() => {
        logger.log(
          "Successfully updated welcomeEmailSent flag for user: " + userId,
        );
      }).catch((error) => {
        logger.error(
          "Failed updating welcomeEmailSent flag for user: " + userId,
          error,
        );
        // throw error; // Optionally re-throw
      });
    } else {
      logger.log(
        "Conditions not met for user " + userId + ". Email not sent.",
      );
      return Promise.resolve();
    }
  }, // End of event handler
);

// You can add other Cloud Functions here if needed.
