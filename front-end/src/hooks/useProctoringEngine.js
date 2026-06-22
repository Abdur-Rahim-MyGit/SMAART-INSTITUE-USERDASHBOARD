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
  registeredFaceDescriptor = null, // NEW: Face embedding from ProctoringSetup
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

  // Face Verification State (NEW)
  const [verificationStatus, setVerificationStatus] = useState('no_face');
  // 'verified' | 'mismatch' | 'no_face' | 'multiple_faces' | 'covered' | 'error'
  const [similarityScore, setSimilarityScore] = useState(0);

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
  const registeredFaceDescriptorRef = useRef(registeredFaceDescriptor);

  // Stable ref to triggerLockout to break TDZ initialization loops
  const triggerLockoutRef = useRef(null);

  // Debouncing face violations (require consecutive failures before logging)
  const faceAbsentStreak = useRef(0);
  const multipleFacesStreak = useRef(0);
  const faceMismatchStreak = useRef(0);
  const faceCoveredStreak = useRef(0);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Keep descriptor ref in sync
  useEffect(() => {
    registeredFaceDescriptorRef.current = registeredFaceDescriptor;
  }, [registeredFaceDescriptor]);

  // Initialize and stop camera stream
  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      console.log('[ProctoringEngine] Requesting media stream...');
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
    setVerificationStatus('no_face');
    setSimilarityScore(0);
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
  }, []);

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

  // ─── FACE VERIFICATION TICK (replaces old runFaceCheck) ────────────
  const runFaceVerification = async () => {
    if (!videoRef.current || !isActiveRef.current || hasLockedOutRef.current) return;
    if (videoRef.current.readyState < 2) return;

    const descriptor = registeredFaceDescriptorRef.current;

    try {
      // If we have a registered face descriptor, run full verification
      if (descriptor) {
        const result = await verifyFace(videoRef.current, descriptor);

        if (result.error) {
          console.warn('[ProctoringEngine] Face verification error:', result.error);
          return;
        }

        setVerificationStatus(result.status);
        setSimilarityScore(result.similarity || 0);
        setFaceCount(result.faceCount);
        setIsFaceDetected(result.status === VerificationStatus.VERIFIED);

        // Handle each verification status
        switch (result.status) {
          case VerificationStatus.VERIFIED:
            // All clear — reset all streaks
            faceAbsentStreak.current = 0;
            multipleFacesStreak.current = 0;
            faceMismatchStreak.current = 0;
            faceCoveredStreak.current = 0;
            break;

          case VerificationStatus.NO_FACE:
            faceAbsentStreak.current += 1;
            multipleFacesStreak.current = 0;
            faceMismatchStreak.current = 0;
            faceCoveredStreak.current = 0;
            if (faceAbsentStreak.current >= 4) { // ~10 seconds
              faceAbsentStreak.current = 0;
              reportViolation('face_absent', 'Warning: Face not detected. Please face the camera.');
            }
            break;

          case VerificationStatus.MULTIPLE_FACES:
            multipleFacesStreak.current += 1;
            faceAbsentStreak.current = 0;
            faceMismatchStreak.current = 0;
            faceCoveredStreak.current = 0;
            if (multipleFacesStreak.current >= 3) { // ~7.5 seconds
              multipleFacesStreak.current = 0;
              reportViolation('multiple_faces', 'Warning: Multiple faces detected. Only the candidate should be visible.');
            }
            break;

          case VerificationStatus.MISMATCH:
            faceMismatchStreak.current += 1;
            faceAbsentStreak.current = 0;
            multipleFacesStreak.current = 0;
            faceCoveredStreak.current = 0;
            if (faceMismatchStreak.current >= 3) { // ~7.5 seconds of different person
              faceMismatchStreak.current = 0;
              reportViolation('face_mismatch', 'Warning: Face does not match registered candidate. Ensure the registered person is in front of the camera.');
            }
            break;

          case VerificationStatus.COVERED:
            faceCoveredStreak.current += 1;
            faceAbsentStreak.current = 0;
            multipleFacesStreak.current = 0;
            faceMismatchStreak.current = 0;
            if (faceCoveredStreak.current >= 4) { // ~10 seconds
              faceCoveredStreak.current = 0;
              reportViolation('face_covered', 'Warning: Face not clearly visible. Please remove any obstruction and look at the camera.');
            }
            break;

          default:
            break;
        }
      } else {
        // No registered descriptor — fallback to basic detection (legacy behavior)
        const result = await detectFaces(videoRef.current);

        if (result.error) {
          console.warn('[ProctoringEngine] Face detection error:', result.error);
          return;
        }

        setFaceCount(result.faceCount);
        setIsFaceDetected(result.isFacePresent);
        setVerificationStatus(result.isFacePresent ? 'verified' : 'no_face');

        if (result.faceCount === 0) {
          faceAbsentStreak.current += 1;
          if (faceAbsentStreak.current >= 4) {
            faceAbsentStreak.current = 0;
            reportViolation('face_absent', 'Warning: Face not detected. Ensure your face is centered in the camera feed.');
          }
        } else {
          faceAbsentStreak.current = 0;
        }

        if (result.faceCount > 1) {
          multipleFacesStreak.current += 1;
          if (multipleFacesStreak.current >= 3) {
            multipleFacesStreak.current = 0;
            reportViolation('multiple_faces', 'Warning: Multiple faces detected. Only the candidate should be visible.');
          }
        } else {
          multipleFacesStreak.current = 0;
        }
      }
    } catch (err) {
      console.error('[ProctoringEngine] Face verification tick failed:', err);
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

  // Stable refs for event handlers so the main effect doesn't re-fire
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
            if (triggerLockoutRef.current) triggerLockoutRef.current();
          }

          // Log face registration event if we have a registered descriptor
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

    // Start Webcam
    startCamera();

    // Start Attention Check Scheduler
    scheduleAttentionCheckRef.current();

    // Stable wrapper functions that delegate to latest refs
    const onVisibilityChange = () => handleVisibilityChangeRef.current();
    const onBlur = () => handleBlurRef.current();
    const onFullscreenChange = () => handleFullscreenChangeRef.current();
    const onActivity = () => resetInactivityTimerRef.current();

    // Set up tab / window listeners
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    // Set up inactivity events
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, onActivity);
    });

    resetInactivityTimerRef.current();

    // Face Verification Interval (replaces old face check)
    faceIntervalRef.current = setInterval(runFaceVerification, FACE_CHECK_INTERVAL);

    // Initial fullscreen check
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
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
    };
  // Only re-run when these stable values change, not on every callback recreation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, resultId, assessmentId]);

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

    // Face Verification (NEW)
    verificationStatus,
    similarityScore,
    
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
