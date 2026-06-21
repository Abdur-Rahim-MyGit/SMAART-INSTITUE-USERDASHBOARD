import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import { detectFaces } from '@/services/faceDetectionService';
import { proctoringApi } from '@/services/proctoringApi';
import { toast } from 'sonner';

// Helper to capture a frame from the video stream as a JPEG Blob
const captureScreenshot = (videoElement) => {
  return new Promise((resolve) => {
    if (!videoElement || videoElement.readyState < 2) {
      resolve(null);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 320;
      canvas.height = videoElement.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.75); // 75% quality JPEG
    } catch (e) {
      console.error('[ProctoringEngine] Canvas capture failed:', e);
      resolve(null);
    }
  });
};

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const FACE_CHECK_INTERVAL = 2500; // 2.5 seconds
const MAX_WARNINGS = 3;

export const useProctoringEngine = ({
  resultId = null,
  assessmentId = null,
  isActive = false,
  onLockout = null // Custom submit callback
}) => {
  const [warningsCount, setWarningsCount] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lastViolationType, setLastViolationType] = useState('');
  const [proctoringSessionId, setProctoringSessionId] = useState(null);
  
  // Camera & Face State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  // Fullscreen State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(0);

  // Attention Check State
  const [showAttentionCheck, setShowAttentionCheck] = useState(false);
  const attentionTimerRef = useRef(null);

  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const hasLockedOutRef = useRef(false);
  const warningsCountRef = useRef(0);
  const inactivityTimerRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const fullscreenTimerRef = useRef(null);
  const proctoringSessionIdRef = useRef(null);

  // Stable ref to triggerLockout to break TDZ initialization loops
  const triggerLockoutRef = useRef(null);

  // Debouncing face violations (require consecutive failures before logging)
  const faceAbsentStreak = useRef(0);
  const multipleFacesStreak = useRef(0);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Initialize and stop camera stream
  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      console.log('[ProctoringEngine] Requesting media stream...');
      const constraints = {
        video: { width: 320, height: 240, frameRate: { ideal: 15 } },
        audio: false // No audio processing needed to protect privacy
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Create hidden video element for BlazeFace predictions
      const video = document.createElement('video');
      video.width = 320;
      video.height = 240;
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      videoRef.current = video;
      
      // Wait for metadata to load
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      setIsCameraActive(true);
      setCameraError(null);
    } catch (error) {
      console.error('[ProctoringEngine] Webcam init failed:', error);
      setCameraError(error.name || 'WebcamAccessDenied');
      setIsCameraActive(false);
      
      // Soft-gate fallback: let the user proceed but display a warning
      toast.warning('Camera permissions are required. Denying webcam access lowers your session trust score.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setIsCameraActive(false);
    setIsFaceDetected(false);
    setFaceCount(0);
  };

  // Trigger lockout and submit test
  const triggerLockout = useCallback(async () => {
    if (hasLockedOutRef.current) return;
    hasLockedOutRef.current = true;
    setIsLockedOut(true);
    setIsWarningVisible(false);

    // Stop streams
    stopCamera();

    try {
      console.log('🔒 Locking out user due to activity violations...');
      if (onLockout) {
        await onLockout();
      } else {
        await apiCall('/security/lockout-submit', {
          method: 'POST',
          body: JSON.stringify({ assessmentId })
        });
      }
    } catch (error) {
      console.error('Error calling lockout-submit API:', error);
    } finally {
      navigate('/locked-out', { replace: true, state: { reason: 'Disqualified due to proctoring violations' } });
    }
  }, [assessmentId, navigate, onLockout]);

  // Sync ref
  triggerLockoutRef.current = triggerLockout;

  // Log violation to backend and increment warning counters
  const reportViolation = useCallback(async (eventType, displayMessage) => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    try {
      console.warn(`⚠️ Proctoring violation: ${eventType}`);
      setLastViolationType(eventType);
      toast.error(displayMessage || `Violation detected: ${eventType}`);

      let severity = 'low';
      if (eventType === 'attention_check_fail' || eventType === 'fullscreen_exit') {
        severity = 'medium';
      } else if (eventType === 'multiple_faces') {
        severity = 'high';
      } else if (eventType === 'face_absent') {
        severity = 'medium';
      }

      let screenshotUrl = '';
      if (videoRef.current && isCameraActive && proctoringSessionIdRef.current) {
        try {
          const blob = await captureScreenshot(videoRef.current);
          if (blob) {
            const uploadRes = await proctoringApi.uploadSnapshot(proctoringSessionIdRef.current, blob);
            if (uploadRes && uploadRes.success) {
              screenshotUrl = uploadRes.screenshotUrl;
            }
          }
        } catch (e) {
          console.error('[ProctoringEngine] Snapshot upload failed:', e);
        }
      }

      if (proctoringSessionIdRef.current) {
        const response = await proctoringApi.logEvent(proctoringSessionIdRef.current, {
          eventType,
          severity,
          details: displayMessage || `Violation: ${eventType}`,
          screenshotUrl
        });

        if (response && response.success) {
          const newCount = response.sessionStatus.totalViolations;
          setWarningsCount(newCount);
          warningsCountRef.current = newCount;

          if (newCount > MAX_WARNINGS) {
            if (triggerLockoutRef.current) {
              await triggerLockoutRef.current();
            }
          } else {
            setIsWarningVisible(true);
          }
        }
      }
    } catch (error) {
      console.error('Error reporting activity violation:', error);
      // Fallback local tracking if backend call fails
      setWarningsCount(prev => {
        const next = prev + 1;
        warningsCountRef.current = next;
        if (next > MAX_WARNINGS) {
          if (triggerLockoutRef.current) {
            triggerLockoutRef.current();
          }
        } else {
          setIsWarningVisible(true);
        }
        return next;
      });
    }
  }, [isCameraActive]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.warn('Inactivity timeout reached.');
      reportViolation('inactivity', 'Assessment paused due to inactivity.');
    }, INACTIVITY_TIMEOUT);
  }, [reportViolation]);

  const scheduleAttentionCheck = useCallback(() => {
    if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
    if (!isActiveRef.current || hasLockedOutRef.current) return;
    
    // Trigger random attention check between 2.5 and 4.5 minutes (150000 to 270000 ms)
    const delay = Math.floor(Math.random() * 120000) + 150000; 
    attentionTimerRef.current = setTimeout(() => {
      if (isActiveRef.current && !hasLockedOutRef.current) {
        setShowAttentionCheck(true);
      }
    }, delay);
  }, []);

  const passAttentionCheck = useCallback(() => {
    setShowAttentionCheck(false);
    scheduleAttentionCheck();
    toast.success('Liveness verification successful.');
  }, [scheduleAttentionCheck]);

  const failAttentionCheck = useCallback(() => {
    setShowAttentionCheck(false);
    reportViolation('attention_check_fail', 'Verification failed: Attention check missed.');
    scheduleAttentionCheck();
  }, [reportViolation, scheduleAttentionCheck]);

  // Request Fullscreen
  const requestFullscreen = useCallback(() => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  }, []);

  // Run face check tick
  const runFaceCheck = async () => {
    if (!videoRef.current || !isCameraActive || !isActiveRef.current || hasLockedOutRef.current) return;

    try {
      const result = await detectFaces(videoRef.current);
      
      if (result.error) {
        console.warn('[ProctoringEngine] Face detection error:', result.error);
        return; // Skip this frame on prediction errors
      }

      setFaceCount(result.faceCount);
      setIsFaceDetected(result.isFacePresent);

      // 1. Face Absent Check
      if (result.faceCount === 0) {
        faceAbsentStreak.current += 1;
        if (faceAbsentStreak.current >= 4) { // ~10 seconds of continuous absence
          faceAbsentStreak.current = 0;
          reportViolation('face_absent', 'Warning: Face not detected. Ensure your face is centered in the camera feed.');
        }
      } else {
        faceAbsentStreak.current = 0;
      }

      // 2. Multiple Face Check
      if (result.faceCount > 1) {
        multipleFacesStreak.current += 1;
        if (multipleFacesStreak.current >= 3) { // ~7.5 seconds of multiple faces
          multipleFacesStreak.current = 0;
          reportViolation('multiple_faces', 'Warning: Multiple faces detected. Only the candidate should be visible.');
        }
      } else {
        multipleFacesStreak.current = 0;
      }

    } catch (err) {
      console.error('[ProctoringEngine] Face prediction tick failed:', err);
    }
  };

  // Visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      reportViolation('tab_switch', 'Warning: Tab switching is forbidden.');
    }
  }, [reportViolation]);

  // Focus changes
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (document.hidden) return; // Handled by visibility change
      reportViolation('minimize', 'Warning: Window focus lost.');
    }, 150);
  }, [reportViolation]);

  // Fullscreen changes
  const handleFullscreenChange = useCallback(() => {
    const active = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    
    setIsFullScreen(active);

    if (!active && isActiveRef.current && !hasLockedOutRef.current) {
      // Trigger grace period timer
      setFullscreenCountdown(15);
      
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      
      fullscreenTimerRef.current = setInterval(() => {
        setFullscreenCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(fullscreenTimerRef.current);
            reportViolation('fullscreen_exit', 'Warning: Exited fullscreen mode.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Returned to fullscreen, clear timer
      if (fullscreenTimerRef.current) {
        clearInterval(fullscreenTimerRef.current);
        fullscreenTimerRef.current = null;
      }
      setFullscreenCountdown(0);
    }
  }, [reportViolation]);

  const acknowledgeWarning = useCallback(() => {
    setIsWarningVisible(false);
  }, []);

  // Sync / Fetch initial warning count on activation
  useEffect(() => {
    if (!isActive) {
      if (proctoringSessionIdRef.current) {
        const sessionId = proctoringSessionIdRef.current;
        proctoringApi.completeSession(sessionId).catch(err => {
          console.error('[ProctoringEngine] Error auto-completing session:', err);
        });
        proctoringSessionIdRef.current = null;
        setProctoringSessionId(null);
      }
      stopCamera();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
      return;
    }

    const startProctoringSession = async () => {
      try {
        const response = await proctoringApi.startSession({
          resultId,
          assessmentId,
          environmentCheck: {
            fullScreenGranted: !!(document.fullscreenElement || document.webkitFullscreenElement),
            cameraGranted: true,
            browserInfo: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`
          }
        });
        if (response && response.success) {
          const sessionId = response.data._id;
          setProctoringSessionId(sessionId);
          proctoringSessionIdRef.current = sessionId;
          setWarningsCount(response.data.totalViolations || 0);
          warningsCountRef.current = response.data.totalViolations || 0;
          if (response.data.totalViolations > MAX_WARNINGS) {
            triggerLockout();
          }
        }
      } catch (err) {
        console.error('Error starting proctoring session:', err);
      }
    };
    startProctoringSession();

    // Start Webcam
    startCamera();

    // Start Attention Check Scheduler
    scheduleAttentionCheck();

    // Set up tab / window listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Set up inactivity events
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    // Face Check Interval
    faceIntervalRef.current = setInterval(runFaceCheck, FACE_CHECK_INTERVAL);

    // Initial fullscreen check
    const isNowFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    setIsFullScreen(isNowFull);
    if (!isNowFull) {
      setFullscreenCountdown(15);
      fullscreenTimerRef.current = setInterval(() => {
        setFullscreenCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(fullscreenTimerRef.current);
            reportViolation('fullscreen_exit', 'Warning: Fullscreen exit detected.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      stopCamera();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
    };
  }, [isActive, resultId, assessmentId, handleVisibilityChange, handleBlur, handleFullscreenChange, resetInactivityTimer, triggerLockout, scheduleAttentionCheck]);

  return {
    warningsCount,
    maxWarnings: MAX_WARNINGS,
    isWarningVisible,
    isLockedOut,
    lastViolationType,
    acknowledgeWarning,
    
    // Webcam & Face tracking
    isCameraActive,
    isFaceDetected,
    faceCount,
    cameraError,
    videoElement: videoRef.current,
    stream: streamRef.current,
    
    // Fullscreen status
    isFullScreen,
    fullscreenCountdown,
    requestFullscreen,

    // Attention check
    showAttentionCheck,
    passAttentionCheck,
    failAttentionCheck,
    proctoringSessionId
  };
};

export default useProctoringEngine;
