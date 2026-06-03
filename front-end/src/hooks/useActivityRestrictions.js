import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes (300000ms)
const MAX_WARNINGS = 3;

/**
 * useActivityRestrictions Hook
 * 
 * Tracks window focus (blur), tab switching (visibility change), and user inactivity.
 * Escalates up to 3 warnings. On the 4th violation, forces auto-submission.
 */
export const useActivityRestrictions = ({ assessmentId = null, courseId = null, isActive = false }) => {
    const [warningsCount, setWarningsCount] = useState(0);
    const [isWarningVisible, setIsWarningVisible] = useState(false);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lastViolationType, setLastViolationType] = useState('');
    const navigate = useNavigate();

    const isActiveRef = useRef(isActive);
    const hasLockedOutRef = useRef(false);
    const warningsCountRef = useRef(0);
    const inactivityTimerRef = useRef(null);

    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    // Force submit assessment and lock out user on 4th breach
    const triggerLockout = useCallback(async () => {
        if (hasLockedOutRef.current) return;
        hasLockedOutRef.current = true;
        setIsLockedOut(true);
        setIsWarningVisible(false);

        try {
            console.log('🔒 Locking out user due to activity violations...');
            await apiCall('/security/lockout-submit', {
                method: 'POST',
                body: JSON.stringify({
                    assessmentId,
                    courseId
                })
            });
        } catch (error) {
            console.error('Error calling lockout-submit API:', error);
        } finally {
            // Redirect to the locked out screen
            navigate('/locked-out', { replace: true, state: { reason: 'Disqualified due to tab switching' } });
        }
    }, [assessmentId, courseId, navigate]);

    // Helper to log violation to the backend
    const reportViolation = useCallback(async (eventType) => {
        if (!isActiveRef.current || hasLockedOutRef.current) return;

        try {
            console.warn(`⚠️ Activity restriction breach detected: ${eventType}`);
            setLastViolationType(eventType);

            const response = await apiCall('/security/log-violation', {
                method: 'POST',
                body: JSON.stringify({
                    assessmentId,
                    courseId,
                    eventType
                })
            });

            if (response && response.success) {
                const newCount = response.warningsCount;
                setWarningsCount(newCount);
                warningsCountRef.current = newCount;

                if (newCount >= 4) {
                    await triggerLockout();
                } else {
                    setIsWarningVisible(true);
                }
            }
        } catch (error) {
            console.error('Error reporting activity violation:', error);
        }
    }, [assessmentId, courseId, triggerLockout]);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        if (!isActiveRef.current || hasLockedOutRef.current) return;

        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            console.warn('Inactivity timeout (5 minutes) reached.');
            reportViolation('inactivity');
        }, INACTIVITY_TIMEOUT);
    }, [reportViolation]);

    // Acknowledge warning modal
    const acknowledgeWarning = useCallback(() => {
        setIsWarningVisible(false);
    }, []);

    // Set up proctoring event listeners
    useEffect(() => {
        if (courseId) {
            // Suspended mode disabled for courses for now, we can turn it on later
            return;
        }

        if (!isActive) {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            return;
        }

        // Fetch current warning status on mount/activation
        const fetchStatus = async () => {
            try {
                let url = '/security/warning-status';
                const params = [];
                if (assessmentId) params.push(`assessmentId=${assessmentId}`);
                if (courseId) params.push(`courseId=${courseId}`);
                if (params.length > 0) {
                    url += `?${params.join('&')}`;
                }
                
                const response = await apiCall(url);
                if (response && response.success) {
                    setWarningsCount(response.warningsCount);
                    warningsCountRef.current = response.warningsCount;
                    if (response.warningsCount >= 4) {
                        triggerLockout();
                    }
                }
            } catch (err) {
                console.error('Error fetching warning status:', err);
            }
        };
        fetchStatus();

        // 1. Tab switches (Visibility change)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                reportViolation('tab_switch');
            }
        };

        // 2. Window Blur (Focus lost)
        const handleBlur = () => {
            // Delay check slightly to prevent conflicts with click events
            setTimeout(() => {
                if (document.hidden) return; // Handled by visibility change
                reportViolation('minimize');
            }, 150);
        };

        // 3. Inactivity triggers (User activity listener)
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'mousedown', 'touchstart'];
        
        activityEvents.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        // Initialize inactivity timer
        resetInactivityTimer();

        // Add visibility and blur listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });

            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [isActive, assessmentId, courseId, reportViolation, resetInactivityTimer, triggerLockout]);

    return {
        warningsCount,
        maxWarnings: MAX_WARNINGS,
        isWarningVisible,
        isLockedOut,
        lastViolationType,
        acknowledgeWarning
    };
};

export default useActivityRestrictions;
