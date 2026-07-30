import { apiClient } from './client';

// Mirrors back-end/routes/proctoring.js + controllers/proctoringController.js.
// Registration/verification are scoped to a proctoring session (tied to a
// resultId + assessmentId), not a standalone profile setting — so these can't
// be exercised end-to-end until a real assessment attempt exists (Phase 2 of
// the roadmap doc). The face pipeline itself (src/facepipeline/) is already
// fully wired and testable standalone in the meantime.

export const startSession = (resultId, assessmentId, environmentCheck) =>
  apiClient.post('/proctoring/session/start', { resultId, assessmentId, environmentCheck }).then((r) => r.data);

export const saveRegistration = (sessionId, registration) =>
  apiClient.post(`/proctoring/session/${sessionId}/registration`, {
    embedding: registration.embedding,
    allEmbeddings: registration.allEmbeddings,
    model: registration.model,
    qualityScore: registration.qualityScore,
    framesCaptured: registration.framesCaptured,
  }).then((r) => r.data);

export const getEmbedding = (sessionId) =>
  apiClient.get(`/proctoring/session/${sessionId}/embedding`).then((r) => r.data);

export const logVerification = (sessionId, result) =>
  apiClient.post(`/proctoring/session/${sessionId}/verification`, {
    similarity: result.similarity,
    status: result.status,
    framesCaptured: 1,
    warningIssued: result.status !== 'verified',
  }).then((r) => r.data);

export const logEvent = (sessionId, event) =>
  apiClient.post(`/proctoring/session/${sessionId}/event`, event).then((r) => r.data);

export const completeSession = (sessionId) =>
  apiClient.post(`/proctoring/session/${sessionId}/complete`).then((r) => r.data);
