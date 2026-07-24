import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiErrorWarningLine, RiCloseLine } from '@remixicon/react';

/**
 * RED tier — a recorded warning.
 *
 * Deliberately NOT a modal. The exam stays fully usable underneath: the
 * candidate keeps answering while this is on screen. It states plainly what
 * was seen, shows the count openly, and offers a one-click remedy where one
 * exists (re-enter fullscreen, for example).
 *
 * Red here means "this was logged", not "you cheated". Everything softer than
 * a recorded warning is amber and never reaches the server; everything past it
 * (pause, held) drops back to neutral slate, so red marks exactly one thing:
 * the point at which the attempt's record changed.
 */
const COPY = {
  tab_switch: {
    title: 'Please return to the assessment window.',
    detail: 'This focus change has been recorded.'
  },
  minimize: {
    title: 'The assessment window lost focus.',
    detail: 'Please return to the assessment window. This focus change has been recorded.'
  },
  fullscreen_exit: {
    title: 'You left fullscreen mode.',
    detail: 'Your assessment needs to stay in fullscreen.'
  },
  face_absent: {
    title: 'Your face is not clearly visible.',
    detail: 'Please center your face in the camera frame.'
  },
  student_absent_extended: {
    title: "You've been away for over a minute.",
    detail: 'Please return to your assessment now.'
  },
  multiple_faces: {
    title: 'We detected another person in the camera view.',
    detail: 'The assessment has been flagged for review.'
  },
  face_mismatch: {
    title: "The camera doesn't match your registered photo.",
    detail: 'Make sure it is you in front of the camera, clearly lit.'
  },
  face_covered: {
    title: 'Your face is not clearly visible.',
    detail: 'Please center your face in the camera frame.'
  },
  proctoring_offline: {
    title: 'We lost contact with your assessment.',
    detail: 'Check your internet connection so monitoring can continue.'
  },
  voice_detected: {
    title: 'We picked up talking.',
    detail: 'Please stay quiet for the rest of the assessment.'
  },
  attention_check_fail: {
    title: 'You missed a quick check-in.',
    detail: 'Please respond when a check-in appears.'
  },
  inactivity: {
    title: 'You appear inactive.',
    detail: "Move your mouse or click 'Continue Assessment' to resume."
  }
};

export const ProctoringNotice = ({
  isOpen,
  violationType,
  warnings = 1,
  maxWarnings = 3,
  onFix = null,
  fixLabel = '',
  onDismiss = null
}) => {
  const copy = COPY[violationType] || {
    title: 'Something was recorded during your assessment.',
    detail: 'You can carry on — this has simply been noted.'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/25 dark:bg-red-500/10"
        >
          <RiErrorWarningLine className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />

          <span className="text-sm font-semibold text-red-800 dark:text-red-200">
            {copy.title}
          </span>
          <span className="text-sm text-red-700/80 dark:text-red-200/70">
            {copy.detail} This is warning {Math.min(warnings, maxWarnings)} of {maxWarnings}.
          </span>

          <div className="ml-auto flex items-center gap-2">
            {onFix && (
              <button
                type="button"
                onClick={onFix}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                {fixLabel || 'Fix this'}
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss this notice"
                className="rounded-lg p-1.5 text-red-700 transition hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-500/15"
              >
                <RiCloseLine className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProctoringNotice;
