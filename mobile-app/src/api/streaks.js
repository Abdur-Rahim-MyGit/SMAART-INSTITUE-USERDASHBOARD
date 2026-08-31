/**
 * Streaks API client — `back-end/routes/streaks.js` (all routes `protect`ed,
 * scoped to the signed-in user via the JWT, so no userId parameter).
 *
 * Only the read endpoint Home needs. Recording activity and restoring a
 * broken streak are web/engagement-loop concerns not surfaced on mobile yet.
 */
import { apiClient } from './client';

/** { currentStreak, longestStreak, lastActivityDate, canRestore, ... } */
export const getStreakStatus = () =>
  apiClient.get('/streaks/status').then((r) => r.data);
