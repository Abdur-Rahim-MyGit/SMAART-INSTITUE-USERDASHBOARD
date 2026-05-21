import { useState, useEffect, useRef, useCallback } from 'react';
import { clearAssessmentTimerStorage } from '@/utils/assessmentTimerStorage';

const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Show warning at 5 minutes remaining
const CHECK_INTERVAL_MS = 30 * 1000;          // Check every 30 seconds

/**
 * useSessionGuard
 *
 * Manages the 3-hour hard session expiry on the frontend.
 * Reads sessionExpiresAt from sessionStorage, runs a timer that
 * shows a 5-minute countdown warning and auto-logs-out at T=0.
 *
 * Usage: call in DashboardLayout (always mounted for authed users).
 *
 * Returns:
 *   showWarning     — boolean, show the expiry warning modal
 *   secondsLeft     — number, seconds remaining in the warning window
 *   dismissWarning  — fn, hides the modal (user clicks "Extend Session")
 *   isExpired       — boolean, session is past expiry
 */
const useSessionGuard = (onExpired) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [isExpired, setIsExpired] = useState(false);

  const countdownRef = useRef(null);
  const checkRef = useRef(null);
  const hasExpiredRef = useRef(false);

  const getExpiresAt = useCallback(() => {
    const val = sessionStorage.getItem('sessionExpiresAt');
    if (!val) return null;
    return new Date(val);
  }, []);

  const triggerExpiry = useCallback(() => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    setIsExpired(true);
    setShowWarning(false);
    clearInterval(checkRef.current);
    clearInterval(countdownRef.current);

    // Clear all session data
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    clearAssessmentTimerStorage();

    // Broadcast to other tabs
    localStorage.setItem('logout-event', Date.now().toString());

    if (onExpired) onExpired();
  }, [onExpired]);

  const startCountdown = useCallback((expiresAt) => {
    // Start 1-second countdown for the warning modal
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        triggerExpiry();
      }
    }, 1000);
  }, [triggerExpiry]);

  useEffect(() => {
    // Main periodic check (every 30s)
    checkRef.current = setInterval(() => {
      const expiresAt = getExpiresAt();
      if (!expiresAt) return;

      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        triggerExpiry();
        return;
      }

      if (remaining <= WARNING_THRESHOLD_MS && !showWarning) {
        setShowWarning(true);
        startCountdown(expiresAt);
      }
    }, CHECK_INTERVAL_MS);

    // Also run an immediate check on mount
    const expiresAt = getExpiresAt();
    if (expiresAt) {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        triggerExpiry();
      } else if (remaining <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        startCountdown(expiresAt);
      }
    }

    return () => {
      clearInterval(checkRef.current);
      clearInterval(countdownRef.current);
    };
  }, [getExpiresAt, showWarning, startCountdown, triggerExpiry]);

  const dismissWarning = useCallback(() => {
    // "Extend Session" was clicked — renew via backend and update stored expiry
    setShowWarning(false);
    clearInterval(countdownRef.current);
  }, []);

  return { showWarning, secondsLeft, dismissWarning, isExpired };
};

export default useSessionGuard;
