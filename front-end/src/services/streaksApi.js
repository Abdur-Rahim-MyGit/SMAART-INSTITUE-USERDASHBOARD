import { apiCall } from "./api";

export const streaksAPI = {
  getStatus: async () => {
    return apiCall('/streaks/status');
  },
  recordActivity: async () => {
    return apiCall('/streaks/activity', { method: 'POST' });
  },
  restoreStreak: async (voucherCode) => {
    return apiCall('/streaks/restore', {
      method: 'POST',
      body: JSON.stringify({ voucherCode })
    });
  }
};
