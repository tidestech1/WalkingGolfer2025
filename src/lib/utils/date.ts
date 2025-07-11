/**
 * Formats a date to display as "Month Year" (e.g., "January 2024")
 * Used for walking dates in reviews since we now only collect month/year
 */
export function formatDate(date: Date | string | null): string {
  if (!date) {
    return 'N/A';
  }
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long'
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Formats a date to display as "Month Day, Year" (e.g., "January 15, 2024")
 * Used for review creation dates and other full dates
 */
export function formatFullDate(date: Date | string | null): string {
  if (!date) {
    return 'N/A';
  }
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
} 