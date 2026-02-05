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
          // Destructure to exclude document IDs from registration data
          const { _id, id, ...otherDetails } = data;
          
          const updated = {
            ...prev,
            ...otherDetails,
            fullName: data.fullName || prev?.fullName,
            gender: data.gender || prev?.gender,
            email: data.email || prev?.email,
          };
          // Persist the updated user data
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
  }, [fetchUserDetails]);

  const refreshUser = useCallback(async () => {
    if (user?.email) {
      await fetchUserDetails(user.email);
    }
  }, [user?.email, fetchUserDetails]);

  const logout = useCallback(() => {
    sessionStorage.clear();
    localStorage.clear();
    setUser(null);
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
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
