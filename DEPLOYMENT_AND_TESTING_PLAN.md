# SMAART — Deployment & Testing Plan
**Date:** 2026-06-10 | **Owner of execution:** Claude (I run the local stages; you/your team approve cloud spend) | **Companion to:** `PRELAUNCH_AUDIT_ROUND2_2026-06-10.md`

> **Purpose.** You correctly said you cannot deploy the whole product in one shot — there is load balancing, CI/CD, and crowd/response checking to validate first. This document is the staged plan: you never "build then deploy the full product." Instead the same artifact is promoted through gates (local → smoke → load → staging → production), and each gate has a pass/fail bar. It also defines the **sample deployment** and exactly how we measure **response units** (latency/throughput) afterward, and the plan for **load balancing and crowd handling**.

---

## 0. The core principle — promote one artifact through gates, never "deploy everything at once"

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  G0      │   │  G1      │   │  G2      │   │  G3      │   │  G4      │
│ Local    │──▶│ Smoke    │──▶│ Load /   │──▶│ Staging  │──▶│ Prod     │
│ stack up │   │ tests    │   │ crowd    │   │ (sample  │   │ (rolling │
│          │   │ green    │   │ test     │   │  deploy) │   │  deploy) │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
  docker         scripts/       k6 against      1 ECS task    autoscale,
  compose        smoke.mjs      compose &       on AWS,        WAF, blue/
  (Mongo+Redis   (auth, RBAC,   then staging    real domain,   green-ish
  +backend+      no answer-key  → response-unit  half-real     rolling
  frontend)      leak, ws)      report          traffic        update
