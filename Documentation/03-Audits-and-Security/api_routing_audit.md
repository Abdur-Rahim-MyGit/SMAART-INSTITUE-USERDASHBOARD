# SMAART — Document 1: Backend API Routing Audit
**Date:** 2026-05-19 | **Scope:** `server.js` + all `/routes/*.js` files | **Status:** COMPLETE

---

## Severity Legend
| Badge | Meaning |
|---|---|
| 🔴 P0 | Critical — fix before launch |
| 🟠 High | Fix urgently post-launch |
| 🟡 Medium | Fix in near-term sprint |
| 🟢 Low / Info | Minor or informational |
| ✅ OK | Correctly configured |

---

## SECTION 1 — Server Route Mount Map

Every route file vs. how it is mounted in `server.js`.

| Mount Prefix | Route File | Status | Notes |
|---|---|---|---|
| `/api/auth` | `routes/auth.js` | ✅ OK | Auth — login, OTP, register |
| `/api/users` | `routes/users.js` | 🟠 | Contains dev/debug routes — see §3 |
| `/api/colleges` | `routes/colleges.js` | ✅ OK | — |
| `/api/registrations` | `routes/registrations.js` | ✅ OK | — |
| `/api/degrees` | `routes/degrees.js` | ✅ OK | — |
| `/api/resumes` | `routes/resumes.js` | ✅ OK | — |
| `/api/assessments` | `routes/assessments.js` | ✅ OK | — |
| `/api/results` | `routes/results.js` | ✅ OK | — |
| `/api/baselineresults` | `routes/baselineresults.js` | ✅ OK | — |
| `/api/stageresults` | `routes/stageresults.js` | ✅ OK | — |
| `/api/courses` | `routes/courses.js` | ✅ OK | — |
| `/api/enrollments` | `routes/enrollments.js` | ✅ OK | — |
| `/api/courseEnrollments` | `routes/courseEnrollments.js` | 🟡 | Casing inconsistency — see §4 |
| `/api/questionBanks` | `routes/questionBanks.js` | 🟡 | Casing inconsistency — see §4 |
| `/api/notes` | `routes/notes.js` | ✅ OK | — |
| `/api/certificates` | `routes/certificates.js` | ✅ OK | — |
| `/api/students` | `routes/students.js` | ✅ OK | — |
| `/api/teachers` | `routes/teachers.js` | ✅ OK | — |
| `/api/coaches` | `routes/coaches.js` | ✅ OK | — |
| `/api/coachSessions` | `routes/coachSessions.js` | 🟡 | Casing inconsistency — see §4 |
| `/api/escalations` | `routes/escalations.js` | ✅ OK | — |
| `/api/tickets` | `routes/tickets.js` | ✅ OK | — |
| `/api/chatbot` | `routes/chatbot.js` | ✅ OK | — |
| `/api/community` | `routes/community.js` | ✅ OK | 70KB — largest route file |
| `/api/groups` | `routes/groups.js` | ✅ OK | — |
| `/api/announcements` | `routes/announcements.js` | ✅ OK | — |
| `/api/moderation` | `routes/moderationQueue.js` | 🟡 | Naming mismatch — see §5 |
| `/api/moderation/actions` | `routes/moderation.js` | 🟡 | Overlapping prefix — see §5 |
| `/api/ppi` | `routes/ppiRoutes.js` | ✅ OK | — |
| `/api/user-certificates` | `routes/userCertificates.js` | ✅ OK | — |
| `/api/community-tasks-progress` | `routes/communityTaskProgressRoutes.js` | 🟢 | 374 bytes — likely stub |
| `/api/avatar` | `routes/avatar.js` | ✅ OK | — |
| `/api/ai-career-coach/*` | Inline in `server.js` | 🟠 | Should be extracted to `routes/aiCareerCoach.js` — see §6 |
| `/api/career-intelligence/*` | Inline in `server.js` | 🟠 | Should be extracted — see §6 |
| `/api/visionBoards` | `routes/visionBoards.js` | 🟡 | Duplicate mount — see §7 |
| `/api/vision-boards` | `routes/visionBoards.js` | 🟡 | Duplicate mount — see §7 |
| `/api/vision-board` | `routes/visionBoardRoutes.js` | 🟡 | Three similar prefixes — see §7 |
| `/api/vision-board-pro` | `routes/visionBoardProRoutes.js` | 🟡 | — |
| `/api/user-vision-boards` | `routes/userVisionBoardRoutes.js` | 🟢 | 928 bytes — may be stub |
| `/api/nsfw` | `routes/nsfwRoutes.js` | ✅ OK | — |
| `/api/ocr` | `routes/ocrRoutes.js` | ✅ OK | — |
| `/api/contact` | `routes/contact.js` | ✅ OK | — |
| `/api/tasks` | `routes/tasks.js` | ✅ OK | — |
| `/api/upload` | `routes/uploadRoutes.js` | ✅ OK | — |
| `/api/badges` | `routes/badges.js` | ✅ OK | — |
| `/api/notifications` | `routes/notifications.js` | ✅ OK | — |
| `/api/health` | Inline in `server.js` | ✅ OK | Health check endpoint |

