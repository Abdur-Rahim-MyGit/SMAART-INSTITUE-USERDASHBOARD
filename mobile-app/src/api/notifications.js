/**
 * Notifications API client — `back-end/routes/notifications.js`.
 *
 * The backend carries two generations of the schema side by side: older rows
 * key the owner on `recipient` + `read`, newer ones on `userId` + `isRead`.
 * Every route queries both, and `PATCH /:id/read` writes both flags — so a
 * client only has to read `isRead ?? read` and never has to care which
 * generation a row came from. `isUnread()` below is that one place.
 */
import { apiClient } from './client';

/**
 * @param {{ page?: number, limit?: number, unreadOnly?: boolean }} params
 * @returns {Promise<{ notifications: any[], pagination: object, unreadCount: number }>}
 */
export const getNotifications = ({ page = 1, limit = 30, unreadOnly = false } = {}) =>
  apiClient
    .get('/notifications', {
      params: { page, limit, ...(unreadOnly ? { unreadOnly: 'true' } : {}) },
    })
    .then((r) => r.data);

export const getUnreadCount = () =>
  apiClient.get('/notifications/unread-count').then((r) => r.data);

export const markRead = (id) =>
  apiClient.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllRead = () =>
  apiClient.patch('/notifications/read-all').then((r) => r.data);

export const deleteNotification = (id) =>
  apiClient.delete(`/notifications/${id}`).then((r) => r.data);

export const clearAllNotifications = () =>
  apiClient.delete('/notifications/clear-all').then((r) => r.data);

/** True when a notification has not been read, under either schema generation. */
export const isUnread = (n) => !(n?.isRead ?? n?.read ?? false);
