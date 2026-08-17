/**
 * Courses API client.
 *
 * Mirrors the web dashboard's learning surface against the same backend routes
 * (`back-end/routes/courses.js` and `back-end/routes/courseEnrollments.js`), so
 * mobile and web read the same data with no server change.
 *
 * Progress writes (`task`/`video`/`quiz`) all resolve the student from the auth
 * token server-side via `ownStudentId` — `studentId` is passed only as a hint
 * and is never trusted, so a caller cannot write progress onto another account.
 */
import { apiClient } from './client';

// ─── Catalogue ──────────────────────────────────────────────────────────────

export const getEnrollments = (studentId) =>
  apiClient.get(`/courseEnrollments/student/${studentId}`).then((r) => r.data);

export const getPublishedCourses = () =>
  apiClient.get('/courses?status=active&limit=100').then((r) => r.data);

export const getCourseById = (courseId) =>
  apiClient.get(`/courses/${courseId}`).then((r) => r.data);

export const getCourseByCode = (code) =>
  apiClient.get(`/courses/code/${encodeURIComponent(code)}`).then((r) => r.data);

/**
 * Primary course source for the player — resolves a catalogue id (S01, PIQ01)
 * or a Mongo id, and returns the course enriched for playback (`learningFlow`,
 * modules/days, admin quizzes). This is what the web's CoursePlayer loads
 * first; `getCourseStages` is only its fallback.
 */
export const getCourseByCatalog = (catalogId) =>
  apiClient.get(`/courses/catalog/${encodeURIComponent(catalogId)}`).then((r) => r.data);

/** Module list for a course — the spine of the course-detail screen. */
export const getCourseModules = (courseId) =>
  apiClient.get(`/courses/${courseId}/modules`).then((r) => r.data);

/** Stage breakdown (T1–T4 grouping) used to gate/order modules. */
export const getCourseStages = (courseId) =>
  apiClient.get(`/courses/${courseId}/stages`).then((r) => r.data);

// ─── Enrolment ──────────────────────────────────────────────────────────────

export const enrollInCourse = (payload) =>
  apiClient.post('/courseEnrollments', payload).then((r) => r.data);

export const getEnrollment = (enrollmentId) =>
  apiClient.get(`/courseEnrollments/${enrollmentId}`).then((r) => r.data);

export const updateEnrollment = (enrollmentId, payload) =>
  apiClient.put(`/courseEnrollments/${enrollmentId}`, payload).then((r) => r.data);

// ─── Progress ───────────────────────────────────────────────────────────────

export const getUserProgress = (courseCode) =>
  apiClient.get(`/courseEnrollments/user-progress/${encodeURIComponent(courseCode)}`).then((r) => r.data);

export const saveUserProgress = (payload) =>
  apiClient.post('/courseEnrollments/user-progress/save', payload).then((r) => r.data);

/** Mark a single task done/undone. */
export const saveTaskProgress = ({ courseCode, moduleId, dayId, taskId, completed, studentId }) =>
  apiClient
    .post('/courseEnrollments/task-progress', { courseCode, moduleId, dayId, taskId, completed, studentId })
    .then((r) => r.data);

/**
 * Checkpoint video position. `maxWatchedTime` is a high-water mark, not the
 * current head — the server keeps the furthest point reached so scrubbing
 * backwards never loses credit for what was already watched.
 */
export const saveVideoProgress = ({ courseCode, moduleId, dayId, stepId, maxWatchedTime, videoDuration, isCompleted, studentId }) =>
  apiClient
    .post('/courseEnrollments/video-progress', {
      courseCode, moduleId, dayId, stepId, maxWatchedTime, videoDuration, isCompleted, studentId,
    })
    .then((r) => r.data);

export const saveQuizProgress = ({ courseCode, moduleId, dayId, quizId, score, totalPoints, studentId }) =>
  apiClient
    .post('/courseEnrollments/quiz-progress', { courseCode, moduleId, dayId, quizId, score, totalPoints, studentId })
    .then((r) => r.data);

export const saveTaskResult = (payload) =>
  apiClient.post('/courseEnrollments/task-result', payload).then((r) => r.data);
