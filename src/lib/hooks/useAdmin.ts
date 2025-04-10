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
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    void checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}; 