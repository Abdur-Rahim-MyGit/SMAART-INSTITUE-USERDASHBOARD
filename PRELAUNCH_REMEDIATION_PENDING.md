# SMAART — Remediation Status (post Phase 3)

**Date:** 2026-06-10
**Updated after applying the score-IDOR + mass-assignment + ID-race fixes.**

---

## ✅ NOW FIXED IN CODE (this session)

| # | Item | What was done | Files |
|---|---|---|---|
| H7 | Students reading/writing their own + others' results | `protect` + self-or-staff guard: non-staff are scoped to `req.user._id`; result detail has an ownership check | `routes/results.js` |
| H8 | CourseEnrollment progress/score IDOR | All progress endpoints (task/video/quiz/task-result) and `/student/:studentId` now force `studentId = req.user._id` for non-staff | `routes/courseEnrollments.js` |
| H9 | Stage/baseline result IDOR + destructive reset | Self-or-staff override on all `/user/:userId` reads and reset/restart; **`baselineresults.js` was fully unauthenticated — now has `protect`** | `routes/stageresults.js`, `routes/baselineresults.js` |
| H4 | Escalation mass-assignment | Create/update now use an explicit field whitelist | `routes/escalations.js` |
| H14 | Racy `countDocuments()+1` ID generation | New atomic `nextSequentialCode()` helper backed by the `Counter` collection; seeds past existing IDs to avoid collisions | `utils/idGenerator.js`, `models/Coach.js`, `models/Course.js`, `models/Assessment.js` |

**⚠️ Manual test needed (you — login + OTP):** take an assessment, watch a course video, complete a quiz/task, open Performance/Analysis — confirm progress and scores still save. Create a coach/course/assessment from admin — confirm the ID is assigned and no duplicate-key error.

---

## ⏳ STILL PENDING (deliberately deferred — need coordination/testing)

### Self-score integrity (related to H8) — recommended before launch
**Files:** `routes/courseEnrollments.js` `/quiz-progress` (score from body), `/task-result` (score from body)
The ownership fix stops a student tampering with **another** student's score. A student can still submit an inflated score for **their own** quiz/task because the score comes from the request body. To close this, recompute the score **server-side** from the submitted answers against the quiz/task answer key, and ignore any `score` in the body. This needs the quiz-grading flow tested live, so it was not changed blindly.

### H19 — Vision-board NSFW/toxicity model race (robustness)
**File:** `front-end/src/features/visionBoard/pages/VisionBoardEditorPro.jsx:218-228`
Note: the **instant text check** (`moderateText(text, true)`) uses a synchronous banned-word list and already works before models load. Only the **TF model-based image/toxicity** layer has the race.
**Fix:** in the image-add / board-save path, if `isModelLoading` is true, disable the action or `await` the model promise before running the NSFW/toxicity check. Make `loadToxicityModel`/`preloadNSFWModel` return cached promises so callers can await on demand. Requires testing with real image uploads.

### H20 — ECS task missing OPENROUTER_API_KEY / SMTP secrets (your AWS console)
**Files:** `aws-deployment/ecs-task-definition.json` vs `production-secrets.env.example`
1. In **AWS Secrets Manager (ap-south-1)** create: `OPENROUTER_API_KEY`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (+ anything else in `.env` the task def omits).
2. Add them to `containerDefinitions[].secrets` as `{ "name": "...", "valueFrom": "<arn>" }`.
3. Give the task **execution role** `secretsmanager:GetSecretValue` on those ARNs.
4. Cross-check every `.env` key against the task def so nothing is missing in prod.

### H21 — JWT in WebSocket URL (coordinated client+server change)
**Files:** live `back-end/services/websocketService.js` (raw-WS path reads `query.token`), client `socket.io-client` connect code, and `aws-deployment/production-websocket-sync.js`
Note: the **socket.io path already prefers `socket.handshake.auth.token`** (secure). The remaining work:
- **Client:** ensure it passes the token via Socket.io `auth: { token }` (not query string); for raw `ws` use a subprotocol `new WebSocket(url, [token])`.
- **Server raw-WS:** read the token from `sec-websocket-protocol` / `Authorization` header instead of `query.token`.
- Test live reconnection before/after, since this affects realtime chat/notifications.

---

## 🔑 Still outstanding from Phase 0 (you)
**Rotate the leaked secrets** (MongoDB, JWT_SECRET, Cloudinary, SMTP, OpenRouter, Deepgram, ITSM) and purge them from git history (BFG / git-filter-repo + force-push). Untracking the files does not remove them from past commits.
