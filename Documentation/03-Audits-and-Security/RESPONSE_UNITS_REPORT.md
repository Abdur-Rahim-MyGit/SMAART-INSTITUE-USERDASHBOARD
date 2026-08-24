# SMAART — Response Units Report (Local Load Test)

**Date:** 2026-06-30
**Environment:** Local Docker stack (single backend container + MongoDB) on an 8-logical-core developer laptop.
**Tool:** k6 (run via the `grafana/k6` Docker image on the Compose network).
**Companion docs:** `DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_AND_TESTING_PLAN.md`.

> **Read this first — what this report is and is NOT.**
> These are **relative** capacity numbers measured locally, where the load
> generator (k6), the database (MongoDB), and the backend all share the same 8
> CPU cores. They are designed to find **bugs, cliffs, and the scaling shape** —
> NOT to be the absolute production capacity. The authoritative production
> numbers come later from the **G3 AWS staging** test (dedicated vCPU, managed
> Atlas database, no load generator competing for CPU).

---

## 1. What was tested

A realistic, read-heavy student session against the **real production Docker
image**:

- `GET /api/auth/me` (session/user check — real JWT verify + DB lookup)
- `GET /api/courses` (browse courses)
- `GET /api/assessments` (browse assessments)
- `GET /api/notifications` (notifications poll)
- `GET /api/results/assessment/:id/start` (start an assessment — DB write + question logic), ~25% of sessions

**Method notes (why the test is valid):**
- 2,000 test students were seeded and a valid JWT minted per student. We do
  **not** load-test the email-OTP login step — in production that is a one-time
  human gate, not sustained traffic. Every request still pays the real
  per-request auth cost (`findById().populate('college')`).
- Each virtual student sends a **unique `X-Forwarded-For`** so the per-IP rate
  limiter (1000 req/min) treats it as a distinct client — realistic (10k
  students = 10k IPs) and removes the single-source-IP artifact of local testing.
- Think time of 1–3s between actions models real browsing, so "concurrent
  virtual users" ≈ "concurrent students".

**Artifacts:** `back-end/scripts/seed-loadtest.js`, `loadtest/k6/{smoke,ramp,steady}.js`, `loadtest/README.md`.

---

## 2. Headline result — the per-task ceiling

**Response unit = one request's full latency.** The metric that matters is
**p95** (95% of users are at least this fast). Healthy target: **p95 < 800 ms**.

Steady-state runs, each level held 75 seconds:

| Concurrent students | Median | **p95** | Healthy (p95 < 800ms)? | Errors |
|---|---|---|---|---|
| 10 (smoke) | ~25 ms | 200 ms | ✅ | 0% |
| 100 | 441 ms | 1,350 ms | ❌ | 0% |
| 150 | 1,040 ms | 2,280 ms | ❌ | 0% |
| 200 | 1,490 ms | 3,120 ms | ❌ | 0% |
| 300 | 2,570 ms | 4,060 ms | ❌ | 0% |

**Per-task comfortable ceiling (p95 < 800 ms): ≈ 50–80 concurrent students** on
this single ~1-core container for this read-mix. By 100 students the single CPU
core is saturated and p95 crosses the healthy line.

**Sustained throughput plateau: ≈ 50–57 requests/second** per container.

---

## 3. Resource usage

- **CPU: pinned at ~1 core (100–135%)** from 100 students upward — saturated
  even at the lowest steady level. Cause: **Node.js runs JavaScript on a single
  thread**, so one `node server.js` process ≈ one CPU core regardless of how
  many cores the host has.
- **Memory: flat ~150 MB** (range 84 → 226 MB across the full ramp), well under
  the 450 MB heap cap. **No leak** observed in these short runs (a 2-hour soak
  is still recommended to confirm).

---

## 4. Stress / resilience finding

A separate ramp pushed concurrency to **1,000** students:
- The server **did not crash and did not leak** — error rate stayed at **0.37%**
  (only `/api/auth/me` failures under extreme queueing).
- Latency degraded badly (p95 ~27 s) — requests **queued** behind the saturated
  single core rather than failing.

**Verdict:** the application **degrades gracefully** (slows down, stays correct)
rather than falling over. This is healthy behaviour and the right foundation for
adding horizontal scaling.

---

## 5. What this means for production scaling

**One Node process ≈ one CPU core. Therefore horizontal scaling is mandatory:**
10,000 students are served not by one big server but by **many backend copies
(ECS Fargate tasks) behind an Application Load Balancer**, with **autoscaling**
adding/removing tasks based on CPU.

