import { apiClient } from './client';

export const getColleges = () => apiClient.get('/colleges').then((r) => r.data);

// Public route (no auth) — mirrors front-end's CollegeBanners.jsx.
export const getCollegeBanners = (collegeId) =>
  apiClient.get(`/colleges/${collegeId}/banners`).then((r) => r.data);
