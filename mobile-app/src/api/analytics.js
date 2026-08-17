/**
 * Analytics API client — backs the mobile "Performance" screen.
 *
 * Wraps `GET /analytics/student`, the same endpoint web's
 * `StudentAnalyticsView` (front-end/src/components/AnalyticsCharts.jsx) calls
 * via `apiCall('/analytics/student')`. Handled server-side by
 * `back-end/controllers/analyticsController.js#getStudentAnalytics`
 * (route: `back-end/routes/analytics.js`, `authorize('student')`).
 *
 * Response shape: { success, metrics: { totalCourses, completedCourses,
 * inProgressCourses, totalHoursSpent, avgProgress, activityTime, dailyUsage },
 * courses: CourseEnrollment[], timeline: [{ date, progress, hoursSpent }],
 * visionBoards, finalPathway, careerAnalyses, userProgress, resumes, notes,
 * stageResults }. The mobile screen only consumes `metrics`, `courses`, and
 * `timeline` — the rest feeds web-only UI (see mobile IMPLEMENTATION_MAP.md).
 */
import { apiClient } from './client';

/** Student progression/usage analytics snapshot for the signed-in user. */
export const getStudentAnalytics = () =>
  apiClient.get('/analytics/student').then((r) => r.data);

export default { getStudentAnalytics };
