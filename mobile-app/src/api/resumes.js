/**
 * Resumes API client — `back-end/routes/resumes.js`.
 *
 * `POST /:id/export` renders a PDF server-side, which is why mobile does not
 * need the web's html2canvas + QR pipeline — it asks the server for the file
 * and shares the returned URL.
 */
import { apiClient } from './client';

export const listResumes = () => apiClient.get('/resumes').then((r) => r.data);

export const getResume = (id) => apiClient.get(`/resumes/${id}`).then((r) => r.data);

export const createResume = (payload) => apiClient.post('/resumes', payload).then((r) => r.data);

export const updateResume = (id, payload) => apiClient.put(`/resumes/${id}`, payload).then((r) => r.data);

export const deleteResume = (id) => apiClient.delete(`/resumes/${id}`).then((r) => r.data);

export const duplicateResume = (id) => apiClient.post(`/resumes/${id}/duplicate`).then((r) => r.data);

/** Server-side PDF render. Rate-limited by `resumeExportLimiter` (10/hour). */
export const exportResume = (id, payload = {}) =>
  apiClient.post(`/resumes/${id}/export`, payload).then((r) => r.data);

/** Public verification — no auth required. */
export const verifyResume = (resumePublicId) =>
  apiClient.get(`/resumes/verify/${encodeURIComponent(resumePublicId)}`).then((r) => r.data);
