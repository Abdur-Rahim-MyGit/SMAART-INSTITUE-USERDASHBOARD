const ASSESSMENT_TIMER_PREFIX = "assessment_timer__";

export const buildAssessmentTimerStorageKeys = (stageKey, userId = "anonymous", resultId = "") => {
  const normalizedStage = String(stageKey || "T1").toUpperCase();
  const normalizedUser = String(userId || "anonymous");
  // Scope the clock to the specific attempt. A genuine mid-exam refresh keeps
  // the same resultId and so resumes the same clock (anti-cheat), while a fresh
  // attempt gets a new resultId and therefore a clean, full-duration timer —
  // instead of inheriting a previous attempt's already-elapsed clock.
  const normalizedResult = String(resultId || "");
  const attemptSuffix = normalizedResult ? `__${normalizedResult}` : "";
  const baseKey = `${ASSESSMENT_TIMER_PREFIX}${normalizedStage}__${normalizedUser}${attemptSuffix}`;

  return {
    startTimeKey: `${baseKey}__startTime`,
    warningShownKey: `${baseKey}__oneMinuteWarningShown`,
  };
};

export const clearAssessmentTimerStorage = () => {
  if (typeof window === "undefined") return;

  const keysToRemove = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    if (
      key.startsWith(ASSESSMENT_TIMER_PREFIX) ||
      /^(T1|T2|T3|T4)_(startTime|oneMinuteWarningShown)$/.test(key)
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
};