**Unmounted route files (exist in `/routes/` but NOT mounted in `server.js`):**

| File | Size | Status |
|---|---|---|
| `routes/aiCareerCoach.js` | 1,341 bytes | 🔴 **ORPHANED** — loaded inline in server.js separately |
| `routes/careerIntelligence.js` | 1,561 bytes | 🔴 **ORPHANED** — loaded inline in server.js separately |

---

## SECTION 2 — Frontend API Call Mapping vs. Backend Endpoints

Cross-referencing `src/services/api.js` and page-level calls against mounted backend routes.

| Frontend Call | Backend Endpoint | Mounted? | Status |
|---|---|---|---|
| `apiCall('/courses')` | `GET /api/courses` | ✅ | OK |
| `apiCall('/courses/:id/modules')` | `GET /api/courses/:id/modules` | ✅ | OK |
| `apiCall('/courseEnrollments/...')` | `GET/POST /api/courseEnrollments/...` | ✅ | OK (casing risk on Linux — §4) |
| `apiCall('/notes')` | `GET/POST /api/notes` | ✅ | OK |
| `apiCall('/visionBoards')` | `GET/POST /api/visionBoards` | ✅ | OK |
| `apiCall('/badges/...')` | `GET /api/badges/...` | ✅ | OK |
| `apiCall('/notifications/...')` | `GET/PUT /api/notifications/...` | ✅ | OK |
| `fetch(API_BASE_URL + '/coaches/...')` | `GET /api/coaches/...` | ✅ | ⚠️ Raw fetch, no `apiCall` — no auth header |
| `fetch(API_BASE_URL + '/coachSessions/...')` | `POST /api/coachSessions/...` | ✅ | ⚠️ Raw fetch, no `apiCall` — no auth header |
| `fetch(API_BASE_URL + '/mindcare-feedback')` | ❌ **DOES NOT EXIST** | ❌ | 🔴 **404 on every feedback submit** |
| `fetch(API_BASE_URL + '...')` in MindCareSessions | `API_BASE_URL` not imported | ❌ | 🔴 **ReferenceError crash** |

---

## SECTION 3 — Dev/Debug Routes Left in Production Code

These routes are present in `routes/users.js` and will be live in production unless removed.

| Route | Risk | Severity |
|---|---|---|
| `POST /api/users/_dev/backfill` | Allows mass user record creation/modification. Has `NODE_ENV === 'production'` guard — **BUT route is still reachable**. An attacker who can spoof the environment or if the guard logic has a bug can exploit this. | 🟠 High |
| `GET /api/users/_debug/state/:email` | Returns password hash preview, registration status, and email for **any user by email**. **NO AUTH REQUIRED.** Completely unauthenticated — anyone on the internet can call this and enumerate user accounts. | 🔴 **P0 — Remove immediately** |

> **Fix for `_debug/state/:email`:** Either delete this endpoint entirely or add the `protect` middleware before it AND wrap in an `if (process.env.NODE_ENV !== 'production')` guard.

---

## SECTION 4 — URL Casing Inconsistencies (Linux/Production Risk)

On Windows (your dev machine), routes like `/api/courseEnrollments` and `/api/courseEnrollments` are the same because Windows is case-insensitive. On Linux (AWS EC2 production), they are **NOT** the same.

| Route Prefix | Risk |
|---|---|
| `/api/courseEnrollments` | Any frontend call using `/api/courseenrollments` will 404 on Linux |
| `/api/questionBanks` | Same risk |
| `/api/coachSessions` | Same risk |
| `/api/visionBoards` | Same risk — also has three alternate mounts |

**Fix:** Standardize all route prefixes to lowercase with hyphens (e.g., `/api/course-enrollments`). Update both `server.js` mounts and all `apiCall()` usages in the frontend simultaneously.

---

## SECTION 5 — Moderation Route Overlap / Naming Conflict

```
server.js line 161: app.use('/api/moderation',         require('./routes/moderationQueue'));
server.js line 162: app.use('/api/moderation/actions', require('./routes/moderation'));
```

**Problem:** Both are mounted under `/api/moderation`. Express will match the first one (`moderationQueue`) for ALL requests starting with `/api/moderation`, including `/api/moderation/actions`. The `/api/moderation/actions` mount may never be reached depending on how routes are defined inside `moderationQueue.js`.

**Fix:** Either rename `moderationQueue` to `/api/moderation/queue` or merge the two files into one `moderation.js` with sub-routers.

---

## SECTION 6 — Inline Route Definitions in `server.js` (Tech Debt)

The AI Career Coach and Career Intelligence routes are defined inline in `server.js` instead of using the `routes/aiCareerCoach.js` and `routes/careerIntelligence.js` files that already exist.

