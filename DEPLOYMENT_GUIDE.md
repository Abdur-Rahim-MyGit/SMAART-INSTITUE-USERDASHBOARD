# SMAART — Deployment Guide
**Date:** 2026-06-11 | Audience: you + the team | Goal: understand *what deployment means*, prove it locally first, then go to production safely with a real CI/CD pipeline.

> Read this top-to-bottom once. It is written so a teammate who has never deployed before can follow it. The companion doc is `TESTING_GUIDE.md` (how we test and how we fix bugs *after* launch).

---

## PART 1 — Terms you must understand before deploying

You can't deploy confidently if these words are fuzzy. Short, plain definitions:

| Term | Plain meaning | Why it matters for SMAART |
|---|---|---|
| **Build artifact** | The finished, runnable output of the code (the backend Docker **image**; the frontend `dist/` folder of static files). | You deploy the *artifact*, not the source. The **same** artifact is promoted from local → staging → production so "it worked on my machine" can't bite you. |
| **Docker image** | A frozen box containing Node + our backend code + dependencies, that runs identically anywhere. | This is what runs on AWS. Built once, tagged, reused. |
| **Container** | A running copy of an image. | Each Fargate "task" runs one container of our backend. |
| **Registry (ECR)** | A storage shelf for Docker images on AWS. | CI pushes the image here; ECS pulls it from here. |
| **ECS / Fargate** | AWS's "run my container for me" service — no servers to patch. | Runs the backend. "Serverless containers." |
| **Task / Task definition** | A *task* is one running container; the *task definition* is the recipe (CPU, memory, which image, which secrets). | Scaling = running more tasks. |
| **ALB (Application Load Balancer)** | The front door that receives all traffic and spreads it across the running tasks. | Also does HTTPS, health checks, and is where WebSocket connections land. |
| **Target group** | The list of healthy tasks the ALB is allowed to send traffic to. | A task only receives traffic after it passes the **health check**. |
| **Health check** | The ALB repeatedly calls `/api/health`; if it fails, that task is pulled out of rotation. | Must be a *deep* check (DB connected), not just "process alive." |
| **Autoscaling** | Automatically add/remove tasks based on load (CPU, request count). | Handles "exam day" crowds without manual work. |
| **S3 + CloudFront** | S3 stores the frontend static files; CloudFront is the global CDN that serves them fast. | The React app is served from here, **not** from the backend — keeps asset traffic off ECS. |
| **Secrets Manager** | AWS's vault for credentials, injected into the container at runtime. | Where the rotated keys live — never in the image or git. |
| **Environment (env) variables** | Per-environment settings (`NODE_ENV`, `MONGODB_URI`, `FRONTEND_URL`). | The difference between "dev" and "prod" behavior. |
| **CI (Continuous Integration)** | Automatically build + test the code on every push. | Catches breakage before it ships. |
| **CD (Continuous Deployment/Delivery)** | Automatically (or with one approval) ship the built artifact to an environment. | Removes manual, error-prone deploys. |
| **Pipeline** | The ordered CI→CD steps (build → test → scan → deploy). | Our GitHub Actions workflow. |
| **Staging** | A production-*like* environment used to rehearse the real deploy with no real users. | Where we catch problems safely. |
| **Blue/green & rolling deploy** | Ways to release a new version with **zero downtime** by bringing up the new version before retiring the old. | Users never see an outage during deploys. |
| **Rollback** | Switching back to the previous known-good artifact. | Our safety net if a deploy goes wrong. |
| **Graceful shutdown** | On shutdown, stop taking new requests, finish in-flight ones, then exit. | Without it, deploys drop users' requests and WebSocket connections. |
| **Smoke test** | A tiny set of "does the most important stuff work at all" checks run right after a deploy. | First line of "did we break it." |

If anything above is still unclear, that's the thing to ask about before we touch production.

---

## PART 2 — The golden rule: never deploy the whole product in one shot

You already said this, and you're right. We promote **one artifact** through **gates**. It only moves to the next gate if the current one passes:

```
 G0 Local      → G1 Local Docker  → G2 Smoke      → G3 Staging (sample   → G4 Production
 (dev machine)   (prod image,        (automated      deployment on AWS,     (real users,
                  local DB/Redis)     critical-path    load + crowd test)     rolling deploy)
                                      checks)
```

