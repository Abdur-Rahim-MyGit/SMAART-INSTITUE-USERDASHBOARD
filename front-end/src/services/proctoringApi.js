import { apiCall } from './api';

export const proctoringApi = {
  // Start a new proctoring session
  startSession: async (data) => {
    return apiCall('/proctoring/session/start', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Log a proctoring event
  logEvent: async (sessionId, eventData) => {
    return apiCall(`/proctoring/session/${sessionId}/event`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  // Complete a proctoring session
  completeSession: async (sessionId) => {
    return apiCall(`/proctoring/session/${sessionId}/complete`, {
      method: 'POST'
    });
  },

  // Trigger lockout for a proctoring session
  triggerLock: async (sessionId, data) => {
    return apiCall(`/proctoring/session/${sessionId}/lock`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Upload a webcam snapshot
  uploadSnapshot: async (sessionId, imageBlob) => {
    const formData = new FormData();
    formData.append('snapshot', imageBlob, `snapshot-${Date.now()}.jpg`);
    
    return apiCall(`/proctoring/session/${sessionId}/upload-snapshot`, {
      method: 'POST',
      body: formData
    });
  },

  // Admin: Get all proctoring sessions
  getSessions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(query ? `/proctoring/admin/sessions?${query}` : '/proctoring/admin/sessions');
  },

  // Admin: Get detailed proctoring session
  getSessionDetails: async (sessionId) => {
    return apiCall(`/proctoring/admin/session/${sessionId}`);
  },

  // v2: Persist ArcFace registration embedding to the session record
  // embedding: Float32Array | number[]
  saveRegistration: async (sessionId, registrationData) => {
    const { embedding, model, qualityScore, framesCaptured, antispoofPassed, alignedCropUrl } = registrationData;
    return apiCall(`/proctoring/session/${sessionId}/registration`, {
      method: 'POST',
      body: JSON.stringify({
        embedding: Array.from(embedding),  // Convert Float32Array → plain array for JSON
        model,
        qualityScore,
        framesCaptured,
        antispoofPassed,
        alignedCropUrl: alignedCropUrl || null,
      }),
    });
  },

  // v2: Retrieve stored embedding for session resume after page refresh
  getEmbedding: async (sessionId) => {
    return apiCall(`/proctoring/session/${sessionId}/embedding`);
  },
};

export default proctoringApi;
