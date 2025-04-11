import { UserProfile } from '@/types/user';
import { CourseReview, DisplayNameType } from '@/types/review';

/**
 * Derives the display name for a review based on user profile and review settings.
 * 
 * @param profile - The UserProfile object (can be null if user data isn't available).
 * @param review - The CourseReview object containing display preferences.
 * @returns The string to display as the reviewer's name.
 */
export function deriveReviewerDisplayName(
    profile: Pick<UserProfile, 'displayName'> | null, 
    review: Pick<CourseReview, 'submittedName' | 'display_name_type'>
): string {
    // Prioritize submitted name (from pending review), then profile display name
    const nameToUse = (review.submittedName || profile?.displayName || 'Anonymous Golfer').trim();
    if (!nameToUse) return 'Anonymous Golfer';

    switch (review.display_name_type) {
        case 'full':
            return nameToUse;
        case 'first_initial':
            const partsFI = nameToUse.split(/\s+/);
            return partsFI.length > 1 ? `${partsFI[0]} ${partsFI.slice(1).map(n => n[0]).join('.')}.` : nameToUse;
        case 'initials':
            const partsI = nameToUse.split(/\s+/);
            return partsI.map(n => n[0]).join('.') + '.';
        case 'private':
            return 'Private Reviewer';
        default:
            // Fallback to full name if type is somehow invalid or missing
            return nameToUse;
    }
}

// Potential future additions:
// - Function to format dates
// - Function to calculate average ratings etc. 