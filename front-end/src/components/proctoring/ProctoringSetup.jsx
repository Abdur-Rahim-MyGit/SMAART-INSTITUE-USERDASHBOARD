import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  RiCameraLine,
  RiCheckLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiFullscreenLine,
  RiArrowRightLine,
  RiUserSmileLine,
  RiLoader4Line,
  RiSoundModuleLine,   // used for microphone row ✅
  RiVolumeMuteLine,    // used for mic denied state ✅
} from '@remixicon/react';
// Registration uses the PROVEN main-thread detector (onnxPipeline via
// faceVerificationService). The worker path was unreliable for the live
// registration preview (createImageBitmap frame degraded SCRFD). The exam
// itself still runs on the worker; registration is a one-time ~5 s step.
import {
  loadModels,
  registerFace,
  detectFacesFast,
  isReady as isModelsReady,
  getModelLoadError,
} from '@/services/faceVerificationService';

// Gap between presence scans. Measured from the END of the previous scan.
// 50ms ensures smooth, real-time face tracking at ~20 FPS.
const SCAN_INTERVAL_MS = 50;

// Registration capture settings.
const REGISTRATION_FRAMES = 3;
const REGISTRATION_FRAME_GAP_MS = 350;

// L2-normalize an embedding vector.
const normalize = (v) => {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
};

// Median-pool a set of (already-normalized) embeddings, then renormalize.
// Median is more robust to a single bad frame than the mean.
const medianPool = (embeddings) => {
  const dim = embeddings[0].length;
  const out = new Float32Array(dim);
  const scratch = new Array(embeddings.length);
  for (let d = 0; d < dim; d++) {
    for (let e = 0; e < embeddings.length; e++) scratch[e] = embeddings[e][d];
    scratch.sort((a, b) => a - b);
    const mid = scratch.length >> 1;
    out[d] = scratch.length % 2 ? scratch[mid] : (scratch[mid - 1] + scratch[mid]) / 2;
  }
  return normalize(out);
};

const cosine = (a, b) => {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // inputs are unit vectors
};

// Grab a JPEG data URL of the current video frame for the registration
// thumbnail. Pure main-thread canvas draw — no model involved.
const captureFrameDataUrl = (video) => {
  try {
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
};

// Mean pairwise cosine similarity among the captured frames — a real
// intra-person consistency signal used as the registration "confidence".
const meanPairwiseSimilarity = (embeddings) => {
  if (embeddings.length < 2) return 1;
  let sum = 0, pairs = 0;
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) { sum += cosine(embeddings[i], embeddings[j]); pairs++; }
  }
  return pairs ? sum / pairs : 1;
};

