/**
 * Vision Board API client — talks to the "Pro" tier only.
 *
 * The plain `/vision-board` and `/user-vision-boards` backends exist in the
 * repo but have zero live web consumers (confirmed by tracing every importer
 * of their frontend API clients) and one has a known ownership-check gap on
 * GET/PUT/DELETE :id — so mobile targets the same endpoints the real web UI
 * (`VisionBoardGalleryPro` / `VisionBoardView`) uses:
 * `back-end/routes/visionBoardProRoutes.js` mounted at `/api/vision-board-pro`.
 *
 * Auth: every route is behind `protect` (JWT bearer), and userId is derived
 * server-side from the token — apiClient's existing Authorization header is
 * sufficient, no `?userId=` needed.
 */
import { apiClient } from './client';

const BASE = '/vision-board-pro';

export const visionBoardAPI = {
  // GET /vision-board-pro → { success, count, maxAllowed, canCreateMore, data: [...] }
  getAllVisionBoards: () => apiClient.get(BASE).then((r) => r.data),

  // GET /vision-board-pro/:id → { success, data }
  getVisionBoard: (id) => apiClient.get(`${BASE}/${id}`).then((r) => r.data),

  // POST /vision-board-pro → { success, message, data } (or 400 maxReached)
  createVisionBoard: (payload) => apiClient.post(BASE, payload).then((r) => r.data),

  // PUT /vision-board-pro/:id → { success, message, data }
  updateVisionBoard: (id, payload) => apiClient.put(`${BASE}/${id}`, payload).then((r) => r.data),

  // DELETE /vision-board-pro/:id → { success, message }
  deleteVisionBoard: (id) => apiClient.delete(`${BASE}/${id}`).then((r) => r.data),

  // POST /vision-board-pro/:id/duplicate → { success, message, data } (or 400 maxReached)
  duplicateVisionBoard: (id) => apiClient.post(`${BASE}/${id}/duplicate`).then((r) => r.data),
};

export default visionBoardAPI;
