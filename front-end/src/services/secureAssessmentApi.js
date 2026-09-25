import { apiCall } from './api';

/**
 * Secure assessment (Safe Exam Browser + screen capture) endpoints.
 */
export const secureAssessmentApi = {
  /** Is this assessment code in secure mode for the signed-in student? */
  status: async (code) => apiCall(`/assessments/code/${encodeURIComponent(code)}/secure-status`),

  /** The Secure Pilot card, if this student is on the pilot list. */
  pilot: async () => apiCall('/assessments/secure/pilot'),

  /** Mint a launch: returns { sebsUrl, configUrl, expiresAt, stage, configKey }. */
  launch: async (assessmentId, platform) =>
    apiCall(`/assessments/${assessmentId}/secure/launch`, {
      method: 'POST',
      body: JSON.stringify({ platform: platform || '' })
    }),

  /** Inside SEB: swap the launch token for a signed-in session. */
  exchange: async (lt) =>
    apiCall('/assessments/secure/exchange', {
      method: 'POST',
      body: JSON.stringify({ lt })
    }),

  /** Upload a screen frame (image/jpeg) or clip (video/webm) for a session. */
  uploadScreen: async (sessionId, blob, kind = 'frame', reason = '') => {
    const form = new FormData();
    form.append('kind', kind);
    if (reason) form.append('reason', reason);
    const ext = kind === 'clip' ? 'webm' : 'jpg';
    form.append('media', blob, `${kind}-${Date.now()}.${ext}`);
    return apiCall(`/proctoring/session/${sessionId}/screen`, {
      method: 'POST',
      body: form,
      timeout: 60000
    });
  }
};

export default secureAssessmentApi;
