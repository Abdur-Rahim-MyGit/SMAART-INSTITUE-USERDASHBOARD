import { apiClient } from './client';

export const notificationsAPI = {
  getNotifications: (params = {}) => apiClient.get('/notifications', { params }).then((r) => r.data),
  getUnreadCount: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.patch('/notifications/read-all').then((r) => r.data),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`).then((r) => r.data),
  clearAll: () => apiClient.delete('/notifications/clear-all').then((r) => r.data),
  registerPushToken: (token, platform) =>
    apiClient.post('/notifications/push-token', { token, platform }).then((r) => r.data),
  unregisterPushToken: (token) =>
    apiClient.delete('/notifications/push-token', { data: { token } }).then((r) => r.data),
};