- **No skipping.** A red gate stops the train.
- **Same image** flows G1→G4. We do not rebuild for prod.
- **G3 is the "sample deployment"** you asked for: a small, cheap, tear-down-able copy of production where we measure real response units before committing to the full launch (the measurements go into `RESPONSE_UNITS_REPORT.md` — see `TESTING_GUIDE.md`).

---

## PART 3 — Local deployment testing (G0 + G1)

The point: prove the **production artifact** runs end-to-end on your machine before spending a rupee on AWS. I can set all of this up.

### G0 — Run from source (fastest inner loop)
1. `back-end/`: copy `.env.example` → `.env` with **rotated dev secrets** (never the old leaked ones), then `npm install && npm run dev`.
2. `front-end/`: `npm install && npm run dev`.
3. Open the app, click the hero → signup → dashboard. This is just "does the code run."

### G1 — Run the real Docker image locally (this is "local deployment")
This is the step most people skip and then get burned in production. We build the **exact** image AWS will run and boot the whole stack with `docker-compose`.

**What I'll add (currently missing):**
- `docker-compose.local.yml` defining three services:
  - `backend` — built from `aws-deployment/Dockerfile`, env from `.env.local`, port 5000
  - `mongo` — `mongo:7` with a seeded test DB (or point at an Atlas dev cluster)
  - `redis` — `redis:7-alpine` (needed so the WebSocket cross-task sync path is exercised)
- `back-end/.dockerignore` — so a local `docker build` from the backend folder can't bake `.env` into the image (it currently has none → real risk).

**G1 pass criteria:**
1. `docker compose -f docker-compose.local.yml up --build` → backend container reports **healthy** (Docker HEALTHCHECK green).
2. `GET /api/health` returns 200 **and** confirms DB connected (after we deepen the health check).
3. Backend logs show **no** `undefined env var` warnings — this single check catches the whole class of "secret not provisioned in prod" bugs *locally*.
4. The built frontend (`npm run build && npm run preview`) talks to the containerized backend; you can complete signup → dashboard → course → assessment.

**Why this matters:** if it boots and passes smoke here, the chance of a surprise on AWS drops enormously, because the artifact is identical.

### Pre-production code gaps to close first (small backend changes)
These make the artifact deployable; I can do them when you say go:
- [ ] **Graceful shutdown** — handle `SIGTERM`: stop accepting, `server.close()`, close Mongo + WebSocket, exit. (ECS sends SIGTERM on every deploy; without this, users get dropped.)
- [ ] **Deep health check** — `/api/health` should return 503 if `mongoose.connection.readyState !== 1`, so a task with a dead DB is pulled from rotation.
- [ ] **Compression** — `app.use(compression())` to shrink responses (saves egress cost + faster).
- [ ] **Body-size right-sizing** — drop the global 50MB JSON limit to ~2MB and keep 50MB only on the specific upload routes (prevents a cheap memory-exhaustion DoS).
- [ ] **Task sizing** — 512 CPU / 1024 MB (the current 256/512 is tight for AI calls + uploads).

---

## PART 4 — Production deployment (G3 sample → G4 full)

### G3 — The "sample deployment" (rehearsal on real AWS, cheap & disposable)
You said you can't deploy the whole product on the first attempt — exactly. G3 is a **minimal, throwaway** AWS footprint that proves the real pipeline and lets us measure response units before the full launch.

1. **Provision Tier-A minimal:** 1 Fargate task, 1 ALB, MongoDB Atlas M10 (or a dev cluster), Secrets Manager with the **rotated** keys, S3+CloudFront for the frontend. No autoscaling yet, WAF in "count" (observe-only) mode.
2. **Deploy the G1-proven image** via the pipeline (not by hand).
3. **Run the smoke suite** against the staging URL (see `TESTING_GUIDE.md`).
4. **Run the load/crowd tests** against staging and capture **response units** (p50/p95/p99 latency, throughput, error rate, container CPU/mem). → `RESPONSE_UNITS_REPORT.md`.
5. **Decide from real numbers:** how many concurrent users one task sustains, and the autoscaling target. *Then* size G4.
6. **Tear it down** (or keep as permanent staging). Because it's small and scripted, it costs little and can be recreated anytime.

This is the difference between *guessing* production capacity and *knowing* it.

### G4 — Full production with zero-downtime rollout
1. Stand up the full Tier-A (or Tier-B) stack with autoscaling on, WAF in **block** mode, deep health checks, graceful shutdown, `stopTimeout: 30`.
2. **Rolling deploy** (`minimumHealthyPercent: 100, maximumPercent: 200`): the new version's tasks come up and pass health checks **before** old tasks are drained → users never see downtime.
3. Smoke-test the production URL immediately after the deploy completes.
4. Watch dashboards for the first 48h; roll back instantly (re-point to the previous task definition) if the agreed threshold trips.

