/**
 * Resumes API client — `back-end/routes/resumes.js`.
 *
 * `POST /:id/export` only registers a verification record (no file).
 * `GET /:id/pdf` is the actual server-side render (pdfkit) — it returns a
 * public `/uploads/resumes/...` URL the app can open in the browser.
 */
import { apiClient, API_BASE_URL } from './client';

export const listResumes = () => apiClient.get('/resumes').then((r) => r.data);

export const getResume = (id) => apiClient.get(`/resumes/${id}`).then((r) => r.data);

export const createResume = (payload) => apiClient.post('/resumes', payload).then((r) => r.data);

export const updateResume = (id, payload) => apiClient.put(`/resumes/${id}`, payload).then((r) => r.data);

export const deleteResume = (id) => apiClient.delete(`/resumes/${id}`).then((r) => r.data);

export const duplicateResume = (id) => apiClient.post(`/resumes/${id}/duplicate`).then((r) => r.data);

/** Registers a verification record only — see `exportResumePdf` for the file. */
export const exportResume = (id, payload = {}) =>
  apiClient.post(`/resumes/${id}/export`, payload).then((r) => r.data);

/**
 * Server-side PDF render (rate-limited by `resumeExportLimiter`). Returns an
 * ABSOLUTE URL to the generated file, resolved against the API host so the
 * app can hand it straight to Linking.openURL.
 */
export const exportResumePdf = async (id) => {
  const res = await apiClient.get(`/resumes/${id}/pdf`).then((r) => r.data);
  if (res?.url && !/^https?:\/\//i.test(res.url)) {
    res.url = API_BASE_URL.replace(/\/api\/?$/, '') + res.url;
  }
  return res;
};

/** Public verification — no auth required. */
export const verifyResume = (resumePublicId) =>
  apiClient.get(`/resumes/verify/${encodeURIComponent(resumePublicId)}`).then((r) => r.data);
