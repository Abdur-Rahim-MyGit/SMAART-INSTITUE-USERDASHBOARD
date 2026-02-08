import { useState, useEffect } from 'react';

/**
 * useAuth Hook
 * 
 * Provides access to the current authenticated user
 * Reads from localStorage and returns user object
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
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
