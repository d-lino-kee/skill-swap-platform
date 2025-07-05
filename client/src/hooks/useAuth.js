import { useState, useEffect } from 'react';
import { auth } from '../firebase';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email
        });
      } else {
        // Try to get from localStorage as fallback
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Function to get the current user's ID token for API requests
  const getIdToken = async () => {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  // Helper function for making authenticated requests
  const authFetch = async (url, options = {}) => {
    const token = await getIdToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    return fetch(url, {
      ...options,
      headers
    });
  };

  return { 
    currentUser, 
    loading,
    getIdToken,
    authFetch
  };
} 