/**
 * Assessment stage configuration — ported verbatim from `STAGE_MAP` in
 * `front-end/src/pages/BaseLineTest.jsx`.
 *
 * These numbers are the contract between client and server: `code` selects the
 * assessment document, `questionLimit` truncates the server's question list,
 * and `durationMinutes` is the wall the countdown runs against. They must not
 * drift from the web — a student who starts T2 in a browser and finishes it on
 * a phone has to be taking the same test.
 *
 * `maxAttempts` and `passingPercentage` are shown in the UI; the server is the
 * one that actually enforces them (`stageresults.js`).
 */
export const STAGE_MAP = {
  T1: { code: 'ASM00001', name: 'Baseline',   title: 'Base Line Test',  questionLimit: 36, durationMinutes: 45, maxAttempts: 1, passingPercentage: 0  },
  T2: { code: 'ASM00002', name: 'Capacity',   title: 'Capacity Test',   questionLimit: 34, durationMinutes: 40, maxAttempts: 3, passingPercentage: 60 },
  T3: { code: 'ASM00003', name: 'Capability', title: 'Capability Test', questionLimit: 34, durationMinutes: 45, maxAttempts: 3, passingPercentage: 60 },
  T4: { code: 'ASM00004', name: 'Leadership', title: 'Leadership Test', questionLimit: 36, durationMinutes: 40, maxAttempts: 3, passingPercentage: 60 },
};

/** Display order — also the unlock order. */
export const STAGE_KEYS = ['T1', 'T2', 'T3', 'T4'];

/**
 * Per-stage accent, matching the three learning stages in `LearningScreen`
 * (Capacity emerald, Capability violet, Leadership amber) so a student sees one
 * colour language across the app. T1 is the baseline and takes the brand blue.
 */
export const STAGE_ACCENT = {
  T1: '#2563EB',
  T2: '#10B981',
  T3: '#8B5CF6',
  T4: '#F59E0B',
};

export const STAGE_ICON = {
  T1: 'activity',
  T2: 'layers',
  T3: 'zap',
  T4: 'award',
};

export const getStageConfig = (stageKey) => STAGE_MAP[stageKey] || STAGE_MAP.T1;

/**
 * Which stages are open, given the server's status map.
 *
 * Mirrors the web's gating: T1 is always available, and each later stage opens
 * once the previous one is completed. The server re-checks this on `start`, so
 * this is presentation only — never the enforcement point.
 */
export function deriveStageLocks(stageStatus) {
  const locks = {};
  let previousDone = true;
  STAGE_KEYS.forEach((key) => {
    locks[key] = {
      unlocked: previousDone,
      completed: Boolean(stageStatus?.[key]?.completed),
    };
    previousDone = Boolean(stageStatus?.[key]?.completed);
  });
  return locks;
}
