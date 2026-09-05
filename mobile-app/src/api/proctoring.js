import { apiClient } from './client';

/**
 * Proctoring API client — mirrors back-end/routes/proctoring.js and
 * controllers/proctoringController.js.
 *
 * THE DECISION CONTRACT
 * ---------------------
 * `logEvent` and `heartbeat` both answer with a `proctoring` object. That
 * object is the ONLY thing the client is allowed to act on — the server owns
 * risk scoring and tier selection (FR-PROC-12):
 *
 *   {
 *     tier: 'ok' | 'warn' | 'pause' | 'held',
 *     warnings, maxWarnings, riskScore,
 *     status, held, reason, ticketId
 *   }
 *
 * FLAG_ONLY_MODE is handled entirely server-side: when it is on, `buildDecision`
 * downgrades `pause`/`held` to `warn` before the client ever sees them. So a
 * client that simply renders whatever tier it is given supports both modes with
 * no branching of its own — that is FR-PROC-15, satisfied by obedience rather
 * than by duplicating the policy.
 *
 * A 409 from `heartbeat` means the session was already held; the body still
 * carries `proctoring`, so read it rather than treating the status as fatal.
 */

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

/**
 * Liveness ping (FR-PROC-10). The server measures the gap between pings and
 * records `proctoring_offline` itself when one is too long — the client cannot
 * suppress an absence by simply not reporting it.
 */
export const heartbeat = (sessionId) =>
  apiClient.post(`/proctoring/session/${sessionId}/heartbeat`, {}).then((r) => r.data);

/**
 * Snapshot evidence upload (FR-PROC-13). Multipart; the server applies the same
 * ownership check as every other session route.
 * @param {string} sessionId
 * @param {{ uri: string, name?: string, type?: string }} file
 * @param {string} reason  why this frame was captured (e.g. 'face_mismatch')
 */
export const uploadSnapshot = (sessionId, file, reason) => {
  const form = new FormData();
  form.append('snapshot', {
    uri: file.uri,
    name: file.name || `snapshot-${Date.now()}.jpg`,
    type: file.type || 'image/jpeg',
  });
  if (reason) form.append('reason', reason);
  return apiClient
    .post(`/proctoring/session/${sessionId}/upload-snapshot`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

/** Ask the server to hold the session. Rarely needed — the server locks itself. */
export const triggerLock = (sessionId, reason) =>
  apiClient.post(`/proctoring/session/${sessionId}/lock`, { reason }).then((r) => r.data);