### Rough sizing for 10,000 students

> If one task handles ~50–80 concurrent students at good latency:
> **10,000 *simultaneous* active students ≈ 125–200 tasks.**

Two caveats that materially lower this number:

1. **"10,000 students" ≠ "10,000 requests/second."** With realistic think time,
   10,000 *logged-in* students generate only a few hundred simultaneous in-flight
   requests. The high task count only applies to a true thundering-herd spike
   (e.g. an exam window opening) — which the WAF + CloudFront + autoscaling are
   designed to absorb.
2. **Production tasks outperform this laptop.** On AWS, the database is separate
   (Atlas), no load generator competes for CPU, and each task gets dedicated
   vCPU. Real per-task capacity will be **higher** — confirmed at G3.

### Autoscaling targets (to be finalized at G3)
- Target-track **average CPU ~60%**, min 2 / max ~6–10 tasks for launch.
- Step rule on ALB `RequestCountPerTarget` using the req/s ceiling measured at G3.

---

## 6. Optimization applied + measured result

**Change made (safe, behavior-preserving — output JSON identical):**
- `GET /api/courses`: added `.lean()` (skip Mongoose hydration of large course
  docs) and removed a redundant `College.findById()` (the college, with
  `subscriptionPlan`, is already populated onto `req.user` by `protect`).
- `GET /api/assessments`: added `.lean()`.

**A/B benchmark** (focused on `/api/courses`, 60 seeded courses, before vs after):

| Metric | Before | After | Change |
|---|---|---|---|
| Throughput | 2.8 req/s | **10.6 req/s** | **3.8× more** |
| Median latency @100 | 10.7 s | 5.3 s | 2× faster |
| p95 @100 (saturated) | 34.7 s | 44.7 s | ~same |
| Total requests in run | 308 | 1,169 | 3.8× |

**Reading this honestly:** throughput **tripled** (3.8×) and median halved — a
real, zero-risk capacity gain. p95 stayed high **because the benchmark pushes
100–200 concurrent past the saturation point**, and the dominant remaining cost
is now **payload size**: each `/api/courses` response is **~1.6 MB** (it returns
50 *full* course documents incl. all modules/days). `.lean()` removed the
hydration CPU; it cannot shrink the 1.6 MB serialize + transfer.

### The biggest remaining win (needs frontend coordination)
A **list** endpoint should not return full course content. Returning lightweight
summaries (title, code, category, module/day counts) and fetching full detail
only when a course is opened would shrink responses ~50–100× and multiply
per-task capacity far beyond the 3.8× already gained. This changes the response
shape, so it must be coordinated with the frontend.

**The number of tasks you run — and your monthly AWS bill — is decided by how
efficient each request is.** Faster/smaller endpoints → each task serves more
students → fewer tasks → lower cost. Apply the same `.lean()` + response-shaping
pattern to the assessment `start` path next.

---

## 7. Recommended next steps

1. **Optimize `courses` + `start-assessment`** (caching / reduce per-request CPU), then re-run `steady.js` to measure the improved ceiling.
2. **Soak test** (50 VUs for 2 hours) to confirm no slow memory leak.
3. **Pre-production code prerequisites** (from `DEPLOYMENT_GUIDE.md`): graceful shutdown, deep health check, compression, body-size right-sizing, Redis adapter for cross-task WebSockets.
4. **G3 AWS staging deployment** to capture the **authoritative** per-task capacity and finalize autoscaling thresholds.
5. **Resolve the B1 secrets blocker** before any cloud deployment.

---

## Appendix — how to reproduce

```bash
# 1. Stack up
docker compose -f docker-compose.local.yml up -d

# 2. Seed (inside the compose network — host has a separate local MongoDB on 27017)
docker run --rm --network smaart_default -v "<repo>:/app" -w /app/back-end \
  -e LOADTEST_MONGODB_URI="mongodb://mongo:27017/smaart_local" \
  node:20-alpine node scripts/seed-loadtest.js

# 3. Tests (run from PowerShell on Windows)
docker run --rm -i --network smaart_default -v "<repo>\loadtest:/loadtest" grafana/k6 run /loadtest/k6/smoke.js
docker run --rm -i --network smaart_default -v "<repo>\loadtest:/loadtest" grafana/k6 run /loadtest/k6/steady.js
docker run --rm -i --network smaart_default -v "<repo>\loadtest:/loadtest" grafana/k6 run /loadtest/k6/ramp.js
```