export const ProctoringSetup = ({ onComplete, assessmentTitle }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [cameraState, setCameraState] = useState('pending'); // 'pending' | 'checking' | 'allowed' | 'denied'
  const [micState, setMicState] = useState('pending');       // 'pending' | 'checking' | 'allowed' | 'denied' | 'skipped'
  const [networkLatency, setNetworkLatency] = useState(null);
  const [networkState, setNetworkState] = useState('checking'); // 'checking' | 'good' | 'poor'
  const [consentGranted, setConsentGranted] = useState(false);
  const [isFullScreenActive, setIsFullScreenActive] = useState(false);

  // Face Registration State
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [modelLoadState, setModelLoadState] = useState('idle'); // 'idle' | 'loading' | 'loaded' | 'error'
  const [registrationState, setRegistrationState] = useState('idle');
  // 'idle' | 'detecting' | 'face_found' | 'registering' | 'registered' | 'error'
  const registrationStateRef = useRef(registrationState);
  useEffect(() => {
    registrationStateRef.current = registrationState;
  }, [registrationState]);

  const [registrationProgress, setRegistrationProgress] = useState({ current: 0, total: 3 });
  const [registrationConfidence, setRegistrationConfidence] = useState(0);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceCheckError, setFaceCheckError] = useState(null);
  const [faceStableCount, setFaceStableCount] = useState(0);
  const [qualityIssues, setQualityIssues] = useState([]);
  const [detectingElapsed, setDetectingElapsed] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const localStreamRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const registeredCropDataUrlRef = useRef(null);
  const faceStableCountRef = useRef(0);
  const registrationResultRef = useRef(null);
  const detectingTimerRef = useRef(null);

  // Live elapsed-seconds counter while in 'detecting' state
  useEffect(() => {
    if (registrationState === 'detecting') {
      setDetectingElapsed(0);
      detectingTimerRef.current = setInterval(() => {
        setDetectingElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (detectingTimerRef.current) {
        clearInterval(detectingTimerRef.current);
        detectingTimerRef.current = null;
      }
    }
    return () => {
      if (detectingTimerRef.current) {
        clearInterval(detectingTimerRef.current);
        detectingTimerRef.current = null;
      }
    };
  }, [registrationState]);

  // 1. Run network speed checks
  useEffect(() => {
    if (step === 1) {
      const checkNetwork = async () => {
        const start = Date.now();
        try {
          await fetch('/api/auth/me', { method: 'HEAD', signal: AbortSignal.timeout(3000) }).catch(() => { });
          const latency = Date.now() - start;
          setNetworkLatency(latency);
          setNetworkState(latency < 500 ? 'good' : 'poor');
        } catch {
          setNetworkLatency(120);
          setNetworkState('good');
        }
      };
      checkNetwork();
    }
  }, [step]);

  // Handle stream initialization for webcam check
  const requestWebcamAccess = async () => {
    setCameraState('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
      });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraState('allowed');
    } catch (err) {
      setCameraState('denied');
      setFaceCheckError('Camera access failed: ' + (err.message || err.toString()));
    }
  };

  // Handle microphone permission check (Disabled)
  const requestMicAccess = async () => {
    setMicState('allowed');
  };

  // Auto-request webcam on first render
  useEffect(() => {
    if (step === 1 && cameraState === 'pending') {
      const initMedia = async () => {
        await requestWebcamAccess();
        setMicState('allowed');
      };
      initMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // PERFORMANCE: start fetching the models the moment setup opens, rather than
  // waiting until the candidate reaches step 3. The download then overlaps with
  // the permission prompts and the rules screen — by the time they reach face
  // registration the weights are usually already cached, which is most of the
  // "Detecting your face..." wait people were seeing.
  useEffect(() => {
    if (!isModelsReady()) {
      loadModels((progress) => setModelLoadProgress(progress)).catch((err) =>
        console.warn('[ProctoringSetup] Model preload failed, will retry at step 3:', err?.message || err)
      );
    }
  }, []);

  // Ensure the AI models are ready when entering step 3.
  const loadAIModels = useCallback(async () => {
    if (isModelsReady()) {
      setModelLoadState('loaded');
      setModelLoadProgress(100);
      return;
    }

    setModelLoadState('loading');
    setModelLoadProgress(0);

    // Guard against a silent stall: surface an error + retry rather than sitting
    // on "Detecting your face…" forever if the load neither resolves nor rejects.
    const LOAD_TIMEOUT_MS = 120000;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; }, LOAD_TIMEOUT_MS);

    try {
      const ok = await loadModels((progress) => setModelLoadProgress(progress));
      clearTimeout(timeout);
      if (ok && !timedOut) {
        setModelLoadState('loaded');
        setModelLoadProgress(100);
        console.log('[ProctoringSetup] ✅ AI models loaded');
      } else {
        const initErr = getModelLoadError?.();
        throw new Error(timedOut ? 'Model load timed out.' : (initErr?.message || 'Face models failed to initialise.'));
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('[ProctoringSetup] Model loading failed:', err);
      setModelLoadState('error');
      setFaceCheckError(t('proctoring_setup.error_model_load', 'Failed to load AI models. Please check your connection and try again.') + ' (' + (err.message || err.toString()) + ')');
    }
  }, [t]);

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawFaceFeedback = useCallback((faces) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    if (displaySize.width === 0 || displaySize.height === 0) return;

    // Make canvas same size as the display size of the video
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!faces || faces.length === 0) return;

    faces.forEach(f => {
      // Draw Bounding Box
      const box = f.box; // {x, y, width, height}
      if (!box || !video.videoWidth || !video.videoHeight) return;

      // Scale to canvas display size
      const scaleX = displaySize.width / video.videoWidth;
      const scaleY = displaySize.height / video.videoHeight;
      if (!isFinite(scaleX) || !isFinite(scaleY)) return;

      // Ignore full-canvas background boxes (>98% of container)
      if (box.width * scaleX > displaySize.width * 0.98 || box.height * scaleY > displaySize.height * 0.98) return;

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x * scaleX, box.y * scaleY, box.width * scaleX, box.height * scaleY);

      // Draw Landmarks (ONNX format: [[x,y], ...])
      if (f.landmarks) {
        ctx.fillStyle = '#10b981';
        f.landmarks.forEach(pt => {
          ctx.beginPath();
          const lx = pt.x !== undefined ? pt.x : pt[0];
          const ly = pt.y !== undefined ? pt.y : pt[1];
          ctx.arc(lx * scaleX, ly * scaleY, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  }, []);

  // Run multi-frame face registration
  const startFaceRegistration = useCallback(async () => {
    if (!videoRef.current) return;

    // Stop scanning interval — registration takes over the camera loop
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }

    setRegistrationState('registering');
    setRegistrationProgress({ current: 0, total: REGISTRATION_FRAMES });
    setFaceCheckError(null);
    setQualityIssues([]);

    try {
      // Proven main-thread multi-frame registration (onnxPipeline via
      // faceVerificationService). Handles retries, quality checks, alignment and
      // median-pooled embedding internally.
      const result = await registerFace(videoRef.current, {
        frameCount: REGISTRATION_FRAMES,
        intervalMs: REGISTRATION_FRAME_GAP_MS,
        onFrameCaptured: (frameIndex, totalFrames, descriptor, face) => {
          setRegistrationProgress({ current: frameIndex, total: totalFrames });
          setQualityIssues([]);
          if (face) drawFaceFeedback([face]);
        },
        onError: (msg) => console.warn('[ProctoringSetup] Registration frame issue:', msg),
        onQualityIssue: (issues) => setQualityIssues(issues),
      });

      setRegisteredDescriptor(result.descriptor);
      registeredCropDataUrlRef.current = result.alignedCropDataUrl;
      setRegistrationConfidence(result.confidence);
      setRegistrationProgress({ current: result.framesCaptured, total: REGISTRATION_FRAMES });
      setRegistrationState('registered');
      setQualityIssues([]);
      clearCanvas();

      registrationResultRef.current = {
        descriptor: result.descriptor,
        allEmbeddings: result.allEmbeddings,
        alignedCrops: result.alignedCrops,
        qualityScore: result.qualityScore,
        confidence: result.confidence,
        framesCaptured: result.framesCaptured,
      };

      console.log(`[ProctoringSetup] ✅ Face registered: ${result.framesCaptured} frames, confidence: ${(result.confidence * 100).toFixed(1)}%`);
    } catch (err) {
      console.error('[ProctoringSetup] Face registration failed:', err);
      setRegistrationState('error');
      clearCanvas();
      setQualityIssues([]);

      // Show specific error messages for hard-stop conditions
      if (err.code === 'NO_FACE_DETECTED') {
        setFaceCheckError('No face detected. Please position yourself in front of the camera.');
      } else if (err.code === 'MULTIPLE_FACES_DETECTED') {
        setFaceCheckError('Only one person should be visible during registration.');
      } else {
        setFaceCheckError(err.message || t('proctoring_setup.error_registration_failed_retry', 'Face registration failed. Please try again.'));
      }
    }
  }, [drawFaceFeedback, clearCanvas, t]);

  // Start face detection scanning (pre-registration)
  const startFaceScanning = useCallback(() => {
    if (!videoRef.current || !localStreamRef.current) return;

    setRegistrationState('detecting');
    setFaceCheckError(null);
    faceStableCountRef.current = 0;
    let noFaceTicks = 0;
    let multiFaceTicks = 0;
    let scanLog = 0;

    // Self-scheduling loop rather than setInterval.
    //
    // With a fixed interval, a detection that takes longer than the period
    // stacks up behind the previous one and the feed gets progressively more
    // laggy. Scheduling the next pass only after the current one finishes
    // keeps latency bounded no matter how slow the device is.
    const scanOnce = async () => {
      if (!videoRef.current || faceCheckIntervalRef.current === null) return;

      try {
        // Presence-only (proven main-thread SCRFD): skips the recognition net
        // until the candidate actually registers.
        if (videoRef.current.readyState < 2) return;
        const result = await detectFacesFast(videoRef.current);

        if (result.error) {
          return; // Skip frame
        }

        // diag: log the live faceCount stream so we can see why it stalls.
        if (scanLog++ % 6 === 0) {
          console.log(`[Setup][diag] faceCount=${result.faceCount} stable=${faceStableCountRef.current} state=${registrationStateRef.current}`);
        }

        if (result.faceCount === 1) {
          noFaceTicks = 0;
          multiFaceTicks = 0;
          faceStableCountRef.current += 1;
          setFaceStableCount(faceStableCountRef.current);
          setFaceCheckError(null);
          drawFaceFeedback(result.faces);

          // Ready to register once we've accumulated enough single-face frames.
          if (faceStableCountRef.current >= 3 && registrationStateRef.current !== 'registering' && registrationStateRef.current !== 'registered') {
            console.log('[Setup][diag] → starting registration');
            clearInterval(faceCheckIntervalRef.current);
            faceCheckIntervalRef.current = null;
            startFaceRegistration();
          }
        } else if (result.faceCount === 0) {
          noFaceTicks += 1;
          multiFaceTicks = 0;
          // Tolerant: DECAY rather than hard-reset, so a single dropped frame
          // doesn't wipe out accumulated progress (detection can briefly blip).
          faceStableCountRef.current = Math.max(0, faceStableCountRef.current - 1);
          setFaceStableCount(faceStableCountRef.current);
          clearCanvas();

          // Show guidance banner after ~1 second (20 ticks) of no face, keeping scanning active!
          if (noFaceTicks >= 20) {
            setFaceCheckError(t('proctoring_setup.error_no_face', 'No face detected. Ensure your face is clearly visible and well-lit.'));
          }
        } else if (result.faceCount > 1) {
          multiFaceTicks += 1;
          faceStableCountRef.current = Math.max(0, faceStableCountRef.current - 1);
          if (multiFaceTicks >= 5) {
            setFaceCheckError(t('proctoring_setup.error_multiple_faces', 'Only one person should be visible during registration.'));
          }
        }
      } catch (err) {
        console.error('[ProctoringSetup] Face scanning error:', err);
      } finally {
        // Reschedule only if we were not cancelled (either by teardown or by
        // registration starting).
        if (faceCheckIntervalRef.current !== null) {
          faceCheckIntervalRef.current = setTimeout(scanOnce, SCAN_INTERVAL_MS);
        }
      }
    };

    // Sentinel so the first scanOnce sees an active scan; replaced by the real
    // timer id on the first reschedule. clearInterval/clearTimeout share an id
    // space, so existing teardown calls keep working unchanged.
    faceCheckIntervalRef.current = setTimeout(scanOnce, 0);
  }, [registrationState, startFaceRegistration, drawFaceFeedback, clearCanvas]);

  // Ensure camera stream is active and playing on the video element
  const ensureCameraActive = useCallback(async () => {
    const hasActiveTrack = localStreamRef.current &&
      localStreamRef.current.getVideoTracks().some(t => t.readyState === 'live' && t.enabled);

    if (!hasActiveTrack) {
      console.log('[ProctoringSetup] Re-acquiring webcam stream...');
      await requestWebcamAccess();
    }

    if (videoRef.current && localStreamRef.current) {
      if (videoRef.current.srcObject !== localStreamRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
      }
      try {
        await videoRef.current.play();
      } catch (e) {
        console.warn('[ProctoringSetup] Video play notice:', e.message);
      }
    }
  }, []);

  // Step 3: Ensure webcam stream is active, load models, then start scanning
  useEffect(() => {
    if (step === 3) {
      const initStep3 = async () => {
        await ensureCameraActive();
        await loadAIModels();

        // Wait for video element to be ready
        if (videoRef.current) {
          let waitCount = 0;
          while (videoRef.current && videoRef.current.readyState < 2 && waitCount < 25) {
            await new Promise(r => setTimeout(r, 100));
            waitCount++;
          }
        }

        if (isModelsReady()) {
          startFaceScanning();
        }
      };

      initStep3();
    } else {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
    }
    return () => {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Monitor Fullscreen Status
  useEffect(() => {
    const checkFullscreen = () => {
      const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullScreenActive(active);
    };
    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, []);

  const triggerFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  };

  const handleNextStep = () => {
    if (step === 1 && cameraState === 'allowed') {
      setStep(2);
    } else if (step === 2 && consentGranted) {
      setStep(3);
    } else if (step === 3 && registrationState === 'registered') {
      // Stop the setup camera stream immediately before unmounting the video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
      setStep(4);
    }
  };

  const handleStartTest = () => {
    // Release setup streams — stop video src first, then kill tracks
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }

    // Check fullscreen
    if (!isFullScreenActive) {
      triggerFullscreen();
    }

    // 1800ms delay: OS camera drivers need time to fully release the hardware
    // before the exam engine's getUserMedia call can succeed
    setTimeout(() => {
      const regResult = registrationResultRef.current || {};
      onComplete({
        faceDescriptor: registeredDescriptor,
        allEmbeddings: regResult.allEmbeddings || null,
        alignedCrops: regResult.alignedCrops || null,
        registrationQualityScore: regResult.qualityScore || null,
        registrationCropUrl: regResult.alignedCrops?.[regResult.alignedCrops.length - 1] || null,
      });
    }, 1800);
  };

  // Retry registration (full reset — back to detecting state)
  const retryRegistration = async () => {
    // Clear any running interval
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }
    clearCanvas();
    setRegistrationState('idle');
    setRegisteredDescriptor(null);
    setRegistrationConfidence(0);
    setRegistrationProgress({ current: 0, total: 3 });
    setFaceCheckError(null);
    setQualityIssues([]);
    faceStableCountRef.current = 0;
    setFaceStableCount(0);

    // Re-activate camera stream if needed
    await ensureCameraActive();

    // Restart scanning after a short delay to let camera settle
    setTimeout(() => {
      if (isModelsReady()) startFaceScanning();
    }, 400);
  };

  // ─── Render ────────────────────────────────────────────────────────

  // Helper: render face registration progress text
  const getRegistrationStatusText = () => {
    if (modelLoadState === 'loading') return t('proctoring_setup.status_loading_models', 'Loading AI Models...');
    if (modelLoadState === 'error') return t('proctoring_setup.status_model_failed', 'Model loading failed');
    if (faceCheckError && registrationState === 'detecting') return faceCheckError;
    if (registrationState === 'detecting') return t('proctoring_setup.status_detecting_face', 'Detecting your face... please wait') + (detectingElapsed > 0 ? ` (${detectingElapsed}s)` : '');
    if (registrationState === 'face_found') return t('proctoring_setup.status_face_found', 'Face found! Hold still...');
    if (registrationState === 'registering') return t('proctoring_setup.status_registering_identity', 'Registering identity ({{current}}/{{total}})', { current: registrationProgress.current, total: registrationProgress.total });
    if (registrationState === 'registered') return t('proctoring_setup.status_face_registered', 'Face Registered Successfully');
    if (registrationState === 'error') return t('proctoring_setup.status_registration_failed', 'Registration failed');
    return t('proctoring_setup.status_preparing', 'Preparing...');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 dark:bg-[#000F24]/80 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#002147] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col">

        {/* Glow decorative effects */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#1a3884]/5 dark:bg-[#1a3884]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="mb-4 border-b border-slate-100 dark:border-white/5 pb-3 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3884] dark:text-cyan-400">{t('proctoring_setup.badge', 'AI Integrity Setup')}</span>
          <h2 className="text-lg sm:text-xl font-black mt-0.5 leading-tight text-slate-900 dark:text-white">
            {t('proctoring_setup.preparing', 'Preparing: {{title}}', { title: assessmentTitle || t('proctoring_setup.default_assessment_title', 'SMAART Assessment') })}
          </h2>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex gap-1.5 mb-4 shrink-0">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${s === step
                  ? 'bg-[#1a3884] dark:bg-cyan-400 w-12'
                  : s < step
                    ? 'bg-emerald-500'
                    : 'bg-slate-100 dark:bg-white/10'
                }`}
            />
          ))}
        </div>

        {/* Step Contents */}
        <div className="flex-1 overflow-y-auto pr-1 max-h-[55vh] custom-scrollbar">
          {/* STEP 1: Camera & Hardware Checks */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <RiCameraLine className="text-[#1a3884] dark:text-cyan-400" /> {t('proctoring_setup.camera_hardware_title', 'Camera & Hardware Test')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350">
                {t('proctoring_setup.camera_hardware_desc', 'To guarantee test credibility, a functioning webcam is required. Permissions must be explicitly granted.')}
              </p>

              <div className="space-y-3">
                {/* Camera Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-200/50 dark:bg-white/5 rounded-xl">
                      <RiCameraLine size={20} className="text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Webcam Access</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">To check your identity during the test</p>
                    </div>
                  </div>
                  {cameraState === 'allowed' ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/25">
                      <RiCheckLine size={14} /> {t('proctoring_setup.allowed', 'Allowed')}
                    </span>
                  ) : cameraState === 'checking' ? (
                    <span className="text-xs text-slate-400 animate-pulse">{t('proctoring_setup.checking', 'Checking...')}</span>
                  ) : cameraState === 'denied' ? (
                    <button
                      onClick={requestWebcamAccess}
                      className="text-xs font-bold text-red-500 dark:text-red-400 hover:underline"
                    >{t('proctoring_setup.retry_permission', 'Retry Permission')}</button>
                  ) : (
                    <button
                      onClick={requestWebcamAccess}
                      className="px-4 py-2 bg-[#1a3884] hover:bg-[#112b6b] text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                    >{t('proctoring_setup.grant_access', 'Grant Access')}</button>
                  )}
                </div>

                {/* Microphone Row (NEW) (Temporarily Hidden)
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-200/50 dark:bg-white/5 rounded-xl">
                      <RiSoundModuleLine size={20} className="text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Microphone Access</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Required for voice activity monitoring</p>
                    </div>
                  </div>
                  {micState === 'allowed' ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/25">
                      <RiCheckLine size={14} /> Allowed
                    </span>
                  ) : micState === 'checking' ? (
                    <span className="text-xs text-slate-400 animate-pulse">Checking...</span>
                  ) : micState === 'denied' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <RiVolumeMuteLine size={13} /> Denied
                      </span>
                      <button
                        onClick={requestMicAccess}
                        className="text-xs font-bold text-[#1a3884] dark:text-cyan-400 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={requestMicAccess}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Grant Access
                    </button>
                  )}
                </div>
                */}

                {/* Network Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-200/50 dark:bg-white/5 rounded-xl">
                      <RiShieldCheckLine size={20} className="text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('proctoring_setup.network_speed_check', 'Network Speed Check')}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('proctoring_setup.latency_verification', 'Latency verification')}</p>
                    </div>
                  </div>
                  {networkState === 'checking' ? (
                    <span className="text-xs text-slate-400 animate-pulse">{t('proctoring_setup.checking', 'Checking...')}</span>
                  ) : networkState === 'good' ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/25">
                      {t('proctoring_setup.network_good', 'Good ({{latency}}ms)', { latency: networkLatency })}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-yellow-655 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-100 dark:border-yellow-500/25">
                      {t('proctoring_setup.network_unstable', 'Unstable ({{latency}}ms)', { latency: networkLatency })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Compliance Consent + Assessment Rules */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <RiShieldCheckLine className="text-[#1a3884] dark:text-cyan-400" /> {t('proctoring_setup.security_consent_title', 'Security Compliance Consent')}
              </h3>

              {/* Why each permission is required */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">This assessment requires the following access:</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a3884] dark:bg-cyan-400" />
                    <span><strong>Camera access</strong> — We use your camera to check your identity at the start and throughout the test.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a3884] dark:bg-cyan-400" />
                    <span><strong>Browser monitoring</strong> — We check if you leave the test tab or switch to another window, so the session stays fair.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a3884] dark:bg-cyan-400" />
                    <span><strong>Full-screen mode</strong> — Full-screen removes distractions and prevents access to other apps while you test.</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  All session records are securely processed under the Digital Personal Data Protection Act (DPDPA 2023) and auto-purged within 30 days of attempt completion.
                </p>
              </div>

              {/* Assessment Rules */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Assessment Rules</p>
                <ul className="space-y-1.5">
                  {[
                    'Keep your camera on.',
                    'Keep your face visible.',
                    'Only one person is allowed.',
                    'Do not switch tabs or windows.',
                    'Stay in full-screen mode.',
                    'Do not use your phone or look away repeatedly.'
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#1a3884]/5 dark:bg-[#1a3884]/20 border border-[#1a3884]/15 dark:border-[#1a3884]/40 rounded-2xl p-4 flex gap-3 items-start">
                <RiInformationLine size={20} className="text-[#1a3884] dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Violations are reviewed by a human before any serious action is taken. The system flags behaviour for review — it does not make automatic failure decisions.
                </div>
              </div>

              <label className="flex items-start gap-3 mt-4 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all select-none">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 accent-[#1a3884] dark:accent-cyan-400"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  I understand why these permissions are required, accept the assessment rules, and consent to face registration and identity verification.
                </span>
              </label>
            </motion.div>
          )}

          {/* STEP 3: Face Registration */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 flex flex-col items-center">
              <h3 className="text-lg font-bold text-center self-start flex items-center gap-2 text-slate-900 dark:text-white">
                <RiUserSmileLine className="text-[#1a3884] dark:text-cyan-400" /> {t('proctoring_setup.face_registration_title', 'Face Registration')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350 text-left self-start">
                {t('proctoring_setup.face_registration_desc', 'Look straight into the camera. The AI will capture your face identity and verify you throughout the assessment.')}
              </p>

              {/* Video + Registration UI */}
              <div className="relative w-56 h-42 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-[#1a3884]/30 shadow-lg">
                <video
                  ref={videoRef}
                  width={640}
                  height={480}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => e.target.play().catch(() => { })}
                />

                {/* Oval face guide overlay */}
                {(registrationState === 'detecting' || registrationState === 'idle') && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 224 168" preserveAspectRatio="xMidYMid slice">
                      {/* Semi-transparent mask with oval cutout */}
                      <defs>
                        <mask id="face-oval-mask">
                          <rect width="100%" height="100%" fill="white" />
                          <ellipse cx="112" cy="80" rx="48" ry="62" fill="black" />
                        </mask>
                      </defs>
                      <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#face-oval-mask)" />
                      {/* Oval guide border */}
                      <ellipse cx="112" cy="80" rx="48" ry="62" fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="2" strokeDasharray="6 4" className="animate-[spin_8s_linear_infinite]" style={{ transformOrigin: '112px 80px' }} />
                    </svg>
                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="text-[9px] font-bold text-cyan-300/80 uppercase tracking-wider">Center your face in the oval</span>
                    </div>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1] z-10"
                />

                {/* Registration progress overlay */}
                {registrationState === 'registering' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                      <RiLoader4Line size={16} className="text-cyan-400 animate-spin" />
                      <span className="text-xs text-white font-bold">
                        {t('proctoring_setup.capturing_progress', 'Capturing {{current}}/{{total}}', { current: registrationProgress.current, total: registrationProgress.total })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Success overlay */}
                {registrationState === 'registered' && (
                  <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl">
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 backdrop-blur-sm py-1.5 flex items-center justify-center gap-1.5">
                      <RiCheckLine size={14} className="text-white" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">{t('proctoring_setup.registered', 'Registered')}</span>
                    </div>
                  </div>
                )}

                {/* Model loading overlay */}
                {modelLoadState === 'loading' && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RiLoader4Line size={24} className="text-cyan-400 animate-spin mb-2" />
                    <span className="text-xs text-cyan-300 font-bold">{t('proctoring_setup.loading_ai_models', 'Loading AI Models')}</span>
                    <div className="w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${modelLoadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">{modelLoadProgress}%</span>
                  </div>
                )}

                {/* Model loading FAILED overlay — surfaces the real error + retry
                    instead of silently sitting on "Detecting your face…". */}
                {modelLoadState === 'error' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center px-4 text-center">
                    <RiAlertLine size={24} className="text-red-400 mb-2" />
                    <span className="text-xs text-red-300 font-bold mb-1">
                      {t('proctoring_setup.status_model_failed', 'Model loading failed')}
                    </span>
                    <span className="text-[10px] text-slate-300 mb-3 max-w-[240px] leading-snug">
                      {faceCheckError || t('proctoring_setup.error_model_load', 'Failed to load AI models. Please check your connection and try again.')}
                    </span>
                    <button
                      onClick={loadAIModels}
                      className="px-5 py-2 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <RiLoader4Line size={13} /> {t('proctoring_setup.retry_model_load', 'Retry')}
                    </button>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <AnimatePresence mode="wait">
                {registrationState === 'registered' ? (
                  <motion.div
                    key="registered"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-500/25">
                      <RiCheckLine size={16} /> {t('proctoring_setup.status_face_registered', 'Face Registered Successfully')}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {t('proctoring_setup.confidence_frames', 'Confidence: {{confidence}}% • {{frames}} frames captured', { confidence: (registrationConfidence * 100).toFixed(0), frames: registrationProgress.current })}
                    </span>
                  </motion.div>
                ) : registrationState === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col items-center gap-2 w-full"
                  >
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 rounded-xl px-3 py-2 max-w-full">
                      <RiAlertLine size={14} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium text-center leading-snug">
                        {faceCheckError || t('proctoring_setup.error_registration_failed_retry', 'Registration failed. Please try again.')}
                      </span>
                    </div>
                    <button
                      onClick={retryRegistration}
                      className="px-5 py-2 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1.5"
                    >
                      <RiLoader4Line size={13} /> {t('proctoring_setup.retry_registration', 'Retry Registration')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-1.5 w-full"
                  >
                    <div className={`text-xs font-medium text-center transition-colors ${faceCheckError ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-slate-400 animate-pulse'
                      }`}>
                      {getRegistrationStatusText()}
                    </div>
                    {/* Quality feedback during capturing */}
                    {registrationState === 'registering' && qualityIssues.length > 0 && (
                      <div className="text-[10px] text-amber-500 dark:text-amber-400 text-center">
                        ⚠ {qualityIssues[0]}
                      </div>
                    )}
                    {registrationState === 'detecting' && faceStableCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {t('proctoring_setup.face_detected_hold', 'Face detected — hold still...')}
                      </div>
                    )}
                    {/* Frame progress dots during registration */}
                    {registrationState === 'registering' && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {Array.from({ length: registrationProgress.total || 3 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx < registrationProgress.current
                                ? 'bg-emerald-500 scale-110'
                                : idx === registrationProgress.current
                                  ? 'bg-cyan-400 animate-pulse'
                                  : 'bg-slate-200 dark:bg-white/10'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 4: Fullscreen Setup */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <RiFullscreenLine className="text-[#1a3884] dark:text-cyan-400" /> {t('proctoring_setup.fullscreen_title', 'Locked Fullscreen Mode')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                {t('proctoring_setup.fullscreen_desc', 'This assessment requires full screen alignment. Moving outside full screen boundaries is counted as a security violation.')}
              </p>

              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col gap-4 items-center justify-center text-center">
                {isFullScreenActive ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full inline-flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/25">
                      <RiCheckLine size={16} /> {t('proctoring_setup.fullscreen_active', 'Fullscreen Active')}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">{t('proctoring_setup.ready_to_launch', 'Assessment is ready to launch.')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{t('proctoring_setup.fullscreen_instruction', 'Click the button below to toggle fullscreen.')}</p>
                    <button
                      onClick={triggerFullscreen}
                      className="px-5 py-2.5 bg-[#1a3884] hover:bg-[#112b6b] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <RiFullscreenLine size={16} /> {t('proctoring_setup.request_fullscreen', 'Request Full Screen')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-4 pt-3 border-t border-slate-150 dark:border-white/5 flex justify-between items-center gap-3 shrink-0">
          {/* Skip face registration — dev/testing convenience only */}
          {import.meta.env.DEV && step === 3 && registrationState !== 'registered' && (
            <button
              onClick={() => setStep(4)}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              Skip for now
            </button>
          )}

          <div className="ml-auto flex gap-3">
            {step < 4 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 && cameraState !== 'allowed') ||
                  (step === 2 && !consentGranted) ||
                  (step === 3 && registrationState !== 'registered')
                }
                className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${((step === 1 && cameraState === 'allowed') ||
                    (step === 2 && consentGranted) ||
                    (step === 3 && registrationState === 'registered'))
                    ? 'bg-[#1a3884] hover:bg-[#112b6b] text-white shadow-md hover:shadow-lg hover:translate-x-0.5'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent'
                  }`}
              >
                {t('proctoring_setup.continue_button', 'Continue')} <RiArrowRightLine size={16} />
              </button>
            ) : (
              <button
                onClick={handleStartTest}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-xs"
              >
                {t('proctoring_setup.start_assessment_now', 'Start Assessment Now')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringSetup;
