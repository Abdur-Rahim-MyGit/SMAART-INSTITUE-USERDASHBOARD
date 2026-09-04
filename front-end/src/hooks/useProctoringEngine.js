import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '@/services/api';
import { verifyFace, detectFaces, detectFacesFast, VerificationStatus, loadModels, isReady, resetGazeCalibration, detectObjects, isObjectDetectorReady, getLastObjectNearMisses } from '@/services/faceVerificationService';
import { proctoringApi } from '@/services/proctoringApi';
import { startAudioMonitoring, stopAudioMonitoring, getLastGates } from '@/services/audioMonitorService';
import { getPipelineStatus } from '@/services/onnxPipeline';
import proctoringWorker from '@/workers/proctoringWorkerClient';
import { initGaze as initMediaPipeGaze, detectGaze as detectMediaPipeGaze, isGazeReady as isMediaPipeGazeReady } from '@/services/mediapipeGaze';
import { calculateGazeAndPose } from '@/services/gazeTrackingService';
// NOTE: livenessService.evaluateLiveness is deliberately NOT wired. It was
// imported here but never called, which read as spoof protection that does not
// exist. Presentation-attack detection is still an open gap — see the audit.
import { createLadder, COLOUR } from '@/services/proctoringLadder';
import { runEnvironmentChecks, watchForDuplicateWindows } from '@/services/environmentSignals';
import { toast } from 'sonner';

/**
 * Every camera stream this engine has opened.
 *
 * There is no browser API to enumerate streams another piece of code is
 * holding, so the only way to guarantee a release is to remember what we
 * acquired. `stopCamera` previously tried to cover that gap by calling
 * getUserMedia again -- which opened a NEW stream in order to close it, and so
 * turned the camera light back on at the exact moment the candidate left the
 * exam. Tracks remove themselves here when they end.
 */
const acquiredStreams = new Set();

const trackStream = (stream) => {
  if (!stream) return stream;
  acquiredStreams.add(stream);
  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      if (stream.getTracks().every((t) => t.readyState === 'ended')) {
        acquiredStreams.delete(stream);
      }
    });
  });
  return stream;
};

/**
 * Weak-but-real indicators that the exam is running inside a VM or over a
 * remote desktop session.
 *
 * None of these is conclusive on its own -- a low-end laptop can look like a
 * VM -- which is why the event is weighted at 25 rather than treated as proof.
 * Two or more agreeing signals is the bar for reporting.
 */
const detectRemoteOrVirtualDisplay = () => {
  const reasons = [];

  try {
    // Remote desktop sessions commonly negotiate down to 16-bit colour.
    if (typeof screen !== 'undefined' && screen.colorDepth && screen.colorDepth < 24) {
      reasons.push(`colour depth ${screen.colorDepth}-bit`);
    }

    // Software rasterisers and hypervisor display adapters name themselves.
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '') : '';
      const flagged = ['vmware', 'virtualbox', 'parallels', 'llvmpipe', 'swiftshader', 'basic render', 'microsoft basic'];
      if (renderer && flagged.some((name) => renderer.toLowerCase().includes(name))) {
        reasons.push(`display adapter "${renderer}"`);
      }
    } else {
      reasons.push('no hardware WebGL');
    }

    // A single logical core is vanishingly rare on real 2020s hardware.
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1) {
      reasons.push(`${navigator.hardwareConcurrency} CPU core`);
    }
  } catch (err) {
    console.warn('[ProctoringEngine] Remote/VM probe failed:', err);
  }

  // One signal is noise; two agreeing signals is worth recording.
  return reasons.length >= 2 ? reasons.join(', ') : null;
};

/** Stop every stream this engine opened. Never re-acquires. */
const releaseAllStreams = () => {
  acquiredStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.warn('[ProctoringEngine] Failed to stop a track:', err);
    }
  });
  acquiredStreams.clear();
};

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
// Consecutive disagreeing ArcFace frames before identity is called a mismatch.
// Absorbs a single bad frame (blink / head turn / motion blur) without giving a
// real impostor room: at ~800 ms per identity tick this costs under a second
// against the mismatch ladder's 15 s red stage.
const IDENTITY_MISMATCH_STREAK = 3;
// YOLO object detection cadence.
//
// This was 3 s, which is LONGER than the ladder's grace period for a condition
// that has blinked. A single tick where the phone was turned edge-on or moved
// out of crop therefore ended the episode, and the phone ladder (red at 4 s)
// needs consecutive detections to get there — so a phone held in plain view
// could be missed indefinitely. At 1.5 s two ticks fit inside the grace window,
// so brief occlusions no longer reset the timer.
const OBJECT_CHECK_INTERVAL = 1000;

// ── Liveness (presentation-attack detection) ────────────────────────────────
// There is no anti-spoof model in the bundle — the shipped MN3-AntiSpoof file
// is invalid — so liveness is derived from motion instead, using the Face Mesh
// signals already computed for gaze.
//
// The premise is simple and hard to defeat with a still image: over three
// quarters of a minute a living person ALWAYS blinks, and their head always
// drifts by at least a couple of degrees. A photo held up to the lens produces
// landmark output that is not merely stable but numerically identical frame to
// frame — every range below collapses to zero at once.
//
// All four signals must be flat together before anything is reported. Postural
// sway alone is normally several degrees and MediaPipe's own estimation noise
// is around one, so a genuine candidate clears these bars without trying; the
// thresholds exist only to leave room for that noise.
const LIVENESS_SAMPLE_INTERVAL_MS = 200;   // Also the gaze/attention cadence
const LIVENESS_WINDOW_MS = 45 * 1000;      // Evidence window before judging
const LIVENESS_MIN_POSE_RANGE_DEG = 1.5;   // Degrees of yaw/pitch travel
const LIVENESS_MIN_EAR_RANGE = 0.03;       // Eye-aperture travel

