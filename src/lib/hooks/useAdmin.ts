import { useState, useEffect } from 'react';

import { useAuth } from './useAuth';

/**
 * Custom hook for checking if the current user has admin permissions
 * @returns Object containing isAdmin flag and loading state
 */
export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Reset admin status when user changes
      setIsAdmin(false);
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get the ID token with fresh claims
        const idToken = await user.getIdToken(true);
        
        // Make request to admin verify endpoint
        const response = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        // If response is successful, the user is an admin
        setIsAdmin(response.ok);
      } catch (error: unknown) {
        // Check if the error is an instance of Error and resembles a fetch response error
        // We don't want to log the expected 403 Forbidden for non-admins
        let shouldLogError = true;
        if (error instanceof Response) { 
            // If the error is a Response object itself (can happen with fetch)
            if (error.status === 403) {
              shouldLogError = false; 
            }
        } else if (error instanceof Error && error.message.includes('403')){
            // Crude check if the error message contains 403 (less reliable)
            // A more robust way might involve custom error classes from the API call
            shouldLogError = false;
        }

        if (shouldLogError) {
            console.error('Error checking admin status:', error);
        }
        setIsAdmin(false); // Ensure isAdmin is false on any error
      } finally {
        setLoading(false);
      }
    };

    void checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}; 