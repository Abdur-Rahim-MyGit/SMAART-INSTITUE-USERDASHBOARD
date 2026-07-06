import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import * as faceapi from '@vladmandic/face-api';
import {
  loadModels,
  registerFace,
  detectFaces,
  isReady as isModelsReady
} from '@/services/faceVerificationService';

export const ProctoringSetup = ({ onComplete, assessmentTitle }) => {
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
  const [registrationProgress, setRegistrationProgress] = useState({ current: 0, total: 5 });
  const [registrationConfidence, setRegistrationConfidence] = useState(0);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [faceCheckError, setFaceCheckError] = useState(null);
  const [faceStableCount, setFaceStableCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const localStreamRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const faceStableCountRef = useRef(0);

  // 1. Run network speed checks
  useEffect(() => {
    if (step === 1) {
      const checkNetwork = async () => {
        const start = Date.now();
        try {
          await fetch('/api/auth/me', { signal: AbortSignal.timeout(3000) }).catch(() => {});
          const latency = Date.now() - start;
          setNetworkLatency(latency);
          setNetworkState(latency < 350 ? 'good' : 'poor');
        } catch {
          setNetworkLatency(400);
          setNetworkState('poor');
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
      console.error('[ProctoringSetup] Camera access denied:', err);
      setCameraState('denied');
    }
  };

  // Handle microphone permission check (NEW)
  const requestMicAccess = async () => {
    setMicState('checking');
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Immediately release — we only needed to verify permission
      micStream.getTracks().forEach(t => t.stop());
      setMicState('allowed');
    } catch (err) {
      console.error('[ProctoringSetup] Microphone access denied:', err);
      setMicState('denied');
    }
  };

  // Auto-request both on first render (common flow)
  useEffect(() => {
    if (step === 1 && micState === 'pending') {
      // Stagger by 1s after camera prompt to avoid permission-denial cascade
      const t = setTimeout(requestMicAccess, 1200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Load AI Models when entering step 3
  const loadAIModels = useCallback(async () => {
    if (isModelsReady()) {
      setModelLoadState('loaded');
      setModelLoadProgress(100);
      return;
    }

    setModelLoadState('loading');
    setModelLoadProgress(0);

    try {
      await loadModels((progress) => {
        setModelLoadProgress(progress);
      });
      setModelLoadState('loaded');
      console.log('[ProctoringSetup] ✅ AI models loaded successfully');
    } catch (err) {
      console.error('[ProctoringSetup] Model loading failed:', err);
      setModelLoadState('error');
      setFaceCheckError('Failed to load AI models. Please check your connection and try again.');
    }
  }, []);

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

    faceapi.matchDimensions(canvas, displaySize);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!faces || faces.length === 0) return;

    const resizedDetections = faceapi.resizeResults(faces.map(f => f.detection), displaySize);
    const resizedLandmarks = faces.map(f => faceapi.resizeResults(f.landmarks, displaySize));

    resizedDetections.forEach(detection => {
      const box = detection.box;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });

    resizedLandmarks.forEach(landmarks => {
      ctx.fillStyle = '#10b981';
      const points = landmarks.positions;
      points.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, []);

  // Run multi-frame face registration
  const startFaceRegistration = useCallback(async () => {
    if (!videoRef.current) return;

    setRegistrationState('registering');
    setRegistrationProgress({ current: 0, total: 5 });
    setFaceCheckError(null);

    try {
      const result = await registerFace(videoRef.current, {
        frameCount: 5,
        intervalMs: 600,
        onFrameCaptured: (frameIndex, totalFrames, descriptor, face) => {
          setRegistrationProgress({ current: frameIndex, total: totalFrames });
          if (face) {
            drawFaceFeedback([face]);
          }
        },
        onError: (err) => {
          console.warn('[ProctoringSetup] Registration frame issue:', err);
        }
      });

      setRegisteredDescriptor(result.descriptor);
      setRegistrationConfidence(result.confidence);
      setRegistrationState('registered');
      clearCanvas();

      console.log(`[ProctoringSetup] ✅ Face registered: ${result.framesCaptured} frames, confidence: ${(result.confidence * 100).toFixed(1)}%`);
    } catch (err) {
      console.error('[ProctoringSetup] Face registration failed:', err);
      setRegistrationState('error');
      setFaceCheckError(err.message || 'Face registration failed. Please try again.');
      clearCanvas();
    }
  }, [drawFaceFeedback, clearCanvas]);

  // Start face detection scanning (pre-registration)
  const startFaceScanning = useCallback(() => {
    if (!videoRef.current || !localStreamRef.current) return;

    setRegistrationState('detecting');
    setFaceCheckError(null);
    faceStableCountRef.current = 0;

    faceCheckIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const result = await detectFaces(videoRef.current);

        if (result.error) {
          return; // Skip frame
        }

        if (result.faceCount === 1 && result.faces[0].hasDescriptor) {
          faceStableCountRef.current += 1;
          setFaceStableCount(faceStableCountRef.current);
          setFaceCheckError(null);
          drawFaceFeedback(result.faces);

          // Face stable for 2+ consecutive checks (~1.6 seconds) → ready to register
          if (faceStableCountRef.current >= 2 && registrationState !== 'registering' && registrationState !== 'registered') {
            // Auto-start registration
            clearInterval(faceCheckIntervalRef.current);
            faceCheckIntervalRef.current = null;
            startFaceRegistration();
          }
        } else if (result.faceCount === 0) {
          faceStableCountRef.current = 0;
          setFaceStableCount(0);
          setFaceCheckError('No face detected. Ensure your face is clearly visible and well-lit.');
          clearCanvas();
        } else if (result.faceCount > 1) {
          faceStableCountRef.current = 0;
          setFaceStableCount(0);
          setFaceCheckError('Multiple faces detected. Only you should be in frame.');
          drawFaceFeedback(result.faces);
        }
      } catch (err) {
        console.error('[ProctoringSetup] Face scanning error:', err);
      }
    }, 800);
  }, [registrationState, startFaceRegistration, drawFaceFeedback, clearCanvas]);

  // Step 3: Load models then start scanning
  useEffect(() => {
    if (step === 3) {
      // Bind video stream
      if (localStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
        videoRef.current.play().catch(err => console.warn('Video playback failed:', err));
      }

      // Load AI models first, then start scanning
      const init = async () => {
        await loadAIModels();
        // Only start scanning if models loaded successfully
        if (isModelsReady()) {
          startFaceScanning();
        }
      };
      init();
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
      setStep(4);
    }
  };

  const handleStartTest = () => {
    // Release setup streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (faceCheckIntervalRef.current) {
      clearInterval(faceCheckIntervalRef.current);
    }

    // Check fullscreen
    if (!isFullScreenActive) {
      triggerFullscreen();
    }

    // Pass the registered face descriptor to the parent
    onComplete({ faceDescriptor: registeredDescriptor });
  };

  // Retry registration (reset state and rescan)
  const retryRegistration = () => {
    setRegistrationState('idle');
    setRegisteredDescriptor(null);
    setRegistrationConfidence(0);
    setFaceCheckError(null);
    faceStableCountRef.current = 0;
    setFaceStableCount(0);

    if (isModelsReady()) {
      startFaceScanning();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  // Helper: render face registration progress text
  const getRegistrationStatusText = () => {
    if (modelLoadState === 'loading') return 'Loading AI Models...';
    if (modelLoadState === 'error') return 'Model loading failed';
    if (registrationState === 'detecting') return 'Detecting your face...';
    if (registrationState === 'face_found') return 'Face found! Hold still...';
    if (registrationState === 'registering') return `Registering identity (${registrationProgress.current}/${registrationProgress.total})`;
    if (registrationState === 'registered') return 'Face Registered Successfully';
    if (registrationState === 'error') return 'Registration failed';
    return 'Preparing...';
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
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 dark:bg-[#000F24]/80 backdrop-blur-lg flex items-center justify-center p-4 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full max-w-xl bg-white dark:bg-[#002147] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-2xl relative overflow-hidden">
        
        {/* Glow decorative effects */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#1a3884]/5 dark:bg-[#1a3884]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#1a3884] dark:text-cyan-400">AI Integrity Setup</span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-slate-900 dark:text-white">
            Preparing: {assessmentTitle || 'SMAART Assessment'}
          </h2>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                s === step
                  ? 'bg-[#1a3884] dark:bg-cyan-400 w-12'
                  : s < step
                  ? 'bg-emerald-500'
                  : 'bg-slate-100 dark:bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step Contents */}
        <div className="min-h-[280px]">
          {/* STEP 1: Camera & Hardware Checks */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <RiCameraLine className="text-[#1a3884] dark:text-cyan-400" /> Camera & Hardware Test
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350">
                To guarantee test credibility, a functioning webcam is required. Permissions must be explicitly granted.
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">Required for identity verification</p>
                    </div>
                  </div>
                  {cameraState === 'allowed' ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/25">
                      <RiCheckLine size={14} /> Allowed
                    </span>
                  ) : cameraState === 'checking' ? (
                    <span className="text-xs text-slate-400 animate-pulse">Checking...</span>
                  ) : cameraState === 'denied' ? (
                    <button
                      onClick={requestWebcamAccess}
                      className="text-xs font-bold text-red-500 dark:text-red-400 hover:underline"
                    >
                      Retry Permission
                    </button>
                  ) : (
                    <button
                      onClick={requestWebcamAccess}
                      className="px-4 py-2 bg-[#1a3884] hover:bg-[#112b6b] text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      Grant Access
                    </button>
                  )}
                </div>

              {/* Microphone Row (NEW) */}
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

                {/* Network Row */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-200/50 dark:bg-white/5 rounded-xl">
                      <RiShieldCheckLine size={20} className="text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Network Speed Check</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Latency verification</p>
                    </div>
                  </div>
                  {networkState === 'checking' ? (
                    <span className="text-xs text-slate-400 animate-pulse">Checking...</span>
                  ) : networkState === 'good' ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/25">
                      Good ({networkLatency}ms)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-yellow-655 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-100 dark:border-yellow-500/25">
                      Unstable ({networkLatency}ms)
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Compliance Consent */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <RiShieldCheckLine className="text-[#1a3884] dark:text-cyan-400" /> Security Compliance Consent
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                By ticking the consent statement below, you acknowledge that this assessment utilizes AI Proctoring with face verification. Your face will be registered at the start and continuously verified throughout the assessment. Dynamic snapshots, liveness indicators, and screen focus are continuously logged under the Digital Personal Data Protection Act (DPDPA 2023). All session records are securely processed and auto-purged within 30 days of attempt completion.
              </p>

              <div className="bg-[#1a3884]/5 dark:bg-[#1a3884]/20 border border-[#1a3884]/15 dark:border-[#1a3884]/40 rounded-2xl p-4 flex gap-3 items-start">
                <RiInformationLine size={20} className="text-[#1a3884] dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Strict Actions:</strong> Minimizing window focus, opening browser DevTools, exiting fullscreen mode, or showing a different face will trigger warnings and can lead to immediate lockout disqualification.
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
                  I consent to face registration, identity verification, and agree to the integrity checks.
                </span>
              </label>
            </motion.div>
          )}

          {/* STEP 3: Face Registration */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 flex flex-col items-center">
              <h3 className="text-lg font-bold text-center self-start flex items-center gap-2 text-slate-900 dark:text-white">
                <RiUserSmileLine className="text-[#1a3884] dark:text-cyan-400" /> Face Registration
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350 text-left self-start">
                Look straight into the camera. The AI will capture your face identity and verify you throughout the assessment.
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
                />
                
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]"
                />
                
                {/* Scanning overlay */}
                {registrationState === 'detecting' && (
                  <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 rounded-2xl animate-pulse" />
                )}

                {/* Registration progress overlay */}
                {registrationState === 'registering' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                      <RiLoader4Line size={16} className="text-cyan-400 animate-spin" />
                      <span className="text-xs text-white font-bold">
                        Capturing {registrationProgress.current}/{registrationProgress.total}
                      </span>
                    </div>
                  </div>
                )}

                {/* Success overlay */}
                {registrationState === 'registered' && (
                  <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl">
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 backdrop-blur-sm py-1.5 flex items-center justify-center gap-1.5">
                      <RiCheckLine size={14} className="text-white" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Registered</span>
                    </div>
                  </div>
                )}

                {/* Model loading overlay */}
                {modelLoadState === 'loading' && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RiLoader4Line size={24} className="text-cyan-400 animate-spin mb-2" />
                    <span className="text-xs text-cyan-300 font-bold">Loading AI Models</span>
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
                      <RiCheckLine size={16} /> Face Registered Successfully
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Confidence: {(registrationConfidence * 100).toFixed(0)}% • {registrationProgress.current} frames captured
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
                    <div className="text-xs text-red-500 dark:text-red-400 font-medium text-center">
                      {faceCheckError || 'Registration failed. Please try again.'}
                    </div>
                    <button
                      onClick={retryRegistration}
                      className="px-4 py-1.5 border border-[#1a3884]/30 text-[#1a3884] hover:bg-[#1a3884]/5 dark:text-cyan-400 dark:border-cyan-400/30 dark:hover:bg-cyan-400/5 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      Retry Registration
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
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center animate-pulse">
                      {faceCheckError || getRegistrationStatusText()}
                    </div>
                    {registrationState === 'detecting' && faceStableCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Face detected — hold still...
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
                <RiFullscreenLine className="text-[#1a3884] dark:text-cyan-400" /> Locked Fullscreen Mode
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                This assessment requires full screen alignment. Moving outside full screen boundaries is counted as a security violation.
              </p>

              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col gap-4 items-center justify-center text-center">
                {isFullScreenActive ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full inline-flex items-center gap-1 border border-emerald-100 dark:border-emerald-500/25">
                      <RiCheckLine size={16} /> Fullscreen Active
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-450 font-medium">Assessment is ready to launch.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Click the button below to toggle fullscreen.</p>
                    <button
                      onClick={triggerFullscreen}
                      className="px-5 py-2.5 bg-[#1a3884] hover:bg-[#112b6b] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <RiFullscreenLine size={16} /> Request Full Screen
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-8 pt-4 border-t border-slate-150 dark:border-white/5 flex justify-end gap-3">
          {step < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={
                (step === 1 && cameraState !== 'allowed') ||
                (step === 2 && !consentGranted) ||
                (step === 3 && registrationState !== 'registered')
              }
              className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                ((step === 1 && cameraState === 'allowed') ||
                 (step === 2 && consentGranted) ||
                 (step === 3 && registrationState === 'registered'))
                  ? 'bg-[#1a3884] hover:bg-[#112b6b] text-white shadow-md hover:shadow-lg hover:translate-x-0.5'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent'
              }`}
            >
              Continue <RiArrowRightLine size={16} />
            </button>
          ) : (
            <button
              onClick={handleStartTest}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-xs"
            >
              Start Assessment Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProctoringSetup;
