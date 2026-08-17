import { apiClient } from './client';

/**
 * communityFeedAPI — client for back-end/routes/community.js's discussion
 * feed, mounted at `/api/community` (`/community/discussions`,
 * `/community/groups`, `/community/contributors`, ...).
 *
 * NOT to be confused with `groupsAPI` (./groups.js), which talks to
 * `/api/groups` — real-time, chat-capable Study Groups against a completely
 * different Mongoose model. This file only ever touches the CommunityPost /
 * CommunityGroup models behind `/api/community/*`. Keep the two imports
 * distinct — do not repoint one at the other.
 *
 * Mirrors front-end/src/services/communityApi.js's endpoints 1:1 onto the
 * mobile axios client (mobile-app/src/api/client.js), which already injects
 * the Bearer token + device headers via its request interceptor, so no extra
 * auth plumbing is needed here. All /api/community/* routes sit behind
 * `router.use(protect)` server-side.
 */

export const communityFeedAPI = {
  // ── Discussions feed ──────────────────────────────────────────────────
  // GET query params the server accepts: page, limit, category, search,
  // sortBy ('createdAt' | 'popularity'), dateRange ('all'|'today'|'week'|'month'),
  // tags (comma-separated), channelType, collegeId. Omit channelType to get
  // the same default feed the web dashboard shows (discussion + coach +
  // legacy posts, excluding support/mentor).
  getDiscussions: (params = {}) =>
    apiClient.get('/community/discussions', { params }).then((r) => r.data),

  getUserDiscussions: (userId, params = {}) =>
    apiClient.get(`/community/discussions/user/${userId}`, { params }).then((r) => r.data),

  getBookmarkedDiscussions: (userId, params = {}) =>
    apiClient.get(`/community/discussions/bookmarks/${userId}`, { params }).then((r) => r.data),

  // Also increments `views` server-side — no separate view call is needed
  // after opening the detail screen.
  getDiscussion: (id) => apiClient.get(`/community/discussions/${id}`).then((r) => r.data),

  // Lightweight view-counter ping for feed cards (mirrors the web's
  // IntersectionObserver-driven card view tracking) — does not return the
  // full discussion, just { views }.
  recordDiscussionView: (id) => apiClient.post(`/community/discussions/${id}/view`).then((r) => r.data),

  // `payload` is a FormData instance: title, content, category, authorEmail
  // (optional), authorId (redundant — server always uses the session's user,
  // sent only for parity with the web payload), and an optional file field
  // named "attachment" (image/video/pdf, 5MB limit, uploadCommunity.any()).
  // axios sets the multipart boundary automatically as long as we never set
  // Content-Type ourselves.
  createDiscussion: (formData) => apiClient.post('/community/discussions', formData).then((r) => r.data),

  // ── Reactions / votes / bookmark / pin ────────────────────────────────
  // Live but has no UI consumer on web (PostCard/ReactionBar use the typed
  // 5-reaction row below instead) — kept only for client parity.
  toggleLike: (discussionId, userId) =>
    apiClient.post(`/community/discussions/${discussionId}/like`, { userId }).then((r) => r.data),

  // The 5-type reaction row that IS live in the web UI: 'like' | 'heart' |
  // 'insightful' | 'support' | 'smile'. Toggles off if the same type is sent
  // again; switches type otherwise. Returns { reactions, counts, currentUserReaction }.
  reactToDiscussion: (discussionId, userId, type) =>
    apiClient.post(`/community/discussions/${discussionId}/react`, { userId, type }).then((r) => r.data),

  toggleBookmark: (discussionId, userId) =>
    apiClient.post(`/community/discussions/${discussionId}/bookmark`, { userId }).then((r) => r.data),

  // Server-gated via requireRole('moderator', 'admin') — any client-side role
  // check is only cosmetic (hides the button); the backend is the real gate.
  togglePin: (discussionId) => apiClient.patch(`/community/discussions/${discussionId}/pin`).then((r) => r.data),

  // DEAD ROUTE: back-end/routes/community.js registers
  // `POST /discussions/:id/vote` TWICE — the peer up/down handler
  // (voteOnPost, below) is registered first, and Express dispatches to the
  // first matching handler only, so this {userId, optionIndex} payload never
  // reaches the poll-vote code. Kept only for parity with communityApi.js;
  // do not wire UI to it — it's broken on the web dashboard today too.
  voteInPoll: (discussionId, userId, optionIndex) =>
    apiClient.post(`/community/discussions/${discussionId}/vote`, { userId, optionIndex }).then((r) => r.data),

  // The LIVE handler at that same path — peer quality up/down vote. No web
  // UI consumes this today; kept for parity, not wired into a mobile screen
  // in this pass either (matches web).
  voteOnPost: (discussionId, vote) =>
    apiClient.post(`/community/discussions/${discussionId}/vote`, { vote }).then((r) => r.data),

  // ── Replies ────────────────────────────────────────────────────────────
  // `authorId` is accepted for payload parity with communityApi.js but is
  // ignored server-side — the real author is always req.user._id.
  addReply: (discussionId, content, authorId) =>
    apiClient.post(`/community/discussions/${discussionId}/reply`, { content, authorId }).then((r) => r.data),

  // SPOOFABLE OWNERSHIP CHECK: unlike POST /reply, the PUT/DELETE reply
  // handlers authorize by comparing `reply.author` against a client-supplied
  // `authorId` body field instead of the session. Kept for API parity; no
  // mobile UI calls these (flagged in the audit — needs a backend fix first).
  editReply: (discussionId, replyId, content, authorId) =>
    apiClient.put(`/community/discussions/${discussionId}/reply/${replyId}`, { content, authorId }).then((r) => r.data),

  deleteReply: (discussionId, replyId, authorId) =>
    apiClient.delete(`/community/discussions/${discussionId}/reply/${replyId}`, { data: { authorId } }).then((r) => r.data),

  // Live and secure (author derived from the session), but no web UI renders
  // threaded/nested replies yet — kept for parity, no screen in this pass.
  addThreadedReply: (discussionId, replyId, content, authorId) =>
    apiClient
      .post(`/community/discussions/${discussionId}/reply/${replyId}/thread`, { content, authorId })
      .then((r) => r.data),

  // Live, author-or-moderator-gated; no web UI calls it — kept for parity,
  // the detail screen only renders bestAnswer/bestAnswerReply read-only.
  markBestAnswer: (discussionId, replyId, authorId) =>
    apiClient.post(`/community/discussions/${discussionId}/best-answer`, { replyId, authorId }).then((r) => r.data),

  // ── Moderation ─────────────────────────────────────────────────────────
  // One report per user is enforced server-side (400 on a duplicate).
  reportDiscussion: (discussionId, userId, reason) =>
    apiClient.post(`/community/discussions/${discussionId}/report`, { userId, reason }).then((r) => r.data),

  // ── Groups directory / contributors ───────────────────────────────────
  // Fully implemented server-side against the CommunityGroup model, but
  // neither CommunityHub.jsx nor CommunitySidebar.jsx call any of these on
  // web (verified by repo-wide grep) — this is unbuilt on both platforms,
  // not a mobile gap. Kept for full API parity; no feed-screen UI in this pass.
  getFeaturedGroups: () => apiClient.get('/community/groups/featured').then((r) => r.data),

  getGroups: (params = {}) => apiClient.get('/community/groups', { params }).then((r) => r.data),

  updateGroupMembership: (groupId, userId, action) =>
    apiClient.post(`/community/groups/${groupId}/membership`, { userId, action }).then((r) => r.data),

  getTopContributors: (limit = 5) =>
    apiClient.get('/community/contributors', { params: { limit } }).then((r) => r.data),

  getStats: () => apiClient.get('/community/stats').then((r) => r.data),

  searchUsers: (query) => apiClient.get('/community/search-users', { params: { query } }).then((r) => r.data),
};

export default communityFeedAPI;
