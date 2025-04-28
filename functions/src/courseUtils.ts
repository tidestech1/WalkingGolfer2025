import {OrderByDirection} from "firebase-admin/firestore";
import {
  CourseFilters,
} from "./types/course.js"; // Updated path
import * as logger from "firebase-functions/logger";

// Define a union type for the constraints the Admin SDK uses
export type AdminQueryConstraint =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { fieldPath: string; opStr: FirebaseFirestore.WhereFilterOp; value: any }
  | { fieldPath: string; directionStr?: OrderByDirection };

/**
 * Build query constraints based on filters for the Admin SDK.
 * @param {CourseFilters} filters The filter object from the client.
 * @return {AdminQueryConstraint[]} An array of constraint objects.
 */
export function buildFilterSortConstraints(
  filters: CourseFilters,
): AdminQueryConstraint[] {
  logger.debug(
    "[Admin buildFilterSortConstraints LOG] Input Filters:", filters);
  const constraints: AdminQueryConstraint[] = [];
  let firstOrderByField: string | null = null;
  const sortDirection = filters.sortOrder || "desc";

  // --- Add clauses for active boolean filters ---
  if (filters.filter_isWalkable === true) {
    constraints.push({
      fieldPath: "course_isWalkable",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_drivingRange === true) {
    constraints.push({
      fieldPath: "facilities_drivingRange",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_golfCarts === true) {
    constraints.push({
      fieldPath: "facilities_golfCarts",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_pushCarts === true) {
    constraints.push({
      fieldPath: "facilities_pushCarts",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_restaurant === true) {
    constraints.push({
      fieldPath: "facilities_restaurant",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_proShop === true) {
    constraints.push({
      fieldPath: "facilities_proShop",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_puttingGreen === true) {
    constraints.push({
      fieldPath: "facilities_puttingGreen",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_chippingGreen === true) {
    constraints.push({
      fieldPath: "facilities_chippingGreen",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_practiceBunker === true) {
    constraints.push({
      fieldPath: "facilities_practiceBunker",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_caddies === true) {
    constraints.push({
      fieldPath: "amenities_caddies",
      opStr: "==",
      value: true,
    });
  }
  if (filters.filter_clubRental === true) {
    constraints.push({
      fieldPath: "amenities_clubRental",
      opStr: "==",
      value: true,
    });
  }


  // --- Add clause for walkability rating ---
  if (
    typeof filters.walkabilityRating_overall_min === "number" &&
    filters.walkabilityRating_overall_min > 0
  ) {
    constraints.push({
      fieldPath: "walkabilityRating_overall",
      opStr: ">=",
      value: filters.walkabilityRating_overall_min,
    });
    if (!firstOrderByField) {
      firstOrderByField = "walkabilityRating_overall";
    }
  }

  // --- Add clause for search query ---
  if (filters.searchQuery?.trim()) {
    const searchTerm = filters.searchQuery.trim().toLowerCase();
    constraints.push({
      fieldPath: "searchableTerms",
      opStr: "array-contains",
      value: searchTerm,
    });
    if (!firstOrderByField) {
      firstOrderByField = "courseName";
    }
  }

  // --- Apply default or explicit sorting ---
  const finalSortField =
    filters.sortBy || firstOrderByField || "walkabilityRating_overall";
  const primarySortDirection =
    (finalSortField === "courseName" && !filters.sortBy) ?
      "asc" :
      sortDirection;

  // Add primary sort order
  constraints.push({
    fieldPath: finalSortField,
    directionStr: primarySortDirection,
  });

  // --- Add final sort for stable pagination/results ---
  if (finalSortField !== "__name__") {
    constraints.push({
      fieldPath: "__name__",
      directionStr: primarySortDirection,
    });
  }

  logger.debug(
    "[Admin buildFilterSortConstraints LOG] Generated Constraints:",
    constraints
  );
  return constraints;
}

// Note: Removed other functions like getCourses, getCourseById etc. as they
// are not needed directly in the cloud function or use the client SDK.
