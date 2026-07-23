import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiShieldCheckLine, RiFocus3Line, RiErrorWarningLine, RiPauseCircleLine } from '@remixicon/react';

/**
 * The live proctoring signal — a three-colour system.
 *
 *   GREEN  monitoring active, nothing happening
 *   AMBER  needs your attention, NOTHING on your record yet
 *   RED    recorded, counts toward your warning budget
 *
 * The pill is present from the first second, so a later change of colour reads
 * as information rather than an ambush. Amber is where the honest majority
 * lives and is never penalised; red is honest that something was logged.
 *
 * Neither is an accusation — that stays true at the end, where the worst
 * outcome is still "held for review" in neutral slate, never red.
 *
 * Note the colour a candidate sees is a presentation layer only. The server
 * records every red event at full fidelity regardless, so a gentler display
 * never means gentler enforcement.
 */
const TONE = {
  ok: {
    icon: RiShieldCheckLine,
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200 dark:border-emerald-500/25',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  nudge: {
    icon: RiFocus3Line,
    dot: 'bg-amber-500',
    ring: 'border-amber-200 dark:border-amber-500/25',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300'
  },
  // RED — a warning has been recorded against the attempt.
  warn: {
    icon: RiErrorWarningLine,
    dot: 'bg-red-500',
    ring: 'border-red-200 dark:border-red-500/25',
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-300'
  },
  pause: {
    icon: RiPauseCircleLine,
    dot: 'bg-slate-500',
    ring: 'border-slate-200 dark:border-slate-500/25',
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-300'
  },
  held: {
    icon: RiPauseCircleLine,
    dot: 'bg-slate-500',
    ring: 'border-slate-200 dark:border-slate-500/25',
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-300'
  }
};

export const ProctoringStatusPill = ({
  tier = 'ok',
  message = '',
  warnings = 0,
  maxWarnings = 3
}) => {
  const tone = TONE[tier] || TONE.ok;
  const Icon = tone.icon;

  // Tier 2+ shows the running count openly. Candidates who know the budget
  // stop panicking about it; there is nothing here worth hiding.
  const label =
    message ||
    (tier === 'warn' || tier === 'pause'
      ? `Warning ${Math.min(warnings, maxWarnings)} of ${maxWarnings}`
      : 'Monitoring active');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${tier}-${label}`}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.18 }}
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone.bg} ${tone.ring} ${tone.text}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {tier === 'ok' && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.dot}`} />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
        </span>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="max-w-[16rem] truncate">{label}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProctoringStatusPill;
