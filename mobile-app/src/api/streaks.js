import { apiClient } from './client';

// Mirrors front-end DashboardLayout.jsx: record today's activity on dashboard
// load, then read the streak. Both routes sit behind `protect` in
// back-end/routes/streaks.js.

/** @returns {Promise<{ success, data: { currentStreak, longestStreak, lastActivityDate } }>} */
export const getStreakStatus = () => apiClient.get('/streaks/status').then((r) => r.data);

export const recordActivity = () => apiClient.post('/streaks/activity').then((r) => r.data);
