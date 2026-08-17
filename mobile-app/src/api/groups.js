import { apiClient } from './client';

export const groupsAPI = {
  createGroup: (data) => apiClient.post('/groups/student', data).then(r => r.data),
  getMyGroups: () => apiClient.get('/groups/my').then(r => r.data),
  getGroup: (id) => apiClient.get(`/groups/${id}`).then(r => r.data),
  addMember: (groupId, studentId) => apiClient.post(`/groups/${groupId}/members`, { studentId }).then(r => r.data),
  leaveGroup: (groupId) => apiClient.delete(`/groups/${groupId}/members`).then(r => r.data),
  sendMessage: (groupId, content, image, video, poll) =>
    apiClient.post(`/groups/${groupId}/messages`, { content, image, video, poll }).then(r => r.data),
  voteInPoll: (groupId, messageId, optionIndex) =>
    apiClient.post(`/groups/${groupId}/messages/${messageId}/vote`, { optionIndex }).then(r => r.data),
  searchStudents: (query) => apiClient.get(`/groups/search/students`, { params: { query } }).then(r => r.data),
  removeMember: (groupId, memberId) => apiClient.delete(`/groups/${groupId}/members/${memberId}`).then(r => r.data),
  promoteToAdmin: (groupId, memberId) => apiClient.post(`/groups/${groupId}/admins/${memberId}`).then(r => r.data),
  demoteFromAdmin: (groupId, memberId) => apiClient.delete(`/groups/${groupId}/admins/${memberId}`).then(r => r.data),
  createChannel: (groupId, channelData) => apiClient.post(`/groups/${groupId}/channels`, channelData).then(r => r.data),
  getChannels: (groupId) => apiClient.get(`/groups/${groupId}/channels`).then(r => r.data),
  updateChannel: (groupId, channelId, channelData) => apiClient.put(`/groups/${groupId}/channels/${channelId}`, channelData).then(r => r.data),
  deleteChannel: (groupId, channelId) => apiClient.delete(`/groups/${groupId}/channels/${channelId}`).then(r => r.data),
  pinMessage: (groupId, messageId) => apiClient.post(`/groups/${groupId}/messages/${messageId}/pin`).then(r => r.data),
  unpinMessage: (groupId, messageId) => apiClient.post(`/groups/${groupId}/messages/${messageId}/pin`).then(r => r.data),
  addReaction: (groupId, messageId, emoji) => apiClient.post(`/groups/${groupId}/messages/${messageId}/react`, { emoji }).then(r => r.data),
  removeReaction: (groupId, messageId, emoji) => apiClient.delete(`/groups/${groupId}/messages/${messageId}/react`, { data: { emoji } }).then(r => r.data),
};
