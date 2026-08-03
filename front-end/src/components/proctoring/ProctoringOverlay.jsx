import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  RiCameraOffLine,
  RiSubtractLine,
  RiFullscreenLine,
  RiShieldCheckLine,
  RiUserUnfollowLine,
  RiEyeOffLine,
  RiGroupLine
} from '@remixicon/react';

import { detectOnly } from '@/services/onnxPipeline';

// Map verification statuses to display info
const STATUS_CONFIG = {
  verified: {
    label: 'Face Detected',
    fullLabel: 'Face Detected',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    icon: RiShieldCheckLine
  },
  mismatch: {
    label: 'Face Mismatch',
    fullLabel: 'Face Mismatch',
    dotColor: 'bg-red-500',
    textColor: 'text-red-500',
    icon: RiUserUnfollowLine
  },
  no_face: {
    label: 'No Face',
    fullLabel: 'No Face Detected',
    dotColor: 'bg-red-500 animate-pulse',
    textColor: 'text-red-500',
    icon: RiCameraOffLine
  },
  multiple_faces: {
    label: 'Multiple Faces',
    fullLabel: 'Multiple Faces Detected',
    dotColor: 'bg-red-500 animate-pulse',
    textColor: 'text-red-500',
    icon: RiGroupLine
  },
  covered: {
    label: 'Face Blocked',
    fullLabel: 'Face Obstructed',
    dotColor: 'bg-amber-500 animate-pulse',
    textColor: 'text-amber-500',
    icon: RiEyeOffLine
  },
  spoof_detected: {
    label: 'Spoof Detected',
    fullLabel: 'Spoof / Replay Detected',
    dotColor: 'bg-red-500 animate-pulse',
    textColor: 'text-red-500',
    icon: RiUserUnfollowLine
  },
  model_unavailable: {
    label: 'Initialising…',
    fullLabel: 'Initialising AI…',
    dotColor: 'bg-slate-400 animate-pulse',
    textColor: 'text-slate-400',
    icon: RiShieldCheckLine
  },
  error: {
    label: 'Error',
    fullLabel: 'Detection Error',
    dotColor: 'bg-slate-400',
    textColor: 'text-slate-400',
    icon: RiCameraOffLine
  }
};

