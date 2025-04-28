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
// Use modular imports for firebase-admin
import {initializeApp} from "firebase-admin/app";
// Consolidate firestore imports
import {
  getFirestore,
  FieldValue,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import {Change} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  buildFilterSortConstraints,
  AdminQueryConstraint,
} from "./courseUtils.js";
import {
  GolfCourse,
  CourseFilters,
  MapBounds,
} from "./types/course.js";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Initialize Firebase Admin SDK using the modular function
initializeApp();

// Get a reference to the Firestore database using the modular function
const db = getFirestore();

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
        updatedAt: FieldValue.serverTimestamp(),
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

// === NEW CLOUD FUNCTION ===

// Define the structure of the data expected by the function
interface GetCoursesForMapData {
  filters: CourseFilters;
  bounds: MapBounds;
}

export const getCoursesForMap = onCall(
  // Enforce memory and timeout settings if needed
  // { memory: "1GiB", timeoutSeconds: 60 },
  async (request): Promise<{ courses: GolfCourse[] }> => {
    logger.info("getCoursesForMap function triggered", {structuredData: true});

    const data = request.data as GetCoursesForMapData;
    const {filters, bounds} = data;

    // --- Input Validation ---
    if (!filters) {
      logger.error("Missing 'filters' in request data.");
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'filters' argument.");
    }
    if (!bounds) {
      logger.error("Missing 'bounds' in request data.");
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'bounds' argument.");
    }
    // Basic bounds validation (can be more specific)
    if (
      typeof bounds.north !== "number" ||
      typeof bounds.south !== "number" ||
      typeof bounds.east !== "number" ||
      typeof bounds.west !== "number"
    ) {
      logger.error("Invalid 'bounds' structure.", {bounds});
      throw new HttpsError(
        "invalid-argument",
        "Invalid 'bounds' structure provided.");
    }

    logger.info("Received filters:", filters);
    logger.info("Received bounds:", bounds);

    try {
      const coursesRef = db.collection("courses");

      // 1. Build query constraints using the utility function
      const filterConstraints = buildFilterSortConstraints(filters);
      logger.info("Generated filter constraints:", filterConstraints);

      // Initialize the query with type converter
      let q: FirebaseFirestore.Query<GolfCourse> =
        coursesRef.withConverter<GolfCourse>({
          fromFirestore: (snapshot): GolfCourse => {
            const data = snapshot.data();
            return {id: snapshot.id, ...data} as GolfCourse;
          },
          toFirestore: (
            modelObject: GolfCourse
          ): FirebaseFirestore.DocumentData => {
            // Prefix id with _ to indicate unused
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {id: _id, ...rest} = modelObject;
            return rest;
          },
        });

      // 2. Apply constraints iteratively using Admin SDK methods
      filterConstraints.forEach((constraint: AdminQueryConstraint) => {
        if ("opStr" in constraint) {
          // Apply where clause
          q = q.where(constraint.fieldPath, constraint.opStr, constraint.value);
        } else if ("directionStr" in constraint) {
          // Apply orderBy clause
          q = q.orderBy(constraint.fieldPath, constraint.directionStr);
        }
      });

      // Execute the constructed query
      const snapshot = await q.get();
      const coursesMatchingFilters = snapshot.docs.map((doc) => doc.data());
      logger.info(
        `Found ${coursesMatchingFilters.length} courses ` +
          "matching filters server-side."
      );

      // 3. Server-side Filtering by Bounds
      const coursesInView = coursesMatchingFilters.filter(
        (course: GolfCourse) => {
          // Ensure coordinates exist before filtering
          if (
            course.location_coordinates_latitude == null ||
            course.location_coordinates_longitude == null
          ) {
            logger.warn(
              `Course ${course.id} missing coordinates, ` +
              "skipping bounds check."
            );
            return false;
          }
          return (
            course.location_coordinates_latitude >= bounds.south &&
            course.location_coordinates_latitude <= bounds.north &&
            course.location_coordinates_longitude >= bounds.west &&
            course.location_coordinates_longitude <= bounds.east
          );
        }
      );

      logger.info(
        `Filtered down to ${coursesInView.length} ` +
        "courses within map bounds server-side."
      );

      // Return only the courses matching filters AND bounds
      return {courses: coursesInView};
    } catch (error: unknown) { // Use unknown instead of any
      logger.error("Error fetching courses in getCoursesForMap:", error);

      // Determine error message safely
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Throwing a generic internal error to avoid exposing details
      throw new HttpsError(
        "internal",
        "An error occurred while fetching courses.",
        {originalError: errorMessage}
      );
    }
  }
);

// You can add other Cloud Functions here if needed.
