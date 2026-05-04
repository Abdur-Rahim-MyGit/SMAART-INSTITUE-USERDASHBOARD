import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { API_BASE_URL } from '@/services/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback(async (email) => {
    if (!email) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/register-details/${email}`);
      if (response.ok) {
        const data = await response.json();
        setUser(prev => {
          // If the user has been logged out (or is currently logging out),
          // don't resurrect the session by injecting background fetch data.
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
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, []);

  useEffect(() => {
    const initUser = () => {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Refresh details in background
        if (parsedUser.email) {
          fetchUserDetails(parsedUser.email);
        }
      }
      setLoading(false);
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
        localStorage.removeItem("sessionExpiresAt");
        
        // Set a flag so the LandingPage can show a clean toast message
        sessionStorage.setItem("logged_out_other_tab", "true");
        
        // Force navigation to the root explicitly using replace
        // NOTE: We intentionally bypass `setUser(null)` here. 
        // Calling `setUser(null)` triggers a synchronous React re-render of the entire tree,
        // which can cause an ErrorBoundary crash (HMR context mismatch) while the browser is trying to redirect.
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

  const logout = useCallback(async () => {
    console.log('[Logout] Starting logout process...');
    
    // Call backend to clear session BEFORE clearing local storage
    try {
      const token = sessionStorage.getItem('token');
      console.log('[Logout] Token found:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      
      if (token) {
        console.log('[Logout] Calling backend logout API...');
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include' // Include cookies
        });
        
        const result = await response.json().catch(() => ({}));
        console.log('[Logout] Backend response:', response.status, result);
      } else {
        console.log('[Logout] No token found, skipping backend call');
      }
    } catch (error) {
      console.error('[Logout] Error calling logout API:', error);
      // Continue with local logout even if API call fails
    }
    
    // Clear local storage
    console.log('[Logout] Clearing local storage...');
    
    // Broadcast logout to other tabs via localStorage
    localStorage.setItem('logout-event', Date.now().toString());

    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("sessionExpiresAt");
    
    setUser(null);
    console.log('[Logout] Logout complete');
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    console.warn('⚠️ useUser was called outside UserProvider (or Vite HMR split the context). Returning fallback to avoid crash during teardown.');
    return { 
      user: null, 
      loading: false, 
      setUser: () => {}, 
      refreshUser: () => {}, 
      logout: () => {} 
    };
  }
  return context;
};
