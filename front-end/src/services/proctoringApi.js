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

  // Liveness ping — the server measures the gap between pings and records a
  // violation the candidate cannot suppress when contact lapses.
  heartbeat: async (sessionId) => {
    return apiCall(`/proctoring/session/${sessionId}/heartbeat`, {
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

  // v3: Persist ArcFace registration embedding(s) to the session record
  // embedding: Float32Array | number[] (merged)
  // allEmbeddings: number[][] (all 5 individual embeddings)
  // registrationImages: string[] (base64 data URLs of 5 crops)
  saveRegistration: async (sessionId, registrationData) => {
    const { embedding, allEmbeddings, registrationImages, model, qualityScore, framesCaptured, antispoofPassed, alignedCropUrl } = registrationData;
    return apiCall(`/proctoring/session/${sessionId}/registration`, {
      method: 'POST',
      body: JSON.stringify({
        embedding: Array.from(embedding),  // Convert Float32Array → plain array for JSON
        allEmbeddings: allEmbeddings
          ? allEmbeddings.map(e => e instanceof Float32Array ? Array.from(e) : e)
          : null,
        registrationImages: registrationImages || null,
        model,
        qualityScore,
        framesCaptured,
        antispoofPassed,
        alignedCropUrl: alignedCropUrl || null,
      }),
    });
  },

  // v3: Retrieve stored embedding(s) for session resume after page refresh
  getEmbedding: async (sessionId) => {
    return apiCall(`/proctoring/session/${sessionId}/embedding`);
  },

  // v3: Log batch verification result
  logVerification: async (sessionId, verificationData) => {
    const { similarity, status, framesCaptured, warningIssued } = verificationData;
    return apiCall(`/proctoring/session/${sessionId}/verification`, {
      method: 'POST',
      body: JSON.stringify({ similarity, status, framesCaptured, warningIssued }),
    });
  },
};

export default proctoringApi;