### Load balancing & scaling (how a "crowd" is handled)
- **ALB** spreads requests across tasks; routes WebSockets to tasks and drains them gracefully on deploy.
- **Autoscaling** target-tracks **CPU ~60%** (min 1–2 tasks, max 6), plus a step rule on **requests-per-task** derived from the G3 load test.
- **WebSockets across tasks:** force the socket.io WebSocket transport (no sticky cookies needed) and use **ElastiCache Redis over `rediss://`** (TLS) so a notification published on task A reaches a user connected to task B. *(Note: the current `production-websocket-sync.js` falls back to plain `redis://`, which silently breaks cross-task delivery — fix before running >1 task.)*
- **CloudFront + WAF** absorb the burst: static assets never hit the backend, and a WAF rate-based rule (e.g. 2,000 req/5min/IP, stricter on `/api/auth/*` and `/api/ai-*`) sheds abusive traffic before ECS sees it.

---

## PART 5 — The CI/CD pipeline (what runs on every push)

We have a workflow file (`aws-deployment/github-deploy-workflow.yml`) but it is **not active** — it lives in `aws-deployment/`, not in `.github/workflows/`. Activating it = moving it there. Before we do, it should have these stages:

```
push to main
   │
   ├─ 1. Install + Lint          (fast fail on broken code/style)
   ├─ 2. Test                    (unit/integration — currently MISSING, see TESTING_GUIDE)
   ├─ 3. Build backend image     (tag with the git SHA — immutable, not :latest)
   ├─ 4. Scan image              (Trivy/ECR scan; FAIL the deploy on HIGH/CRITICAL)
   ├─ 5. Push image to ECR
   ├─ 6. Build frontend (vite)   → sync to S3 → invalidate CloudFront
   ├─ 7. Deploy to STAGING       (render task def with the SHA image, rolling)
   ├─ 8. Smoke test staging      (auto; fail = stop)
   ├─ ⏸ 9. Manual approval       (a human clicks "go" — this is the "can't deploy in one shot" guard)
   └─ 10. Deploy to PRODUCTION   (rolling, then smoke test prod)
```

**Key pipeline principles:**
- **Immutable tags:** deploy the `git-SHA` image, never `:latest`, so a rollback is unambiguous (you know exactly which image was running).
- **Gate on the security scan** (step 4) — don't ship an image with known HIGH vulnerabilities.
- **Manual approval before prod** (step 9) via a GitHub *Environment* with required reviewers — this is precisely your "I can't deploy the whole product at the first attempt": staging deploys automatically, production needs a human yes.
- **Least-privilege deploy role:** the GitHub→AWS role (OIDC, no long-lived keys) should be scoped to only the ECR/ECS/S3/CloudFront actions it needs.

**How to verify the pipeline works:** make a trivial change, push to a branch → confirm CI builds, tests, scans; merge → confirm it deploys to staging and the smoke test passes; click approve → confirm prod rolls out with no downtime and the prod smoke test passes. Do this once with a no-op change *before* trusting it with a real release.

---

## PART 6 — Pre-launch deployment checklist

- [ ] All secrets rotated (Team Question #1) and provisioned in Secrets Manager
- [ ] `back-end/.dockerignore` added; image verified to NOT contain `.env`
- [ ] Graceful shutdown + deep health check + compression added
- [ ] `docker-compose.local.yml` boots the full stack; G1 smoke passes
- [ ] ECS task def lists **every** secret the code reads (OPENROUTER, SMTP, DEEPGRAM, ITSM, ADMIN_SYSTEM_SECRET, OCR, REDIS_USERNAME) — not the unused `OPENAI_API_KEY`
- [ ] `readonlyRootFilesystem: true` + tmpfs; task sized 512/1024; `stopTimeout: 30`
- [ ] Redis uses `rediss://`; WebSocket cross-task delivery verified with 2 tasks
- [ ] CI/CD workflow moved to `.github/workflows/`, image scan gate on, manual prod approval on, deploy role scoped
- [ ] G3 sample deployment done; `RESPONSE_UNITS_REPORT.md` produced; autoscaling sized from it
- [ ] On-call + rollback trigger agreed (Team Question #7)

When every box is ticked, G4 (full production launch) is a low-risk, rehearsed event — not a leap of faith.
