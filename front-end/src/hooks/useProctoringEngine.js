import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import { verifyFace, verifyFaceBatch, detectFaces, VerificationStatus, loadModels, isReady, resetGazeCalibration } from '@/services/faceVerificationService';
import { proctoringApi } from '@/services/proctoringApi';
import { startAudioMonitoring, stopAudioMonitoring } from '@/services/audioMonitorService';
import { checkHeadPose } from '@/services/faceQualityService';
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

// v3: Batch Verification & Fast Violation Constants
const BATCH_INTERVAL_MS = 6000;   // 6 seconds between batch verification cycles
const BATCH_INITIAL_DELAY_MS = 2000;   // 2 seconds after start before first batch
const QUICK_CHECK_INTERVAL_MS = 1000;  // 1 second for lightweight face presence checks between batches

// v3: Responsive Grace Period Constants
const NO_FACE_REMINDER_MS = 2000;   // 2 seconds no face → gentle toast reminder
const NO_FACE_VIOLATION_MS = 5000;   // 5 seconds sustained absence → violation logged
const MULTI_FACE_GRACE_MS = 1000;   // 1 second grace before multiple-face violation
const MISMATCH_RETRY_COUNT = 1;      // retry verification 1 time before warning
const MISMATCH_FLAG_COUNT = 2;      // flag for review after 2 confirmed mismatches

