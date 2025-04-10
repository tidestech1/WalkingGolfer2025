// Removed unused GolfCourse import

// Interface for individual walkability rating components
interface WalkabilityRatingInput {
  terrain: number; // Corresponds to hilliness
  distance: number; // Corresponds to holeDistance
  cost: number;
}

interface WeightConfig {
  hilliness: number;
  holeDistance: number;
  cost: number;
}

export const DEFAULT_WEIGHTS: WeightConfig = {
  hilliness: 0.4,    // 40% weight for terrain difficulty
  holeDistance: 0.4, // 40% weight for distance between holes
  cost: 0.2         // 20% weight for cost considerations
};

/**
 * Calculate a weighted walkability rating based on component scores
 * @param ratings Walkability rating components
 * @param weights Optional custom weights for each component
 * @returns Weighted average rating between 1-5, or null if no ratings available
 */
export function calculateWeightedWalkabilityRating(
  ratings: WalkabilityRatingInput,
  weights: WeightConfig = DEFAULT_WEIGHTS
): number | null {
  // Check if any ratings are provided and valid (assuming 0 is not a valid rating input here, adjust if needed)
  if (!ratings.terrain && !ratings.distance && !ratings.cost) {
    return null;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  // Add terrain (hilliness) rating
  if (ratings.terrain) {
    weightedSum += ratings.terrain * weights.hilliness;
    totalWeight += weights.hilliness;
  }

  // Add distance rating
  if (ratings.distance) {
    weightedSum += ratings.distance * weights.holeDistance;
    totalWeight += weights.holeDistance;
  }

  // Add cost rating
  if (ratings.cost) {
    weightedSum += ratings.cost * weights.cost;
    totalWeight += weights.cost;
  }

  // Return null if no valid ratings contributed (totalWeight is 0)
  if (totalWeight === 0) {
    return null;
  }

  // Calculate and return weighted average
  return weightedSum / totalWeight;
}

/**
 * Get a descriptive label for a walkability rating
 * @param rating Walkability rating (1-5)
 * @returns Descriptive label
 */
export function getWalkabilityLabel(rating: number | null | undefined): string {
  if (rating === undefined || rating === null) {
return 'Not rated';
}
  
  const roundedRating = Math.round(rating);
  switch (roundedRating) {
    case 1:
      return 'Very difficult';
    case 2:
      return 'Challenging';
    case 3:
      return 'Moderate';
    case 4:
      return 'Easy';
    case 5:
      return 'Very easy';
    default:
      return 'Not rated';
  }
}

/**
 * Get a text description for the hilliness rating
 * Note: Rating scale is now 1 = flat to 5 = very hilly
 */
export function getHillinessDescription(rating?: number): string {
  if (rating === undefined) {
return 'Unknown';
}
  
  const descriptions = [
    'Very flat',     // 1
    'Mostly flat',   // 2
    'Moderate',      // 3
    'Hilly',        // 4
    'Very hilly'    // 5
  ];
  
  const index = Math.max(0, Math.min(Math.floor(rating) - 1, 4));
  return descriptions[index] || 'Unknown';
}

/**
 * Get a text description for the hole distance rating
 * Note: Rating scale is now 1 = compact to 5 = very spread out
 */
export function getHoleDistanceDescription(rating?: number): string {
  if (rating === undefined) {
return 'Unknown';
}
  
  const descriptions = [
    'Very compact layout',     // 1
    'Relatively compact',      // 2
    'Average distances',       // 3
    'Spread out layout',       // 4
    'Very spread out'         // 5
  ];
  
  const index = Math.max(0, Math.min(Math.floor(rating) - 1, 4));
  return descriptions[index] || 'Unknown';
}

/**
 * Get a text description for the cost rating
 * Note: Rating scale is now 1 = budget-friendly to 5 = ultra-premium
 */
export function getCostDescription(rating?: number): string {
  if (rating === undefined) {
return 'Unknown';
}
  
  const descriptions = [
    'Budget-friendly pricing',    // 1
    'Moderate pricing',          // 2
    'Standard pricing',          // 3
    'Premium pricing',           // 4
    'Ultra-premium pricing'      // 5
  ];
  
  const index = Math.max(0, Math.min(Math.floor(rating) - 1, 4));
  return descriptions[index] || 'Unknown';
}

/**
 * Maps a numerical rating (1-5) to a terrain type description
 * Uses hilliness rating (1: Very flat, 5: Very hilly)
 */
export function getTerrainTypeFromRating(hillinessRating?: number): 'flat' | 'moderate' | 'hilly' | 'unknown' {
  if (hillinessRating === undefined) {
return 'unknown';
}
  
  if (hillinessRating <= 2) {
return 'flat';
}
  if (hillinessRating <= 3.5) {
return 'moderate';
}
  return 'hilly';
}

/**
 * Converts numeric rating to stars display format
 * @param rating - Rating value (1-5)
 * @param maxStars - Maximum number of stars (default: 5)
 * @returns Object with whole, half, and empty star counts
 */
export function getStarRating(rating: number, maxStars = 5): { whole: number; half: number; empty: number } {
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  const wholeStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = maxStars - wholeStars - (hasHalfStar ? 1 : 0);
  
  return {
    whole: wholeStars,
    half: hasHalfStar ? 1 : 0,
    empty: emptyStars
  };
}

/**
 * Get a text description for the course conditions rating
 * Note: Rating scale is 1 = poor to 5 = excellent
 */
export function getConditionsDescription(rating?: number): string {
  if (rating === undefined) {
return 'Unknown';
}
  
  const descriptions = [
    'Poor conditions',           // 1
    'Below average conditions',  // 2
    'Average conditions',        // 3
    'Good conditions',          // 4
    'Excellent conditions'      // 5
  ];
  
  const index = Math.max(0, Math.min(Math.floor(rating) - 1, 4));
  return descriptions[index] || 'Unknown';
} 