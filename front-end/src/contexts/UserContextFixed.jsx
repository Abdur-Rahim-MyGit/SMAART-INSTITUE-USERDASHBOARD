/**
 * UserContextFixed.jsx
 * -------------------------
 * Enhanced user context with proper profile data fetching
 * Prevents infinite loops and buffering issues while restoring functionality
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';
import { clearAssessmentTimerStorage } from '@/utils/assessmentTimerStorage';

const UserContext = createContext(null);

const clearCareerAgentStorage = () => {
  const explicitKeys = [
    'smaart_student_name',
    'smaart_student_email',
    'smaart_analysis',
    'smaart_analysis_id',
    'smaart_pref_primary',
    'smaart_pref_secondary',
    'smaart_pref_tertiary',
    'smaart_onboarding_draft',
    'smaart_user_degree',
    'smaart_user_specialisation',
    'smaart_user_skills',
    'smaart_user',
    'smaart_completed_courses',
    'smaart_last_watched_course',
    'smaart_last_watched_title',
    'smaart_last_watched_lesson',
    'smaart_course_progress',
    'smaart_last_active',
    'smaart_demo_progress',
    'smaart_capacity_dev_unlocked'
  ];
  explicitKeys.forEach((key) => localStorage.removeItem(key));

  // Dynamically clear specific prefixes to prevent cross-user data bleed
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('course-notes-') || 
        key.startsWith('passport_demo_') || 
        key.startsWith('note_color_')) {
      localStorage.removeItem(key);
    }
  });
};

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
        clearCareerAgentStorage();
        clearAssessmentTimerStorage();

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
    clearCareerAgentStorage();
    if (userData) {
      const userToStore = { ...userData };
      sessionStorage.setItem("user", JSON.stringify(userToStore));
      setUser(userToStore);

      // Persist login timestamp so Activity Feed can show it
      try {
        const logKey = `smaart_session_logs_${userData._id || userData.id || userData.email}`;
        const logs = JSON.parse(localStorage.getItem(logKey) || '[]');
        logs.push({ type: 'login', ts: new Date().toISOString() });
        localStorage.setItem(logKey, JSON.stringify(logs.slice(-60))); // keep last 60 entries
      } catch (e) { /* non-blocking */ }
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[Logout] Starting logout process...');

    // Persist logout timestamp BEFORE clearing storage so Activity Feed can show it
    try {
      const storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (storedUser) {
        const logKey = `smaart_session_logs_${storedUser._id || storedUser.id || storedUser.email}`;
        const logs = JSON.parse(localStorage.getItem(logKey) || '[]');
        logs.push({ type: 'logout', ts: new Date().toISOString() });
        localStorage.setItem(logKey, JSON.stringify(logs.slice(-60)));
      }
    } catch (e) { /* non-blocking */ }

    // Step 1: Invalidate server-side session (clear currentSessionId in DB)
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // sends HttpOnly cookie
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      console.log('[Logout] Server session cleared');
    } catch (err) {
      // Non-blocking — still clear local state even if server call fails
      console.warn('[Logout] Server logout request failed (non-blocking):', err.message);
    }

    // Step 2: Clear all local storage (except session logs — keep them for the feed)
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    clearCareerAgentStorage();
    clearAssessmentTimerStorage();

    // Step 3: Set flag for clean logout message
    sessionStorage.setItem('logged_out_other_tab', 'true');

    // Step 4: Reset state
    setUser(null);

    // Step 5: Redirect
    window.location.replace('/');
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
    console.warn('⚠️ useUser was called outside UserProvider (or Vite HMR split the context). Returning fallback to avoid crash.');
    return {
      user: null,
      loading: false,
      login: () => { },
      logout: () => { },
      updateUser: () => { },
      refreshUser: () => { }
    };
  }
  return context;
};

export default UserContext;