export const useProctoringEngine = ({
  resultId = null,
  assessmentId = null,
  isActive = false,
  registeredFaceDescriptor = null,
  registeredAllEmbeddings = null,
  registrationMetadata = null,
  onLockout = null
}) => {
  const [warningsCount, setWarningsCount] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lastViolationType, setLastViolationType] = useState('');
  const [proctoringSessionId, setProctoringSessionId] = useState(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  // Face Verification State
  const [verificationStatus, setVerificationStatus] = useState('no_face');
  const [similarityScore, setSimilarityScore] = useState(0);

  // Eye Gaze State (NEW)
  const [gazeDirection, setGazeDirection] = useState('center');

  // Audio Monitor State (NEW)
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAudioCalibrated, setIsAudioCalibrated] = useState(false);
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
  const registeredAllEmbeddingsRef = useRef(registeredAllEmbeddings);

  const triggerLockoutRef = useRef(null);

  // v3: Batch verification state refs
  const batchIntervalRef = useRef(null);
  const quickCheckIntervalRef = useRef(null);
  const noFaceTimestampRef = useRef(null);     // When no-face was first detected
  const noFaceReminderSentRef = useRef(false); // Whether gentle reminder was shown
  const multiFaceTimestampRef = useRef(null);   // When multi-face was first detected
  const gazeTimestampRef = useRef(null);        // When sustained head pose gaze away was first detected
  const consecutiveMismatchRef = useRef(0);     // Consecutive batch mismatches
  const isBatchRunningRef = useRef(false);      // Prevent overlapping batch runs

  // Legacy streak refs (kept for non-batch quick-check mode)
  const faceAbsentStreak = useRef(0);
  const multipleFacesStreak = useRef(0);
  const faceMismatchStreak = useRef(0);
  const faceCoveredStreak = useRef(0);
  // Eye gaze streaks
  const gazeAwayStreak = useRef(0);
  const eyesClosedStreak = useRef(0);
  // Grace timer: track when no-face was first detected (ms timestamp)
  const noFaceGraceStartRef = useRef(null);
  const GRACE_PERIOD_MS = 5000;  // v3: 5 seconds grace before logging no-face violation
  const MISMATCH_LOCKOUT = 2;     // 2 consecutive mismatches → suspected impersonation violation

  // Initialization grace period (8 seconds) to prevent false focus/fullscreen flags while loading
  const isInitializingRef = useRef(true);

  useEffect(() => {
    isInitializingRef.current = true;
    const timer = setTimeout(() => {
      isInitializingRef.current = false;
      console.log('[ProctoringEngine] Initialization grace period ended. Focus and fullscreen monitoring active.');
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    registeredFaceDescriptorRef.current = registeredFaceDescriptor;
  }, [registeredFaceDescriptor]);

  useEffect(() => {
    registeredAllEmbeddingsRef.current = registeredAllEmbeddings;
  }, [registeredAllEmbeddings]);

  // Initialize and stop camera stream with automatic retries for release delays
  const startCamera = async (retryCount = 0) => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;
    if (streamRef.current) return;

    // On the very first attempt, wait for the setup stream to fully release.
    // ProctoringSetup already waits 1800ms before mounting this component,
    // but some OS/browser combos need an additional buffer.
    if (retryCount === 0) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      console.log(`[ProctoringEngine] Requesting media stream (attempt ${retryCount + 1})...`);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } }
        });
      }

      // Handle race condition: component might have unmounted or isActive became false
      if (!isActiveRef.current || hasLockedOutRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setMediaStream(stream);

      // Create hidden video element in the DOM for live face verification
      const video = document.createElement('video');
      video.width = 640;
      video.height = 480;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0.01';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-9999';
      document.body.appendChild(video);

      video.srcObject = stream;
      videoRef.current = video;

      // The detection video MUST stay inside the viewport — Chromium suspends
      // frame decoding for any element positioned outside the viewport bounds
      // (right: -9999px, top: -9999px, etc.), even with non-zero opacity.
      // Solution: place it at a real decoded size (120×90 is enough for
      // TinyFaceDetector's 320-px input), with opacity 0.001 and z-index -1
      // so it is inside the viewport but completely invisible under all content.
      //
      // Corner choice matters: ProctoringOverlay renders a fully opaque panel
      // fixed at bottom-right for the entire exam. Placing this video in that
      // same corner put it permanently behind (and fully covered by) that
      // panel, which is enough for some browsers to treat it as occluded and
      // stop delivering fresh frames to the detector — the overlay's own
      // preview (a separate <video> bound to the same stream) kept rendering
      // live, so the face was visibly present while detection saw a frozen
      // frame and reported "No Face Detected" forever. Top-left is empty on
      // every exam route, so nothing ever stacks on top of it.
      video.setAttribute('aria-hidden', 'true');
      Object.assign(video.style, {
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '640px',     // Match source resolution to prevent browser from downscaling video decoding quality
        height: '480px',
        opacity: '0.01',   // Non-zero keeps Chromium decoding frames
        pointerEvents: 'none',
        zIndex: '99999',   // Sit on top of all elements to prevent occlusion suspension
      });
      if (!video.isConnected) document.body.appendChild(video);

      // Start playback immediately as a fail-safe
      video.play().catch(e => console.warn('[ProctoringEngine] Immediate play failed:', e.message));

      // Wait for metadata to load
      await new Promise((resolve) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }
        video.onloadedmetadata = () => {
          video.play().catch(e => console.warn('[ProctoringEngine] Video play interrupted in metadata event:', e));
          resolve();
        };
        if (video.readyState >= 2) {
          onReady();
        } else {
          video.onloadedmetadata = onReady;
          video.oncanplay = onReady;
          setTimeout(resolve, 2000);
        }
      });

      setIsCameraActive(true);
      setCameraError(null);
      console.log('[ProctoringEngine] ✅ Camera stream acquired & attached to DOM.');

      // Ensure ONNX / face-api models are loaded
      if (!isReady()) {
        try {
          await loadModels();
        } catch (err) {
          console.warn('[ProctoringEngine] Model loading failed during camera start:', err);
        }
      }
    } catch (error) {
      const isPermissionDenied =
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError' ||
        error.name === 'SecurityError';

      if (!isPermissionDenied && retryCount < 5) {
        const retryDelay = 800;
        console.warn(`[ProctoringEngine] Camera busy. Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/5)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return startCamera(retryCount + 1);
      }

      setCameraError(error.name || 'WebcamAccessDenied');
      setIsCameraActive(false);
      toast.warning('Camera unavailable. Please check that no other app is using your webcam.');
    }
  };

  const stopCamera = useCallback(() => {
    // Clear camera retry timeouts
    if (cameraRetryTimeoutRef.current) {
      clearTimeout(cameraRetryTimeoutRef.current);
      cameraRetryTimeoutRef.current = null;
    }
    // Stop tracks on the stream ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    // Remove video element from DOM and null reference
    if (videoRef.current) {
      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    // NOTE: Do NOT call getUserMedia here as a "nuclear fallback" —
    // acquiring and immediately stopping a stream re-locks the hardware
    // and causes AbortError on the next legitimate getUserMedia call.

    setIsCameraActive(false);
    setMediaStream(null);
    setIsFaceDetected(false);
    setFaceCount(0);
    setVerificationStatus('no_face');
    setSimilarityScore(0);
  }, []);

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
      } else if (proctoringSessionIdRef.current) {
        // Trigger lock via backend API
        await proctoringApi.triggerLock(proctoringSessionIdRef.current, { lockReason: lastViolationType });
      }
    } catch (error) {
      console.error('Error calling lockout API:', error);
    } finally {
      navigate('/locked-out', { replace: true, state: { reason: 'Assessment Locked due to multiple violations. A support ticket has been raised for IT Support.' } });
    }
  }, [navigate, onLockout, lastViolationType]);

  triggerLockoutRef.current = triggerLockout;

  const reportViolation = useCallback(async (eventType, displayMessage) => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    // Ignore focus/fullscreen checks during initialization grace period
    if (isInitializingRef.current && (eventType === 'minimize' || eventType === 'fullscreen_exit')) {
      console.log(`[ProctoringEngine] Grace period: Bypassing focus/fullscreen violation '${eventType}' during initial load.`);
      return;
    }

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
    if (!isActiveRef.current || hasLockedOutRef.current || !isCameraActive) return;

    const delay = Math.floor(Math.random() * 120000) + 150000;
    attentionTimerRef.current = setTimeout(() => {
      if (isActiveRef.current && !hasLockedOutRef.current && isCameraActive) {
        setShowAttentionCheck(true);
      }
    }, delay);
  }, [isCameraActive]);

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

  // Forward schedule wrapper helper (kept for legacy compatibility with quick checks)
  const scheduleNextFaceCheck = useCallback((delay) => {
    if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
    if (isActiveRef.current && !hasLockedOutRef.current) {
      faceTimeoutRef.current = setTimeout(runQuickFaceCheck, delay);
    }
  }, []);

  // ─── v3: LIGHTWEIGHT QUICK CHECK (between batch verifications) ──────
  // Runs every 2 seconds. Only detects face presence (no embedding/comparison).
  // Manages grace periods for no-face and multiple-face conditions.
  const runQuickFaceCheck = async () => {
    if (!videoRef.current || !isActiveRef.current || hasLockedOutRef.current) return;

    console.log('[ProctoringEngine] Checking video state:', {
      readyState: videoRef.current.readyState,
      paused: videoRef.current.paused,
      videoWidth: videoRef.current.videoWidth,
      videoHeight: videoRef.current.videoHeight,
      srcObject: !!videoRef.current.srcObject,
    });

    if (videoRef.current.readyState < 2) {
      scheduleNextFaceCheck(QUICK_CHECK_INTERVAL_MS);
      return;
    }

    try {
      const result = await detectFaces(videoRef.current);
      if (result.error) {
        scheduleNextFaceCheck(QUICK_CHECK_INTERVAL_MS);
        return;
      }

      setFaceCount(prev => (prev !== result.faceCount ? result.faceCount : prev));

      if (result.faceCount === 1) {
        // Face present — reset all grace timers
        setIsFaceDetected(true);
        noFaceTimestampRef.current = null;
        noFaceReminderSentRef.current = false;
        setVerificationStatus(prev => (prev === 'no_face' ? 'verified' : prev));

        // ── 3D Head Pose & Gaze Estimation ──
        if (result.faces?.[0]?.landmarks) {
          const pose = checkHeadPose(result.faces[0].landmarks);
          setGazeDirection(pose.direction);

          if (pose.direction !== 'center') {
            if (!gazeTimestampRef.current) {
              gazeTimestampRef.current = Date.now();
            }
            const gazeElapsed = Date.now() - gazeTimestampRef.current;
            if (gazeElapsed >= 2500) { // 2.5s sustained gaze away
              gazeTimestampRef.current = Date.now(); // reset
              const dirText = pose.direction.replace('_', ' ');
              reportViolation('attention_check_fail', `Warning: Head turned away (${dirText}). Please face your screen.`);
            }
          } else {
            gazeTimestampRef.current = null;
          }
        }
      } else if (result.faceCount === 0) {
        setIsFaceDetected(false);
        setVerificationStatus('no_face');

        // Start no-face grace timer if not started
        if (!noFaceTimestampRef.current) {
          noFaceTimestampRef.current = Date.now();
        }

        const elapsed = Date.now() - noFaceTimestampRef.current;

        // 5s: gentle reminder (not a violation)
        if (elapsed >= NO_FACE_REMINDER_MS && !noFaceReminderSentRef.current) {
          noFaceReminderSentRef.current = true;
          toast.info('Please position yourself in front of the camera.', { duration: 4000 });
          // Log as info event, not a violation
          if (proctoringSessionIdRef.current) {
            proctoringApi.logEvent(proctoringSessionIdRef.current, {
              eventType: 'face_absent_reminder',
              severity: 'info',
              details: 'Gentle reminder: face absent for 5+ seconds',
            }).catch(() => { });
          }
        }

        // 15s: actual violation
        if (elapsed >= NO_FACE_VIOLATION_MS) {
          noFaceTimestampRef.current = Date.now(); // Reset to prevent spamming
          noFaceReminderSentRef.current = false;
          reportViolation('face_absent', 'Warning: Face not detected for an extended period. Please face the camera.');
        }

        multiFaceTimestampRef.current = null;
      } else if (result.faceCount > 1) {
        setVerificationStatus('multiple_faces');

        // Start multi-face grace timer if not started
        if (!multiFaceTimestampRef.current) {
          multiFaceTimestampRef.current = Date.now();
        }

        const elapsed = Date.now() - multiFaceTimestampRef.current;

        // 3s grace: warn only after sustained multiple faces
        if (elapsed >= MULTI_FACE_GRACE_MS) {
          multiFaceTimestampRef.current = Date.now(); // Reset
          reportViolation('multiple_faces', 'Warning: Multiple people detected. Only the registered candidate may remain in view.');
        }

        noFaceTimestampRef.current = null;
        noFaceReminderSentRef.current = false;
      }
    } catch (err) {
      console.warn('[ProctoringEngine] Quick face check error:', err.message);
    }

    scheduleNextFaceCheck(QUICK_CHECK_INTERVAL_MS);
  };

  // ─── v3: BATCH FACE VERIFICATION (runs every 10 seconds) ───────────
  const runBatchVerification = async () => {
    if (!videoRef.current || !isActiveRef.current || hasLockedOutRef.current) return;
    if (isBatchRunningRef.current) return; // prevent overlap
    isBatchRunningRef.current = true;

    const allEmbs = registeredAllEmbeddingsRef.current;
    const singleDescriptor = registeredFaceDescriptorRef.current;

    try {
      if (allEmbs && allEmbs.length > 0) {
        // ── Multi-reference batch verification (5 live vs 5 registered) ──
        const result = await verifyFaceBatch(videoRef.current, allEmbs, {
          frameCount: 5,
          intervalMs: 500,
        });

        if (result.error) {
          console.warn('[ProctoringEngine] Batch verification error:', result.error);
          isBatchRunningRef.current = false;
          return;
        }

        console.log(`[ProctoringEngine] Batch verification: ${result.status}, best=${result.bestSimilarity?.toFixed(3)}, avg=${result.avgSimilarity?.toFixed(3)}, frames=${result.framesCaptured}`);

        setVerificationStatus(result.status);
        setSimilarityScore(result.bestSimilarity || 0);
        setFaceCount(result.faceCount);
        setIsFaceDetected(result.status === VerificationStatus.VERIFIED);

        // Log batch result to backend (fire-and-forget)
        if (proctoringSessionIdRef.current) {
          proctoringApi.logVerification(proctoringSessionIdRef.current, {
            similarity: result.bestSimilarity || 0,
            status: result.status,
            framesCaptured: result.framesCaptured,
            warningIssued: false, // Will be updated below if a warning fires
          }).catch(() => { });
        }

        // Handle batch result
        if (result.status === VerificationStatus.VERIFIED) {
          // All clear — reset mismatch streak
          consecutiveMismatchRef.current = 0;
          noFaceTimestampRef.current = null;
          noFaceReminderSentRef.current = false;
          multiFaceTimestampRef.current = null;
        } else if (result.status === VerificationStatus.MISMATCH) {
          consecutiveMismatchRef.current++;

          if (consecutiveMismatchRef.current < MISMATCH_RETRY_COUNT) {
            // Retry: run another quick batch before warning
            console.log(`[ProctoringEngine] Mismatch (${consecutiveMismatchRef.current}/${MISMATCH_RETRY_COUNT}) — retrying before warning...`);
            toast.info('Verifying identity... please face the camera directly.', { duration: 3000 });
          } else if (consecutiveMismatchRef.current >= MISMATCH_FLAG_COUNT) {
            // Flag for review after 3+ consecutive mismatches
            consecutiveMismatchRef.current = 0;
            reportViolation('face_mismatch', 'Suspected identity mismatch detected. The session has been flagged for review.');
          } else {
            // Warning after MISMATCH_RETRY_COUNT consecutive mismatches
            toast.warning(`Face mismatch detected. Please adjust your lighting or camera angle. (Attempt ${consecutiveMismatchRef.current}/${MISMATCH_FLAG_COUNT})`);
          }
        } else if (result.status === VerificationStatus.MULTIPLE_FACES) {
          reportViolation('multiple_faces', 'Warning: Multiple people detected. Only the registered candidate may remain in view.');
        } else if (result.status === VerificationStatus.NO_FACE) {
          reportViolation('face_absent', 'Warning: Face not detected. Please position yourself in front of the camera.');
        }

      } else if (singleDescriptor) {
        // ── Fallback: Single-descriptor verification (legacy) ──
        const result = await verifyFace(videoRef.current, singleDescriptor);
        if (!result.error) {
          setVerificationStatus(result.status);
          setSimilarityScore(result.similarity || 0);
          setFaceCount(result.faceCount);
          setIsFaceDetected(result.status === VerificationStatus.VERIFIED);

          if (result.status === VerificationStatus.VERIFIED) {
            consecutiveMismatchRef.current = 0;
          } else if (result.status === VerificationStatus.MISMATCH) {
            consecutiveMismatchRef.current++;
            if (consecutiveMismatchRef.current >= MISMATCH_RETRY_COUNT) {
              consecutiveMismatchRef.current = 0;
              reportViolation('face_mismatch', 'Suspected identity substitution detected.');
            }
          }
        }
      }
    } catch (err) {
      console.error('[ProctoringEngine] Batch verification crashed:', err);
    } finally {
      isBatchRunningRef.current = false;
    }
  };



  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      reportViolation('tab_switch', 'Warning: Tab switching is forbidden.');
    }
  }, [reportViolation]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      // Ignore if document is hidden (tab_switch handles it) or if window retained/regained focus
      if (document.hidden || document.hasFocus()) return;
      reportViolation('minimize', 'Warning: Window focus lost.');
    }, 500);
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
      setIsMicActive(false);
      setIsAudioCalibrated(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
      if (batchIntervalRef.current) clearInterval(batchIntervalRef.current);
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

          const descriptor = registeredFaceDescriptorRef.current;
          const allEmbs = registeredAllEmbeddingsRef.current;

          if (descriptor) {
            // ── Persist the registration embedding(s) to the backend ──────────────
            try {
              await proctoringApi.saveRegistration(sessionId, {
                embedding: descriptor,
                allEmbeddings: allEmbs || null,
                registrationImages: registrationMetadata?.alignedCrops || null,
                model: 'arcface-r50-onnx',
                qualityScore: registrationMetadata?.qualityScore || null,
                framesCaptured: 5,
                antispoofPassed: true,
              });
              console.log('[ProctoringEngine] ✅ Face embedding(s) saved to backend session.');
            } catch (saveErr) {
              console.warn('[ProctoringEngine] Failed to persist face embedding to backend:', saveErr);
            }

            proctoringApi.logEvent(sessionId, {
              eventType: 'face_registered',
              severity: 'info',
              details: `Face identity registered: ${allEmbs?.length || 1} embeddings persisted`
            }).catch(err => console.warn('[ProctoringEngine] Failed to log face_registered event:', err));

            // Call saveRegistration to upload crop image to Cloudinary & save descriptor!
            proctoringApi.saveRegistration(sessionId, {
              embedding: Array.from(registeredFaceDescriptorRef.current),
              model: registrationMetadataRef.current?.model || 'faceapi-128',
              qualityScore: registrationMetadataRef.current?.qualityScore || 100,
              framesCaptured: registrationMetadataRef.current?.framesCaptured || 3,
              antispoofPassed: registrationMetadataRef.current?.antispoofPassed !== undefined ? registrationMetadataRef.current.antispoofPassed : true,
              alignedCropUrl: registrationMetadataRef.current?.registrationCropUrl || null
            }).then(regRes => {
              if (regRes && regRes.success && regRes.referencePhotoUrl) {
                console.log('[ProctoringEngine] ✅ Face registration & Cloudinary image saved to server:', regRes.referencePhotoUrl);
              }
            }).catch(err => console.error('[ProctoringEngine] Failed to save registration:', err));
          } else {
            console.warn('[ProctoringEngine] No face descriptor in memory. Attempting recovery from backend...');
            try {
              const embeddingRes = await proctoringApi.getEmbedding(sessionId);
              if (embeddingRes && embeddingRes.success && embeddingRes.embedding) {
                const recovered = new Float32Array(embeddingRes.embedding);
                registeredFaceDescriptorRef.current = recovered;
                console.log('[ProctoringEngine] ✅ Face embedding recovered from backend session.');

                // v3: Also recover all 5 individual embeddings if available
                if (embeddingRes.allEmbeddings && Array.isArray(embeddingRes.allEmbeddings)) {
                  registeredAllEmbeddingsRef.current = embeddingRes.allEmbeddings;
                  console.log(`[ProctoringEngine] ✅ All ${embeddingRes.allEmbeddings.length} reference embeddings recovered from backend.`);
                }
              } else {
                console.warn('[ProctoringEngine] No face embedding found in backend. Identity verification will be detection-only.');
              }
            } catch (fetchErr) {
              console.warn('[ProctoringEngine] Could not recover face embedding from backend:', fetchErr);
            }
          }
        }
      } catch (err) {
        console.error('Error starting proctoring session:', err);
        if (err.data && err.data.isLocked) {
          navigate('/locked-out', { replace: true, state: { reason: 'Assessment Locked due to multiple violations. A support ticket has been raised for IT Support.' } });
        }
      }
    };
    startProctoringSession();

    // Reset gaze calibration (no-op)
    resetGazeCalibration();

    // Start Webcam
    startCamera();

    // Audio Monitoring disabled per user requirements
    setIsMicActive(false);
    setIsAudioCalibrated(false);

    // Start Attention Check Scheduler
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

    // v3: Start batch verification cycle + quick check loop
    // Quick checks run every 2s for face presence monitoring
    scheduleNextFaceCheck(BATCH_INITIAL_DELAY_MS);
    // Batch verification runs every 10s for identity comparison
    batchIntervalRef.current = setInterval(() => {
      if (isActiveRef.current && !hasLockedOutRef.current) {
        runBatchVerification();
      }
    }, BATCH_INTERVAL_MS);
    // First batch after initial delay
    setTimeout(() => {
      if (isActiveRef.current && !hasLockedOutRef.current) {
        runBatchVerification();
      }
    }, BATCH_INITIAL_DELAY_MS);

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
      setIsMicActive(false);
      setIsAudioCalibrated(false);
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
      if (batchIntervalRef.current) clearInterval(batchIntervalRef.current);

      // Nuclear fix to ensure any running track is killed on unmount
      if (window.localStream) {
        window.localStream.getTracks().forEach(t => t.stop());
      }

      if (proctoringSessionIdRef.current) {
        proctoringApi.completeSession(proctoringSessionIdRef.current).catch(err => {
          console.error('[ProctoringEngine] Error auto-completing session on unmount:', err);
        });
        proctoringSessionIdRef.current = null;
      }
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
    stream: mediaStream || streamRef.current,

    // Face Verification
    verificationStatus,
    similarityScore,

    // Eye Gaze (NEW)
    gazeDirection,

    // Audio Monitor (NEW)
    isMicActive,
    isAudioCalibrated,

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
