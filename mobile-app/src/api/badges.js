/**
 * Badges API client — `back-end/routes/badges.js`.
 *
 * Only the read endpoints a student needs to see their own earned badges.
 * Badge *awarding* is a server-side concern (course/assessment completion
 * hooks) — this client deliberately does not expose POST /badges/award, so
 * no screen is tempted to run a client-side "auto-award" loop on mount.
 */
import { apiClient } from './client';

export const getEarnedBadges = (userId) =>
  apiClient.get(`/badges/user/${encodeURIComponent(userId)}/earned`).then((r) => r.data);

export const getBadgeStats = (userId) =>
  apiClient.get(`/badges/user/${encodeURIComponent(userId)}/stats`).then((r) => r.data);
