import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiAlertLine,
  RiTimeLine,
  RiCameraLine,
  RiWindowLine,
  RiUserUnfollowLine,
  RiEyeOffLine
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
    title: 'Face Not Detected',
    description: 'Please position your face in front of the camera.',
    icon: <RiCameraLine className="text-red-500 w-12 h-12" />
  },
  multiple_faces: {
    title: 'Multiple Faces Detected',
    description: 'Only one person is allowed during the exam.',
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
  },
  face_mismatch: {
    title: 'Identity Mismatch',
    description: 'The face detected does not match the registered candidate. Ensure only the registered person is in front of the camera.',
    icon: <RiUserUnfollowLine className="text-red-500 w-12 h-12" />
  },
  face_covered: {
    title: 'Face Obstructed',
    description: 'Your face is not clearly visible. Remove any obstruction and look directly at the camera.',
    icon: <RiEyeOffLine className="text-red-500 w-12 h-12" />
  },
  gaze_away: {
    title: 'Looking Away from Screen',
    description: 'Keep your gaze focused directly on the assessment screen.',
    icon: <RiEyeOffLine className="text-red-500 w-12 h-12" />
  },
  looking_down: {
    title: 'Head Tilted Downward',
    description: 'Keep your head upright and focused on the assessment screen.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  eyes_closed: {
    title: 'Eyes Closed',
    description: 'Keep your eyes open and visible to the proctoring camera.',
    icon: <RiEyeOffLine className="text-red-500 w-12 h-12" />
  },
  phone_detected: {
    title: 'Mobile Phone Detected',
    description: 'Mobile devices are strictly prohibited during the assessment.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  book_detected: {
    title: 'Prohibited Material Detected',
    description: 'Notes, books, and external devices are not permitted.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  voice_detected: {
    title: 'Voice Activity Detected',
    description: 'Talking or speech is not permitted during the assessment.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  multiple_exam_windows: {
    title: 'Multiple Windows Open',
    description: 'The assessment is open in another browser window or tab.',
    icon: <RiWindowLine className="text-red-500 w-12 h-12" />
  },
  student_absent_extended: {
    title: 'Extended Absence Recorded',
    description: 'You were absent from the camera view for an extended period.',
    icon: <RiCameraLine className="text-red-500 w-12 h-12" />
  },
  camera_disabled: {
    title: 'Webcam Stream Interrupted',
    description: 'Camera access was turned off or lost. Continuous camera feed is required during the assessment.',
    icon: <RiCameraLine className="text-red-500 w-12 h-12" />
  },
  camera_tamper: {
    title: 'Camera Feed Tampered',
    description: 'The webcam stream was disconnected or modified during the test.',
    icon: <RiCameraLine className="text-red-500 w-12 h-12" />
  },
  proctoring_offline: {
    title: 'Network Connection Interrupted',
    description: 'Proctoring heartbeats were delayed due to connection loss.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  dev_tools_opened: {
    title: 'Developer Tools Detected',
    description: 'Opening browser developer tools or inspecting elements is forbidden.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  },
  browser_focus_lost: {
    title: 'Browser Focus Lost',
    description: 'The assessment window lost active focus. Please remain on the exam screen.',
    icon: <RiWindowLine className="text-red-500 w-12 h-12" />
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
    title: violationType ? violationType.replace(/_/g, ' ').toUpperCase() : 'Security Exception',
    description: 'A proctoring integrity rule violation was recorded.',
    icon: <RiAlertLine className="text-red-500 w-12 h-12" />
  };

  // Button countdown lock to enforce reading (timestamp based to prevent lag)
  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(3 - elapsed, 0);
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayMax = maxWarnings || 3;

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
          Security Warning {Math.min(warningsCount, displayMax)} of {displayMax}
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
