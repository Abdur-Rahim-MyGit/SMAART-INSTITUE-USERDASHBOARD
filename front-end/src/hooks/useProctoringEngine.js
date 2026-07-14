import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import { verifyFace, detectFaces, VerificationStatus, loadModels, isReady } from '@/services/faceVerificationService';
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
      }, 'image/jpeg', 0.75);
    } catch (e) {
      console.error('[ProctoringEngine] Canvas capture failed:', e);
      resolve(null);
    }
  });
};

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_WARNINGS = 3;

// Adaptive Interval Constants
const INTERVAL_STABLE_MS = 5000;    // 5.0 seconds when verified/stable
const INTERVAL_DEFAULT_MS = 2500;   // 2.5 seconds baseline/transition
const INTERVAL_INFRACTION_MS = 1000; // 1.0 second during active warning/streak to check rapidly

export const useProctoringEngine = ({
  resultId = null,
  assessmentId = null,
  isActive = false,
  registeredFaceDescriptor = null,
  onLockout = null
}) => {
  const [warningsCount, setWarningsCount] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lastViolationType, setLastViolationType] = useState('');
  const [proctoringSessionId, setProctoringSessionId] = useState(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  const [verificationStatus, setVerificationStatus] = useState('no_face');
  const [similarityScore, setSimilarityScore] = useState(0);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(0);

  const [showAttentionCheck, setShowAttentionCheck] = useState(false);
  const attentionTimerRef = useRef(null);

  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const hasLockedOutRef = useRef(false);
  const warningsCountRef = useRef(0);
  const inactivityTimerRef = useRef(null);
  
  // Timeout reference for adaptive checking
  const faceTimeoutRef = useRef(null);
  const fullscreenTimerRef = useRef(null);
  const proctoringSessionIdRef = useRef(null);
  const registeredFaceDescriptorRef = useRef(registeredFaceDescriptor);

  const triggerLockoutRef = useRef(null);

  const faceAbsentStreak = useRef(0);
  const multipleFacesStreak = useRef(0);
  const faceMismatchStreak = useRef(0);
  const faceCoveredStreak = useRef(0);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    registeredFaceDescriptorRef.current = registeredFaceDescriptor;
  }, [registeredFaceDescriptor]);

  // Initialize and stop camera stream with automatic retries for release delays
  const startCamera = async (retryCount = 0) => {
    if (streamRef.current) return;
    try {
      console.log(`[ProctoringEngine] Requesting media stream (attempt ${retryCount + 1})...`);
      const constraints = {
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        audio: false // No audio processing needed to protect privacy
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Create hidden video element for face verification
      const video = document.createElement('video');
      video.width = 640;
      video.height = 480;
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

      // Ensure face-api models are loaded
      if (!isReady()) {
        try {
          await loadModels();
        } catch (err) {
          console.warn('[ProctoringEngine] Model loading failed during camera start:', err);
        }
      }
    } catch (error) {
      console.error(`[ProctoringEngine] Webcam acquisition failed (attempt ${retryCount + 1}):`, error);
      
      // Retry on any hardware allocation error (device locked, busy, driver lag) up to 4 times
      const isPermissionDenied = 
        error.name === 'NotAllowedError' || 
        error.name === 'PermissionDeniedError' || 
        error.name === 'SecurityError';

      if (!isPermissionDenied && retryCount < 4) {
        console.warn(`[ProctoringEngine] Camera initialization issue (locked/busy). Retrying in 900ms...`);
        await new Promise(resolve => setTimeout(resolve, 900));
        return startCamera(retryCount + 1);
      }

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
    setVerificationStatus('no_face');
    setSimilarityScore(0);
  };

  const triggerLockout = useCallback(async () => {
    if (hasLockedOutRef.current) return;
    hasLockedOutRef.current = true;
    setIsLockedOut(true);
    setIsWarningVisible(false);

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

  triggerLockoutRef.current = triggerLockout;

  const reportViolation = useCallback(async (eventType, displayMessage) => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    try {
      console.warn(`⚠️ Proctoring violation: ${eventType}`);
      setLastViolationType(eventType);
      toast.error(displayMessage || `Violation detected: ${eventType}`);

      let severity = 'low';
      if (eventType === 'attention_check_fail' || eventType === 'fullscreen_exit') {
        severity = 'medium';
      } else if (eventType === 'multiple_faces' || eventType === 'face_mismatch') {
        severity = 'high';
      } else if (eventType === 'face_absent' || eventType === 'face_covered') {
        severity = 'medium';
      }

      let screenshotUrl = '';
      if (videoRef.current && proctoringSessionIdRef.current) {
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
  }, []);

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

  // Forward schedule wrapper helper
  const scheduleNextFaceCheck = useCallback((delay) => {
    if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
    if (isActiveRef.current && !hasLockedOutRef.current) {
      faceTimeoutRef.current = setTimeout(runFaceVerification, delay);
    }
  }, []);

  // ─── ADAPTIVE FACE VERIFICATION SCHEDULER ───────────────────────────
  const runFaceVerification = async () => {
    if (!videoRef.current || !isActiveRef.current || hasLockedOutRef.current) return;
    if (videoRef.current.readyState < 2) return;

    const descriptor = registeredFaceDescriptorRef.current;
    let nextDelay = INTERVAL_DEFAULT_MS;

    try {
      if (descriptor) {
        const result = await verifyFace(videoRef.current, descriptor);

        if (result.error) {
          console.warn('[ProctoringEngine] Face verification error:', result.error);
          scheduleNextFaceCheck(INTERVAL_DEFAULT_MS);
          return;
        }

        setVerificationStatus(result.status);
        setSimilarityScore(result.similarity || 0);
        setFaceCount(result.faceCount);
        setIsFaceDetected(result.status === VerificationStatus.VERIFIED);

        let activeInfraction = false;

        switch (result.status) {
          case VerificationStatus.VERIFIED:
            faceAbsentStreak.current = 0;
            multipleFacesStreak.current = 0;
            faceMismatchStreak.current = 0;
            faceCoveredStreak.current = 0;
            
            // Stable State -> Check every 5.0 seconds
            nextDelay = INTERVAL_STABLE_MS;
            break;

          case VerificationStatus.NO_FACE:
            faceAbsentStreak.current += 1;
            multipleFacesStreak.current = 0;
            faceMismatchStreak.current = 0;
            faceCoveredStreak.current = 0;
            
            activeInfraction = true;
            if (faceAbsentStreak.current >= 4) { // 4 seconds total
              faceAbsentStreak.current = 0;
              reportViolation('face_absent', 'Warning: Face not detected. Please face the camera.');
            }
            break;

          case VerificationStatus.MULTIPLE_FACES:
            multipleFacesStreak.current += 1;
            faceAbsentStreak.current = 0;
            faceMismatchStreak.current = 0;
            faceCoveredStreak.current = 0;
            
            activeInfraction = true;
            if (multipleFacesStreak.current >= 3) { // 3 seconds total
              multipleFacesStreak.current = 0;
              reportViolation('multiple_faces', 'Warning: Multiple faces detected. Only the candidate should be visible.');
            }
            break;

          case VerificationStatus.MISMATCH:
            faceMismatchStreak.current += 1;
            faceAbsentStreak.current = 0;
            multipleFacesStreak.current = 0;
            faceCoveredStreak.current = 0;
            
            activeInfraction = true;
            if (faceMismatchStreak.current >= 3) { // 3 seconds total
              faceMismatchStreak.current = 0;
              reportViolation('face_mismatch', 'Warning: Face does not match registered candidate. Ensure the registered person is in front of the camera.');
            }
            break;

          case VerificationStatus.COVERED:
            faceCoveredStreak.current += 1;
            faceAbsentStreak.current = 0;
            multipleFacesStreak.current = 0;
            faceMismatchStreak.current = 0;
            
            activeInfraction = true;
            if (faceCoveredStreak.current >= 4) { // 4 seconds total
              faceCoveredStreak.current = 0;
              reportViolation('face_covered', 'Warning: Face not clearly visible. Please remove any obstruction and look at the camera.');
            }
            break;

          default:
            break;
        }

        // Active violation state -> poll rapidly at 1.0 second intervals
        if (activeInfraction) {
          nextDelay = INTERVAL_INFRACTION_MS;
        }
      } else {
        // Fallback baseline basic detection
        const result = await detectFaces(videoRef.current);

        if (result.error) {
          console.warn('[ProctoringEngine] Face detection error:', result.error);
          scheduleNextFaceCheck(INTERVAL_DEFAULT_MS);
          return;
        }

        setFaceCount(result.faceCount);
        setIsFaceDetected(result.isFacePresent);
        setVerificationStatus(result.isFacePresent ? 'verified' : 'no_face');

        if (result.faceCount === 0) {
          faceAbsentStreak.current += 1;
          nextDelay = INTERVAL_INFRACTION_MS;
          if (faceAbsentStreak.current >= 4) {
            faceAbsentStreak.current = 0;
            reportViolation('face_absent', 'Warning: Face not detected. Ensure your face is centered in the camera feed.');
          }
        } else {
          faceAbsentStreak.current = 0;
          nextDelay = INTERVAL_STABLE_MS;
        }

        if (result.faceCount > 1) {
          multipleFacesStreak.current += 1;
          nextDelay = INTERVAL_INFRACTION_MS;
          if (multipleFacesStreak.current >= 3) {
            multipleFacesStreak.current = 0;
            reportViolation('multiple_faces', 'Warning: Multiple faces detected. Only the candidate should be visible.');
          }
        } else {
          multipleFacesStreak.current = 0;
        }
      }
    } catch (err) {
      console.error('[ProctoringEngine] Face verification check crashed:', err);
    }

    scheduleNextFaceCheck(nextDelay);
  };

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      reportViolation('tab_switch', 'Warning: Tab switching is forbidden.');
    }
  }, [reportViolation]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (document.hidden) return;
      reportViolation('minimize', 'Warning: Window focus lost.');
    }, 150);
  }, [reportViolation]);

  const handleFullscreenChange = useCallback(() => {
    const active = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    
    setIsFullScreen(active);

    if (!active && isActiveRef.current && !hasLockedOutRef.current) {
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

  const handleVisibilityChangeRef = useRef(handleVisibilityChange);
  const handleBlurRef = useRef(handleBlur);
  const handleFullscreenChangeRef = useRef(handleFullscreenChange);
  const resetInactivityTimerRef = useRef(resetInactivityTimer);
  const reportViolationRef = useRef(reportViolation);
  const scheduleAttentionCheckRef = useRef(scheduleAttentionCheck);

  useEffect(() => { handleVisibilityChangeRef.current = handleVisibilityChange; }, [handleVisibilityChange]);
  useEffect(() => { handleBlurRef.current = handleBlur; }, [handleBlur]);
  useEffect(() => { handleFullscreenChangeRef.current = handleFullscreenChange; }, [handleFullscreenChange]);
  useEffect(() => { resetInactivityTimerRef.current = resetInactivityTimer; }, [resetInactivityTimer]);
  useEffect(() => { reportViolationRef.current = reportViolation; }, [reportViolation]);
  useEffect(() => { scheduleAttentionCheckRef.current = scheduleAttentionCheck; }, [scheduleAttentionCheck]);

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
      if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
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
            if (triggerLockoutRef.current) triggerLockoutRef.current();
          }

          if (registeredFaceDescriptorRef.current) {
            proctoringApi.logEvent(sessionId, {
              eventType: 'face_registered',
              severity: 'info',
              details: 'Face identity registered during setup'
            }).catch(err => console.warn('[ProctoringEngine] Failed to log face_registered event:', err));
          }
        }
      } catch (err) {
        console.error('Error starting proctoring session:', err);
      }
    };
    startProctoringSession();

    startCamera();
    scheduleAttentionCheckRef.current();

    const onVisibilityChange = () => handleVisibilityChangeRef.current();
    const onBlur = () => handleBlurRef.current();
    const onFullscreenChange = () => handleFullscreenChangeRef.current();
    const onActivity = () => resetInactivityTimerRef.current();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, onActivity);
    });

    resetInactivityTimerRef.current();

    // Trigger initial adaptive check
    scheduleNextFaceCheck(INTERVAL_DEFAULT_MS);

    const isNowFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    setIsFullScreen(isNowFull);
    if (!isNowFull) {
      setFullscreenCountdown(15);
      fullscreenTimerRef.current = setInterval(() => {
        setFullscreenCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(fullscreenTimerRef.current);
            if (reportViolationRef.current) {
              reportViolationRef.current('fullscreen_exit', 'Warning: Fullscreen exit detected.');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      stopCamera();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, onActivity);
      });

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
    };
  }, [isActive, resultId, assessmentId, scheduleNextFaceCheck]);

  return {
    warningsCount,
    maxWarnings: MAX_WARNINGS,
    isWarningVisible,
    isLockedOut,
    lastViolationType,
    acknowledgeWarning,
    
    isCameraActive,
    isFaceDetected,
    faceCount,
    cameraError,
    videoElement: videoRef.current,
    stream: streamRef.current,

    verificationStatus,
    similarityScore,
    
    isFullScreen,
    fullscreenCountdown,
    requestFullscreen,

    showAttentionCheck,
    passAttentionCheck,
    failAttentionCheck,
    proctoringSessionId
  };
};

export default useProctoringEngine;
