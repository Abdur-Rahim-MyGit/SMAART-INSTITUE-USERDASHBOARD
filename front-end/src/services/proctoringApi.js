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

  // Liveness ping. The server measures the gap between pings and records a
  // violation when contact lapses — which is why going offline can no longer
  // produce a clean record.
  heartbeat: async (sessionId) => {
    return apiCall(`/proctoring/session/${sessionId}/heartbeat`, {
      method: 'POST'
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
  }
};

export default proctoringApi;
