/**
 * UserContextFixed.jsx
 * -------------------------
 * Enhanced user context with proper profile data fetching
 * Prevents infinite loops and buffering issues while restoring functionality
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async (email) => {
    if (!email) return;
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.log('[UserContext] No token found, skipping background fetch');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/register-details/${email}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(prev => {
          // If the user has been logged out, don't resurrect the session
          if (!prev) {
            return null;
          }

          // Destructure to exclude document IDs from registration data
          const { _id, id, ...otherDetails } = data;
          
          const updated = {
            ...prev,
            ...otherDetails,
            fullName: data.fullName || prev?.fullName,
            gender: data.gender || prev?.gender,
            email: data.email || prev?.email,
          };
          // Persist the updated user data only to sessionStorage
          sessionStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      } else {
        console.log('[UserContext] Background fetch failed, using cached data');
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, []);

  useEffect(() => {
    const initUser = () => {
      try {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser === 'object') {
            setUser(parsedUser);
            // Refresh details in background if token exists
            const token = sessionStorage.getItem('token');
            if (parsedUser.email && token) {
              fetchUserDetails(parsedUser.email);
            }
          }
        }
      } catch (err) {
        console.error("[UserContext] Failed to parse stored user:", err);
        sessionStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initUser();

    // Multi-tab sync listener via localStorage
    const handleStorageChange = (e) => {
      if (e.key === "logout-event") {
        console.log("[UserContext] Cross-tab logout detected. Redirecting to login.");
        
        // Clear storages safely
        sessionStorage.clear();
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        
        // Set a flag so the LandingPage can show a clean toast message
        sessionStorage.setItem("logged_out_other_tab", "true");
        
        // Force navigation to the root explicitly using replace
        window.location.replace("/");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchUserDetails]);

  const refreshUser = useCallback(async () => {
    if (user?.email) {
      await fetchUserDetails(user.email);
    }
  }, [user?.email, fetchUserDetails]);

  const login = useCallback((userData, token) => {
    console.log('[UserContext] Login function called with user:', userData?.email);
    if (token) sessionStorage.setItem("token", token);
    if (userData) {
      const userToStore = { ...userData };
      sessionStorage.setItem("user", JSON.stringify(userToStore));
      setUser(userToStore);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[Logout] Starting logout process...');
    
    // Clear storages
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Set flag for clean logout message
    sessionStorage.setItem("logged_out_other_tab", "true");
    
    // Reset state
    setUser(null);
    
    // Redirect
    window.location.replace("/");
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(prev => {
      const updated = { ...prev, ...userData };
      sessionStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, login, refreshUser, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
