import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiAlertLine,
  RiTimeLine,
  RiCameraLine,
  RiWindowLine
} from '@remixicon/react';

const VIOLATION_DETAILS = {
  tab_switch: {
    title: 'Tab Switching Forbidden',
    description: 'You switched tabs or minimized the browser window. The system locks focus onto the assessment. All switches are logged.',
    icon: <RiWindowLine className="text-red-500 w-12 h-12" />
  },
  minimize: {
    title: 'Focus Lost',
    description: 'The browser window lost active focus. Ensure you do not click outside the test screen or switch tasks.',
    icon: <RiWindowLine className="text-red-500 w-12 h-12" />
  },
  inactivity: {
    title: 'Inactivity Timeout',
    description: 'No activity was detected for 5 minutes. The assessment requires your continuous focus.',
    icon: <RiTimeLine className="text-red-500 w-12 h-12" />
  },
  face_absent: {
    title: 'Candidate Face Not Detected',
    description: 'Your face went out of view or was blocked. Ensure your webcam has clear visibility and your face remains centered.',
    icon: <RiCameraLine className="text-red-500 w-12 h-12" />
  },
  multiple_faces: {
    title: 'Multiple Persons Detected',
    description: 'More than one face was detected in the camera frame. The assessment must be taken individually.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  fullscreen_exit: {
    title: 'Fullscreen Mode Deactivated',
    description: 'You exited fullscreen mode. Proctoring rules enforce active fullscreen.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  attention_check_fail: {
    title: 'Liveness Verification Missed',
    description: 'You failed to acknowledge the periodic liveness check popup in time.',
    icon: <RiTimeLine className="text-red-500 w-12 h-12" />
  }
};

export const ProctoringWarningModal = ({
  isOpen,
  warningsCount,
  maxWarnings,
  violationType,
  onAcknowledge
}) => {
  const [countdown, setCountdown] = useState(3);
  const details = VIOLATION_DETAILS[violationType] || {
    title: 'Security Exception',
    description: 'A proctoring integrity rule violation was recorded.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  };

  // Button countdown lock to enforce reading
  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#00152E] border border-red-200 dark:border-red-950/20 rounded-3xl p-6 shadow-[0_24px_50px_rgba(0,0,0,0.12)] dark:shadow-2xl relative overflow-hidden text-center text-slate-800 dark:text-white"
      >
        {/* Warning Background Splash */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />

        {/* Bouncing Infraction Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-full animate-bounce">
            {details.icon}
          </div>
        </div>

        {/* Warning Level */}
        <span className="text-xs font-black uppercase tracking-[0.25em] text-red-550 dark:text-red-400">
          Security Warning {warningsCount} of {maxWarnings + 1}
        </span>
        
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-3">
          {details.title}
        </h3>
        
        <p className="text-sm text-slate-655 dark:text-slate-350 mb-6 leading-relaxed">
          {details.description}
        </p>

        {/* Warning Statement */}
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3.5 mb-6 text-xs text-red-750 dark:text-red-300 font-semibold leading-relaxed">
          {warningsCount > maxWarnings ? (
            <span>Disqualification threshold reached. Submitting test...</span>
          ) : (
            <span>
              Next violation will result in assessment termination and lock-out.
            </span>
          )}
        </div>

        {/* Acknowledge Action */}
        <button
          onClick={onAcknowledge}
          disabled={countdown > 0}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-98 ${
            countdown > 0
              ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent'
              : 'bg-red-600 hover:bg-red-700 text-white hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-red-500/10'
          }`}
        >
          {countdown > 0 ? `Please read constraints (${countdown}s)` : 'I Acknowledge & Resume'}
        </button>
      </motion.div>
    </div>
  );
};

export default ProctoringWarningModal;
