import { apiClient } from './client';

export const announcementsAPI = {
  getAnnouncements: (params = {}) => {
    // Filter out null/undefined/empty parameters
    const filtered = Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== '') acc[k] = v;
      return acc;
    }, {});
    return apiClient.get('/announcements', { params: filtered }).then(r => r.data);
  },
  react: (id, emoji) => apiClient.patch(`/announcements/${id}/react`, { emoji }).then(r => r.data),
};
