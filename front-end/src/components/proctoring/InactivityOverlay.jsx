import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiMouseLine, RiTimeLine } from '@remixicon/react';

/**
 * Inactivity presence check — blurred-screen overlay.
 *
 * Shown after 30 seconds without mouse, keyboard or touch activity. The
 * candidate clicks "Continue Assessment" to dismiss it and resume. If they
 * do not respond within the grace period (30 seconds), the system records an
 * inactivity violation.
 *
 * Deliberately non-accusatory: it reads as a helpful check, not an
 * interruption.
 */
const GRACE_SECONDS = 30;

export const InactivityOverlay = ({ onDismiss, onTimeout }) => {
  const [secondsLeft, setSecondsLeft] = useState(GRACE_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* Blurred backdrop — the assessment is still visible underneath */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl dark:bg-black/60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="inactivity-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-[#00152E]/95"
      >
        {/* Glow effect */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
          <RiMouseLine className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title */}
        <h2
          id="inactivity-title"
          className="text-xl font-bold text-slate-900 dark:text-white"
        >
          Are you still there?
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          You appear inactive. Move your mouse or click the button below to
          resume your assessment.
        </p>

        {/* Countdown ring */}
        <div className="mx-auto my-6 relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              className="fill-none stroke-slate-100 dark:stroke-white/5"
              strokeWidth="4"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              className="fill-none stroke-amber-500 dark:stroke-amber-400"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={Math.PI * 2 * 34}
              animate={{
                strokeDashoffset:
                  Math.PI * 2 * 34 * (1 - secondsLeft / GRACE_SECONDS),
              }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black tabular-nums text-slate-800 dark:text-white">
              {secondsLeft}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              sec
            </span>
          </div>
        </div>

        {/* CTA button */}
        <button
          type="button"
          onClick={onDismiss}
          autoFocus
          className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/15 transition hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-[0.98] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-900"
        >
          Continue Assessment
        </button>

        {/* Footer note */}
        <p className="mt-3 flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
          <RiTimeLine className="h-3 w-3" />
          Not responding will record an inactivity event.
        </p>
      </motion.div>
    </div>
  );
};

export default InactivityOverlay;
