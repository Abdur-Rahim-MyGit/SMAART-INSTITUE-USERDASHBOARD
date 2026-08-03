import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import { verifyFace, detectFaces, detectFacesFast, VerificationStatus, loadModels, isReady, resetGazeCalibration } from '@/services/faceVerificationService';
import { proctoringApi } from '@/services/proctoringApi';
import { startAudioMonitoring, stopAudioMonitoring } from '@/services/audioMonitorService';
import proctoringWorker from '@/workers/proctoringWorkerClient';
import { initGaze as initMediaPipeGaze, detectGaze as detectMediaPipeGaze, isGazeReady as isMediaPipeGazeReady } from '@/services/mediapipeGaze';
import { calculateGazeAndPose } from '@/services/gazeTrackingService';
import { evaluateLiveness } from '@/services/livenessService';
import { createLadder, COLOUR } from '@/services/proctoringLadder';
import { runEnvironmentChecks, watchForDuplicateWindows } from '@/services/environmentSignals';
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

const INACTIVITY_TIMEOUT = 30 * 1000; // 30 seconds before showing presence check
const FACE_CHECK_INTERVAL = 400; // 400ms (~2.5 FPS real-time responsiveness)
// Presence (SCRFD, cheap) runs every tick for real-time detection; the heavy
// 174 MB ArcFace identity verify runs only every Nth tick so it doesn't block
// the main thread every second (which stuttered the exam countdown).
const IDENTITY_EVERY_TICKS = 2; // ArcFace identity check ~every 2 s
const OBJECT_CHECK_INTERVAL = 3000; // YOLO object detection ~every 3 s

// Fallback only. The SERVER owns the real budget (config/proctoringPolicy.js)
// and tells us the tier on every event; this is used purely to render a
// sensible count if a response is ever missing.
const MAX_WARNINGS = 3;

// Liveness ping. Must stay well under the server's HEARTBEAT_GAP_MS (30s).
const HEARTBEAT_INTERVAL = 10 * 1000;

// Escalation thresholds and copy now live in the ladder module, which is pure
// and unit-tested. See services/proctoringLadder.js.