export const ProctoringOverlay = ({
  stream,
  isCameraActive,
  isFaceDetected,
  faceCount,
  warningsCount,
  maxWarnings,
  isFullScreen,
  fullscreenCountdown,
  onRequestFullscreen,
  verificationStatus = 'no_face',
  similarityScore = 0,
  gazeDirection = 'center'
}) => {
  const { t } = useTranslation();
  const [isMinimized, setIsMinimized] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const inFlightRef = useRef(false);

  // Bind the camera stream to the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.warn('[ProctoringOverlay] Error playing webcam stream:', err);
      });
    }
  }, [stream, isCameraActive, isMinimized]);

  // Real-time canvas overlay drawing bounding box & landmarks
  useEffect(() => {
    if (isMinimized || !stream || !isCameraActive) return;

    let isSubscribed = true;

    const drawOverlay = async () => {
      if (!isSubscribed) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && !inFlightRef.current) {
        const cW = video.clientWidth || 180;
        const cH = video.clientHeight || 135;

        if (canvas.width !== cW || canvas.height !== cH) {
          canvas.width = cW;
          canvas.height = cH;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, cW, cH);

        inFlightRef.current = true;
        try {
          const faces = await detectOnly(video);
          if (faces && faces.length > 0 && isSubscribed) {
            const vW = video.videoWidth || 640;
            const vH = video.videoHeight || 480;

            const scaleX = cW / vW;
            const scaleY = cH / vH;

            for (const face of faces) {
              const { box, landmarks } = face;

              const x = box.x * scaleX;
              const y = box.y * scaleY;
              const w = box.width * scaleX;
              const h = box.height * scaleY;

              const isOK = verificationStatus === 'verified' || verificationStatus === 'ok';
              const strokeColor = verificationStatus === 'covered' ? '#F59E0B' : (verificationStatus === 'mismatch' || verificationStatus === 'multiple_faces' || verificationStatus === 'no_face') ? '#EF4444' : '#10B981';
              const dotColor = '#06B6D4';

              // 1. Draw Bounding Box
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(x, y, w, h);

              // 2. Corner HUD Brackets
              const cornerLen = Math.min(w, h) * 0.25;
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 2.5;

              // Top-Left
              ctx.beginPath();
              ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
              ctx.stroke();

              // Top-Right
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
              ctx.stroke();

              // Bottom-Left
              ctx.beginPath();
              ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
              ctx.stroke();

              // Bottom-Right
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
              ctx.stroke();

              // Bounding box and corner HUD brackets are drawn above
            }
          }
        } catch (e) {
          // ignore transient detection frame error
        } finally {
          inFlightRef.current = false;
        }
      }

      if (isSubscribed) {
        animFrameRef.current = setTimeout(drawOverlay, 80);
      }
    };

    drawOverlay();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, [isMinimized, stream, isCameraActive, verificationStatus]);

  const statusConfig = STATUS_CONFIG[verificationStatus] || STATUS_CONFIG.no_face;

  // Similarity bar segments (like a signal strength indicator)
  const getSignalBars = () => {
    if (verificationStatus !== 'verified') return 0;
    if (similarityScore > 0.85) return 4;
    if (similarityScore > 0.70) return 3;
    if (similarityScore > 0.55) return 2;
    return 1;
  };

  const signalBars = getSignalBars();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] select-none pointer-events-none">
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ left: -window.innerWidth + 220, right: 0, top: -window.innerHeight + 180, bottom: 0 }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-auto w-[180px] bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 tracking-wide uppercase">
              AI Proctoring
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title={isMinimized ? "Expand Camera" : "Minimize Camera"}
          >
            <RiSubtractLine size={12} />
          </button>
        </div>

        {/* Video Box */}
        {!isMinimized && (
          <div className="relative aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 mb-1.5">
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => e.target.play().catch(() => { })}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]"
                />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                <RiCameraOffLine size={18} />
                <span className="text-[9px] mt-1 text-center font-medium px-2">Webcam Inactive</span>
              </div>
            )}

            {/* Signal bars */}
            {isCameraActive && verificationStatus === 'verified' && (
              <div className="absolute bottom-1 right-1 flex items-end gap-[2px] h-3 mr-0.5 bg-black/40 px-1 py-0.5 rounded">
                {[1, 2, 3, 4].map(bar => (
                  <div
                    key={bar}
                    className={`w-[3px] rounded-sm transition-all duration-300 ${bar <= signalBars
                        ? 'bg-emerald-400'
                        : 'bg-white/20'
                      }`}
                    style={{ height: `${bar * 3}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Rows */}
        <div className="space-y-1 text-[10px]">
          {/* Verification Status Row */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2 py-1.5 rounded">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <span className={`font-black ${statusConfig.textColor}`}>
              {statusConfig.fullLabel}
            </span>
          </div>

          {/* 3D Head Pose Gaze Direction Row */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2 py-1.5 rounded">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Gaze:</span>
            <span className={`font-bold ${gazeDirection === 'center'
                ? 'text-emerald-500'
                : gazeDirection === 'looking_down'
                  ? 'text-red-500 font-black'
                  : 'text-amber-500 font-black'
              }`}>
              {gazeDirection === 'center'
                ? 'Center ✓'
                : gazeDirection === 'looking_left'
                  ? '← Left'
                  : gazeDirection === 'looking_right'
                    ? 'Right →'
                    : gazeDirection === 'looking_down'
                      ? '↓ Down'
                      : '↑ Up'}
            </span>
          </div>

          {/* Warnings Row */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2 py-1.5 rounded">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Warnings:</span>
            <span className={`font-black ${warningsCount > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-350'}`}>
              {warningsCount} / {maxWarnings}
            </span>
          </div>

          {!isFullScreen && (
            <button
              onClick={onRequestFullscreen}
              className="w-full px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-black animate-pulse text-center flex items-center justify-center gap-1 mt-1 cursor-pointer transition-all shadow-sm active:scale-95"
            >
              <RiFullscreenLine size={10} /> Full Screen ({fullscreenCountdown}s)
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProctoringOverlay;
