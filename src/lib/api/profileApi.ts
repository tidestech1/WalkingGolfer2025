import { getAuth } from 'firebase/auth';
import type { UserProfileUpdate } from '@/types/user';

/**
 * Client-side helper to update user profile via server API
 * This ensures both Firebase and Klaviyo are updated reliably
 */
export async function updateProfileViaAPI(profileData: UserProfileUpdate): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated to update profile');
  }

  // Get user's ID token for authentication
  const token = await user.getIdToken();
  
  const response = await fetch('/api/profile/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      profileData
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }

  const result = await response.json();
  console.log('Profile update result:', result);
  
  return result;
} 