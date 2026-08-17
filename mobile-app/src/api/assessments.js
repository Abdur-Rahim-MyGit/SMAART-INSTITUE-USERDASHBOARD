/**
 * Assessment API client — a 1:1 port of `front-end/src/services/assessmentApi.js`.
 *
 * Every method here maps to the same backend route the web calls, with the same
 * arguments in the same order, so the two clients are interchangeable against
 * one server. Where the web returns `apiCall(...)` (already-unwrapped JSON),
 * these return `r.data` for the same shape.
 *
 * THE SESSION TOKEN
 * -----------------
 * `startAssessment` issues a dedicated per-attempt JWT (`assessmentToken`),
 * separate from the login token. `saveAnswer` and `submitAssessment` must send
 * it back as the `x-assessment-token` header — the server uses it to bind
 * writes to that specific attempt. Dropping it silently breaks answer
 * persistence, so it is a required-in-practice argument on both, exactly as on
 * web.
 *
 * Routes are spread across four backend files:
 *   assessments.js       — catalogue + per-code status
 *   results.js           — attempt lifecycle (start / answer / submit / fetch)
 *   stageresults.js      — T1–T4 stage rollup, attempts, restart
 *   baselineresults.js   — legacy T1 results
 */
import { apiClient } from './client';

const withToken = (token) => (token ? { headers: { 'x-assessment-token': token } } : undefined);

export const assessmentApi = {
  // ── Catalogue ─────────────────────────────────────────────────────────────

  /** All assessments. */
  getAll: () => apiClient.get('/assessments').then((r) => r.data),

  /** Look up by description, e.g. "big 5". */
  getByDescription: (description) =>
    apiClient.get(`/assessments/by-description/${encodeURIComponent(description)}`).then((r) => r.data),

  /** Look up by code, e.g. "ASM00001". Returns `data._id` used to start. */
  getByCode: (code) => apiClient.get(`/assessments/code/${code}`).then((r) => r.data),

  /** Whether this user has already completed the assessment with this code. */
  checkAssessmentStatus: (code) =>
    apiClient.get(`/assessments/code/${code}/status`).then((r) => r.data),

  // ── Attempt lifecycle ─────────────────────────────────────────────────────

  /**
   * Begin (or resume) an attempt.
   * Returns `{ resultId, assessmentToken, questions, responses, remainingSeconds, startedAt }`.
   * `remainingSeconds`/`startedAt` are server-authoritative — the client clock
   * is never the source of truth for how long is left.
   */
  startAssessment: (assessmentId) =>
    apiClient.get(`/results/assessment/${assessmentId}/start`).then((r) => r.data),

  /** Development-only: discard an attempt so it can be retaken. */
  resetAssessment: (resultId) =>
    apiClient.post(`/results/${resultId}/reset`).then((r) => r.data),

  /** Persist one answer immediately, as the web does on every selection. */
  saveAnswer: (resultId, questionId, selectedValue, questionText = '', token = null) =>
    apiClient
      .post(
        `/results/${resultId}/answer`,
        { questionId, selectedValue, questionText },
        withToken(token)
      )
      .then((r) => r.data),

  /**
   * Finalise the attempt and score it.
   * `options` carries the web's flags: `submissionReason`,
   * `completeMissingAnswers`, `forcePassDev`, `forceFailDev`.
   */
  submitAssessment: (resultId, token = null, options = {}) =>
    apiClient.post(`/results/${resultId}/submit`, options, withToken(token)).then((r) => r.data),

  /** All attempts for a user, optionally filtered by status. */
  getUserResults: (userId, status = null) =>
    apiClient
      .get(status ? `/results/user/${userId}?status=${status}` : `/results/user/${userId}`)
      .then((r) => r.data),

  /** One attempt's full detail, including the scored report. */
  getResult: (resultId) => apiClient.get(`/results/${resultId}`).then((r) => r.data),

  // ── Stage rollup (T1–T4) ──────────────────────────────────────────────────

  /** Legacy T1 baseline results. */
  getBaseLineResults: (userId) =>
    apiClient.get(`/baselineresults/user/${userId}`).then((r) => r.data),

  /** Every stage result for a user. */
  getStageResults: (userId) =>
    apiClient.get(`/stageresults/user/${userId}`).then((r) => r.data),

  /** One stage's result. `stage` is 'T1' | 'T2' | 'T3' | 'T4'. */
  getStageResult: (userId, stage) =>
    apiClient.get(`/stageresults/user/${userId}/stage/${stage}`).then((r) => r.data),

  /** Completion map across all stages — drives lock state on the dashboard. */
  getStageStatus: (userId) =>
    apiClient.get(`/stageresults/user/${userId}/status`).then((r) => r.data),

  /** Attempt history for a stage: count, pass/fail, locked. */
  getStageAttempts: (userId, stage) =>
    apiClient.get(`/stageresults/user/${userId}/stage/${stage}/attempts`).then((r) => r.data),

  /** Reset every stage for a user. */
  resetAllStages: (userId) =>
    apiClient.delete(`/stageresults/reset/${userId}/ALL`).then((r) => r.data),

  /** Clear attempts and restart the courses gating a stage. */
  restartStageCourse: (userId, stage) =>
    apiClient.post('/stageresults/restart-course', { userId, stage }).then((r) => r.data),
};

// Named re-exports so existing call sites (HomeScreen, LearningScreen) that
// import `getStageStatus` directly keep working unchanged.
export const getStageStatus = assessmentApi.getStageStatus;
export const getStageResult = assessmentApi.getStageResult;
export const getStageAttempts = assessmentApi.getStageAttempts;

export default assessmentApi;
