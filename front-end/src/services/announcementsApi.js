import { apiCall } from './api';

export const announcementsAPI = {
  // Get announcements visible to the current user
  getAnnouncements: async (params = {}) => {
    const filtered = Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== '') acc[k] = v;
      return acc;
    }, {});
    const query = new URLSearchParams(filtered).toString();
    return apiCall(`/announcements?${query}`);
  },

  // Create a new announcement (admin / college_admin only)
  createAnnouncement: async (data) => {
    return apiCall('/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update an announcement
  updateAnnouncement: async (id, data) => {
    return apiCall(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete an announcement
  deleteAnnouncement: async (id) => {
    return apiCall(`/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  // Toggle pin (admin only)
  togglePin: async (id) => {
    return apiCall(`/announcements/${id}/pin`, {
      method: 'PATCH'
    });
  },
  
  // Toggle/Update reaction (any user)
  react: async (id, emoji) => {
    return apiCall(`/announcements/${id}/react`, {
      method: 'PATCH',
      body: JSON.stringify({ emoji })
    });
  }
};
