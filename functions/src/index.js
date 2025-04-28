"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.getCoursesForMap = exports.onUserUpdateSendWelcomeEmail = void 0;
var firestore_1 = require("firebase-functions/v2/firestore");
var logger = require("firebase-functions/logger");
var admin = require("firebase-admin");
var https_1 = require("firebase-functions/v2/https");
var courseUtils_js_1 = require("./courseUtils.js");
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
var db = admin.firestore();
/**
 * V2 Firestore trigger on user update.
 * Sends welcome email placeholder post-verification.
 */
exports.onUserUpdateSendWelcomeEmail = (0, firestore_1.onDocumentUpdated)("users/{userId}", function (// Event handler start. Use correct V2 Event type
event) {
    var _a, _b;
    var userId = event.params.userId;
    logger.log("Starting V2 onUserUpdateSendWelcomeEmail for user: " + userId);
    var change = event.data; // This can be undefined
    if (!change) {
        logger.warn("Event data (Change object) missing for user: " + userId + ". Exiting.");
        return; // Exit if change data is missing
    }
    // Snapshots should exist for onUpdate, use QueryDocumentSnapshot methods
    var beforeData = (_a = change.before.data()) !== null && _a !== void 0 ? _a : {}; // guaranteed by QueryDocSnap
    var afterData = (_b = change.after.data()) !== null && _b !== void 0 ? _b : {}; // guaranteed by QueryDocSnap
    var justVerified = !beforeData.emailVerified && afterData.emailVerified;
    var notSentYet = !afterData.welcomeEmailSent;
    logger.log("Checking conditions for " + userId + ": " +
        "justVerified=" + String(justVerified) + ", " +
        "notSentYet=" + String(notSentYet));
    if (justVerified && notSentYet) {
        logger.info("Conditions met for sending welcome email to user: " + userId, { structuredData: true });
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
        var userRef = db.collection("users").doc(userId);
        return userRef.update({
            welcomeEmailSent: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            logger.log("Successfully updated welcomeEmailSent flag for user: " + userId);
        })["catch"](function (error) {
            logger.error("Failed updating welcomeEmailSent flag for user: " + userId, error);
            // throw error; // Optionally re-throw
        });
    }
    else {
        logger.log("Conditions not met for user " + userId + ". Email not sent.");
        return Promise.resolve();
    }
});
exports.getCoursesForMap = (0, https_1.onCall)(
// Enforce memory and timeout settings if needed
// { memory: "1GiB", timeoutSeconds: 60 },
function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var data, filters, bounds, coursesRef, filterConstraints, q_1, snapshot, coursesMatchingFilters, coursesInView, error_1, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger.info("getCoursesForMap function triggered", { structuredData: true });
                data = request.data;
                filters = data.filters, bounds = data.bounds;
                // --- Input Validation ---
                if (!filters) {
                    logger.error("Missing 'filters' in request data.");
                    throw new https_1.HttpsError("invalid-argument", "The function must be called with a 'filters' argument.");
                }
                if (!bounds) {
                    logger.error("Missing 'bounds' in request data.");
                    throw new https_1.HttpsError("invalid-argument", "The function must be called with a 'bounds' argument.");
                }
                // Basic bounds validation (can be more specific)
                if (typeof bounds.north !== "number" ||
                    typeof bounds.south !== "number" ||
                    typeof bounds.east !== "number" ||
                    typeof bounds.west !== "number") {
                    logger.error("Invalid 'bounds' structure.", { bounds: bounds });
                    throw new https_1.HttpsError("invalid-argument", "Invalid 'bounds' structure provided.");
                }
                logger.info("Received filters:", filters);
                logger.info("Received bounds:", bounds);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                coursesRef = db.collection("courses");
                filterConstraints = (0, courseUtils_js_1.buildFilterSortConstraints)(filters);
                logger.info("Generated filter constraints:", filterConstraints);
                q_1 = coursesRef.withConverter({
                    fromFirestore: function (snapshot) {
                        var data = snapshot.data();
                        return __assign({ id: snapshot.id }, data);
                    },
                    toFirestore: function (modelObject) {
                        // Prefix id with _ to indicate unused
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        var _id = modelObject.id, rest = __rest(modelObject, ["id"]);
                        return rest;
                    }
                });
                // 2. Apply constraints iteratively using Admin SDK methods
                filterConstraints.forEach(function (constraint) {
                    if ("opStr" in constraint) {
                        // Apply where clause
                        q_1 = q_1.where(constraint.fieldPath, constraint.opStr, constraint.value);
                    }
                    else if ("directionStr" in constraint) {
                        // Apply orderBy clause
                        q_1 = q_1.orderBy(constraint.fieldPath, constraint.directionStr);
                    }
                });
                return [4 /*yield*/, q_1.get()];
            case 2:
                snapshot = _a.sent();
                coursesMatchingFilters = snapshot.docs.map(function (doc) { return doc.data(); });
                logger.info("Found ".concat(coursesMatchingFilters.length, " courses ") +
                    "matching filters server-side.");
                coursesInView = coursesMatchingFilters.filter(function (course) {
                    // Ensure coordinates exist before filtering
                    if (course.location_coordinates_latitude == null ||
                        course.location_coordinates_longitude == null) {
                        logger.warn("Course ".concat(course.id, " missing coordinates, ") +
                            "skipping bounds check.");
                        return false;
                    }
                    return (course.location_coordinates_latitude >= bounds.south &&
                        course.location_coordinates_latitude <= bounds.north &&
                        course.location_coordinates_longitude >= bounds.west &&
                        course.location_coordinates_longitude <= bounds.east);
                });
                logger.info("Filtered down to ".concat(coursesInView.length, " ") +
                    "courses within map bounds server-side.");
                // Return only the courses matching filters AND bounds
                return [2 /*return*/, { courses: coursesInView }];
            case 3:
                error_1 = _a.sent();
                logger.error("Error fetching courses in getCoursesForMap:", error_1);
                errorMessage = "Unknown error";
                if (error_1 instanceof Error) {
                    errorMessage = error_1.message;
                }
                // Throwing a generic internal error to avoid exposing details
                throw new https_1.HttpsError("internal", "An error occurred while fetching courses.", { originalError: errorMessage });
            case 4: return [2 /*return*/];
        }
    });
}); });
// You can add other Cloud Functions here if needed.