/**
 * Detected COCO labels that map to a proctoring condition.
 *
 * `laptop` used to be detected and then thrown away, on the reasoning that a
 * candidate at a desk often has a second machine legitimately in shot. That is
 * true, and it is also exactly how a second screen gets used to look something
 * up. It is now reported — with the longest window and the lowest weight of the
 * three, so an idle machine on the desk costs far less than a phone in hand.
 */
const OBJECT_CONDITIONS = {
  phone: 'phone_detected',
  book: 'book_detected',
  laptop: 'laptop_detected',
};
// An object has to be seen on OBJECT_CONFIRM_TICKS of the last
// OBJECT_CONFIRM_WINDOW ticks before its condition opens, and be absent for a
// whole window before it clears. One tick is a single frame: a book turned
// edge-on or a hand passing the lens can read as a phone for one frame, and
// the detector's alternating zoom passes can miss a real phone on the off tick.
const OBJECT_CONFIRM_TICKS = 2;
const OBJECT_CONFIRM_WINDOW = 3;

// Fallback only. The SERVER owns the real budget (config/proctoringPolicy.js)
// and tells us the tier on every event; this is used purely to render a
// sensible count if a response is ever missing.
const MAX_WARNINGS = 3;

// Liveness ping. Must stay well under the server's HEARTBEAT_GAP_MS (30s).
const HEARTBEAT_INTERVAL = 10 * 1000;

/**
 * Window and focus events are raw browser signals, not judged episodes.
 *
 * Camera conditions go through the ladder, which reports a condition at most
 * once per continuous episode. tab_switch / minimize / fullscreen_exit call
 * reportViolation directly, so nothing stopped a single alt-tab -- or the
 * warning card itself taking focus -- from recording several violations in a
 * row. One physical action should cost one warning.
 */
const WINDOW_EVENT_COOLDOWN_MS = 10 * 1000;

// How long the window must stay unfocused before it counts as leaving the exam.
// Long enough to ride out a notification or a stray click on browser chrome,
// short enough that actually switching away is still caught.
const WINDOW_BLUR_GRACE_MS = 2500;

/**
 * Minimum gap between two recorded violations OF THE SAME TYPE.
 *
 * Every type has one. Camera conditions get a long gap because they are judged
 * over a duration already: if someone genuinely has a second person in the room
 * for two minutes, that is one situation to warn about, not ten. Deliberate
 * actions (leaving the window, copying) get a shorter gap because repeating
 * them is a repeated choice.
 */
const DEFAULT_EVENT_COOLDOWN_MS = 45 * 1000;

/**
 * Events whose cooldown restarts when the candidate dismisses a warning card.
 *
 * Closing the card moves focus back to the exam, and that movement must not be
 * read as the candidate leaving it again. Only focus-related events need this;
 * a camera condition is unaffected by where the pointer went.
 */
const FOCUS_SENSITIVE_EVENTS = ['tab_switch', 'minimize', 'fullscreen_exit', 'inactivity'];
const EVENT_COOLDOWN_MS = {
  // Deliberate, repeatable actions.
  tab_switch: WINDOW_EVENT_COOLDOWN_MS,
  minimize: WINDOW_EVENT_COOLDOWN_MS,
  fullscreen_exit: WINDOW_EVENT_COOLDOWN_MS,
  inactivity: WINDOW_EVENT_COOLDOWN_MS,
  copy_detected: WINDOW_EVENT_COOLDOWN_MS,
  paste_detected: WINDOW_EVENT_COOLDOWN_MS,
  restricted_shortcut: WINDOW_EVENT_COOLDOWN_MS,
  context_menu: WINDOW_EVENT_COOLDOWN_MS,

  // Continuous conditions — one warning per situation, not per detection.
  multiple_faces: 90 * 1000,
  face_mismatch: 90 * 1000,
  face_absent: 60 * 1000,
  face_covered: 60 * 1000,
  gaze_away: 60 * 1000,
  eyes_closed: 60 * 1000,
  looking_down: 60 * 1000,
  voice_detected: 60 * 1000,
  multiple_voices: 120 * 1000,
  phone_detected: 30 * 1000,
  book_detected: 30 * 1000,
  laptop_detected: 60 * 1000,
};

/**
 * Keyboard shortcuts blocked during an assessment.
 *
 * Print and Save are how a paper leaves the room as a file; the devtools
 * shortcuts are how the DOM (and therefore the question text) is read straight
 * out of the page.
 */
