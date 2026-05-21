const ASSESSMENT_TIMER_PREFIX = "assessment_timer__";

export const buildAssessmentTimerStorageKeys = (stageKey, userId = "anonymous") => {
  const normalizedStage = String(stageKey || "T1").toUpperCase();
  const normalizedUser = String(userId || "anonymous");
  const baseKey = `${ASSESSMENT_TIMER_PREFIX}${normalizedStage}__${normalizedUser}`;

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