```

**The same Docker image** built once at G0 is the image that reaches production. Nothing is rebuilt between staging and prod — only the environment/secrets differ. This is what makes "I can't deploy the full product at the first attempt" safe: each gate catches a class of failure before money/users are exposed.

A change does not advance to the next gate until the current gate's **pass criteria** are green. If a gate fails, you fix and re-run only that gate.

---

## 1. Gate G0 — Local full-stack deployment ("check the deployment face to face")

Goal: prove the **production artifact** (the real Dockerfile image, not `npm run dev`) runs end-to-end on one machine, with a real Mongo and Redis, before any AWS spend. This is the "face to face" local check.

### 1.1 What's missing today (must be added first)
- **No `docker-compose.yml`** anywhere → can't bring up the full stack with one command.
- **No `back-end/.dockerignore`** → a local `docker build` from the back-end context would copy `.env` into the image (`COPY . .`).
- **No graceful shutdown / deep health check** → containers can report healthy with a dead DB and get hard-killed on restart.

### 1.2 Deliverable: `docker-compose.local.yml` (I will author this)
Services:
| Service | Image / build | Purpose |
|---|---|---|
| `mongo` | `mongo:7` | local DB (or point at an Atlas **dev** cluster) |
| `redis` | `redis:7-alpine` | validates the websocket cross-instance sync path |
| `backend` | build `aws-deployment/Dockerfile` | the **production image**, env from `.env.local` (NEW rotated secrets only) |
| `frontend` | `node:20` running `vite preview` on the built `dist/`, or `nginx:alpine` serving `dist/` | the real SPA build, not the dev server |

Plus a `.dockerignore` at the build context excluding `.env*`, `logs/`, `node_modules`, `tests/`, `scratch/`.

### 1.3 G0 pass criteria
1. `docker compose -f docker-compose.local.yml up` brings all four services up; backend HEALTHCHECK goes green.
2. `GET /api/health` returns 200 **and** reports DB connected (after the deep-health-check fix below).
3. Backend logs show **zero** `undefined` env-var warnings (this catches the "ECS is missing OPENROUTER_API_KEY/SMTP" class of bug locally, before prod).
4. The SPA loads against the containerized backend; you can sign up → log in → reach the dashboard.

### 1.4 Required code prerequisites for G0 (small, safe — I can do these)
- **Deep health check:** `/api/health` returns 503 unless `mongoose.connection.readyState === 1`.
- **Graceful shutdown:** on `SIGTERM`/`SIGINT`, stop accepting new connections, `server.close()`, close mongoose + websockets, then exit. Needed so ECS rolling deploys drain instead of dropping live assessment sessions.
- **`back-end/.dockerignore`** so no build bakes secrets.

---

## 2. Gate G1 — Automated smoke tests (the functional gate)

Today there is **zero test infrastructure** (`npm test` literally exits 1). G1 introduces a thin but high-value smoke suite that runs against the G0 stack and exits non-zero on any failure. This is fast (seconds), runs in CI on every push, and is the minimum bar before any deploy.

### 2.1 Deliverable: `scripts/smoke.mjs` (Node, fetch-based, ~25 assertions). I will author it.

**Auth & session**
- signup-OTP → verify → login returns a JWT; `/api/health` 200.

**Authorization (these double as security regression tests for the Round-2 fixes)**
| Check | Expected |
|---|---|
| anonymous `GET /api/students` | 401 |
| student token `POST /api/courses` | 403 |
| student reads **own** results | 200 |
| student reads **another** user's results | 403 |
| `GET /api/vision-board-pro?userId=<otherUser>` (anonymous) | 401 ← **validates today's B2 fix** |
| `GET /api/vision-board-pro?userId=<otherUser>` (student token) | returns only the caller's boards, never the victim's |
| `GET /api/courses/debug-flashcards-db` | 404 ← **validates today's B5 fix** |
| assessment fetch as student | response body contains **no** `correctAnswer` field |
| `GET /api/career-agent/...` with `?status[$ne]=` operator | operator stripped, normal result ← **validates the mongo-sanitize fix** |
| hammer `/api/ai-career-coach/chat` 31×/15min | 31st returns 429 ← **validates the aiLimiter fix** |

**Core flows**
- course list, enrollment progress write, escalation create (role-gated), notification fetch.

**Websocket**
- connect with token via socket.io `auth: { token }`, receive a notification event.

### 2.2 G1 pass criteria
All assertions green, exit code 0. Wire into `package.json` as `"test": "node scripts/smoke.mjs"` and as a CI step (replacing the `exit 1` placeholder).

---

## 3. Gate G2 — Load / crowd testing ("how crowd works", response units)

This is the "crowd checking / load balancing" stage you asked for. Tool: **k6** (single Go binary, JS scripts, runs natively on Windows; Artillery is the fallback). We run G2 first against the **local compose stack** (cheap, catches the obvious cliffs), then once against **staging** (G3) for real numbers. **Never** against production with real user data.

### 3.1 What a "response unit" is, and how we measure it
A **response unit** = one request's full latency, broken into percentiles. We report, per scenario:
- **p50 / p95 / p99 latency** (ms) — the number that matters is **p95** (95% of users are at least this fast).
- **throughput** (requests/sec) the stack sustained.
- **error rate** (% non-2xx/3xx).
- **resource cost**: backend container CPU% and memory (from `docker stats` locally, Container Insights on AWS).
The headline output is two numbers that drive autoscaling:
1. **Max concurrent users one task sustains at p95 < 800ms** → sets the per-task capacity.
2. **Requests-per-task at that point** → becomes the autoscaling target value.

### 3.2 Deliverable: `loadtest/k6/*.js` (I will author). Scenarios:

| # | Scenario | Profile | Pass criteria |
|---|---|---|---|
| L1 | **Smoke-load** | 10 virtual users (VU), 2 min, read-mostly | p95 < 300ms, 0 errors |
| L2 | **Average day** | ramp 0→100 VU over 5 min, hold 10 min; mix 70% reads / 20% authed writes / 10% login | p95 < 800ms, errors < 0.5% |
| L3 | **Exam-day spike (the real "crowd")** | 0→500 VU in 60s, hold 5 min on login + assessment-start + answer-submit | no 5xx storm; rate limiters return clean **429s, not crashes**; recovery < 1 min after ramp-down |
| L4 | **Soak** | 50 VU, 2 hours | no memory growth (catches the polling/interval leaks flagged in the audit); p95 stable |
| L5 | **Websocket fan-out** | 300–500 concurrent socket connections + broadcast | all clients receive within 2s; with 2 backend replicas, Redis sync delivers cross-instance |
| L6 | **AI-cost guard** | 50 VU hammering `/api/ai-career-coach/chat` | `aiLimiter` returns 429 after quota → **proves the unbounded-billing hole is closed** |

> **Why the exam-day spike is the key test:** your real thundering herd is not steady traffic — it's an assessment window opening and hundreds of students hitting login + start-assessment in the same 60 seconds. L3 models exactly that. If the stack survives L3 with clean 429s and recovers, it survives launch day.

### 3.3 Deliverable: the response-unit report
After G2 I produce **`RESPONSE_UNITS_REPORT.md`** (a separate document, per your request) containing, for each scenario L1–L6: the p50/p95/p99 table, throughput, error rate, CPU/memory, the two autoscaling numbers, and a plain-English verdict ("one 0.5vCPU/1GB task comfortably serves N concurrent users; scale out at M req/s"). This is the document that tells you "how the response units are" after the sample deployment.

---

## 4. Gate G3 — Sample (staging) deployment on AWS

This is the **"sample deployment"** — a single, cheap, production-shaped environment that is NOT your real launch. It proves the AWS wiring (ALB, Secrets Manager, networking, TLS, health checks) end-to-end with the real image, before you commit to the full production stack.

### 4.1 Minimal staging footprint (Tier-A "lean", ~₹11–14k/mo, can be torn down after validation)
- **1 ECS Fargate task** (0.5 vCPU / 1 GB) behind **1 ALB**, single AZ acceptable for staging.
- **MongoDB Atlas M0/M10 dev cluster** in ap-south-1 (Mumbai).
- **Secrets Manager** holding the NEW rotated secrets (this is also where we prove the task def actually provisions `OPENROUTER_API_KEY`, `SMTP_*`, `DEEPGRAM_API_KEY`, `ITSM_API_KEY`, `ADMIN_SYSTEM_SECRET` — currently missing).
- **ACM** TLS cert on a staging subdomain (e.g. `staging-api.smaartminds.com`).
- Frontend `dist/` to a staging **S3 + CloudFront**.

### 4.2 G3 procedure
1. Reconcile the ECS task definition against `grep -r "process.env\." back-end/` so **every** env var the code reads is in Secrets Manager or the task env (fixes the "AI/email silently dead in prod" gap).
2. Push the G0 image to **ECR**, deploy the task, point the ALB target group health check at the **deep** `/api/health`.
3. Run the G1 smoke suite **against the staging URL** — must be green.
4. Run the G2 L1/L2/L3 k6 scenarios **against staging** → real numbers for `RESPONSE_UNITS_REPORT.md`.
5. Verify: TLS A-grade, security headers present, no secret in logs, websocket connects over `wss://`.

### 4.3 G3 pass criteria
Smoke green on staging; L3 spike survives; secrets all resolve; TLS + headers correct; CloudWatch shows clean logs. **Only now** do you size and stand up production.

---

## 5. Gate G4 — Production deployment & the CI/CD pipeline

### 5.1 Production stack (Tier-A launch → Tier-B as users grow)
Per the cost analysis already in the main audit: Fargate behind ALB (multi-AZ), Atlas M10→M30, S3+CloudFront for the SPA, WAF, Secrets Manager, ElastiCache Redis (`rediss://` TLS — the current `redis://` fallback silently breaks cross-instance websocket delivery and must be fixed before running 2+ tasks).

### 5.2 Load balancing & autoscaling (the "load balancing" plan you asked for)
- **ALB → ECS service.** Target group health check → the deep `/api/health`; deregistration delay 30s; task `stopTimeout: 30` so in-flight assessment submissions and websockets **drain** instead of being cut.
- **Autoscaling policy:** target-tracking on **ECS service average CPU 60%** (min 1 task at launch, min 2 / max 6 for Tier-B), plus a step-scaling alarm on **ALB `RequestCountPerTarget`** using the threshold measured in G2/G3. Scale-in cooldown 300s (websocket reconnect churn is expensive — don't flap).
- **Websockets across replicas:** force socket.io websocket transport (disable long-polling) so ALB cookie stickiness is unnecessary; ElastiCache Redis adapter fans out across tasks; fix the `broadcastToAll` `clients.get('*')` bug before scaling past one task.
- **Burst absorption:** S3+CloudFront serves the SPA so the backend never sees asset traffic; a **WAF rate-based rule** (e.g. 2,000 req/5min/IP, stricter on `/api/auth/*` and `/api/ai-*`) absorbs abusive crowds at the edge before they reach ECS.

### 5.3 CI/CD pipeline (the staged pipeline — "more load balancing, check, etc. in the CI/CD")
The workflow file exists (`aws-deployment/github-deploy-workflow.yml`) but is **not installed** (`.github/workflows/` is empty), so CD is currently manual. Target pipeline once gates are trusted:

```
push to main
   │
   ├─ 1. install + lint
   ├─ 2. npm audit (SCA)            ← non-blocking allowlist, not hard-fail
   ├─ 3. G1 smoke tests             ← BLOCKS on failure  (new)
   ├─ 4. docker build → ECR         ← tag by immutable git SHA (not :latest)
   ├─ 5. image scan (Trivy/ECR)     ← BLOCKS on HIGH/CRITICAL  (new)
   ├─ 6. deploy to STAGING (G3)
   ├─ 7. smoke tests vs staging     ← BLOCKS on failure  (new)
   ├─ 8. [manual approval gate]     ← GitHub Environment, required reviewer
   └─ 9. rolling deploy to PROD     ← minHealthyPercent 100 / maxPercent 200
```
- **Rolling deploy** (`minimumHealthyPercent: 100, maximumPercent: 200`) = zero-downtime; old tasks keep serving until new tasks are healthy. This is the mechanism that lets you "not deploy the full product at once" — new code rolls in task-by-task, and an unhealthy new task aborts the deployment automatically.
- Immediately after deploy, the pipeline runs the smoke suite against prod; a failure triggers automatic rollback to the previous task-definition revision.
- **Pin images by SHA**, never `:latest` (the task def currently defaults to `:latest`).

### 5.4 G4 pass criteria
Rolling deploy completes with 100% healthy targets; post-deploy smoke green against prod; WAF active; autoscaling alarms armed; CloudWatch dashboards + alarms (5xx rate, p95 latency, task CPU/mem, Atlas connections) live.

---

## 6. Pre-deploy code prerequisites (small, safe, mostly done by me)

These are launch-blocking-for-deploy but low-risk to add; none changes existing working behavior:

| Item | File | Status |
|---|---|---|
| Deep health check (503 if DB down) | `server.js` | to do (G0 prereq) |
| Graceful SIGTERM shutdown + `stopTimeout` | `server.js` + task def | to do (G0 prereq) |
| `compression` middleware | `server.js` | to do (cuts egress cost) |
| `back-end/.dockerignore` | new file | to do (G0 prereq) |
| `docker-compose.local.yml` | new file | to do (G0) |
| `scripts/smoke.mjs` | new file | to do (G1) |
| `loadtest/k6/*.js` | new files | to do (G2) |
| Reconcile ECS secrets vs `process.env.*` | task def | to do (G3) |
| `rediss://` TLS + `broadcastToAll` fix | `production-websocket-sync.js` / `websocketService.js` | to do before 2+ tasks (G4) |
| Right-size task (512/1024) + drop global 50MB body limit to 2MB (keep 50MB only on upload routes) | task def + `server.js` | to do (G3/G4) |
| `readonlyRootFilesystem: true` + tmpfs | task def | to do (G4 hardening) |

---

## 7. Execution timeline (what I do, in order, on your go)

```
Day 1   G0: .dockerignore + deep health + graceful shutdown + compression
            + docker-compose.local.yml → bring stack up locally, verify
Day 1-2 G1: scripts/smoke.mjs → all green locally (also regression-proves
            today's security fixes)
Day 2-3 G2: loadtest/k6/* → run L1–L6 vs local → draft RESPONSE_UNITS_REPORT.md
Day 3   Reconcile ECS secrets; right-size task; fix redis TLS + broadcast
        --- hand to you/team: approve AWS staging spend ---
Day 4   G3: deploy sample/staging on AWS, smoke vs staging, k6 vs staging,
            finalize RESPONSE_UNITS_REPORT.md (real numbers)
Day 5   G4: install CI/CD workflow, immutable tags, image scan, manual-approval
            gate, rolling prod deploy, post-deploy smoke, dashboards/alarms
```

Everything in Days 1–3 is local and free and I can execute immediately after the security blockers are cleared. Days 4–5 need your approval for AWS spend (the "sample deployment" is the first paid step, and it is intentionally the cheap Tier-A footprint that you can tear down).

---

## 8. Separate documents this plan produces
1. **`RESPONSE_UNITS_REPORT.md`** — the post-sample-deployment latency/throughput report (per your request: "how the response units are and how we can do it"). Generated after G2/G3.
2. **`docker-compose.local.yml`, `scripts/smoke.mjs`, `loadtest/k6/*.js`, `back-end/.dockerignore`** — the executable artifacts.
3. Updates to **`aws-deployment/ecs-task-definition.json`** (reconciled secrets) and the installed **`.github/workflows/deploy.yml`** (staged pipeline).

> None of the testing/deployment work touches application business logic — it adds infrastructure, tests, and config around the existing code, so it cannot regress working features. The only code edits (deep health check, graceful shutdown, compression, body-limit) are additive and isolated.