const isRestrictedShortcut = (e) => {
  const key = (e.key || '').toLowerCase();
  if (e.key === 'F12') return 'Developer tools';
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key)) return 'Developer tools';
  if ((e.ctrlKey || e.metaKey) && key === 'p') return 'Print';
  if ((e.ctrlKey || e.metaKey) && key === 's') return 'Save page';
  if ((e.ctrlKey || e.metaKey) && key === 'u') return 'View source';
  return null;
};

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
  // The SERVER owns the warning budget and sends it with every decision. Until
  // the first decision arrives we render the local fallback, but we must never
  // keep showing it afterwards — the UI was telling candidates "1 of 3" while
  // the real budget was 10, which makes an early warning look far more serious
  // than it is.
  const [maxWarnings, setMaxWarnings] = useState(MAX_WARNINGS);
  // Has the attempt already crossed the line that holds it for review? The
  // warning count does NOT answer this — the risk score decides, and it gets
  // there first.
  const [riskFlagged, setRiskFlagged] = useState(false);

  /**
   * Live diagnostics, surfaced in the proctoring panel.
   *
   * Every failure on this system so far has been invisible on screen and
   * obvious in one console line — a detector that silently failed to load, a
   * gate that could never open, a reference that never arrived. Asking someone
   * mid-test to open devtools and read a log is not a workable way to find
   * those. The panel shows the same facts where the person testing is already
   * looking.
   */
  const [diagnostics, setDiagnostics] = useState({
    models: null,
    audio: null,
    objects: '',
    objectsAt: 0,
    sessionId: null,
    sessionError: null,
  });
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  // Read inside reportViolation, which is a stable callback.
  const isWarningVisibleRef = useRef(false);
  // eventType -> timestamp of the last report, for the cooldown above.
  const lastReportAtRef = useRef({});
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
  // Mirror of faceCount readable from interval callbacks (the gaze loop runs on
  // its own cadence and must not evaluate attention while nobody — or more than
  // one person — is in frame).
  const faceCountRef = useRef(0);
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
  const cameraRetryTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const verifyInFlightRef = useRef(false);
  const faceTickRef = useRef(0); // counts verification ticks to pace identity checks
  // Last verdict ArcFace actually produced. Presence-only ticks replay this
  // rather than inventing one, so identity can never be upgraded by a model
  // that does not do identity.
  const lastIdentityVerdictRef = useRef(null);
  // Highest warning count the candidate has already acknowledged.
  const lastAcknowledgedWarningsRef = useRef(0);
  // Fires once per session if the exam runs with no registered face at all.
  const unregisteredReportedRef = useRef(false);
  // Rolling liveness evidence window, and a one-shot latch so a spoof is
  // reported once rather than every window that follows it.
  const livenessRef = useRef(null);
  const spoofReportedRef = useRef(false);
  // Recent detection history per object label (see OBJECT_CONFIRM_TICKS).
  const objectSeenTicksRef = useRef({});
  // A detection pass can outlast the 1 s tick on a slow machine; never stack.
  const objectPassInFlightRef = useRef(false);
  // Consecutive ArcFace frames that disagreed with the registered face. One
  // bad frame is a blink or a turn; several in a row is a different person.
  const mismatchStreakRef = useRef(0);

  const environmentIntervalRef = useRef(null);
  const duplicateWindowCleanupRef = useRef(null);
  // Pending focus-loss report, cancelled if focus comes back in time.
  const blurTimerRef = useRef(null);
  // Each environment signal is reported once per session — a second monitor
  // that stays plugged in is one fact, not one per minute.
  const environmentReportedRef = useRef(new Set());
  const proctoringSessionIdRef = useRef(null);
  // NOTE: useRef only uses its argument on the FIRST render. This hook is called
  // from the assessment player on every render, including the ones before setup
  // has finished — when the descriptor is still null. So these refs latched null
  // at mount and never picked the reference up afterwards, no matter how well
  // registration went. The verification tick reads the refs, found nothing, and
  // took the no-reference path for the whole exam.
  //
  // That is the deeper cause of the original complaint. Before this file failed
  // closed, the no-reference path reported 'verified' for any face present — so
  // ANY person sitting down passed, and the recognition model was never
  // consulted once. The effect below is what actually connects registration to
  // verification.
  const registeredFaceDescriptorRef = useRef(registeredFaceDescriptor);
  const registeredAllEmbeddingsRef = useRef(registeredAllEmbeddings);

  useEffect(() => {
    registeredFaceDescriptorRef.current = registeredFaceDescriptor || null;
    registeredAllEmbeddingsRef.current = registeredAllEmbeddings || null;

    if (registeredFaceDescriptor) {
      // A fresh reference means any earlier "cannot verify" state is stale.
      unregisteredReportedRef.current = false;
      const poses = Array.isArray(registeredAllEmbeddings) ? registeredAllEmbeddings.length : 0;
      console.log(`[ProctoringEngine] ✅ Reference face received — ${registeredFaceDescriptor.length}-d descriptor, ${poses} enrolled pose(s).`);
    }
  }, [registeredFaceDescriptor, registeredAllEmbeddings]);
  const workerRef = useRef(null);
  const objectIntervalRef = useRef(null);
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
        // 720p where the camera allows it: the face pipeline resizes to its
        // own 640 input regardless, but the object detector's zoomed passes
        // get real pixels, which is what a small phone at arm's length needs.
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } },
        audio: false // No audio processing needed to protect privacy
      };
      const stream = trackStream(await navigator.mediaDevices.getUserMedia(constraints));
      // Handle race condition: component might have unmounted or isActive became false while waiting for camera permission
      if (!isActiveRef.current || hasLockedOutRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        acquiredStreams.delete(stream);
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
      acquiredStreams.delete(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      const srcStream = videoRef.current.srcObject;
      if (srcStream && srcStream.getTracks) {
        srcStream.getTracks().forEach(track => track.stop());
        acquiredStreams.delete(srcStream);
      }
      // Detach the stream but keep the element: nulling the ref left every
      // other callback without a video source if proctoring re-activated
      // within the same mount.
      videoRef.current.srcObject = null;
      try { videoRef.current.pause(); } catch (err) { /* element already torn down */ }
    }

    // Catch-all for anything opened but not held in streamRef -- e.g. a
    // permission grant that resolved after teardown began.
    releaseAllStreams();

    setIsCameraActive(false);
    setIsFaceDetected(false);
    setFaceCount(0); faceCountRef.current = 0;
    setVerificationStatus('no_face');
    setSimilarityScore(0);

    // Per-attempt identity/liveness state must not survive into the next one.
    lastIdentityVerdictRef.current = null;
    mismatchStreakRef.current = 0;
    livenessRef.current = null;
    spoofReportedRef.current = false;
    unregisteredReportedRef.current = false;
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
    if (typeof decision.maxWarnings === 'number' && decision.maxWarnings > 0) {
      setMaxWarnings(decision.maxWarnings);
    }
    setRiskFlagged(!!decision.riskFlagged);

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

    // Show the card for a NEW violation only.
    //
    // The server sets tier 'warn' as soon as totalViolations > 0 and leaves it
    // there for the rest of the attempt — it describes the session's standing,
    // not a fresh event. Treating that standing as "show the card" meant every
    // later server reply re-opened the same warning: acknowledge it, answer a
    // question, and it was back, with the counter unchanged because nothing new
    // had actually happened.
    const warnings = decision.warnings ?? 0;
    const isNewViolation = warnings > lastAcknowledgedWarningsRef.current;
    const showCard = isNewViolation && (decision.tier === 'warn' || decision.tier === 'pause');

    isWarningVisibleRef.current = showCard;
    setIsWarningVisible(showCard);
  }, []);

  // Tier 2+ — record a violation with the server and obey what it returns.
  const reportViolation = useCallback(async (eventType, displayMessage) => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;

    // ── Never stack a violation on top of a warning card ────────────────
    // While the card is up the candidate is reading it, not sitting the exam.
    // The card also takes focus, which fires blur by itself. This used to apply
    // only to window events, so a camera condition could record a second
    // violation while the candidate was still reading about the first — which
    // is what made warnings appear to repeat no matter how fast they clicked
    // "Acknowledge & Resume".
    if (isWarningVisibleRef.current) return;

    // ── One violation per type per cooldown window ───────────────────────
    // A flickering detection (a picture frame on the wall read as a second face
    // for a moment, lost, then found again) starts a fresh ladder episode every
    // time it reappears, and each episode is entitled to fire again. Without a
    // floor on how often a type may be recorded, one unstable signal can spend
    // a candidate's entire warning budget.
    const cooldown = EVENT_COOLDOWN_MS[eventType] ?? DEFAULT_EVENT_COOLDOWN_MS;
    const last = lastReportAtRef.current[eventType] || 0;
    if (Date.now() - last < cooldown) {
      console.log(`[ProctoringEngine] ${eventType} suppressed — fired ${Math.round((Date.now() - last) / 1000)}s ago, cooldown ${cooldown / 1000}s.`);
      return;
    }
    lastReportAtRef.current[eventType] = Date.now();

    // The nudge has escalated; stop showing the gentle version.
    nudgeRef.current = '';
    setNudgeMessage('');

    try {
      setLastViolationType(eventType);
      setPauseObservations((prev) => (prev.includes(eventType) ? prev : [...prev, eventType]));

      let severity = 'low';
      if (eventType === 'attention_check_fail' || eventType === 'fullscreen_exit') {
        severity = 'medium';
      } else if (eventType === 'multiple_faces' || eventType === 'face_mismatch' || eventType === 'spoof_detected') {
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
          setDiagnostics((d) => ({ ...d, sessionError: null }));
          applyDecision(response.proctoring);
        } else {
          // The server answered, but not with a decision. The warning card and
          // the counter are BOTH driven by that decision, so without one the
          // candidate sees nothing at all.
          console.error(`[ProctoringEngine] ❌ Server rejected ${eventType}:`, response);
          setDiagnostics((d) => ({ ...d, sessionError: `Server rejected ${eventType}` }));
        }
      } else {
        // No session id. Detection is working perfectly and NOTHING is being
        // recorded — the violation is dropped here, silently, and the panel
        // looks identical to a healthy exam. This was invisible: warnings sat
        // at 0 forever with no indication that the exam was never registered.
        console.error(
          `%c[PROCTOR] NO SESSION — "${eventType}" was detected but NOT recorded. ` +
          `The proctoring session failed to start; look for "Error starting proctoring session" above.`,
          'background:#b91c1c;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold'
        );
        setDiagnostics((d) => ({ ...d, sessionError: 'No session — nothing is being recorded' }));
        // Surface it to the candidate as coaching, so detection is at least
        // visibly alive rather than appearing dead.
        setNudgeRef.current?.(displayMessage || `Detected: ${eventType}`);
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
            setFaceCount(quick.faceCount); faceCountRef.current = quick.faceCount;
            if (quick.gaze?.gazeDirection) {
              setGazeDirection(quick.gaze.gazeDirection);
            }
            if (quick.faceCount === 0) {
              setVerificationStatus(VerificationStatus.NO_FACE);
              setIsFaceDetected(false);
              clearCondition('multiple_faces', 'face_mismatch', 'face_covered');
              observeCondition('face_absent');
            } else if (quick.faceCount > 1) {
              setVerificationStatus(VerificationStatus.MULTIPLE_FACES);
              setIsFaceDetected(false);
              clearCondition('face_absent', 'face_mismatch', 'face_covered');
              observeCondition('multiple_faces');
            } else {
              // Exactly one face present. A presence tick knows only THAT a
              // face is there, never WHOSE it is — SCRFD does not identify.
              // So it may only clear the conditions it can actually disprove
              // (absent / multiple) and must REPLAY the last identity verdict
              // that ArcFace produced. Stamping 'verified' here was the bug
              // that let a different person sit down and pass: it overwrote a
              // real mismatch every 800 ms and reset the mismatch ladder
              // before it could ever reach its 15 s red stage.
              clearCondition('face_absent', 'multiple_faces');
              const lastVerdict = lastIdentityVerdictRef.current;

              if (lastVerdict === VerificationStatus.MISMATCH) {
                setIsFaceDetected(false);
                setVerificationStatus(VerificationStatus.MISMATCH);
                observeCondition('face_mismatch');   // keep the episode running
              } else if (lastVerdict === VerificationStatus.COVERED) {
                setIsFaceDetected(false);
                setVerificationStatus(VerificationStatus.COVERED);
                observeCondition('face_covered');
              } else if (lastVerdict === VerificationStatus.VERIFIED) {
                setIsFaceDetected(true);
                setVerificationStatus(VerificationStatus.VERIFIED);
                clearCondition('face_mismatch', 'face_covered');
              }
              // No identity verdict yet (first ticks after start): show the
              // face as present but claim nothing about identity.
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

        // ── Record what ArcFace actually decided ────────────────────────
        // Only identity-bearing verdicts update the retained verdict.
        // NO_FACE / MULTIPLE_FACES are facts about presence, not about who the
        // person is, so they must not erase a standing mismatch.
        if (result.status === VerificationStatus.MISMATCH) {
          mismatchStreakRef.current += 1;
        } else if (result.status === VerificationStatus.VERIFIED) {
          mismatchStreakRef.current = 0;
        }

        // A single disagreeing frame is a blink, a yawn or a head turn. Only a
        // run of them is a different person. Identity runs ~every 800 ms, so
        // this costs well under a second against a 15 s red stage.
        let effectiveStatus = result.status;
        if (result.status === VerificationStatus.MISMATCH &&
            mismatchStreakRef.current < IDENTITY_MISMATCH_STREAK) {
          effectiveStatus = VerificationStatus.VERIFIED;
        }

        if (effectiveStatus === VerificationStatus.VERIFIED ||
            effectiveStatus === VerificationStatus.MISMATCH ||
            effectiveStatus === VerificationStatus.COVERED) {
          lastIdentityVerdictRef.current = effectiveStatus;
        }

        setVerificationStatus(effectiveStatus);
        setSimilarityScore(result.similarity || 0);
        setFaceCount(result.faceCount); faceCountRef.current = result.faceCount;
        setIsFaceDetected(effectiveStatus === VerificationStatus.VERIFIED);

        // Handle each verification status through the duration ladder:
        // green below the first threshold, amber coaching in the middle (never
        // recorded), red once a stage carries a server event. One continuous
        // episode escalates once rather than re-firing on a loop.
        switch (effectiveStatus) {
          case VerificationStatus.VERIFIED:
            clearCondition('face_absent', 'multiple_faces', 'face_mismatch', 'face_covered');

            // ── Gaze analysis (fallback only) ─────────────────────────────
            // MediaPipe Face Mesh owns attention when it is loaded: it has 468
            // landmarks, real lid contours (eyes_closed) and a proper head-pose
            // matrix (looking_down). This SCRFD-derived path has five points and
            // no eye state at all, so it is a degraded stand-in used only while
            // Face Mesh is unavailable — and it must never fight the good signal
            // for the same ladder conditions.
            if (result.gaze && !mpGazeActiveRef.current) {
              const { gazeDirection: dir } = result.gaze;
              setGazeDirection(dir);

              if (dir !== 'center') {
                observeCondition('gaze_away');
              } else {
                clearCondition('gaze_away');
              }

              // 5-point SCRFD gives a usable pitch but no eyelids. Downward
              // posture is still worth tracking; eye closure genuinely cannot
              // be judged here, so it is left to Face Mesh rather than faked.
              if (dir === 'looking_down') {
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
        // No registered descriptor. This branch runs presence-only detection —
        // it CANNOT tell who is in frame, so it must fail CLOSED. It used to
        // report 'verified' for any face present, which meant a session that
        // lost its registration (reload, resumed attempt, failed enrolment)
        // silently accepted anybody for the whole exam.
        const result = await detectFacesFast(videoRef.current);

        if (result.error) {
          console.warn('[ProctoringEngine] Face detection error:', result.error);
          return;
        }

        setFaceCount(result.faceCount); faceCountRef.current = result.faceCount;
        if (result.gaze?.gazeDirection) {
          setGazeDirection(result.gaze.gazeDirection);
        }
        setIsFaceDetected(false);
        setVerificationStatus(result.isFacePresent ? 'unregistered' : 'no_face');

        // Identity is unverifiable for this session — say so once, loudly,
        // rather than pretending every face is the right one.
        if (!unregisteredReportedRef.current) {
          unregisteredReportedRef.current = true;
          console.error('[ProctoringEngine] No registered face embedding — identity cannot be verified this session.');
          reportViolationRef.current?.(
            'face_mismatch',
            'Your registered face could not be loaded, so your identity cannot be confirmed.'
          );
        }

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

  /**
   * Prohibited items in frame.
   *
   * Runs on the same main-thread pipeline as face verification, because that
   * is the pipeline the exam actually uses. Presence is fed to the ladder like
   * any other condition, so a phone must be visible for a few seconds before
   * anything is recorded -- a single frame of a hand near a pocket is not
   * evidence, and the ladder's amber stage asks the candidate to put it away
   * before anything reaches their record.
   */
  /**
   * Reset the liveness evidence window. Called at the start of a window and
   * whenever continuity breaks (candidate leaves frame, a second person
   * appears) — evidence only means something if it is unbroken.
   */
  const resetLivenessWindow = (now) => {
    livenessRef.current = {
      startedAt: now,
      blinks: 0,
      lastEyesOpen: true,
      yawMin: Infinity, yawMax: -Infinity,
      pitchMin: Infinity, pitchMax: -Infinity,
      earMin: Infinity, earMax: -Infinity,
    };
  };

  /**
   * Accumulate one Face Mesh sample into the liveness window and judge the
   * window once it is full.
   *
   * Deliberately conservative: it reports only when a face has been present and
   * COMPLETELY motionless for the whole window — no blink, no head drift, no
   * change in eye aperture. Calling someone a cheat is a serious claim, and a
   * candidate who is simply sitting very still must never trip it.
   *
   * Known limit, stated rather than hidden: this catches a printed photo or a
   * still image on a screen. It does NOT catch a pre-recorded video of the
   * candidate, which blinks and moves like the real person. Defeating replay
   * needs either a trained anti-spoof model or a challenge-response step.
   */
  const trackLiveness = (g) => {
    if (spoofReportedRef.current) return;

    const now = Date.now();
    if (!livenessRef.current) resetLivenessWindow(now);
    const w = livenessRef.current;

    if (typeof g.yaw === 'number') {
      w.yawMin = Math.min(w.yawMin, g.yaw);
      w.yawMax = Math.max(w.yawMax, g.yaw);
    }
    if (typeof g.pitch === 'number') {
      w.pitchMin = Math.min(w.pitchMin, g.pitch);
      w.pitchMax = Math.max(w.pitchMax, g.pitch);
    }
    if (typeof g.ear === 'number') {
      w.earMin = Math.min(w.earMin, g.ear);
      w.earMax = Math.max(w.earMax, g.ear);
    }

    // A blink is the open → closed transition, counted once per closure.
    if (w.lastEyesOpen && g.eyesOpen === false) w.blinks += 1;
    w.lastEyesOpen = g.eyesOpen !== false;

    if (now - w.startedAt < LIVENESS_WINDOW_MS) return;

    const yawRange = w.yawMax - w.yawMin;
    const pitchRange = w.pitchMax - w.pitchMin;
    // If EAR was never computed this window we cannot judge eye motion, so the
    // range is treated as large — the check fails toward the candidate.
    const earRange = w.earMax > -Infinity ? w.earMax - w.earMin : 1;

    const frozen =
      w.blinks === 0 &&
      yawRange < LIVENESS_MIN_POSE_RANGE_DEG &&
      pitchRange < LIVENESS_MIN_POSE_RANGE_DEG &&
      earRange < LIVENESS_MIN_EAR_RANGE;

    if (frozen) {
      spoofReportedRef.current = true;
      console.warn(
        `[ProctoringEngine] Liveness FAILED — blinks=0, yaw range=${yawRange.toFixed(2)}°, ` +
        `pitch range=${pitchRange.toFixed(2)}°, EAR range=${earRange.toFixed(4)} over ${LIVENESS_WINDOW_MS / 1000}s.`
      );
      reportViolationRef.current?.(
        'spoof_detected',
        'The camera image did not move for a sustained period, which is consistent with a photo rather than a live person.'
      );
    }

    resetLivenessWindow(now);
  };

  const runObjectDetection = async () => {
    if (!isActiveRef.current || hasLockedOutRef.current) return;
    if (!videoRef.current || !isObjectDetectorReady()) return;
    if (objectPassInFlightRef.current) return;
    objectPassInFlightRef.current = true;

    try {
      const found = await detectObjects(videoRef.current);
      const labels = new Set((found || []).map((o) => o.label));

      if (found && found.length) {
        const summary = found.map((o) => `${o.label} ${o.score.toFixed(2)}`).join(', ');
        console.log(`[ProctoringEngine] Objects: ${summary}`);
        setDiagnostics((d) => ({ ...d, objects: summary, objectsAt: Date.now() }));
      } else {
        // Show what the model saw but did not act on, so "not detected" can
        // be told apart from "seen at 0.28 against a 0.35 bar".
        const near = getLastObjectNearMisses();
        setDiagnostics((d) => ({ ...d, objects: near.length ? `near: ${near.join(', ')}` : '', objectsAt: Date.now() }));
      }

      Object.entries(OBJECT_CONDITIONS).forEach(([label, condition]) => {
        const history = [...(objectSeenTicksRef.current[label] || []), labels.has(label)].slice(-OBJECT_CONFIRM_WINDOW);
        objectSeenTicksRef.current[label] = history;
        const hits = history.filter(Boolean).length;
        if (hits >= OBJECT_CONFIRM_TICKS) observeCondition(condition);
        else if (hits === 0) clearCondition(condition);
      });
    } catch (err) {
      console.warn('[ProctoringEngine] Object detection tick failed:', err);
    } finally {
      objectPassInFlightRef.current = false;
    }
  };

  // Visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      reportViolation('tab_switch', 'Warning: Tab switching is forbidden.');
    }
  }, [reportViolation]);

  // Focus changes
  /**
   * Focus loss, judged over a duration rather than an instant.
   *
   * The old handler waited 150 ms and then recorded a violation. That is far
   * shorter than the ordinary interruptions of using a computer: an OS
   * notification, the camera indicator, a click landing on browser chrome, or
   * the warning card itself appearing all steal focus for a few hundred
   * milliseconds and hand it straight back. Candidates were being warned for
   * things they did not do, repeatedly, which is exactly the kind of thing that
   * rattles someone mid-exam.
   *
   * Now the window has to STAY unfocused. Focus returning inside the grace
   * period cancels the pending report entirely.
   */
  const handleBlur = useCallback(() => {
    if (blurTimerRef.current) return; // already counting

    blurTimerRef.current = setTimeout(() => {
      blurTimerRef.current = null;

      if (document.hidden) return;        // tab_switch owns this case
      if (document.hasFocus()) return;    // came back — nothing happened

      reportViolation('minimize', 'Warning: You left the assessment window.');
    }, WINDOW_BLUR_GRACE_MS);
  }, [reportViolation]);

  /** Focus returned within the grace period — cancel the pending report. */
  const handleFocus = useCallback(() => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

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
    isWarningVisibleRef.current = false;
    setIsWarningVisible(false);
    // Everything recorded so far has now been seen. The card returns only when
    // the count rises again.
    lastAcknowledgedWarningsRef.current = warningsCountRef.current;
    // Restart the cooldown: dismissing the card moves focus, and that must not
    // immediately count as the candidate leaving the exam again.
    const now = Date.now();
    FOCUS_SENSITIVE_EVENTS.forEach((type) => { lastReportAtRef.current[type] = now; });
    // Leaving Tier 3 unblocks the exam and restarts the clock. The warnings
    // already recorded stand — this only dismisses the blocking card.
    setTier((current) => (current === 'pause' ? 'warn' : current));
    serverTierRef.current = serverTierRef.current === 'pause' ? 'warn' : serverTierRef.current;
    setPauseObservations([]);
  }, []);

  // Stable refs for event handlers so the main effect doesn't re-fire
  const handleVisibilityChangeRef = useRef(handleVisibilityChange);
  const handleBlurRef = useRef(handleBlur);
  const handleFocusRef = useRef(handleFocus);
  const handleFullscreenChangeRef = useRef(handleFullscreenChange);
  const resetInactivityTimerRef = useRef(resetInactivityTimer);
  const reportViolationRef = useRef(reportViolation);
  const scheduleAttentionCheckRef = useRef(scheduleAttentionCheck);
  const setNudgeRef = useRef(setNudge);
  const clearNudgeRef = useRef(clearNudge);
  const applyDecisionRef = useRef(applyDecision);

  useEffect(() => { handleVisibilityChangeRef.current = handleVisibilityChange; }, [handleVisibilityChange]);
  useEffect(() => { handleBlurRef.current = handleBlur; }, [handleBlur]);
  useEffect(() => { handleFocusRef.current = handleFocus; }, [handleFocus]);
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
          setDiagnostics((d) => ({ ...d, sessionId, sessionError: null }));
          console.log(`[ProctoringEngine] ✅ Proctoring session started: ${sessionId}`);
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

              // Remote-desktop / VM indicators are a property of the machine,
              // so they are probed once rather than on every sweep.
              if (!environmentReportedRef.current.has('remote_access_suspected')) {
                const remoteEvidence = detectRemoteOrVirtualDisplay();
                if (remoteEvidence) {
                  findings.push({
                    eventType: 'remote_access_suspected',
                    details: `Signals consistent with a virtual machine or remote desktop: ${remoteEvidence}.`,
                  });
                }
              }

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
        setDiagnostics((d) => ({
          ...d,
          sessionId: null,
          sessionError: `Session failed to start: ${err?.message || 'unknown error'}`,
        }));
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
      onMultipleVoices: () => {
        if (isActiveRef.current && !hasLockedOutRef.current) {
          reportViolationRef.current?.('multiple_voices', 'Warning: More than one voice was heard in the room.');
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
    const onPageHide = () => releaseAllStreams();

    // Content-capture guards. The handlers block the action as well as
    // recording it: a warning after the paper has already been copied is a
    // record of a leak, not a prevention of one.
    const onCopy = (e) => {
      const selection = String(window.getSelection?.() || '').trim();
      e.preventDefault();
      reportViolationRef.current?.(
        'copy_detected',
        selection
          ? 'Copying assessment content is not permitted.'
          : 'A copy action was blocked during the assessment.'
      );
    };
    const onPaste = (e) => {
      e.preventDefault();
      reportViolationRef.current?.('paste_detected', 'Pasting into the assessment is not permitted.');
    };
    const onContextMenu = (e) => {
      e.preventDefault();
      reportViolationRef.current?.('context_menu', 'The right-click menu is disabled during the assessment.');
    };
    const onKeyDown = (e) => {
      const blocked = isRestrictedShortcut(e);
      if (!blocked) return;
      e.preventDefault();
      reportViolationRef.current?.('restricted_shortcut', `${blocked} is disabled during the assessment.`);
    };
    const onVisibilityChange = () => handleVisibilityChangeRef.current();
    const onBlur = () => handleBlurRef.current();
    const onFocus = () => handleFocusRef.current();
    const onFullscreenChange = () => handleFullscreenChangeRef.current();
    const onActivity = () => resetInactivityTimerRef.current();

    // Set up tab / window listeners
    document.addEventListener('visibilitychange', onVisibilityChange);
    // Closing the tab or a hard navigation never runs React cleanup; pagehide
    // does, and unlike unload it also fires on the bfcache path.
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
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

    // Prohibited items on their own, slower cadence -- YOLO is far heavier than
    // the presence check and does not need to run at face rate.
    objectIntervalRef.current = setInterval(runObjectDetection, OBJECT_CHECK_INTERVAL);

    // MediaPipe Face Mesh gaze runs on the MAIN THREAD (it can't run in a module
    // worker). Lazy-load it, then poll gaze on a light cadence; it overrides the
    // worker's SCRFD gaze once ready. Non-blocking — failure keeps SCRFD gaze.
    initMediaPipeGaze().catch(() => { });
    gazeIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !isActiveRef.current || hasLockedOutRef.current) return;
      if (!isMediaPipeGazeReady()) return;
      const g = detectMediaPipeGaze(videoRef.current);
      if (!g?.gazeDirection) return;

      mpGazeActiveRef.current = true;
      setGazeDirection(g.gazeDirection);

      // Attention conditions are only meaningful while exactly one face is in
      // frame. With nobody there, face_absent already owns the episode; with
      // two people, multiple_faces does. Feeding attention in those states
      // would stack a second warning on the same physical event.
      if (faceCountRef.current !== 1) {
        clearCondition('gaze_away', 'eyes_closed', 'looking_down');
        livenessRef.current = null; // continuity broken — start a fresh window
        return;
      }

      // ── Eyes closed ──────────────────────────────────────────────────
      // Real EAR from the Face Mesh lid contours. Blinks cross the threshold
      // for ~100 ms; the ladder needs 8 s before it even shows amber, so a
      // normal blink rate never registers.
      if (g.eyesOpen === false) {
        clearCondition('gaze_away');
        observeCondition('eyes_closed');
      } else {
        clearCondition('eyes_closed');

        // ── Looking away ───────────────────────────────────────────────
        if (g.gazeDirection !== 'center') {
          observeCondition('gaze_away');
        } else {
          clearCondition('gaze_away');
        }
      }

      // ── Head down ────────────────────────────────────────────────────
      // Tracked independently of gaze_away: it has its own, much longer
      // ladder because glancing at a keyboard is normal and only a sustained
      // downward posture is the phone-in-lap proxy.
      if (g.headDown) {
        observeCondition('looking_down');
      } else {
        clearCondition('looking_down');
      }

      // ── Liveness ─────────────────────────────────────────────────────
      trackLiveness(g);
    }, LIVENESS_SAMPLE_INTERVAL_MS);

    // Diagnostics poll. Cheap: two synchronous reads, once a second.
    const diagnosticsTimer = setInterval(() => {
      setDiagnostics((d) => ({
        ...d,
        models: getPipelineStatus(),
        audio: getLastGates(),
        // Objects go stale — a phone seen ten seconds ago is not in frame now.
        objects: Date.now() - d.objectsAt > 6000 ? '' : d.objects,
      }));
    }, 1000);

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
      clearInterval(diagnosticsTimer);
      stopCamera();
      stopAudioMonitoring();

      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, onActivity);
      });

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (objectIntervalRef.current) { clearInterval(objectIntervalRef.current); objectIntervalRef.current = null; }
      if (gazeIntervalRef.current) { clearInterval(gazeIntervalRef.current); gazeIntervalRef.current = null; }
      mpGazeActiveRef.current = false;
      if (fullscreenTimerRef.current) clearInterval(fullscreenTimerRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (environmentIntervalRef.current) clearInterval(environmentIntervalRef.current);
      if (duplicateWindowCleanupRef.current) { duplicateWindowCleanupRef.current(); duplicateWindowCleanupRef.current = null; }
      if (attentionTimerRef.current) clearTimeout(attentionTimerRef.current);
      
      // Belt and braces: release anything still open, including a stream
      // whose permission prompt resolved after this cleanup started.
      // (This replaced a `window.localStream` check that could never fire --
      // nothing in the codebase ever assigned that global.)
      releaseAllStreams();

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
    maxWarnings,
    riskFlagged,
    diagnostics,
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
