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
  Timestamp,
} from "firebase-admin/firestore";
import {Change} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  buildFilterSortConstraints,
} from "./courseUtils.js";
import {
  GolfCourse,
  CourseFilters,
  MapBounds,
} from "./types/course.js";
// Import geofire-common
import * as geofire from "geofire-common";

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

      // === ADD GEOHASH QUERY LOGIC ===
      const center: geofire.Geopoint = [
        (bounds.north + bounds.south) / 2,
        (bounds.east + bounds.west) / 2,
      ];
      // Calculate radius (approximate)
      const northEast: geofire.Geopoint = [bounds.north, bounds.east];
      // Calculate diagonal distance and divide by 2 for radius in km
      const radiusInKm = geofire.distanceBetween(center, northEast) / 2;
      // Query geohashes within the radius (in meters)
      const queryBounds = geofire.geohashQueryBounds(center, radiusInKm * 1000);

      const promises = [];
      for (const b of queryBounds) {
        // Start fresh for each bound, applying geo filter first
        let gq: FirebaseFirestore.Query<GolfCourse> =
          coursesRef.withConverter<GolfCourse>({
            fromFirestore: (snapshot): GolfCourse => {
              const data = snapshot.data();
              return {id: snapshot.id, ...data} as GolfCourse;
            },
            toFirestore: (
              modelObject: GolfCourse
            ): FirebaseFirestore.DocumentData => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const {id: _id, ...rest} = modelObject;
              return rest;
            },
          });

        // Apply geohash range filters first
        gq = gq.where("geohash", ">=", b[0]);
        gq = gq.where("geohash", "<=", b[1]);

        // --- REMOVED: Do not apply other filters/sorts here ---
        /*
        filterConstraints.forEach((constraint: AdminQueryConstraint) => {
          ...
        });
        */

        promises.push(gq.get());
      }

      // Await all geo queries
      const snapshots = await Promise.all(promises);

      // Combine results and remove duplicates
      const matchingDocs: Record<string, GolfCourse> = {};
      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          if (!matchingDocs[doc.id]) {
            matchingDocs[doc.id] = doc.data();
          }
        }
      }
      const coursesMatchingGeo = Object.values(matchingDocs);

      logger.info(
        `Found ${coursesMatchingGeo.length} courses matching ONLY geo bounds.`
      );

      // --- APPLY OTHER FILTERS IN MEMORY ---
      const coursesPassingInMemoryFilters =
         coursesMatchingGeo.filter((course) => {
           // Apply boolean filters
           if (filters.filter_isWalkable && !course.course_isWalkable) {
             return false;
           }
           if (filters.filter_drivingRange && !course.facilities_drivingRange) {
             return false;
           }
           if (filters.filter_golfCarts && !course.facilities_golfCarts) {
             return false;
           }
           if (filters.filter_pushCarts && !course.facilities_pushCarts) {
             return false;
           }
           if (filters.filter_restaurant && !course.facilities_restaurant) {
             return false;
           }
           if (filters.filter_proShop && !course.facilities_proShop) {
             return false;
           }
           if (filters.filter_puttingGreen && !course.facilities_puttingGreen) {
             return false;
           }
           if (
             filters.filter_chippingGreen &&
                !course.facilities_chippingGreen
           ) {
             return false;
           }
           if (
             filters.filter_practiceBunker &&
                !course.facilities_practiceBunker
           ) {
             return false;
           }
           if (filters.filter_caddies && !course.facilities_caddies) {
             return false;
           }
           if (filters.filter_clubRental && !course.facilities_clubRental) {
             return false;
           }
           // Apply rating filter
           const minRating = filters.walkabilityRating_overall_min;
           const currentRating = course.walkabilityRating_overall;
           if (
             minRating != null &&
          minRating > 0 &&
          (currentRating == null || currentRating < minRating)
           ) {
             return false;
           }
           // Apply search query filter (if applicable)
           const query = filters.searchQuery?.trim();
           if (query) {
             const searchTerm = query.toLowerCase();
             const courseTerms = course.searchableTerms; // Already lowercase
             if (!courseTerms?.includes(searchTerm)) {
               return false;
             }
           }

           return true; // Course passes all active in-memory filters
         });

      logger.info(
        `Filtered down to ${coursesPassingInMemoryFilters.length} courses ` +
          "after in-memory attribute filtering."
      );

      // --- APPLY SORTING IN MEMORY ---
      const sortField =
         filters.sortBy || "walkabilityRating_overall";
      const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

      coursesPassingInMemoryFilters.sort((a, b) => {
        let valA = a[sortField as keyof GolfCourse];
        let valB = b[sortField as keyof GolfCourse];

        // Handle null/undefined or different types if necessary
        // Basic comparison for numbers/strings:
        // Treat nulls based on sort order
        if (valA == null) valA = sortDirection === 1 ? Infinity : -Infinity;
        if (valB == null) valB = sortDirection === 1 ? Infinity : -Infinity;

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return -1 * sortDirection;
        if (valA > valB) return 1 * sortDirection;

        // Secondary sort by name for stability if primary values are equal
        const nameA = a.courseName?.toLowerCase() ?? "";
        const nameB = b.courseName?.toLowerCase() ?? "";
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;

        return 0;
      });

      logger.info("Applied in-memory sorting.");

      // --- END IN-MEMORY FILTERING & SORTING ---

      // === END GEOHASH QUERY LOGIC === // NOTE: Log message adjusted earlier

      // --- Optional: Precise distance filtering (Refinement) ---
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      const mapCenter: geofire.Geopoint = [centerLat, centerLng];

      // Diagonal distance as max
      const northEastPoint: geofire.Geopoint = [bounds.north, bounds.east];
      const maxDistanceKm = geofire.distanceBetween(
        mapCenter,
        northEastPoint
      );

      // Apply precise filter to the already filtered & sorted list
      const coursesInViewPrecise =
        coursesPassingInMemoryFilters.filter((course) => {
        // Exclude if missing coords
          if (
            course.location_coordinates_latitude == null ||
            course.location_coordinates_longitude == null
          ) {
            return false;
          }
          const courseLoc: geofire.Geopoint = [
            course.location_coordinates_latitude,
            course.location_coordinates_longitude,
          ];
          // Check if course is within map bounds (approx radius check)
          return (
            geofire.distanceBetween(courseLoc, mapCenter) <=
            maxDistanceKm
          );
        });
      logger.info(
        `Refined down to ${coursesInViewPrecise.length} courses ` +
          "within precise distance server-side."
      );
      // --- End Precise Filtering ---

      // --- Sanitize Data Before Returning ---
      // Recursive function to replace NaN with null and convert Timestamps
      const sanitizeData = (obj: unknown): unknown => {
        // Handle primitive types and null
        if (
          obj === null ||
          typeof obj !== "object"
        ) {
          return typeof obj === "number" && isNaN(obj) ? null : obj;
        }

        // Handle Firestore Timestamps -> Convert to ISO string
        if (obj instanceof Timestamp) {
          try {
            return obj.toDate().toISOString();
          } catch (tsError) {
            logger.warn("Failed to convert Timestamp:", tsError, obj);
            return null; // Return null if Timestamp is invalid
          }
        }

        // Handle Arrays
        if (Array.isArray(obj)) {
          return obj.map(sanitizeData);
        }

        // Handle Objects (including GeoPoints which should serialize ok)
        const sanitizedObj: {[key: string]: unknown} = {};
        for (const key in obj) {
          // Ensure we are iterating over own properties
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // Cast obj to access properties safely
            const value = (obj as Record<string, unknown>)[key];
            sanitizedObj[key] = sanitizeData(value);
          }
        }
        return sanitizedObj;
      };

      // Apply the sanitizer
      // Use the precisely filtered results (which were already filtered/sorted)
      const coursesToSend = coursesInViewPrecise.map(sanitizeData);
      // --- End Sanitization ---

      // Return the SANITIZED courses
      return {courses: coursesToSend as GolfCourse[]};
    } catch (error: unknown) {
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
