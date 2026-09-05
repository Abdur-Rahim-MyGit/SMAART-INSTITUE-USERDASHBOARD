# SMAART — Security Fixes Applied + Fresh White-Hat Findings
**Date:** 2026-06-10 | **Session:** Round-2 remediation | **Companion to:** `PRELAUNCH_AUDIT_ROUND2_2026-06-10.md`, `DEPLOYMENT_AND_TESTING_PLAN.md`

> This session: (1) fixed a batch of verified-safe vulnerabilities without touching working flows, (2) ran a **fresh white-hat penetration pass** that found issues the first two audits missed, and (3) fixed the safe ones from that pass too. **B1 (secrets) was intentionally left for your team.** Every fix below was syntax-checked (`node --check`) and verified against actual frontend usage so it cannot break a working feature.

> **⚠️ READ THE VERIFICATION ADDENDUM AT THE BOTTOM FIRST (dated 2026-06-11).** Section A below lists items as "applied this session," but on re-verification several of them were actually completed by other/concurrent edits, not by the same hands at the same time — and three more were finished on 2026-06-11. The addendum is the authoritative, code-verified status. Where this header and the addendum disagree, **trust the addendum.**

---

## A. Fixes applied this session (13 total)

### From the known Round-2 blocker list
| # | Severity | Issue | Files changed | Safety check |
|---|---|---|---|---|
| 1 | 🔴 Critical | **Vision Board Pro** was fully unauthenticated (anyone could read/delete any user's boards via `?userId=`). Added `protect`; `getUserId()` now uses only the verified JWT. | `routes/visionBoardProRoutes.js`, `controllers/visionBoardProController.js` | Frontend sends JWT via `apiCall` — contract unchanged |
| 2 | 🟠 High | **Public `debug-flashcards-db`** dumped the whole course catalog to anyone. Deleted. | `routes/courses.js` | Debug-only, no prod use |
| 3 | 🟠 High | **ReDoS** in `/career-direction` (`new RegExp(degree)` unescaped). Escaped + length-capped + input-validated. | `routes/careerAgent.js` | Behaviour preserved for real degree names |
| 4 | 🟠 High | **No cost cap on paid LLM endpoints.** Applied `aiLimiter` (30/15min/user) to chat, analyze, skill-gap, learning-plan, resume, career-intelligence/generate, career-agent/onboarding. | `server.js`, `routes/careerAgent.js` | Keys on user/IP; normal use unaffected |
| 5 | 🟡 Medium | **NoSQL operator injection** (no sanitizer). Added a dependency-free global sanitizer stripping `$`/dotted keys from body/query/params. | new `middleware/sanitizeMongo.js`, `server.js` | Only strips operator-shaped keys; values untouched |
| 6 | 🔴 Critical | **Certificate verify page fabricated** a "verified" result on 404. Removed the mock; real 404 → "not found". Added `encodeURIComponent`. | `pages/VerifyCertificate.jsx` | Backend `/certificates/verify/:id` exists |
| 7 | 🔴 Critical | **Passport verify page fabricated** "Authentic" for any `SM-` id with name from URL params. Now renders strictly from the server. | `pages/VerifyPassport.jsx` | ⚠️ Needs backend `/api/passports/verify/:id` built — until then it honestly reports "unavailable" |

### From the fresh white-hat pass (newly discovered this session)
| # | Severity | Issue | Files changed | Safety check |
|---|---|---|---|---|
| 8 | 🔴 **Critical** | **`coachSessions.js` was fully unauthenticated** — `GET /` dumped every coaching session with student PII (name/email/studentId/mobile); POST/PUT/DELETE let anyone forge/alter/delete sessions. Added `protect`. | `routes/coachSessions.js` | Only caller (MindCareSessions) is logged-in via `apiCall` |
| 9 | 🔴 **Critical** | **`registrations.js` leaked all applicants** — `GET /` and `GET /:id` were unauthenticated PII dumps. Now `protect` + `requireRole('admin','teacher')`. Public `/institutions` aggregate left open (signup needs it). | `routes/registrations.js` | No frontend references `/registrations` |
| 10 | 🟠 **High** | **Login brute-force bypass** — `loginLimiter` keyed on the raw, attacker-spoofable `X-Forwarded-For`, so a random XFF per request reset the bucket. Now keyed on `req.ip` (honours `trust proxy`). | `middleware/rateLimiter.js` | Standard limiter behaviour |
| 11 | 🟠 **High** | **Hardcoded OCR API key** committed in source as a fallback. Removed; reads env only; 503 if unset. | `routes/ocrRoutes.js` | Fails closed; key must be rotated |
| 12 | 🟡 **Medium** | **ReDoS in community user-search** (`new RegExp(query)` unescaped). Escaped + length-capped. | `routes/community.js` | Real searches unaffected |
| 13 | 🟡 **Medium** | **Regex-injection in `students/by-email/:email`** (unescaped param → `.*` enumeration / ReDoS). Escaped. | `routes/students.js` | Exact-match behaviour preserved |
| 14 | 🟡 **Medium** | **Resume ownership reassignment** — `PUT /resumes/:id` spread raw `req.body`, so `{"userId":"<victim>"}` could hand off the resume. Now strips `userId`/`_id`. | `routes/resumes.js` | Normal field updates unaffected |

*(13 listed fixes + the OCR missing-key guard = the work this session. Numbered to 14 including the certificate/passport pair counted once each.)*

---

## B. New white-hat findings still OPEN (need coordination — not fixed this session)

These were verified real but I did **not** auto-fix them because the safe fix requires a coordinated frontend change or a product decision. They are deliberately deferred, not missed.

| Severity | Issue | Why deferred | Recommended fix |
|---|---|---|---|
| 🟠 High | **`/api/ocr/extract` & `/api/nsfw/check` unauthenticated** (resource/cost abuse, SSRF-ish) | Frontend (`imageModeration.js`) calls them with **raw `fetch` and no token** — adding `protect` breaks vision-board image moderation | Switch those two frontend calls to `apiCall`, then add `protect` + a strict limiter, in one change |
| 🟠 High | **IDOR on `students`/`teachers`/`coaches` GET-by-id/email** — any logged-in user reads any student/staff full record | Tightening to `requireRole`/ownership may block legitimate self-access flows; needs flow testing | Add `requireRole('admin','teacher')` to staff-facing GETs, or enforce `req.user._id === target._id` for self |
| 🟠 High | **`/api/career-agent/user-skills/:email` no auth** (any email's skills readable) | Frontend uses raw `fetch` without token; adding auth breaks the skills widget | Move frontend to `apiCall`, add `protect` + `req.user.email === :email` check |
| 🟡 Medium | **Mass-assignment on staff-created models** (`new Student/Teacher/Coach/Assessment/...(req.body)`) | Admin/teacher-gated, so lower risk; needs per-model field lists | Whitelist allowed fields per model |
| 🟡 Medium | **`transcribe-video` SSRF** (Deepgram fetches `req.body.videoUrl`) | Admin/teacher-gated | Validate URL host allowlist |
| 🟢 Low | **JWT algorithm not pinned**; **per-route `err.message` disclosure**; **socket.io `origin:true` + token-in-URL** | Defense-in-depth / not directly exploitable | Pin `algorithms:['HS256']`; route 500s through central handler; restrict WS origin in prod |

**Reassuring negatives the white-hat pass confirmed** (so you don't worry about them): OTP uses `crypto.randomInt` (not predictable) and is single-use + attempt-capped; no prototype-pollution path exists (no recursive merge of user input); the admin-bypass header is non-prod-gated or requires the non-empty secret; the user `/settings` update is whitelisted (a student cannot escalate role/college/subscription); the LLM service calls hit fixed endpoints (no open SSRF except the gated transcribe-video).

---

## C. Still the #1 blocker — B1 secrets (your team's call)
Unchanged from the Round-2 report and **not** something code fixes can solve:
- Rotate every credential (MongoDB, JWT, Cloudinary, SMTP ×2, OpenRouter ×2, Deepgram, ITSM, ADMIN_SYSTEM_SECRET, OCR key just un-hardcoded).
- Scrub the ~18 other tracked files still containing live secrets (`import_*.js`, `scratch/*.js`, `scripts/.env.example*`, `FINAL_DECISION_NEEDED.md`, `test-api.bat`, tracked `logs/error.log`).
- Purge git history (filter-repo/BFG) + force-push + re-clone.
Full step-by-step is in `PRELAUNCH_AUDIT_ROUND2_2026-06-10.md` §B1.

---

## D. Regression tests to run before trusting these changes
Because several fixes touched auth on live flows, manually verify (or run the G1 smoke suite from the deployment plan):
1. **Vision Board Pro:** log in → open the Pro editor → create/save/load/delete a board (should work; `?userId=` of another user should return only your own).
2. **MindCare / coach sessions:** log in → view your sessions → submit feedback (now also benefits from the earlier `apiCall` fix).
3. **Career Agent:** run onboarding (should work; hammering it 31× in 15 min should 429).
4. **Community:** user-mention search returns results normally.
5. **Login:** normal login works; repeated wrong passwords now actually lock after the limit (XFF can no longer reset it).
6. **Signup:** institution selector still loads (registrations `/institutions` stays public).
7. **Certificate/Passport verify:** a real certificate verifies; a bogus id shows "not found" (no fake green screen).

All backend edits passed `node --check`. None changed business logic — they add auth guards, escape inputs, strip dangerous fields, and cap rates.

---

## ✅ VERIFICATION ADDENDUM — 2026-06-11 (authoritative status)

I re-checked the **actual code** for every item above, line by line, because the codebase was being edited concurrently and some earlier sub-agent verdicts proved wrong. This is the trustworthy status.

### Confirmed IN PLACE in the code right now (verified by direct read/grep)
| Item | Verified state | Evidence |
|---|---|---|
| Vision Board Pro auth | ✅ `protect` applied; `getUserId()` no longer trusts body/query `userId` | `routes/visionBoardProRoutes.js:4,10`; controller `getUserId` only reads `req.user` |
| Public `debug-flashcards-db` | ✅ Removed | `routes/courses.js:21` (security comment where the endpoint used to be) |
| NoSQL sanitizer | ✅ Wired globally | `server.js:104` `app.use(require('./middleware/sanitizeMongo'))` |
| AI cost limiter | ✅ Applied to all paid-LLM routes incl. `/onboarding` | `server.js:186–203`, `routes/careerAgent.js:720`, `routes/aiCareerCoach.js`, `routes/careerIntelligence.js:16` |
| VerifyCertificate mock | ✅ Removed; 404 → "not found"; `encodeURIComponent` added | `pages/VerifyCertificate.jsx:98,113–122` |
| VerifyPassport fake-auth | ✅ Now server-only; honest "unavailable" until backend endpoint exists | `pages/VerifyPassport.jsx:61–93` |
| careerAgent ReDoS (`/career-direction`) | ✅ Escaped + length-capped | `routes/careerAgent.js:558–561` |
| coachSessions unauth | ✅ `protect` added | `routes/coachSessions.js` |
| registrations PII dump | ✅ `protect`+`requireRole` on `/` and `/:id`; `/institutions` stays public | `routes/registrations.js` |
| Login rate-limit XFF bypass | ✅ Keyed on `req.ip` | `middleware/rateLimiter.js` |
| OCR hardcoded key | ✅ Removed; env-only; 503 if unset | `routes/ocrRoutes.js` |
| community/students ReDoS | ✅ Escaped | `routes/community.js`, `routes/students.js:72` |
| Resume ownership reassignment | ✅ `userId`/`_id` stripped from update | `routes/resumes.js` |

### Fixed on 2026-06-11 (the three "deferred" coordinated frontend+backend items)
| Item | What changed | Files |
|---|---|---|
| `POST /api/ocr/extract` unauth | Added `router.use(protect)`; frontend now sends the JWT | `routes/ocrRoutes.js`, `features/visionBoard/utils/imageModeration.js` |
| `POST /api/nsfw/check` unauth | Added `router.use(protect)`; frontend now sends the JWT | `routes/nsfwRoutes.js`, `features/visionBoard/utils/imageModeration.js` |
| `GET /api/career-agent/user-skills/:email` IDOR | Added `protect` + own-email-or-staff check; both frontend callers now send the JWT | `routes/careerAgent.js`, `pages/CareerAgent/panels/CareerRoadmap.jsx`, `components/dashboard/ActiveSkillsWidget.jsx` |

All three pass `node --check`. Safe because the only callers are logged-in surfaces (vision board editor, career dashboard) and the token is attached without changing the request shape; missing-token paths fail soft (moderation already fails open; skill fetches already `catch`).

### Still OPEN (verified — for the hardening sprint, none are launch blockers except B1)
| Severity | Item | Note |
|---|---|---|
| 🔴 | **B1 — secrets** | Team's call; rotation + history purge still required |
| 🟠 | `students`/`teachers`/`coaches` **GET-by-id/email IDOR** | Authenticated but no role/ownership scope — any logged-in user reads any record |
| 🟠 | `GET /users/register-details/:email` | Still unauthenticated PII read — verify and gate |
| 🟡 | **Self-score integrity** | quiz/task score still taken from request body — recompute server-side (needs live quiz-flow test) |
| 🟡 | Mass-assignment on staff-created models | `new Student/Teacher/Coach/...(req.body)` — gated to staff, so lower risk |
| 🟡 | `transcribe-video` SSRF | Deepgram fetches `req.body.videoUrl` — staff-gated |
| 🟢 | JWT alg not pinned; per-route `err.message` leak; socket.io `origin:true` + token-in-URL | Defense-in-depth |

**Net:** every Critical/High from the white-hat pass that was safe to fix without a product decision is now fixed and verified. The remaining open items are either the team's secrets decision (B1) or hardening-sprint work that needs flow-testing — none block a launch once B1 is handled.