export const useProctoringEngine = ({
  resultId = null,
  assessmentId = null,
  isActive = false,
  registeredFaceDescriptor = null, // Median face embedding from ProctoringSetup
  registeredAllEmbeddings = null,  // All registered frame embeddings (best-match verify)
  onLockout = null // Custom submit callback
}) => {
  const [warningsCount, setWarningsCount] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lastViolationType, setLastViolationType] = useState('');
  const [proctoringSessionId, setProctoringSessionId] = useState(null);

  // ── Escalation ladder state ────────────────────────────────────────────
  // tier is authoritative from the server for warn/pause/held. 'nudge' is a
  // purely local, unrecorded coaching state that never reaches the backend.
  const [tier, setTier] = useState('ok');
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [pauseObservations, setPauseObservations] = useState([]);
  const nudgeRef = useRef('');
  const serverTierRef = useRef('ok');
  
  // Camera & Face State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraWarmingUp, setIsCameraWarmingUp] = useState(false);
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

  // Fullscreen State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(0);

  // Attention Check State
  const [showAttentionCheck, setShowAttentionCheck] = useState(false);
  const attentionTimerRef = useRef(null);

  // Inactivity Overlay State
  const [showInactivityOverlay, setShowInactivityOverlay] = useState(false);

  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const hasLockedOutRef = useRef(false);
  const warningsCountRef = useRef(0);
  const inactivityTimerRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const fullscreenTimerRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const verifyInFlightRef = useRef(false);
  const faceTickRef = useRef(0); // counts verification ticks to pace identity checks
  const objectIntervalRef = useRef(null);
  const objectInFlightRef = useRef(false);
  const environmentIntervalRef = useRef(null);
  const duplicateWindowCleanupRef = useRef(null);
  // Each environment signal is reported once per session — a second monitor
  // that stays plugged in is one fact, not one per minute.
  const environmentReportedRef = useRef(new Set());
  const proctoringSessionIdRef = useRef(null);
  const registeredFaceDescriptorRef = useRef(registeredFaceDescriptor);
  const registeredAllEmbeddingsRef = useRef(registeredAllEmbeddings);
  const workerRef = useRef(null);
  // Main-thread MediaPipe gaze. When active, it overrides the worker's SCRFD
  // gaze estimate (richer eye/head-pose). Falls back to worker gaze if it never
  // becomes ready.
  const gazeIntervalRef = useRef(null);
  const mpGazeActiveRef = useRef(false);

  // Stable ref to enterHeldState to break TDZ initialization loops
  const enterHeldRef = useRef(null);

  // Duration-aware escalation
  const ladderRef = useRef(createLadder());
  const activatedAtRef = useRef(0);

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive && !activatedAtRef.current) {
      activatedAtRef.current = Date.now();
    } else if (!isActive) {
      activatedAtRef.current = 0;
    }
  }, [isActive]);

  // Face verification runs on the MAIN THREAD (proven onnxPipeline path via
  // faceVerificationService), the SAME pipeline registration uses. Routing the
  // exam through the worker caused two failures: (1) the worker's SCRFD via
  // createImageBitmap was unreliable → "face not detected", and (2) the worker's
  // ArcFace embeddings didn't match the main-thread REGISTRATION embeddings →
  // false "face mismatch" for the genuine user. Keeping both on one pipeline
  // fixes both. The timer stays smooth because runFaceVerification runs cheap
  // SCRFD presence every tick and the heavy ArcFace identity only every Nth tick
  // (IDENTITY_EVERY_TICKS). `workerRef` stays null so runFaceVerification takes
  // the main-thread branch.
  useEffect(() => {
    workerRef.current = null;
    if (!isReady()) loadModels().catch(() => { });
  }, []);

  // Sync reference embeddings with the shared worker whenever they change.
  useEffect(() => {
    if (workerRef.current) {
      const embeddings = (registeredAllEmbeddings && registeredAllEmbeddings.length)
        ? registeredAllEmbeddings
        : (registeredFaceDescriptor ? [registeredFaceDescriptor] : []);
      proctoringWorker.setReference(embeddings);
    }
  }, [registeredFaceDescriptor, registeredAllEmbeddings]);

  // Initialize and stop camera stream
  const startCamera = async () => {
    if (streamRef.current) return;
    setIsCameraWarmingUp(true);
    try {
      console.log('[ProctoringEngine] Requesting media stream...');
      const constraints = {
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        audio: false // No audio processing needed to protect privacy
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Handle race condition: component might have unmounted or isActive became false while waiting for camera permission
      if (!isActiveRef.current || hasLockedOutRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      // If the candidate stops/unplugs the camera mid-exam, the video track
      // fires 'ended' — record it as a violation (device tampering).
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (isActiveRef.current && !hasLockedOutRef.current) {
            reportViolationRef.current?.('camera_disabled', 'Alert: Your camera was turned off or disconnected.');
          }
        };
      });

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
          video.play().catch(e => console.warn('Video play interrupted', e));
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
    } finally {
      setIsCameraWarmingUp(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      const srcStream = videoRef.current.srcObject;
      if (srcStream && srcStream.getTracks) {
        srcStream.getTracks().forEach(track => track.stop());
      }
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    
    // As a nuclear fallback, stop any lingering media streams requested by this window
    try {
        navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
            .then(stream => stream.getTracks().forEach(track => track.stop()))
            .catch(() => {});
    } catch(e) {}

    setIsCameraActive(false);
    setIsFaceDetected(false);
    setFaceCount(0);
    setVerificationStatus('no_face');
    setSimilarityScore(0);
  }, []);

  /**
   * Tier 4 — the attempt is held for review.
   *
   * The SERVER has already made this decision; we are only reacting to it. The
   * client no longer compares counts to a threshold and locks itself, which is
   * what previously made the whole system bypassable by blocking one request.
   *
   * There is no lockout: the answers are submitted and saved, and only the
   * score is withheld pending a human decision.
   */
  const enterHeldState = useCallback(async (decision = {}) => {
    if (hasLockedOutRef.current) return;
    hasLockedOutRef.current = true;
    setIsLockedOut(true);
    setIsWarningVisible(false);
    setTier('held');

    stopCamera();
    stopAudioMonitoring();

    let submission = null;
    try {
      // Submit the work. The candidate never loses answers because they were
      // held — the server decides only whether the SCORE is published.
      if (onLockout) {
        submission = await onLockout();
      }
    } catch (error) {
      console.error('[ProctoringEngine] Error submitting held attempt:', error);
    } finally {
      navigate('/assessment-held', {
        replace: true,
        state: {
          reference: submission?.reference || decision.ticketId || '',
          answersRecorded: submission?.answersRecorded,
          totalQuestions: submission?.totalQuestions
        }
      });
    }
  }, [navigate, onLockout, stopCamera]);

  // Sync ref
  enterHeldRef.current = enterHeldState;

  /**
   * Tier 1 — a nudge.
   *
   * Purely local coaching. Nothing is sent to the server, nothing is counted,
   * and it clears itself the moment the condition resolves. This is where most
   * anomalies should die.
   */
  const setNudge = useCallback((copy) => {
    if (hasLockedOutRef.current) return;
    // Coaching still applies after a warning has been recorded — it is only
    // suppressed once the exam is blocked or held, where a different surface
    // is already speaking to the candidate.
    if (serverTierRef.current === 'pause' || serverTierRef.current === 'held') return;

    if (!copy || nudgeRef.current === copy) return;
    nudgeRef.current = copy;
    setNudgeMessage(copy);

    // Only promote the tier when nothing has been recorded yet. Otherwise keep
    // the server's tier (so the warning count keeps its styling) and just
    // update the coaching text.
    if (serverTierRef.current === 'ok') setTier(copy ? 'nudge' : 'ok');
  }, []);

  const clearNudge = useCallback(() => {
    if (!nudgeRef.current) return;
    nudgeRef.current = '';
    setNudgeMessage('');
    if (serverTierRef.current === 'ok') setTier('ok');
  }, []);

  /**
   * Feed one observation of a condition into the duration ladder.
   *
   * Green below the first threshold, amber (local coaching, nothing recorded)
   * in the middle, red once a stage carries a server event. Each stage fires at
   * most once per continuous episode, so a single long absence produces one
   * escalating sequence rather than a warning every few seconds.
   */
  const observeCondition = useCallback((type) => {
    const { colour, message, fire } = ladderRef.current.observe(type, Date.now());

    if (fire) {
      nudgeRef.current = '';
      setNudgeMessage('');
      reportViolationRef.current?.(fire, message);
      return;
    }

    if (colour === COLOUR.AMBER) {
      setNudgeRef.current?.(message);
    }
  }, []);

  /** The condition cleared — end its episode so it can escalate afresh later. */
  const clearCondition = useCallback((...types) => {
    types.forEach((t) => ladderRef.current.clear(t));
    if (ladderRef.current.active().length === 0) clearNudgeRef.current?.();
  }, []);

  /**
   * Apply the server's decision. The browser renders a tier; it never derives
   * one. This is the whole point of the redesign — a candidate who tampers
   * with the client can no longer talk their way out of being held.
   */
  const applyDecision = useCallback((decision) => {
    if (!decision) return;

    serverTierRef.current = decision.tier || 'ok';
    setWarningsCount(decision.warnings ?? 0);
    warningsCountRef.current = decision.warnings ?? 0;

    if (decision.held || decision.tier === 'held') {
      setTier('held');
      if (enterHeldRef.current) enterHeldRef.current(decision);
      return;
    }

    // A pending nudge is superseded by anything the server has recorded.
    if (decision.tier !== 'ok') {
      nudgeRef.current = '';
      setNudgeMessage('');
    }
    setTier(decision.tier || 'ok');
    setIsWarningVisible(decision.tier === 'warn' || decision.tier === 'pause');
  }, []);

  // Tier 2+ — record a violation with the server and obey what it returns.
  const reportViolation = useCallback(async (eventType, displayMessage) => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    // The nudge has escalated; stop showing the gentle version.
    nudgeRef.current = '';
    setNudgeMessage('');

    try {
      setLastViolationType(eventType);
      setPauseObservations((prev) => (prev.includes(eventType) ? prev : [...prev, eventType]));

      let severity = 'low';
      if (eventType === 'attention_check_fail' || eventType === 'fullscreen_exit') {
        severity = 'medium';
      } else if (eventType === 'multiple_faces' || eventType === 'face_mismatch') {
        severity = 'high';
      } else if (eventType === 'face_absent' || eventType === 'face_covered') {
        severity = 'medium';
      }

      // Loud, greppable line so you can see exactly which RED violation fired
      // and what triggered it. Search the console for "[PROCTOR VIOLATION]".
      console.warn(
        `%c[PROCTOR VIOLATION]%c type=${eventType} | severity=${severity} | "${displayMessage || ''}"`,
        'background:#b91c1c;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold',
        'color:#b91c1c;font-weight:bold'
      );

      // Upload evidence and keep only the opaque id. The server resolves it to
      // a URL after proving it belongs to this session — the client can no
      // longer dictate what gets stored as evidence.
      let snapshotId = '';
      if (videoRef.current && proctoringSessionIdRef.current) {
        try {
          const blob = await captureScreenshot(videoRef.current);
          if (blob) {
            const uploadRes = await proctoringApi.uploadSnapshot(proctoringSessionIdRef.current, blob);
            if (uploadRes && uploadRes.success) {
              snapshotId = uploadRes.snapshotId || '';
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
          snapshotId
        });

        if (response && response.success) {
          applyDecision(response.proctoring);
        }
      }
    } catch (error) {
      // The server is the authority, so a failed report is NOT treated as a
      // local violation any more. If the client genuinely can't reach the
      // backend, the heartbeat gap records that server-side — which the
      // candidate cannot suppress.
      console.error('Error reporting activity violation:', error);
      if (error?.data?.proctoring) {
        applyDecision(error.data.proctoring);
      }
    }
  }, [applyDecision]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    // Dismiss the overlay if the candidate is active again
    setShowInactivityOverlay(false);

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      if (!isActiveRef.current || hasLockedOutRef.current) return;
      console.warn('Inactivity timeout reached — showing presence check.');
      setShowInactivityOverlay(true);
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Candidate dismissed the inactivity overlay — they're still here
  const dismissInactivityOverlay = useCallback(() => {
    setShowInactivityOverlay(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Candidate failed to respond to the inactivity overlay in time
  const failInactivityCheck = useCallback(() => {
    setShowInactivityOverlay(false);
    reportViolation('inactivity', "You appear inactive. Move your mouse or click 'Continue Assessment' to resume.");
    resetInactivityTimer();
  }, [reportViolation, resetInactivityTimer]);

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

    // Drop the tick if the previous inference is still running. On a slow
    // device a fixed 1s interval would otherwise queue overlapping passes and
    // the whole exam UI would get progressively more sluggish.
    if (verifyInFlightRef.current) return;

    // INFRA GUARD: if non-worker main thread models are used and not ready, return early.
    if (!workerRef.current && !isReady()) {
      setVerificationStatus('model_unavailable');
      setIsFaceDetected(false);
      clearCondition('face_absent', 'multiple_faces', 'face_mismatch', 'face_covered');
      loadModels().catch(() => { }); // background recovery attempt
      return;
    }
    verifyInFlightRef.current = true;

    // Safety timeout to ensure verifyInFlightRef is never locked up permanently
    setTimeout(() => {
      verifyInFlightRef.current = false;
    }, 2500);

    const descriptor = registeredFaceDescriptorRef.current;

    try {
      if (workerRef.current) {
        // Pass the video element; the client captures the frame via a
        // main-thread canvas (clean sRGB pixels) and transfers it to the worker.
        workerRef.current.processFrame(videoRef.current);
        return;
      }

      // Fallback if worker creation failed
      if (descriptor) {
        const runIdentity = (faceTickRef.current % IDENTITY_EVERY_TICKS) === 0;
        faceTickRef.current++;

        if (!runIdentity) {
          // Light presence-only tick (SCRFD, fast). Keeps detection real-time
          // without running the heavy 174 MB model every second. The last
          // identity verdict is RETAINED when one face is present — so a
          // different person stays "mismatch" and never flips to "verified".
          const quick = await detectFacesFast(videoRef.current);
          if (!quick.error) {
            setFaceCount(quick.faceCount);
            if (quick.gaze?.gazeDirection) {
              setGazeDirection(quick.gaze.gazeDirection);
            }
            if (quick.faceCount === 0) {
              setVerificationStatus('no_face');
              setIsFaceDetected(false);
              clearCondition('multiple_faces', 'face_mismatch', 'face_covered');
              observeCondition('face_absent');
            } else if (quick.faceCount > 1) {
              setVerificationStatus('multiple_faces');
              setIsFaceDetected(false);
              clearCondition('face_absent', 'face_mismatch', 'face_covered');
              observeCondition('multiple_faces');
            } else {
              // Exactly one face present — restore active verification status immediately
              setIsFaceDetected(true);
              setVerificationStatus('verified');
              clearCondition('face_absent', 'multiple_faces', 'face_mismatch');
            }
          }
          return; // finally{} resets verifyInFlightRef
        }

        // Best-match against ALL registered frame embeddings when available
        // (absorbs pose/lighting drift → far fewer false "mismatch" for the
        // genuine candidate); fall back to the single median descriptor.
        const reference = (registeredAllEmbeddingsRef.current && registeredAllEmbeddingsRef.current.length)
          ? registeredAllEmbeddingsRef.current
          : descriptor;
        const result = await verifyFace(videoRef.current, reference);

        if (result.error) {
          console.warn('[ProctoringEngine] Face verification error:', result.error);
          return;
        }

        setVerificationStatus(result.status);
        setSimilarityScore(result.similarity || 0);
        setFaceCount(result.faceCount);
        setIsFaceDetected(result.status === VerificationStatus.VERIFIED);

        // Handle each verification status through the duration ladder:
        // green below the first threshold, amber coaching in the middle (never
        // recorded), red once a stage carries a server event. One continuous
        // episode escalates once rather than re-firing on a loop.
        switch (result.status) {
          case VerificationStatus.VERIFIED:
            clearCondition('face_absent', 'multiple_faces', 'face_mismatch', 'face_covered');

            // ── Gaze analysis (piggy-backed from verifyFace) ──────────────
            if (result.gaze) {
              const { gazeDirection: dir, eyesOpen } = result.gaze;
              setGazeDirection(dir);

              if (!eyesOpen) {
                clearCondition('gaze_away');
                observeCondition('eyes_closed');
              } else if (dir !== 'center') {
                clearCondition('eyes_closed');
                observeCondition('gaze_away');
              } else {
                clearCondition('gaze_away', 'eyes_closed');
              }
            }

            // ── Head pose ────────────────────────────────────────────────
            // Sustained downward tilt is the best available proxy for reading
            // a phone in the lap. It is inference, never proof — which is why
            // it only feeds a flag and needs a long window to fire.
            if (result.headPose?.calibrated) {
              if (result.headPose.pose === 'down') {
                observeCondition('looking_down');
              } else {
                clearCondition('looking_down');
              }
            }
            break;

          case VerificationStatus.NO_FACE:
            clearCondition('multiple_faces', 'face_mismatch', 'face_covered');
            observeCondition('face_absent');
            break;

          case VerificationStatus.MULTIPLE_FACES:
            clearCondition('face_absent', 'face_mismatch', 'face_covered');
            observeCondition('multiple_faces');
            break;

          case VerificationStatus.MISMATCH:
            clearCondition('face_absent', 'multiple_faces', 'face_covered');
            observeCondition('face_mismatch');
            break;

          case VerificationStatus.COVERED:
            clearCondition('face_absent', 'multiple_faces', 'face_mismatch');
            observeCondition('face_covered');
            break;

          default:
            break;
        }
      } else {
        // No registered descriptor — fallback to basic detection (legacy
        // behavior). Presence-only: this branch reads nothing but faceCount,
        // so there is no reason to run the recognition net every second.
        const result = await detectFacesFast(videoRef.current);

        if (result.error) {
          console.warn('[ProctoringEngine] Face detection error:', result.error);
          return;
        }

        setFaceCount(result.faceCount);
        if (result.gaze?.gazeDirection) {
          setGazeDirection(result.gaze.gazeDirection);
        }
        setIsFaceDetected(result.isFacePresent);
        setVerificationStatus(result.isFacePresent ? 'verified' : 'no_face');

        // Same ladder as the verified path — one escalating episode per
        // condition rather than a repeating counter.
        if (result.faceCount === 0) {
          observeCondition('face_absent');
        } else {
          clearCondition('face_absent');
        }

        if (result.faceCount > 1) {
          observeCondition('multiple_faces');
        } else {
          clearCondition('multiple_faces');
        }
      }
    } catch (err) {
      console.error('[ProctoringEngine] Face verification tick failed:', err);
    } finally {
      verifyInFlightRef.current = false;
    }
  };

  // NOTE: Object detection (phone/book/laptop) now runs INSIDE the shared AI
  // worker as part of each PROCESS_FRAME tick (~3 s YOLO cadence). Its results
  // arrive on TICK_RESULT.objects and are mapped to the ladder in the worker
  // result handler above. No separate main-thread object loop is needed.

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
      // 8-second initialization grace window upon test load to prevent false warnings on mount
      if (activatedAtRef.current && (Date.now() - activatedAtRef.current < 8000)) {
        return;
      }
      
      // Trigger grace period timer
      setFullscreenCountdown(15);
      
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (environmentIntervalRef.current) clearInterval(environmentIntervalRef.current);
      if (duplicateWindowCleanupRef.current) { duplicateWindowCleanupRef.current(); duplicateWindowCleanupRef.current = null; }
      
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
    // Leaving Tier 3 unblocks the exam and restarts the clock. The warnings
    // already recorded stand — this only dismisses the blocking card.
    setTier((current) => (current === 'pause' ? 'warn' : current));
    serverTierRef.current = serverTierRef.current === 'pause' ? 'warn' : serverTierRef.current;
    setPauseObservations([]);
  }, []);

  // Stable refs for event handlers so the main effect doesn't re-fire
  const handleVisibilityChangeRef = useRef(handleVisibilityChange);
  const handleBlurRef = useRef(handleBlur);
  const handleFullscreenChangeRef = useRef(handleFullscreenChange);
  const resetInactivityTimerRef = useRef(resetInactivityTimer);
  const reportViolationRef = useRef(reportViolation);
  const scheduleAttentionCheckRef = useRef(scheduleAttentionCheck);
  const setNudgeRef = useRef(setNudge);
  const clearNudgeRef = useRef(clearNudge);
  const applyDecisionRef = useRef(applyDecision);

  useEffect(() => { handleVisibilityChangeRef.current = handleVisibilityChange; }, [handleVisibilityChange]);
  useEffect(() => { handleBlurRef.current = handleBlur; }, [handleBlur]);
  useEffect(() => { handleFullscreenChangeRef.current = handleFullscreenChange; }, [handleFullscreenChange]);
  useEffect(() => { resetInactivityTimerRef.current = resetInactivityTimer; }, [resetInactivityTimer]);
  useEffect(() => { reportViolationRef.current = reportViolation; }, [reportViolation]);
  useEffect(() => { scheduleAttentionCheckRef.current = scheduleAttentionCheck; }, [scheduleAttentionCheck]);
  useEffect(() => { setNudgeRef.current = setNudge; }, [setNudge]);
  useEffect(() => { clearNudgeRef.current = clearNudge; }, [clearNudge]);
  useEffect(() => { applyDecisionRef.current = applyDecision; }, [applyDecision]);

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
      stopAudioMonitoring();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceIntervalRef.current)    clearInterval(faceIntervalRef.current);
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (environmentIntervalRef.current) clearInterval(environmentIntervalRef.current);
      if (duplicateWindowCleanupRef.current) { duplicateWindowCleanupRef.current(); duplicateWindowCleanupRef.current = null; }
      if (attentionTimerRef.current)  clearTimeout(attentionTimerRef.current);
      return;
    }

    const startProctoringSession = async () => {
      try {
        // Report the REAL camera permission rather than a hardcoded true, which
        // made the admin dashboard's camera column carry no information.
        let cameraGranted = false;
        try {
          const status = await navigator.permissions?.query({ name: 'camera' });
          cameraGranted = status ? status.state === 'granted' : !!streamRef.current;
        } catch {
          cameraGranted = !!streamRef.current;
        }

        const response = await proctoringApi.startSession({
          resultId,
          assessmentId,
          environmentCheck: {
            fullScreenGranted: !!(document.fullscreenElement || document.webkitFullscreenElement),
            cameraGranted,
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

          // Log face registration and hand the reference embedding to the
          // server, so identity is provable off the client rather than being
          // asserted by it. Float32Array does not survive JSON — convert.
          if (registeredFaceDescriptorRef.current) {
            proctoringApi.logEvent(sessionId, {
              eventType: 'face_registered',
              severity: 'info',
              details: 'Face identity registered during setup',
              descriptor: Array.from(registeredFaceDescriptorRef.current)
            }).catch(err => console.warn('[ProctoringEngine] Failed to log face_registered event:', err));
          }

          // ── Environment integrity ──────────────────────────────────────
          // A second monitor or a virtual camera is worth far more than most
          // face signals: there is no innocent reason to pipe OBS into a
          // proctored exam. Re-checked periodically because a monitor can be
          // plugged in after the exam starts.
          const reportEnvironment = async () => {
            try {
              const findings = await runEnvironmentChecks(streamRef.current);
              findings.forEach((f) => {
                if (!environmentReportedRef.current.has(f.eventType)) {
                  environmentReportedRef.current.add(f.eventType);
                  reportViolationRef.current?.(f.eventType, f.details);
                }
              });
            } catch (err) {
              console.warn('[ProctoringEngine] Environment check failed:', err);
            }
          };
          reportEnvironment();
          environmentIntervalRef.current = setInterval(reportEnvironment, 60 * 1000);

          // Same attempt open in two windows splits the proctoring signal and
          // lets one window hold the questions while the other is worked on.
          duplicateWindowCleanupRef.current = watchForDuplicateWindows(resultId, () => {
            if (!environmentReportedRef.current.has('multiple_exam_windows')) {
              environmentReportedRef.current.add('multiple_exam_windows');
              reportViolationRef.current?.(
                'multiple_exam_windows',
                'This assessment is open in more than one window.'
              );
            }
          });

          // ── Liveness ping ──────────────────────────────────────────────
          // Closes the "block the endpoint and stay clean" hole: the server
          // measures the gap between pings and records a violation when
          // contact lapses. The signal is the MISSING request, so a candidate
          // cannot suppress it.
          if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (environmentIntervalRef.current) clearInterval(environmentIntervalRef.current);
      if (duplicateWindowCleanupRef.current) { duplicateWindowCleanupRef.current(); duplicateWindowCleanupRef.current = null; }
          heartbeatIntervalRef.current = setInterval(() => {
            if (!isActiveRef.current || hasLockedOutRef.current) return;
            proctoringApi
              .heartbeat(sessionId)
              .then((res) => {
                if (res?.proctoring) applyDecisionRef.current?.(res.proctoring);
              })
              .catch((err) => {
                if (err?.data?.proctoring) applyDecisionRef.current?.(err.data.proctoring);
              });
          }, HEARTBEAT_INTERVAL);
        }
      } catch (err) {
        console.error('Error starting proctoring session:', err);
        if (err.data && err.data.isLocked) {
          navigate('/assessment-held', {
            replace: true,
            state: { reference: err.data.activeTicketId || '' }
          });
        }
      }
    };
    startProctoringSession();

    // Reset eye-gaze calibration for fresh session
    resetGazeCalibration();

    // Start Webcam
    startCamera();

    // Start Audio Monitoring (non-fatal if mic denied)
    startAudioMonitoring({
      onVoiceDetected: () => {
        if (isActiveRef.current && !hasLockedOutRef.current) {
          reportViolationRef.current?.('voice_detected', 'Warning: Sustained speech detected during the exam. Talking is not permitted.');
        }
      },
      onProlongedSilence: () => {
        if (isActiveRef.current && !hasLockedOutRef.current) {
          reportViolationRef.current?.('prolonged_silence', 'Alert: No activity detected for over 4 minutes. Please confirm you are present.');
        }
      },
      onCalibrated: () => {
        setIsAudioCalibrated(true);
        console.log('[ProctoringEngine] Audio noise floor calibrated.');
      },
    }).then((started) => {
      setIsMicActive(started);
      if (!started) {
        console.warn('[ProctoringEngine] Microphone not available — audio monitoring disabled.');
        if (isActiveRef.current && !hasLockedOutRef.current) {
          reportViolationRef.current?.('microphone_disabled', 'Alert: Your microphone is disabled or was denied. Audio monitoring is required.');
        }
      }
    });

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

    // Face Verification Interval. Each tick sends one frame to the shared
    // worker, which runs SCRFD (presence), ArcFace (identity ~every 12 s / on
    // state change) and YOLO (objects ~every 3 s) — all off the main thread.
    faceIntervalRef.current = setInterval(runFaceVerification, FACE_CHECK_INTERVAL);

    // MediaPipe Face Mesh gaze runs on the MAIN THREAD (it can't run in a module
    // worker). Lazy-load it, then poll gaze on a light cadence; it overrides the
    // worker's SCRFD gaze once ready. Non-blocking — failure keeps SCRFD gaze.
    initMediaPipeGaze().catch(() => { });
    gazeIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !isActiveRef.current || hasLockedOutRef.current) return;
      if (!isMediaPipeGazeReady()) return;
      const g = detectMediaPipeGaze(videoRef.current);
      if (g?.gazeDirection) {
        mpGazeActiveRef.current = true;
        setGazeDirection(g.gazeDirection);
      }
    }, 300);

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
      stopAudioMonitoring();
      if (objectIntervalRef.current) clearInterval(objectIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, onActivity);
      });

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (gazeIntervalRef.current) { clearInterval(gazeIntervalRef.current); gazeIntervalRef.current = null; }
      mpGazeActiveRef.current = false;
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (environmentIntervalRef.current) clearInterval(environmentIntervalRef.current);
      if (duplicateWindowCleanupRef.current) { duplicateWindowCleanupRef.current(); duplicateWindowCleanupRef.current = null; }
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
      
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

    // ── Escalation ladder ────────────────────────────────────────────────
    // 'ok' | 'nudge' | 'warn' | 'pause' | 'held'
    tier,
    nudgeMessage,
    pauseObservations,
    // Tier 3 blocks the exam AND stops the clock. Callers should freeze their
    // timer whenever this is true — it's what makes the pause feel like
    // process rather than punishment.
    isPaused: tier === 'pause',
    resumeFromPause: acknowledgeWarning,


    // Webcam & Face tracking
    isCameraActive,
    isCameraWarmingUp,
    isFaceDetected,
    faceCount,
    cameraError,
    videoElement: videoRef.current,
    stream: streamRef.current,

    // Face Verification
    verificationStatus,
    similarityScore,

    // Eye Gaze (NEW)
    gazeDirection,

    // Audio Monitor (NEW)
    isMicActive,
    isAudioCalibrated,
    
    // Fullscreen status
    isFullScreen,
    fullscreenCountdown,
    requestFullscreen,

    // Attention check
    showAttentionCheck,
    passAttentionCheck,
    failAttentionCheck,
    proctoringSessionId,

    // Inactivity presence check
    showInactivityOverlay,
    dismissInactivityOverlay,
    failInactivityCheck
  };
};

export default useProctoringEngine;
