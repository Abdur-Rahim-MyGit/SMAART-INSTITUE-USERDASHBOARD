/**
 * AI Career Coach API client — 1:1 port of
 * `front-end/src/services/aiCareerCoachApi.js`.
 *
 * These routes are mounted directly in `back-end/server.js` (not via a router
 * file), under `/api/ai-career-coach/*`. Every generative endpoint sits behind
 * `aiLimiter` — 30 requests per 15 minutes per user — because each one costs a
 * paid LLM call. Mobile must not retry them automatically; a failed analysis
 * should surface and wait for the student, or a background retry loop will burn
 * the whole quota in a minute.
 */
import { apiClient } from './client';

const base = '/ai-career-coach';

// ── Profile ─────────────────────────────────────────────────────────────────

export const getCoachProfile = () => apiClient.get(`${base}/profile`).then((r) => r.data);

export const updateCoachProfile = (profileData) =>
  apiClient.put(`${base}/profile`, profileData).then((r) => r.data);

/** Rate-limited (aiLimiter). */
export const analyzeProfile = () => apiClient.post(`${base}/profile/analyze`, {}).then((r) => r.data);

// ── Career guidance ─────────────────────────────────────────────────────────

export const getCareerRecommendations = () =>
  apiClient.get(`${base}/recommendations`).then((r) => r.data);

/** Rate-limited. */
export const analyzeSkillGap = (targetRole) =>
  apiClient.post(`${base}/skill-gap`, { targetRole }).then((r) => r.data);

/** Rate-limited. */
export const generateLearningPlan = (targetRole, timeframe = '6 months') =>
  apiClient.post(`${base}/learning-plan`, { targetRole, timeframe }).then((r) => r.data);

/** Rate-limited. */
export const generateResume = (targetRole) =>
  apiClient.post(`${base}/resume`, { targetRole }).then((r) => r.data);

/** Rate-limited. */
export const generateSummary = (resumeData, targetRole) =>
  apiClient.post(`${base}/generate-summary`, { resumeData, targetRole }).then((r) => r.data);

// ── Chat ────────────────────────────────────────────────────────────────────

/**
 * Send a message. Omit `sessionId` to start a new conversation — the server
 * returns the id to carry forward on subsequent turns.
 * Rate-limited.
 */
export const sendChatMessage = (message, sessionId = null) =>
  apiClient.post(`${base}/chat`, { message, sessionId }).then((r) => r.data);

export const getChatSessions = () => apiClient.get(`${base}/chat/sessions`).then((r) => r.data);

export const getChatHistory = (sessionId) =>
  apiClient.get(`${base}/chat/${sessionId}`).then((r) => r.data);
