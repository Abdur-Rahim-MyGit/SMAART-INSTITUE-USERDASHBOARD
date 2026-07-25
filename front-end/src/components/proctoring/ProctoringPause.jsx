import React from 'react';
import { motion } from 'framer-motion';
import { RiPauseCircleLine } from '@remixicon/react';

/**
 * Tier 3 of the proctoring ladder — the single blocking moment.
 *
 * Reads as a pause, not a verdict. Slate and neutral, never red. It states
 * observations as facts rather than accusations, tells the candidate exactly
 * what happens next, and — critically — the timer stops while it is open.
 *
 * That one detail is what turns an interruption into process rather than
 * punishment, and removes any argument that proctoring cost the candidate
 * marks.
 */
const OBSERVATION_COPY = {
  tab_switch: 'You switched away from the assessment',
  minimize: 'The assessment window lost focus',
  fullscreen_exit: 'You left fullscreen',
  face_absent: 'You were away from the camera',
  multiple_faces: 'A second person appeared in the camera',
  face_mismatch: "The camera didn't match your registered photo",
  face_covered: 'Your face was partly hidden',
  proctoring_offline: 'We lost contact with your assessment',
  voice_detected: 'Talking was picked up',
  attention_check_fail: 'A check-in was missed',
  inactivity: 'A long period of inactivity'
};

export const ProctoringPause = ({
  isOpen,
  observations = [],
  warnings = 3,
  maxWarnings = 3,
  onResume
}) => {
  if (!isOpen) return null;

  const lines = (observations.length ? observations : ['attention_check_fail']).map(
    (o) => OBSERVATION_COPY[o] || 'Activity was recorded during your assessment'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="proctoring-pause-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-slate-800 shadow-2xl dark:border-white/10 dark:bg-[#00152E] dark:text-slate-100"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <RiPauseCircleLine className="h-3.5 w-3.5" aria-hidden="true" />
          Timer paused
        </span>

        <h3
          id="proctoring-pause-title"
          className="mt-4 text-xl font-bold text-slate-900 dark:text-white"
        >
          Let's pause for a moment
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Your assessment is on hold and your time has stopped. Nothing has been
          lost — every answer is saved.
        </p>

        <ul className="my-5 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          If someone else is in the room, please ask them to step out. When you
          continue, one further warning will send your assessment for review by
          our team.
        </p>

        <button
          type="button"
          onClick={onResume}
          autoFocus
          className="w-full rounded-xl bg-slate-800 py-3.5 text-sm font-bold text-white transition hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          I'm ready to continue
        </button>
      </motion.div>
    </div>
  );
};

export default ProctoringPause;
