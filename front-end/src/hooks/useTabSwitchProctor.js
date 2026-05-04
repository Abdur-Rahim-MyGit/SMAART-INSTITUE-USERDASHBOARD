import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_WARNINGS = 3; // Violations before auto-submit

/**
 * useTabSwitchProctor
 *
 * Monitors tab switching and window blur events during assessments.
 * Implements a 3-strike system:
 *   Strike 1 — Orange warning overlay ("Warning 1/3")
 *   Strike 2 — Red warning overlay ("Warning 2/3")
 *   Strike 3 — Auto-submit callback fires, final overlay shown
 *
 * Only active when `isActive` is true (should only be true on assessment paths).
 *
 * @param {boolean} isActive  — Whether proctoring is currently active
 * @param {Function} onAutoSubmit — Called on the 3rd violation
 *
 * Returns:
 *   violations        — current violation count (0-3)
 *   warningLevel      — 0 (no warning), 1 (orange), 2 (red), 3 (auto-submitted)
 *   isAutoSubmitted   — true when the assessment was auto-submitted
 *   clearWarning      — fn called when user clicks "I Understand" on the overlay
 *   isWarningVisible  — whether the overlay should be shown right now
 */
const useTabSwitchProctor = (isActive, onAutoSubmit) => {
  const [violations, setViolations] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);

  // Use a ref for the current violation count to avoid stale closures in event handlers
  const violationsRef = useRef(0);
  const isActiveRef = useRef(isActive);
  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const handleViolation = useCallback(() => {
    if (!isActiveRef.current || hasAutoSubmittedRef.current) return;

    violationsRef.current += 1;
    const count = violationsRef.current;

    setViolations(count);
    setIsWarningVisible(true);

    if (count >= MAX_WARNINGS) {
      hasAutoSubmittedRef.current = true;
      setIsAutoSubmitted(true);
      // Delay auto-submit slightly so user sees the final overlay
      setTimeout(() => {
        if (onAutoSubmit) onAutoSubmit();
      }, 2000);
    }
  }, [onAutoSubmit]);

  useEffect(() => {
    if (!isActive) return;

    // Reset on activation
    violationsRef.current = 0;
    hasAutoSubmittedRef.current = false;
    setViolations(0);
    setIsAutoSubmitted(false);
    setIsWarningVisible(false);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleBlur = () => {
      // Only count blur if the page becomes hidden (tab switch)
      // Window blur from clicking within same page doesn't count
      // We use a small delay to check if it's a real tab switch
      setTimeout(() => {
        if (document.hidden) return; // Already handled by visibilitychange
        handleViolation();
      }, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive, handleViolation]);

  const clearWarning = useCallback(() => {
    if (!isAutoSubmitted) {
      setIsWarningVisible(false);
    }
  }, [isAutoSubmitted]);

  // Warning level: 0=none, 1=orange, 2=red, 3=auto-submitted
  const warningLevel = isAutoSubmitted ? 3 : violations;

  return {
    violations,
    warningLevel,
    isAutoSubmitted,
    isWarningVisible,
    clearWarning,
    maxWarnings: MAX_WARNINGS
  };
};

export default useTabSwitchProctor;
