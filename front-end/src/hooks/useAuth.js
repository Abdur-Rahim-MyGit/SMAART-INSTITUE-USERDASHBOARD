import { useState, useEffect } from 'react';

/**
 * useAuth Hook
 * 
 * Provides access to the current authenticated user
 * Reads from sessionStorage first, falls back to localStorage (FIX #4: dual storage sync)
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // Only read from sessionStorage to keep tabs isolated
            const userData = sessionStorage.getItem("user");
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { user, loading };
};
