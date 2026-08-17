/**
 * CGPA Calculator API client — `back-end/routes/cgpaRoutes.js`.
 *
 * GET /cgpa returns the saved `{ activeMethod, semestersData, cgpa, percentage }`
 * (or `data: null` if the student has never saved a result). POST /cgpa/save
 * upserts the whole record for the current user, keyed by userId server-side.
 */
import { apiClient } from './client';

export const getCgpa = () => apiClient.get('/cgpa').then((r) => r.data);

export const saveCgpa = (payload) => apiClient.post('/cgpa/save', payload).then((r) => r.data);
