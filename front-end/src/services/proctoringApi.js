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
