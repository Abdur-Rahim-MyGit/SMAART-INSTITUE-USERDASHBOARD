import { apiCall } from './api';

export const communityAPI = {
  // Get community stats
  getStats: async () => {
    return apiCall('/community/stats');
  },

  // Get discussions
  getDiscussions: async (params = {}) => {
    const filtered = Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== 'undefined') acc[k] = v;
      return acc;
    }, {});
    const queryParams = new URLSearchParams(filtered).toString();
    return apiCall(`/community/discussions?${queryParams}`);
  },

  // Get user's discussions
  getUserDiscussions: async (userId, params = {}) => {
    const filtered = Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== 'undefined') acc[k] = v;
      return acc;
    }, {});
    const queryParams = new URLSearchParams(filtered).toString();
    return apiCall(`/community/discussions/user/${userId}?${queryParams}`);
  },

  // Get bookmarked discussions
  getBookmarkedDiscussions: async (userId, params = {}) => {
    const filtered = Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== 'undefined') acc[k] = v;
      return acc;
    }, {});
    const queryParams = new URLSearchParams(filtered).toString();
    return apiCall(`/community/discussions/bookmarks/${userId}?${queryParams}`);
  },

  // Get single discussion
  getDiscussion: async (id) => {
    return apiCall(`/community/discussions/${id}`);
  },

  // Create discussion
  createDiscussion: async (data) => {
    const isFormData = data instanceof FormData;
    console.log('[API CALL] sending', data);
    return apiCall('/community/discussions', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      // If it's FormData, let the browser set the Content-Type automatically with boundary
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }
    });
  },

  // Like/Unlike discussion
  toggleLike: async (discussionId, userId) => {
    return apiCall(`/community/discussions/${discussionId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // React to discussion
  reactToDiscussion: async (discussionId, userId, type) => {
    return apiCall(`/community/discussions/${discussionId}/react`, {
      method: 'POST',
      body: JSON.stringify({ userId, type })
    });
  },

  // Bookmark/Unbookmark discussion
  toggleBookmark: async (discussionId, userId) => {
    return apiCall(`/community/discussions/${discussionId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Vote in poll
  voteInPoll: async (discussionId, userId, optionIndex) => {
    return apiCall(`/community/discussions/${discussionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ userId, optionIndex })
    });
  },

  // Add reply to discussion
  addReply: async (discussionId, content, authorId) => {
    return apiCall(`/community/discussions/${discussionId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content, authorId })
    });
  },

  editReply: async (discussionId, replyId, content, authorId) => {
    return apiCall(`/community/discussions/${discussionId}/reply/${replyId}`, {
      method: 'PUT',
      body: JSON.stringify({ content, authorId })
    });
  },

  deleteReply: async (discussionId, replyId, authorId) => {
    return apiCall(`/community/discussions/${discussionId}/reply/${replyId}`, {
      method: 'DELETE',
      body: JSON.stringify({ authorId })
    });
  },

  // Mark/Unmark best answer
  markBestAnswer: async (discussionId, replyId, authorId) => {
    return apiCall(`/community/discussions/${discussionId}/best-answer`, {
      method: 'POST',
      body: JSON.stringify({ replyId, authorId })
    });
  },

  // Report discussion
  reportDiscussion: async (discussionId, userId, reason) => {
    return apiCall(`/community/discussions/${discussionId}/report`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason })
    });
  },

  // Get featured groups
  getFeaturedGroups: async () => {
    return apiCall('/community/groups/featured');
  },

  // Get all groups
  getGroups: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/community/groups?${queryParams}`);
  },

  // Join/Leave group
  updateGroupMembership: async (groupId, userId, action) => {
    return apiCall(`/community/groups/${groupId}/membership`, {
      method: 'POST',
      body: JSON.stringify({ userId, action })
    });
  },

  // Get top contributors
  getTopContributors: async (limit = 5) => {
    return apiCall(`/community/contributors?limit=${limit}`);
  },

  // Seed community data (for development)
  seedData: async () => {
    return apiCall('/community/seed', {
      method: 'POST'
    });
  },

  // Search users for mentions
  searchUsers: async (query) => {
    return apiCall(`/community/search-users?query=${encodeURIComponent(query)}`);
  },

  // Add threaded reply to an existing reply
  addThreadedReply: async (discussionId, replyId, content, authorId) => {
    return apiCall(`/community/discussions/${discussionId}/reply/${replyId}/thread`, {
      method: 'POST',
      body: JSON.stringify({ content, authorId })
    });
  }
};
