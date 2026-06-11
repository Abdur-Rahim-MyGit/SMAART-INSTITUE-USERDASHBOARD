# SMAART Platform — Pre-Launch Audit, Round 2
**Date:** 2026-06-10 | **Branch:** vickram | **Scope:** re-verification of all 56 confirmed Round-1 findings + fresh sweep of security, frontend, UI/theme, and deployment readiness.

> **How this report was produced:** every Critical/High finding from `PRELAUNCH_AUDIT_2026-06.md` was re-checked against the *current* code (not the report's claims). The status doc `PRELAUNCH_REMEDIATION_PENDING.md` was cross-checked too. The most critical verdicts were independently double-verified.

---

## Executive Summary — Verdict: **NOT READY TO DEPLOY YET**

You fixed a lot — genuinely. Of the 12 Criticals from Round 1, **9 are fixed or substantially fixed**. The auth layer (students/teachers/coaches/escalations/enrollments/questionBanks/colleges/badges/community/results/stage-results), the answer-key leak, the account-takeover hole, the admin-bypass `undefined===undefined` hole, the ID-generation race, and the fabricated Excel data are all closed. The frontend crash bugs (AlertTriangle, setIsCompleted, API_BASE_URL in MindCare, FileUpload props) are fixed.

**But 4 things still block launch:**

| # | Blocker | Why it blocks |
|---|---|---|
| B1 | **Secrets are NOT actually remediated.** Deletion of `.env` is only *staged* (not committed), git history is NOT purged, no credential has been rotated, and — newly discovered — **live secrets sit in ~18 OTHER tracked files** (`FINAL_DECISION_NEEDED.md`, `back-end/scripts/test-api.bat`, `back-end/scripts/.env.example*`, `back-end/import_*.js`, `back-end/scratch/*.js`, tracked `back-end/logs/error.log`) | Anyone with repo access owns your DB, JWT, mail, and AI keys |
| B2 | **Vision Board Pro is still fully unauthenticated** (Round-1 Critical #9, untouched). Any anonymous caller can read/update/delete/duplicate ANY user's boards via `?userId=` | Unauthenticated mass IDOR + data destruction |
| B3 | **Public fake-verification pages still live**: `VerifyPassport.jsx` never calls the backend (any `SM-` id = "Authentic", name from URL params); `VerifyCertificate.jsx` still fabricates a verified result on 404 | Credential fraud against the platform's own anti-fraud feature |
| B4 | **Unauthenticated AI/data endpoints remain**: `careerAgent` `GET /dashboard/:id` (guessable IDs, returns PII), `GET /user-skills/:email`, unescaped `new RegExp(degree)` (ReDoS), `/onboarding` still `optionalAuth` with no AI limiter applied; OCR/NSFW endpoints unauthenticated | PII leak + unbounded paid-API cost + DoS |

Everything else below is important but can be sequenced after these four.

**Fix scoreboard (Round-1 Critical + High):**

| Status | Count | Items |
|---|---:|---|
| ✅ Fixed | 19 | C1, C2, C3, C4, C5, C6, C7, C8, C10, H13, H14(partially-moot), H16, H17, H19, H21(IDOR part), H22, H26, H27, H28, H29, H30 |
| 🟡 Partial | 6 | C12 (secrets — untracked but not rotated/purged), H15 (OTP backdoor now double-gated, not removed), H18 (assessment submit still raw), H20 (score-from-body remains), H24 (aiLimiter exists, not applied to careerAgent), H31 (model race known-deferred) |
| 🔴 Still open | 4 | C9 (visionBoardPro), C11 (fake verify pages), H23 (debug endpoint — public again/still), careerAgent cluster (H24-adjacent + Medium #51/52/53) |

---

## SECTION 1 — Remaining Launch Blockers, with step-by-step remediation

### B1. Secrets: rotate, purge, and sweep the stragglers 🔴 CRITICAL
**Current state (verified):**
- `git ls-tree HEAD` still contains `back-end/.env` and `.env.backup` — the deletion is staged but **uncommitted**.
- History NOT purged: 18 commits across all refs carry `.env` (first added Feb 2026, commit `afc98b5d0`).
- The on-disk `.env` still contains the old compromised values (`souban:souban123`, `smaart-admin-bypass-2026`) — **nothing has been rotated**.
- **New finding:** live secrets exist in other *tracked* files:
  - MongoDB URI `mongodb+srv://souban:souban123@...` hardcoded as fallback in ~15 files: `back-end/import_intel.js`, `import_intel_to_agent_data.js`, `import_master_roles.js`, `import_master_roles_verbatim.js`, `back-end/scratch/*.js`, `back-end/scripts/list_colleges.js`, `back-end/scripts/test_college_search.js`, `back-end/scripts/.env.example1`
  - OpenRouter key `sk-or-v1-3eaf…` in `FINAL_DECISION_NEEDED.md` and `back-end/scripts/test-api.bat`; a second key in `back-end/scripts/.env.example1`
  - `ADMIN_SYSTEM_SECRET=smaart-admin-bypass-2026` in `back-end/scripts/.env.example` and `.env.example1`
  - `back-end/logs/error.log` is **tracked** and contains the connection string 8 times (and keeps growing — it shows as modified)

**Remediation, in order (do not skip steps):**
1. **Rotate first, purge second** (rotating makes the leaked values worthless even before the purge):
   - MongoDB Atlas: create a new least-privilege DB user, delete `souban`, drop `authSource=admin`.
   - Generate a new `JWT_SECRET` (`openssl rand -hex 64` / `crypto.randomBytes(64)`). All sessions invalidate — fine pre-launch.
   - Rotate: Cloudinary API secret, both Gmail app passwords, both OpenRouter keys, Deepgram, ITSM, `ADMIN_SYSTEM_SECRET`, `USERDASHBOARD_SYNC_TOKEN`.
2. **Scrub the straggler files** (tracked code/docs): remove every hardcoded URI/key fallback from the `import_*.js`, `scratch/*.js`, `scripts/*` files (replace with `process.env.MONGODB_URI` and a hard error if unset); delete the key from `FINAL_DECISION_NEEDED.md` and `test-api.bat`; replace real values in `.env.example*` with `<PLACEHOLDER>`.
3. `git rm --cached back-end/logs/error.log` (it's tracked; `.gitignore` alone doesn't untrack).
4. Commit the staged `.env` deletions + the scrubs in one commit.
5. **Purge history**: `git filter-repo --invert-paths --path back-end/.env --path back-end/.env.backup --path back-end/logs/error.log` (or BFG `--delete-files`), then force-push and have every collaborator re-clone. Also run `git filter-repo --replace-text` with the old secret strings to catch them inside the straggler files' history.
6. Enable GitHub secret scanning + push protection on the repo.
7. Add `scratch/` and `PRELAUNCH_*.md` to `.gitignore` (currently unignored — a careless `git add .` would commit your own vulnerability roadmap).

### B2. Vision Board Pro — still no auth 🔴 CRITICAL (Round-1 #9, untouched)
**Verified:** `back-end/routes/visionBoardProRoutes.js` applies only `generalLimiter`; `visionBoardProController.getUserId()` still falls back to `req.body.userId` / `req.query.userId`.
**Fix (2 lines + 2 deletions):**
1. In `visionBoardProRoutes.js`: `const { protect } = require('../middleware/auth'); router.use(protect);` (exactly like sibling `visionBoardRoutes.js`).
2. In `visionBoardProController.js` `getUserId()`: delete the `req.body.userId` and `req.query.userId` fallback lines so the id can only come from the verified JWT.
3. Regression test: load the dashboard vision-board widget and the Pro editor as a logged-in student (the frontend already sends the token via `apiCall`, so nothing client-side should break — verify the Pro editor's fetch layer uses `apiCall`/sends Authorization; if any call passes `?userId=`, it keeps working since the server now ignores it).

### B3. Fake "Authenticated" verification pages 🔴 CRITICAL (Round-1 #11, untouched)
**Verified:** `VerifyPassport.jsx` lines ~62-71 — API call commented out, `setTimeout(1500)` then `verified:true` for any `SM-` id, identity from URL query/localStorage. `VerifyCertificate.jsx` lines ~114-163 — "DEMO FALLBACK" mock still fabricates `verified:true` on 404 for `SMAART-` ids.
**Fix:**
1. `VerifyPassport.jsx`: replace the simulation with a real `apiCall('/passports/verify/' + encodeURIComponent(id))` and render strictly from the server response. If no backend endpoint exists yet, the page must show "verification unavailable" — never a green result.
2. `VerifyCertificate.jsx`: delete the entire mock-response branch; a 404 renders the "not found" error. Also add `encodeURIComponent(certId)` (Round-1 #91, still open).
3. Never render name/photo/institution from query params or localStorage on these pages — server fields only.

### B4. careerAgent + OCR endpoint cluster 🟠 HIGH
**Verified still open:** `GET /dashboard/:id` (no auth, `Date.now()` guessable ids, returns stored PII), `GET /user-skills/:email` (no auth), `new RegExp(degree,'i')` at ~line 554 (unescaped → ReDoS), `/onboarding` still `optionalAuth` with the lock/attempt system skipped for anonymous callers; `aiLimiter` (30/15min) **exists in rateLimiter.js but is not applied** to careerAgent routes; `POST /api/ocr/extract` and the NSFW check endpoint remain unauthenticated and fail open.
**Fix:**
1. Add `protect` to `/dashboard/:id`, `/user-skills/:email`, `/onboarding` (replace `optionalAuth`), `/ocr/extract`, `/nsfw/check`.
2. Ownership: in `/dashboard/:id` and `/user-skills/:email`, match the record's email/user against `req.user` (or staff role).
3. Apply `aiLimiter` to every route that triggers an LLM call: careerAgent `/onboarding`, `/generate`, aiCareerCoach `/chat`, `/profile/analyze`, `/resume`, `/skill-gap`, `/learning-plan`, careerIntelligence `/generate`, courses `/transcribe-video`.
4. Escape regex input: `degree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` (the escape helper already exists elsewhere in the same file — reuse it), cap length to ~100 chars.
5. Replace `Date.now()` record ids with `crypto.randomUUID()`.
6. NSFW moderation: fail **closed** on error/timeout/missing key for upload paths.

### B5. Public debug endpoint 🟠 HIGH (quick win — 1 minute)
**Verified:** `courses.js:22` `GET /api/courses/debug-flashcards-db` is registered before `router.use(protect)` (line 74) — dumps the entire course catalog incl. flashcards to anonymous callers.
**Fix:** delete the endpoint (preferred) or move it below `protect` + `authorize('admin')`.

### B6. Self-score integrity 🟠 HIGH (known-deferred — now must be scheduled)
**Verified:** `courseEnrollments.js` `/quiz-progress` (~line 478) and `/task-result` still take `score`/`totalPoints` from the request body. Cross-user tampering is fixed (ownership forced), but a student can still inflate **their own** scores. Same family: `assessments.js` `POST /:id/submit` still pushes `req.body` into `assessment.responses`.
**Fix:** recompute the score server-side from submitted answers vs. the stored answer key; ignore client `score`. Clamp to `[0, totalPoints]`. For `assessments.js` submit: build the response object server-side from validated fields only. **This needs a live quiz-flow test** (the reason it was deferred) — see the test plan in Section 5.

### B7. NoSQL injection hardening 🟡 MEDIUM (your explicit question — answered)
**There is no SQL in this stack (MongoDB), so SQL injection per se doesn't apply. The MongoDB equivalent — operator injection — is partially exposed:**
- **Verified:** no `express-mongo-sanitize` anywhere; query params still assigned directly into Mongo filters in `escalations.js` (~27-35) and `tickets.js`. `?status[$ne]=x` style operator objects pass through. Auth now gates these routes, so it's authenticated-only — but it's one global middleware away from closed.
- Mongoose-`find`-by-`_id` paths cast and throw on objects (safe-ish); the raw filter assignments are the gap.
**Fix:** `npm i express-mongo-sanitize` and in `server.js` after body parsing: `app.use(mongoSanitize());` Plus coerce enum-ish filters: `query.status = String(req.query.status)`. This is one of the few *global* fixes that cannot break working code (it only strips `$`/`.` keys from input).

---

## SECTION 2 — Confirmed fixed (no action; re-test list)

Verified in current code — listed so you know what regression-testing should cover:

| Area | What's now in place |
|---|---|
| students/teachers/coaches/enrollments/questionBanks/colleges | `protectOrBypass` at router level; mutations gated `requireRole('admin','teacher')`; ⚠️ GETs are auth-only (any logged-in user can list staff/students) — acceptable for launch, tighten to role/ownership in hardening sprint |
| users.js | Password overwrite closed (`if (password && !user.password)`); `_dev/backfill` no longer nested per-request. ⚠️ `GET /register-details/:email` still unauthenticated (PII disclosure) — add `protect` + owner check in hardening sprint |
| roleMiddleware.js | Bypass refuses when secret unset; ⚠️ but the bypass still works in production with a static header secret **that is leaked in tracked files** — rotation (B1) is what actually closes this; consider IP-allowlisting it post-launch |
| auth.js (middleware) | Dev bypass now requires `NODE_ENV !== 'production'` **and** `ENABLE_DEV_OTP_BYPASS==='true'`; session checks enforced |
| auth.js (routes) | OTP `999999` backdoor double-gated behind explicit env flag (recommend deleting entirely before launch anyway); resend/reset OTP flows now behind `passwordResetLimiter`/`otpLimiter` |
| escalations.js | `protectOrBypass` + `requireRole('admin','moderator','teacher','counselor','therapist')` + `ESCALATION_FIELDS` whitelist on create/update |
| assessments.js | `sanitizeAssessment()` strips `correctAnswer` for non-staff; POST/PUT/DELETE behind `authorize('admin','teacher')` (submit gap → B6) |
| community.js | Author identity from `req.user._id`; reply/edit/delete ownership vs. authenticated user |
| results / stageresults / baselineresults / courseEnrollments | self-or-staff scoping helpers (`ownUserId`/`ownStudentId`); baselineresults now has `protect`; destructive resets admin-gated |
| Models + utils/idGenerator.js | Atomic `Counter`-based `nextSequentialCode()` wired into Coach/Course/Assessment; seeds past existing max — race closed. ⚠️ `sparse: true` still missing on the unique code fields (Medium #60-62) — add in hardening sprint |
| excelExportService.js | `Math.random()` fabricated percentages removed; neutral qualitative text now |
| Frontend crashes | AlertTriangle import (AssessmentsDashboard), `setIsCompleted` (CoursePlayer), `API_BASE_URL` (MindCareSessions), FileUpload `onChange` (AddDetails) — all fixed |

**Manual regression tests required** (because these touched auth on working flows): student login → dashboard → take an assessment → watch a course video → complete a quiz → view Performance/Analysis; admin: create coach/course/assessment (ID assigned, no E11000); escalation create from the MindCare flow; community post/reply.

---

## SECTION 3 — Remaining frontend bugs (non-blocking, fix in first sprint)

Still-open items re-verified this round, in priority order:

1. **VerifyOTP auto-submit race** (`VerifyOTP.jsx` ~207-216) — `setTimeout(click, 100)` can double-submit and burn OTP attempts. Fix: drive from `useEffect` on `otp.length === 6` + an `isSubmitting` guard.
2. **api.js dev 404 port-probing replays mutations** (~232-257) — a legit 404 on a POST re-fires the POST at ports 5001/5002. Fix: probe only on network errors, never HTTP 404.
3. **Profile.jsx / Settings.jsx raw fetches** use the frozen `API_BASE_URL` export — saves fail when the backend is on a fallback port. Fix: route through `apiCall`.
4. **ComprehensiveSignup**: unguarded `JSON.parse(sessionStorage 'user')` after success (~456-461) can strand the user on the success screen; mount guard never checks `otpVerified`. Wrap parse in try/catch; add the flag check.
5. **ProfileAnalysis.jsx** ~51 — unguarded `JSON.parse(sessionStorage 'userData')` → white screen on corrupt value.
6. **GroupChat.jsx** — `key={idx}` (~533), `isSequential` indexing `group.messages` while mapping `filteredMessages` (~530), 3s poll with no overlap/abort guard (~81), send-button disabled state ignores valid polls (~975).
7. **ModuleViewPage.jsx** ~325 — sequential-unlock guard disabled via `if (false)`. Decide: enable or delete (currently advertised gating isn't enforced).
8. **Supabase client** — no env-var guard; missing `VITE_SUPABASE_URL` crashes any importing bundle at load.
9. **MicroAssessmentPlayer** ~177 — divide-by-zero NaN% guard still absent (`totalPoints > 0 ? … : 0`).
10. **Vision-board NSFW model race** (known-deferred H19/H31): `preloadNSFWModel` still doesn't return its promise; `handleSave` doesn't block while models load. Fix as written in the pending doc; needs a live image-upload test.
11. **userCertificates URLs** (backend but UI-facing): `certificateUrl`/`verificationUrl` still stored unvalidated — enforce `https:` scheme allowlist server-side.

---

## SECTION 4 — UI / Theme globalization & the Hero page

### Current state (good news first)
- **A real design system already exists and is excellent**: `front-end/src/smaart-design-system.css` (916 lines, 100+ tokens: `--s-primary: #1a3884`, `--s-silver: #C0C0C0`, full dark-mode token set, ready-made `.s-btn-primary`/`.s-card`/`.s-heading-*` classes) + `tailwind.config.ts` brand colors (navy/teal/gold/silver) + container preset (centered, 2rem padding, 1400px max).
- **Fonts are already globalized**: Inter everywhere via `--s-font-family` + Tailwind `font-sans`/`font-heading`. Decorative fonts are confined to the Vision Board editor (intentional). **No font work needed.**
- **Dark mode is properly implemented**: class strategy, `ThemeContext` persisting to localStorage + backend, full `.dark` token set.

### The problem
The tokens are **not used** where it counts: **~1,900 hardcoded hex values across 136 files** (`#1a3884` ×1,424, `#002147` ×514, `#00152E` ×127, `#C0C0C0` ~×100…). The brand palette is consistent *by accident* (everyone hand-typed the same hexes), which means a future rebrand or theme tweak requires touching 136 files.

### Hero / Landing page (your top priority)
`src/pages/LandingPage.jsx` orchestrates `components/landing/*`. **Structurally it is good**: correct responsive breakpoints (`text-4xl sm:text-5xl md:text-6xl`), consistent `container mx-auto px-6 sm:px-10 md:px-16 lg:px-24`, working dark-mode variants, alt text present, no dead links/placeholder text found.
**Its only real defect is theming debt**: `HeroSection.jsx` alone has 11+ hardcoded colors (gradients `from-[#1a3884] to-[#132c6b]`, accents `text-[#C0C0C0]`, etc.). Worst landing offenders: `CertificateVerification.jsx` (21), `HeroSection.jsx` (11), `ServiceCards.jsx` (10), `PricingPlans.jsx` (10), `PassportPreview.jsx` (8).

### Globalization plan (safe, incremental, zero behavior change)
The trick to "without affecting currently working code": **map the existing hexes to tokens with identical values** — pixels don't change, only the source of truth does.

1. **Phase T0 — Wire Tailwind to the CSS variables (half a day):** in `tailwind.config.ts`, add semantic aliases that point at the design-system variables: `primary: 'var(--s-primary)'`, `silver: 'var(--s-silver)'`, `navy-deep: 'var(--s-card-bg-dark)'`… Now `bg-primary` ≡ `bg-[#1a3884]` exactly.
2. **Phase T1 — Landing page (1-2 days):** mechanical find/replace in `components/landing/*`: `[#1a3884]` → `primary`, `[#C0C0C0]` → `silver`, `[#002147]` → `navy`, `[#132c6b]` → `primary-hover`, `[#0d1f4d]` → `primary-active`. Visual-diff each section in light + dark before/after.
3. **Phase T2 — Forms & high-traffic pages (2-3 days):** `AddDetails.jsx` (30), `Profile.jsx` (77 instances), `DashboardLayout.jsx` (36), signup flow. Create `.s-input-focus` utility for the repeated focus-ring pattern.
4. **Phase T3 — Parallel stylesheets (2 days):** merge `Certificate.css` (42 rules) and `CareerAgent/careerAgent.css` (69 rules) onto the token system.
5. **Phase T4 — Enforcement (half a day):** ESLint rule (`no-restricted-syntax` or `eslint-plugin-tailwindcss`) failing CI on `\[#[0-9a-fA-F]` in `className`, with an exceptions list (Vision Board).
6. **Container sizes:** adopt one rule — marketing pages use `container mx-auto px-6 sm:px-10 …` (already true); dashboard content areas standardize on a single `max-w-7xl mx-auto` wrapper in `DashboardLayout` instead of per-page `max-w-*`. One-line change per page.

Total: **~6-8 focused days**, fully incremental, each phase shippable on its own. None of it blocks launch — but do **T0+T1 (hero) before launch** since the landing page is the brand's first impression and it's <2 days.

---

## SECTION 5 — Deployment readiness & the pre-deploy testing plan

### 5.1 Current deployment-readiness gaps (verified)
| Gap | Detail | Fix |
|---|---|---|
| Workflow not installed | `github-deploy-workflow.yml` lives only in `aws-deployment/`, not `.github/workflows/` — CI/CD is **not active** | Move it when ready to wire CD; until then deploy manually |
| ECS secrets incomplete | Task def provisions `OPENAI_API_KEY` (unused!) but **not** `OPENROUTER_API_KEY`, `SMTP_*`, `DEEPGRAM_API_KEY`, `ITSM_API_KEY`, `ADMIN_SYSTEM_SECRET`, `USERDASHBOARD_SYNC_TOKEN`, `REDIS_USERNAME` — AI/email/transcription silently dead in prod | Reconcile every key the code reads (grep `process.env.`) against Secrets Manager + task def |
| No graceful shutdown | `server.js` has **no SIGTERM handler** — ECS deploys hard-kill in-flight requests & websockets | Add: on SIGTERM stop accepting, `server.close()`, close mongoose + ws, exit; set `stopTimeout: 30` in task def |
| Health check too shallow | `/api/health` returns 200 unconditionally — a task with a dead DB connection stays "healthy" | Add `mongoose.connection.readyState === 1` check; return 503 otherwise |
| No compression | `compression` middleware absent — every JSON response ships uncompressed through ALB/NAT (you pay egress) | `npm i compression`, `app.use(compression())` |
| No local-stack orchestration | **No docker-compose.yml anywhere**; `local_docker_test.md` is a manual build/run doc; building from `back-end/` context has **no .dockerignore** → `COPY . .` would bake `.env` into a locally built image | Add compose file (below) + `back-end/.dockerignore` |
| Body limit vs. task size | 50MB JSON limit on a 256CPU/512MB task — OOM/DoS vector | Right-size task to 512/1024 AND drop the global limit to 2MB, keeping 50MB only on the specific upload routes |
| readonlyRootFilesystem | still `false` | Set `true` + tmpfs for `/tmp` once uploads confirmed Cloudinary-only |
| Tests | **Zero test infrastructure**: backend `npm test` exits 1, no runner config, no CI test step, no load-test configs | Plan below |

### 5.2 Phase D1 — Local deployment verification ("check the deployment face to face")
Goal: prove the exact production artifact runs end-to-end on your machine **before** any AWS spend. I can execute all of this when you say go.

1. **Create `docker-compose.local.yml`** (backend image built with the production Dockerfile, local MongoDB container — or your Atlas dev cluster — and Redis container, frontend served via `vite preview` or nginx against the built `dist/`):
   - backend: build `aws-deployment/Dockerfile`, env from a fresh `.env.local` (NEW rotated secrets only), port 5000
   - mongo: `mongo:7` with a seeded test database
   - redis: `redis:7-alpine` (validates the websocket sync path)
2. **Boot checks:** container becomes healthy (Docker HEALTHCHECK green), `/api/health` returns 200 *and* DB-connected, logs clean of `undefined` env warnings (this directly catches the ECS-missing-secrets class of bug locally).
3. **Smoke-test script** (`scripts/smoke.mjs`, ~20 requests via fetch, exits non-zero on any failure):
   - auth: signup-OTP → verify → login → JWT issued
   - authorization spot-checks: anonymous GET `/api/students` → 401; student token POST `/api/courses` → 403; student fetch own results → 200, other's results → 403; `/api/vision-board-pro?userId=<other>` → 401 (validates B2 once fixed)
   - core flows: course list, assessment fetch (response must NOT contain `correctAnswer`), enrollment progress write, escalation create (role-gated)
   - websocket: connect with token via `auth` payload, receive a notification
4. **Frontend against the containerized backend:** `npm run build && npm run preview`, click through: landing/hero → signup → dashboard → course player → assessment → community → vision board. (I can drive this with the browser tools and screenshot each step.)
5. **Pass criteria:** all smoke checks green, zero 500s in `error.log`, memory of the backend container stable (< 400MB) after the click-through.

### 5.3 Phase D2 — Load testing ("crowd checking")
Tooling: **k6** (single binary, scriptable JS, runs on Windows; artillery is the alternative). Test against the local compose stack first, then once against a staging ECS service. **Never against prod with real user data.**

| Test | Profile | Pass criteria |
|---|---|---|
| **Smoke-load** | 10 VUs, 2 min, mixed read endpoints | p95 < 300ms, 0 errors |
| **Average-day** | ramp 0→100 VUs over 5 min, hold 10 min (mix: 70% reads, 20% auth'd writes, 10% login flow) | p95 < 800ms, error rate < 0.5% |
| **Exam-day spike** ("crowd") | 0→500 VUs in 60s, hold 5 min on login + assessment-start + answer-submit (your real-world thundering herd is an assessment window opening) | no 5xx storm, rate limiters return clean 429s (not crashes), recovery < 1 min after ramp-down |
| **Soak** | 50 VUs, 2 hours | no memory growth (catches the polling/interval leaks), p95 stable |
| **Websocket** | 300-500 concurrent socket connections + broadcast | all clients receive within 2s; Redis sync verified across 2 backend replicas in compose |
| **AI-cost guard** | 50 VUs hammering `/api/ai-career-coach/chat` | `aiLimiter` 429s after the quota — **proves the unbounded-billing hole is closed** |

I write the k6 scripts (`loadtest/k6/*.js`), run them, and produce a results table (p50/p95/p99, error rates, container CPU/memory) per scenario. Key numbers to extract: **max concurrent users one task sustains** (this sets your autoscaling baseline) and **requests-per-task at p95 < 800ms** (this sets the scaling target value).

### 5.4 Phase D3 — Load balancing & scaling plan
- **Layer:** ALB → ECS Fargate service (the Round-1 architecture, endorsed). ALB target group health check → the *deep* `/api/health` (after 5.1 fix), deregistration delay 30s, `stopTimeout: 30` so websockets drain.
- **Autoscaling policy:** target-tracking on **ECS service CPU 60%** (min 1 task launch-day Tier A, min 2 / max 6 for Tier B), plus a step-scaling alarm on `ALB RequestCountPerTarget` derived from the D2 measurement. Scale-in cooldown 300s (websocket reconnect churn is expensive).
- **Websockets across replicas:** force the socket.io websocket transport (disable long-polling) so cookie stickiness isn't needed; ElastiCache Redis adapter (use `rediss://` TLS — the plain `redis://` fallback in `production-websocket-sync.js` silently breaks cross-task delivery, Round-1 #96, still open) for cross-task fan-out; fix the `broadcastToAll` `clients.get('*')` bug before running 2+ tasks.
- **Static & burst absorption:** S3+CloudFront serves the SPA (already planned) — the backend never sees asset traffic; WAF rate-based rule (e.g. 2,000 req/5min/IP, stricter on `/api/auth/*` and `/api/ai-*`) absorbs abusive crowds before they reach ECS.
- **Deploy order on launch day:** rolling deployment `minimumHealthyPercent: 100, maximumPercent: 200` so there is zero downtime; verify with the smoke script pointed at prod immediately after each deploy.

### 5.5 Sequence to launch
```
1. B1 secrets (rotate → scrub → commit → purge → re-clone)      [blocks everything]
2. B2 visionBoardPro + B5 debug endpoint                         [minutes]
3. B3 verify pages + B4 careerAgent/OCR cluster                  [~1 day]
4. B7 mongo-sanitize + graceful shutdown + deep health check     [~half day]
5. D1 local compose + smoke script  → fix whatever it finds      [~1 day]
6. B6 server-side scoring (now testable via D1 harness)          [~1 day]
7. T0+T1 hero/landing theming                                    [~1-2 days, parallel]
8. D2 load tests locally → right-size task def                   [~1 day]
9. Stand up Tier-A AWS stack → D2 spike test once on staging → launch
```

---

## Appendix — Round-1 items deliberately deferred to the post-launch hardening sprint
Account-enumeration message unification (auth.js), failed-password lockout counter, `sparse:true` on generated-code unique indexes, Notification TTL/dual-field cleanup, Enrollment-vs-CourseEnrollment model unification, assignedTeacher ref inconsistency, `correctAnswer` Number-vs-String normalization, PII-minimization to LLMs + DPDP consent gate (legal task), WAF rate rules, VPC egress scoping, CI image-scan gating, `GET /register-details/:email` auth, GET-route role tightening on students/teachers/coaches, signup tempToken → HttpOnly cookie. These are all real but none changes the launch go/no-go.
