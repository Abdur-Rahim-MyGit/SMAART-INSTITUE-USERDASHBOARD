import { apiClient } from './client';

// Public route (no auth) — mirrors front-end's CollegeBanners.jsx.
export const getCollegeBanners = (collegeId) =>
  apiClient.get(`/colleges/${collegeId}/banners`).then((r) => r.data);
