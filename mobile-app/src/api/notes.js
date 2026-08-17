/**
 * Course notes API client — `back-end/routes/notes.js`.
 *
 * The server upserts one note per (user, courseId), so saving repeatedly for
 * the same course updates a single row rather than accumulating duplicates.
 */
import { apiClient } from './client';

export const getNotes = () => apiClient.get('/notes').then((r) => r.data);

export const getCourseNote = (courseId) =>
  apiClient.get(`/notes/${encodeURIComponent(courseId)}`).then((r) => r.data);

export const saveCourseNote = ({ courseId, title, content }) =>
  apiClient.post('/notes', { courseId, title, content }).then((r) => r.data);

export const deleteCourseNote = (courseId) =>
  apiClient.delete(`/notes/${encodeURIComponent(courseId)}`).then((r) => r.data);
