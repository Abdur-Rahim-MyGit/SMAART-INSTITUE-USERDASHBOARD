import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCameraLine,
  RiCheckLine,
  RiAlertLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiFullscreenLine,
  RiArrowRightLine
} from '@remixicon/react';
import { detectFaces } from '@/services/faceDetectionService';

export const ProctoringSetup = ({ onComplete, assessmentTitle }) => {
  const [step, setStep] = useState(1);
  const [cameraState, setCameraState] = useState('pending'); // 'pending' | 'checking' | 'allowed' | 'denied'
  const [networkLatency, setNetworkLatency] = useState(null);
  const [networkState, setNetworkState] = useState('checking'); // 'checking' | 'good' | 'poor'
  const [consentGranted, setConsentGranted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isFaceChecking, setIsFaceChecking] = useState(false);
  const [isFullScreenActive, setIsFullScreenActive] = useState(false);
  const [faceCheckError, setFaceCheckError] = useState(null);
  const [showSkipOption, setShowSkipOption] = useState(false);
  
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const skipTimeoutRef = useRef(null);

  // 1. Run network speed checks
  useEffect(() => {
    if (step === 1) {
      const checkNetwork = async () => {
        const start = Date.now();
        try {
          // Send a tiny request to verify latency
          await fetch('/api/security/warning-status?assessmentId=test', { signal: AbortSignal.timeout(3000) }).catch(() => {});
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
        video: { width: 320, height: 240, frameRate: { ideal: 15 } }
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

  // Run face check in Step 3
  const startFaceTracking = () => {
    if (!videoRef.current || !localStreamRef.current) return;
    setIsFaceChecking(true);
    setFaceDetected(false);
    setFaceCheckError(null);
    setShowSkipOption(false);

    let checkCount = 0;

    faceCheckIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const res = await detectFaces(videoRef.current);
        
        if (res.error) {
          console.warn('[ProctoringSetup] Face check warning:', res.error);
          checkCount++;
          if (checkCount > 4) {
            setFaceCheckError('Camera interface calibrating. Please wait...');
          }
          return;
        }

        if (res.isFacePresent) {
          if (res.faceCount === 1) {
            setFaceDetected(true);
            setFaceCheckError(null);
            clearInterval(faceCheckIntervalRef.current);
            faceCheckIntervalRef.current = null;
            setIsFaceChecking(false);
          } else {
            setFaceCheckError('Multiple faces detected. Please ensure only you are in frame.');
          }
        } else {
          setFaceCheckError('No face detected. Ensure your face is fully lit and centered.');
        }
      } catch (err) {
        console.error('[ProctoringSetup] Face tracking failed:', err);
      }
    }, 1500);

    // Show skip bypass option after 8 seconds of scanning
    skipTimeoutRef.current = setTimeout(() => {
      setShowSkipOption(true);
    }, 8000);
  };

  useEffect(() => {
    if (step === 3) {
      if (localStreamRef.current && videoRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
        videoRef.current.play().catch(err => console.warn('Video playback failed:', err));
      }
      startFaceTracking();
    } else {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = null;
      }
      setIsFaceChecking(false);
    }
    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    };
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
    } else if (step === 3 && faceDetected) {
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
    
    // Check fullscreen again or force it
    if (!isFullScreenActive) {
      triggerFullscreen();
    }
    
    onComplete();
  };

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
        <div className="min-h-[220px]">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">Required for liveness validation</p>
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
                By ticking the consent statement below, you acknowledge that this assessment utilizes AI Proctoring constraints. Dynamic snapshots, liveness indicators, and screen focus are continuously logged under the Digital Personal Data Protection Act (DPDPA 2023). All session records are securely processed and auto-purged within 30 days of attempt completion.
              </p>

              <div className="bg-[#1a3884]/5 dark:bg-[#1a3884]/20 border border-[#1a3884]/15 dark:border-[#1a3884]/40 rounded-2xl p-4 flex gap-3 items-start">
                <RiInformationLine size={20} className="text-[#1a3884] dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Strict Actions:</strong> Minimizing window focus, opening browser DevTools, exiting fullscreen mode, or looking away from the screen for prolonged periods will trigger warnings and can lead to immediate lockout disqualification.
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
                  I consent to identity validation and agree to the integrity checks.
                </span>
              </label>
            </motion.div>
          )}

          {/* STEP 3: Face & Liveness Setup */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 flex flex-col items-center">
              <h3 className="text-lg font-bold text-center self-start flex items-center gap-2 text-slate-900 dark:text-white">
                <RiCheckLine className="text-[#1a3884] dark:text-cyan-400" /> Liveness Verification
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-350 text-left self-start">
                Look straight into the camera. The AI will calibrate and verify face tracking is stable.
              </p>

              <div className="relative w-48 h-36 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1a3884]/30 shadow-lg">
                <video ref={videoRef} width={320} height={240} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
                
                {/* Bounding box or scanning overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 rounded-2xl animate-pulse" />
                
                {isFaceChecking && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="text-xs text-cyan-300 font-medium animate-pulse">Scanning for Face...</span>
                  </div>
                )}
              </div>

              {faceDetected ? (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full flex items-center gap-1.5 mt-2 border border-emerald-100 dark:border-emerald-500/25">
                  <RiCheckLine size={16} /> Face Calibration Successful
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 mt-2 w-full">
                  <div className="text-xs text-slate-500 dark:text-slate-400 animate-pulse text-center font-medium">
                    {faceCheckError || 'Please center your face inside the camera area.'}
                  </div>
                  {showSkipOption && (
                    <button
                      onClick={() => {
                        setFaceDetected(true);
                        setFaceCheckError(null);
                        setIsFaceChecking(false);
                        if (faceCheckIntervalRef.current) {
                          clearInterval(faceCheckIntervalRef.current);
                          faceCheckIntervalRef.current = null;
                        }
                      }}
                      className="mt-1 px-4 py-1.5 border border-[#1a3884]/30 text-[#1a3884] hover:bg-[#1a3884]/5 dark:text-cyan-400 dark:border-cyan-400/30 dark:hover:bg-cyan-400/5 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      Bypass Face Check (Soft Setup)
                    </button>
                  )}
                </div>
              )}
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
                (step === 3 && !faceDetected)
              }
              className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                ((step === 1 && cameraState === 'allowed') ||
                 (step === 2 && consentGranted) ||
                 (step === 3 && faceDetected))
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
