import {OrderByDirection} from "firebase-admin/firestore";
import {
  CourseFilters,
} from "./types/course.js"; // Updated path
import * as logger from "firebase-functions/logger";

// Define a union type for the constraints the Admin SDK uses
export type AdminQueryConstraint =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | {fieldPath: string; opStr: FirebaseFirestore.WhereFilterOp; value: any}
  | {fieldPath: string; directionStr?: OrderByDirection};

/**
 * Build query constraints based on filters for the Admin SDK.
 * @param {CourseFilters} filters The filter object from the client.
 * @return {AdminQueryConstraint[]} An array of constraint objects.
 */
export function buildFilterSortConstraints(filters: CourseFilters): AdminQueryConstraint[] {
  const constraints: AdminQueryConstraint[] = [];
  let firstOrderByField: string | null = null;
  const sortDirection = filters.sortOrder || "desc";

  // Walkability filter (Include un-walkable courses)
  if (filters.filter_isWalkable === false) {
    constraints.push({fieldPath: "course_isWalkable", opStr: "!=", value: false});
  }

  // Club type filter
  if (filters.clubTypes && filters.clubTypes.length > 0) {
    constraints.push({fieldPath: "club_type", opStr: "in", value: filters.clubTypes});
  }

  // Course holes filter
  if (filters.courseHoles && filters.courseHoles.length > 0) {
    // Convert discrete values to ranges
    // 9 = 9-17 holes, 18 = 18+ holes
    const has9Range = filters.courseHoles.includes(9);
    const has18Range = filters.courseHoles.includes(18);

    if (has9Range && has18Range) {
      // Both ranges selected = 9+ holes (essentially no filtering)
      constraints.push({fieldPath: "club_totalHoles", opStr: ">=", value: 9});
    } else if (has9Range) {
      // Only 9-17 holes
      constraints.push({fieldPath: "club_totalHoles", opStr: ">=", value: 9});
      constraints.push({fieldPath: "club_totalHoles", opStr: "<=", value: 17});
    } else if (has18Range) {
      // Only 18+ holes
      constraints.push({fieldPath: "club_totalHoles", opStr: ">=", value: 18});
    }
  }

  // Walkability rating filter
  if (typeof filters.walkabilityRating_overall_min === "number" && filters.walkabilityRating_overall_min > 0) {
    constraints.push({fieldPath: "walkabilityRating_overall", opStr: ">=", value: filters.walkabilityRating_overall_min});
    if (!firstOrderByField) {
      firstOrderByField = "walkabilityRating_overall";
    }
  }

  // Search query filter
  if (filters.searchQuery?.trim()) {
    const searchTerm = filters.searchQuery.trim().toLowerCase();
    constraints.push({fieldPath: "searchableTerms", opStr: "array-contains", value: searchTerm});
    if (!firstOrderByField) {
      firstOrderByField = "courseName";
    }
  }

  // Sorting
  const finalSortField = filters.sortBy || firstOrderByField || "walkabilityRating_overall";
  const primarySortDirection = (finalSortField === "courseName" && !filters.sortBy) ? "asc" : sortDirection;
  constraints.push({fieldPath: finalSortField, directionStr: primarySortDirection});
  if (finalSortField !== "__name__") {
    constraints.push({fieldPath: "__name__", directionStr: primarySortDirection});
  }

  logger.debug(
    "[Admin buildFilterSortConstraints LOG] Generated Constraints:",
    constraints
  );
  return constraints;
}

// Note: Removed other functions like getCourses, getCourseById etc. as they
// are not needed directly in the cloud function or use the client SDK.
