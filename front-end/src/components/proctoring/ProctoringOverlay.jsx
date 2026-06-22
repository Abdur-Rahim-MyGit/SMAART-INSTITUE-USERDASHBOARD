import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RiCameraOffLine,
  RiSubtractLine,
  RiFullscreenLine,
  RiShieldCheckLine,
  RiUserUnfollowLine,
  RiEyeOffLine,
  RiGroupLine
} from '@remixicon/react';

// Map verification statuses to display info
const STATUS_CONFIG = {
  verified: {
    label: 'Verified',
    fullLabel: 'Identity Verified',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    icon: RiShieldCheckLine
  },
  mismatch: {
    label: 'Mismatch',
    fullLabel: 'Face Not Matched',
    dotColor: 'bg-red-500',
    textColor: 'text-red-500',
    icon: RiUserUnfollowLine
  },
  no_face: {
    label: 'No Face',
    fullLabel: 'No Face Detected',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-500',
    icon: RiCameraOffLine
  },
  multiple_faces: {
    label: 'Multiple',
    fullLabel: 'Multiple Faces',
    dotColor: 'bg-red-500',
    textColor: 'text-red-500',
    icon: RiGroupLine
  },
  covered: {
    label: 'Covered',
    fullLabel: 'Face Obstructed',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-500',
    icon: RiEyeOffLine
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
  // NEW props
  verificationStatus = 'no_face',
  similarityScore = 0
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const videoRef = useRef(null);

  // Bind the camera stream to the video element
  useEffect(() => {
    if (videoRef.current && stream && isCameraActive) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.warn('[ProctoringOverlay] Error playing webcam stream:', err);
      });
    }
  }, [stream, isCameraActive]);

  const statusConfig = STATUS_CONFIG[verificationStatus] || STATUS_CONFIG.no_face;

  // Similarity bar segments (like a signal strength indicator)
  const getSignalBars = () => {
    if (verificationStatus !== 'verified') return 0;
    if (similarityScore >= 0.8) return 4;
    if (similarityScore >= 0.5) return 3;
    if (similarityScore >= 0.2) return 2;
    if (similarityScore > 0) return 1;
    return 0;
  };

  const signalBars = getSignalBars();

  return (
    <div className="fixed z-40 pointer-events-none inset-0">
      {/* Draggable PIP Webcam Container */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={{ x: 'calc(100vw - 190px)', y: 'calc(100vh - 240px)' }}
        className="absolute w-[170px] bg-white/95 dark:bg-[#00152E]/90 border border-slate-200 dark:border-[#1a3884]/40 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-2xl p-2 pointer-events-auto backdrop-blur-md select-none text-slate-800 dark:text-slate-100 transition-colors duration-300"
      >
        {/* Header bar for dragging / actions */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5 mb-2 cursor-move">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-350 tracking-wider uppercase">
              {isMinimized ? 'Proctor' : 'AI Proctoring'}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-400 hover:text-slate-655 dark:hover:text-white transition-colors"
            title={isMinimized ? 'Expand feed' : 'Minimize feed'}
          >
            <RiSubtractLine size={12} className={isMinimized ? 'rotate-90' : ''} />
          </button>
        </div>

        {/* Video stream panel (Hidden if minimized) */}
        {!isMinimized && (
          <div className="relative aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 mb-1.5">
            {isCameraActive && stream ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                muted
                playsInline
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                <RiCameraOffLine size={18} />
                <span className="text-[9px] mt-1 text-center font-medium px-2">Webcam Inactive</span>
              </div>
            )}
            
            {/* Verification Status Badge */}
            {isCameraActive && (
              <div className="absolute bottom-1 right-1 flex items-center gap-1">
                {/* Signal bars */}
                {verificationStatus === 'verified' && (
                  <div className="flex items-end gap-[2px] h-3 mr-0.5">
                    {[1, 2, 3, 4].map(bar => (
                      <div
                        key={bar}
                        className={`w-[3px] rounded-sm transition-all duration-300 ${
                          bar <= signalBars
                            ? 'bg-emerald-400'
                            : 'bg-white/20'
                        }`}
                        style={{ height: `${bar * 3}px` }}
                      />
                    ))}
                  </div>
                )}
                <div className="px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-bold text-slate-200">
                  {statusConfig.label}
                </div>
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

          {/* Warnings Row */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 px-2 py-1.5 rounded">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Warnings:</span>
            <span className={`font-black ${warningsCount > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-350'}`}>
              {warningsCount} / {maxWarnings + 1}
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
