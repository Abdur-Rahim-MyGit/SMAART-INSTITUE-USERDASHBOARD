import React, { useState, useEffect } from 'react';
import emailGif from '@/assets/Email.gif';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall, { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const FloatingCommunityButton = () => {
    const { user } = useAuth();
    // Debug: Verify apiCall import
    useEffect(() => {
        if (typeof apiCall === 'undefined') {
            console.error('❌ FloatingCommunityButton: apiCall is UNDEFINED after import!');
        } else {
            console.log('✅ FloatingCommunityButton: apiCall is ready');
        }
    }, []);

    const navigate = useNavigate();
    const location = useLocation();
    const [notificationCount, setNotificationCount] = useState(0);
    const [isSplashVisible, setIsSplashVisible] = useState(false);
    const [lastSeenCount, setLastSeenCount] = useState(() => {
        const stored = localStorage.getItem('communityLastSeenCount');
        return stored ? parseInt(stored, 10) : 0;
    });

    // Check for Vision Board splash screen
    useEffect(() => {
        const checkSplash = () => {
            // Look for the splash screen overlay (z-index 9999)
            const splashElement = document.querySelector('[class*="z-\\[9999\\]"]');
            setIsSplashVisible(!!splashElement);
        };

        checkSplash();
        const observer = new MutationObserver(checkSplash);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    const fetchNotificationCount = async () => {
        // Only fetch stats if on dashboard AND user is authenticated
        if (!user || !location.pathname.startsWith('/dashboard')) {
            return;
        }

        try {
            // Use apiCall safely
            const data = await apiCall('/community/stats');

            if (data && data.success && data.data) {
                const totalDiscussions = data.data.totalDiscussions || 0;
                const newPosts = Math.max(0, totalDiscussions - lastSeenCount);
                setNotificationCount(newPosts);
            }
        } catch (error) {
            // Silently handle unauthorized/network errors in background poll
            if (error && error.message && !error.message.includes('Unauthorized') && !error.message.includes('Failed to fetch')) {
                console.error('Error fetching community stats:', error);
            }
        }
    };

    useEffect(() => {
        fetchNotificationCount();
        const interval = setInterval(fetchNotificationCount, 8000); // Poll every 8s for near-instant session check
        return () => clearInterval(interval);
    }, [lastSeenCount, location.pathname, user]);

    useEffect(() => {
        if (location.pathname === '/dashboard/community') {
            const markAsSeen = async () => {
                try {
                    const data = await apiCall('/community/stats');
                    if (data && data.success && data.data) {
                        const totalDiscussions = data.data.totalDiscussions || 0;
                        setLastSeenCount(totalDiscussions);
                        localStorage.setItem('communityLastSeenCount', totalDiscussions.toString());
                        setNotificationCount(0);
                    }
                } catch (error) {
                    console.error('Error marking community as seen:', error);
                }
            };
            markAsSeen();
        }
    }, [location.pathname]);

    // Only show on dashboard routes (not landing, login, signup, etc.)
    if (!location.pathname.startsWith('/dashboard')) {
        return null;
    }

    // Hide on the community page itself
    if (location.pathname === '/dashboard/community') {
        return null;
    }

    // Hide on quotient assessment/quiz pages
    if (location.pathname.includes('/quotient') || location.pathname.includes('/assessment') || location.pathname.includes('/quiz')) {
        return null;
    }

    // Hide on group chat pages
    if (location.pathname.includes('/groups/')) {
        return null;
    }

    // Hide when Vision Board splash screen is showing
    if (isSplashVisible) {
        return null;
    }

    const handleClick = () => {
        navigate('/dashboard/community');
    };

    return (
        <motion.button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 w-24 h-24 flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 15 }}
            aria-label="Open Community"
            title="Community"
        >
            {/* Email GIF Animation */}
            <img
                src={emailGif}
                alt="Community"
                className="w-full h-full object-contain"
            />

            {/* Notification Badge */}
            <AnimatePresence>
                {notificationCount > 0 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-lg"
                        style={{
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4)'
                        }}
                    >
                        {notificationCount > 99 ? '99+' : notificationCount}
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export default FloatingCommunityButton;