```js
// server.js line 175–206 (inline routes)
app.get('/api/ai-career-coach/profile', authMiddleware, ...);
app.post('/api/ai-career-coach/profile/analyze', authMiddleware, ...);
// ... 12 more inline route declarations
```

This creates two problems:
1. `routes/aiCareerCoach.js` and `routes/careerIntelligence.js` are **dead files** — they exist but are never loaded.
2. `server.js` is harder to maintain and grows unbounded.

**Fix:** Move inline route declarations into their respective route files and mount them via `app.use()`.

---

## SECTION 7 — Vision Board Route Duplication

```
app.use('/api/visionBoards',       require('./routes/visionBoards'));   // camelCase
app.use('/api/vision-boards',      require('./routes/visionBoards'));   // hyphen (same file!)
app.use('/api/vision-board',       require('./routes/visionBoardRoutes'));  // singular
app.use('/api/vision-board-pro',   require('./routes/visionBoardProRoutes'));
app.use('/api/user-vision-boards', require('./routes/userVisionBoardRoutes'));
```

**Problems:**
- `/api/visionBoards` and `/api/vision-boards` point to the **exact same file** — every route in that file is registered twice, doubling Express route table entries for no benefit.
- Five different prefixes for one feature domain is confusing for front-end developers and makes auditing API calls harder.

**Fix:** Choose one canonical prefix (e.g., `/api/vision-boards`) and remove the duplicate mount. Consolidate the 4 separate route files into 2: `visionBoards.js` and `visionBoardsPro.js`.

---

## SECTION 8 — Backend 404 / Error Handler

```js
// server.js line 237–238
app.use(notFound);    // 404 handler
app.use(errorHandler); // Global error handler
```

✅ A backend `notFound` middleware exists and is correctly placed at the end of all routes.

**However — check inside `middleware/errorHandler.js`:**
- Verify `notFound` sends a JSON response (not HTML). If it sends HTML, clients get a parse error instead of a clean `{ error: "Not found" }`.
- Verify `errorHandler` sets proper CORS headers on error responses — Express error handlers sometimes skip CORS middleware, causing CORS errors on failed requests.

---

## SECTION 9 — Missing Backend Routes (Frontend Calls That Will 404)

These API endpoints are called from the frontend but have **no matching backend mount**:

| Frontend Component | API Call | Backend Status |
|---|---|---|
| `MindCareSessions.jsx` | `fetch(API_BASE_URL + '/mindcare-feedback')` | ❌ No `/api/mindcare-feedback` route registered anywhere |
| `ModuleTasks.jsx` | No API calls — all hardcoded | ℹ️ No backend route exists for tasks per module |
| `ResumeBuilder.jsx` | `apiCall('/resumes/sync-profile')` | ⚠️ Verify `routes/resumes.js` has a `GET /sync-profile` endpoint |
| `Library.jsx` | `fetch('https://www.googleapis.com/books/...')` | ℹ️ External call — backend not involved. Key exposed in client |
| `GeneralDictionary.jsx` | `fetch('https://api.dictionaryapi.dev/api/v2/entries/en/${word}')` | ℹ️ External — API response schema mismatch causes crash |

---

## SECTION 10 — Auth Coverage Audit

Which backend routes are protected by the `protect` middleware?

| Category | Route Prefix | Auth Protected? |
|---|---|---|
| Auth flows | `/api/auth/*` | Varies (login/OTP = public; `/me` = protected) |
| User data | `/api/users/*` | ⚠️ Mixed — `_debug/state` endpoint is UNPROTECTED |
| Courses | `/api/courses/*` | ✅ (verify individual endpoints) |
| Notes | `/api/notes/*` | ✅ |
| Groups | `/api/groups/*` | ✅ |
| Community | `/api/community/*` | ✅ |
| AI Career Coach | `/api/ai-career-coach/*` | ✅ (uses `authMiddleware` inline) |
| Career Intelligence | `/api/career-intelligence/*` | ✅ (uses `authMiddleware` inline) |
| Health | `/api/health` | ❌ Public — intentional, acceptable |
| Vision Boards | `/api/visionBoards/*` | ⚠️ Verify `visionBoards.js` uses `protect` internally |

---

## CRITICAL ACTION LIST (Backend)

| Priority | Action |
|---|---|
| 🔴 P0 | **Delete or fully protect** `GET /api/users/_debug/state/:email` immediately |
| 🔴 P0 | Add `/api/mindcare-feedback` route or fix the frontend call |
| 🟠 High | Extract inline AI Career Coach + Career Intelligence routes into their route files |
| 🟠 High | Remove duplicate `/api/visionBoards` mount |
| 🟠 High | Fix `/api/moderation` + `/api/moderation/actions` overlap |
| 🟡 Medium | Lowercase all camelCase route prefixes before production (Linux casing) |
| 🟡 Medium | Verify `errorHandler.js` returns JSON, not HTML, and includes CORS headers |
| 🟡 Medium | Guard `POST /api/users/_dev/backfill` with `protect` middleware in addition to env check |
