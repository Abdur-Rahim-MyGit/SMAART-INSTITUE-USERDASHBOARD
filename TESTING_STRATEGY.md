# SMAART — Testing Strategy
**Date:** 2026-06-11 | Audience: you + the team | Goal: understand how we test (locally and in production), how we measure that the app survives a crowd, and **how we fix a bug or crash *after* launch without breaking the live product.**

> Companion to `DEPLOYMENT_GUIDE.md`. That doc is "how we ship"; this doc is "how we know it works, and how we recover when something breaks." (A separate short `TESTING_GUIDE.md` already exists for manual login-flow checks — this file is the full strategy.)

---

## PART 1 — Testing terms you must understand

| Term | Plain meaning | Where we use it |
|---|---|---|
| **Unit test** | Test one small function in isolation (e.g. "does the score calculator return 80% for 8/10?"). | Backend grading, utils, validators. |
| **Integration test** | Test several pieces together (e.g. "does `POST /login` with a real DB return a token?"). | API routes against a test database. |
| **End-to-end (E2E) test** | Drive the real app like a user (open page, type, click, assert). | Critical journeys (signup → assessment). |
| **Smoke test** | A tiny "is the most important stuff alive?" set run right after every deploy. | After each deploy, automatically. |
| **Regression test** | A test proving a previously-fixed bug stays fixed. | Every security fix should get one. |
| **Load test** | Hammer the system with many simulated users to measure speed and find the breaking point. | Before launch, on staging. |
| **Soak test** | A long, steady load (hours) to catch slow leaks (memory, connections). | Before launch. |
| **Spike test** | A sudden burst of users in seconds (our "exam-day crowd"). | Before launch. |
| **Latency / response time** | How long one request takes, end to end. | The core "response unit." |
| **p50 / p95 / p99** | Median / 95th / 99th percentile latency. "p95 = 800ms" = 95% of requests were faster than 800ms. **Percentiles beat averages** — averages hide the slow tail users actually feel. | Pass/fail criteria for load tests. |
| **Throughput (RPS)** | Requests handled per second. | Capacity + autoscaling target. |
| **Error rate** | % of requests that failed (5xx, timeouts). | Main "are we healthy" signal. |
| **Concurrency** | How many users are active at the same moment. | WebSockets + exam windows. |
| **Headroom** | Spare capacity before things degrade. | How much crowd we can take before scaling. |
| **Flaky test** | Passes/fails randomly. | Must be fixed or quarantined — flakiness erodes trust in the whole suite. |
| **Coverage** | % of code exercised by tests. | A rough signal, not a goal in itself. |
| **Hotfix** | A small, urgent fix shipped outside the normal cadence. | Post-launch bug response. |
| **Feature flag** | A switch to turn a feature on/off without redeploying. | Disable a broken feature instantly. |
| **Canary** | Release to a small % of users first, watch, then widen. | Lower-risk way to ship a risky change. |
| **Observability** | Logs + metrics + traces to see inside the running app. | How you diagnose a production bug. |

**Current reality:** SMAART has **almost no automated tests** — `back-end` `npm test` is a placeholder that exits with an error, no runner is configured, and the frontend has no test script. "Testing" today means manual clicking. Part 2 fixes that for the critical paths.

---

## PART 2 — Testing locally (before anything ships)

### Tier 1 — Smoke suite (build first; highest value for least effort)
One script (`scripts/smoke.mjs`) that makes ~20 real HTTP calls and exits non-zero on any failure. It's the heartbeat we run after **every** deploy (local, staging, prod):

**Critical user paths**
- signup-OTP → verify → login → a JWT is issued
- fetch course list; fetch an assessment (response must **NOT** contain `correctAnswer`)
- write enrollment progress; create an escalation (role-gated)
- connect a WebSocket with the token; receive a notification

**Authorization guards (these double as security regression tests)**
- anonymous `GET /api/students` → **401**
- student token `POST /api/courses` → **403**
- student fetches own results → **200**, another student's results → **403**
- `GET /api/vision-board-pro?userId=<other>` → returns only *your* boards (IDOR fix)
- anonymous `GET /api/coachSessions` → **401** (new critical fix)
- anonymous `GET /api/registrations` → **401/403** (new critical fix)
- student token `GET /api/career-agent/user-skills/<other-email>` → **403** (today's fix)
- anonymous `POST /api/ocr/extract` and `POST /api/nsfw/check` → **401** (today's fix)
- hammer an AI endpoint 31× in 15 min → **429** (proves the cost cap works)

I can write this script; it runs in seconds and is the single best safety net we can add.

### Tier 2 — Unit + integration tests (the net that grows over time)
- Add a runner: **Vitest** (works for backend and the Vite frontend) or **Jest** for the backend.
- Start with the **highest-risk logic**: server-side score grading, OTP verify/lockout, the auth middleware role checks, and the ID generator (no duplicates under concurrency).
- Wire `npm test` to actually run them; add a **CI test stage** so a broken test blocks the deploy.

### Tier 3 — E2E (optional pre-launch, valuable later)
- **Playwright** scripting the real browser: landing/hero → signup → dashboard → course player → assessment submit → certificate. Run against the G1 local Docker stack.

---

## PART 3 — Load & crowd testing ("how the crowd works")

**Tool:** **k6** (one binary, JS scripts, runs on Windows; **Artillery** is the alternative). Run against **staging** (G3), never production-with-real-data.

| Scenario | Load profile | Pass criteria |
|---|---|---|
| **Smoke-load** | 10 virtual users, 2 min, read-heavy | p95 < 300ms, 0 errors |
| **Average day** | ramp 0→100 over 5 min, hold 10 min (70% reads, 20% writes, 10% login) | p95 < 800ms, error rate < 0.5% |
| **Exam-day spike (crowd)** | 0→500 in 60s, hold 5 min on **login + assessment-start + answer-submit** | no 5xx storm; limiters return clean **429**s (not crashes); recovery < 1 min |
| **Soak** | 50 users, 2 hours | no memory growth (catches polling/interval leaks), p95 stable |
| **WebSocket** | 300–500 concurrent sockets + a broadcast | every client gets it < 2s; verified across **2** tasks via Redis |
| **AI-cost guard** | 50 users hammering `/api/ai-career-coach/chat` | 429 after the per-user cap — runaway billing closed |

**The two numbers that matter most** (from the average-day + spike runs):
1. **Max concurrent users one task sustains at p95 < 800ms** → autoscaling *minimum*.
2. **Requests-per-task at that p95** → autoscaling *target value*.

These plus the full latency tables go into a dedicated **`RESPONSE_UNITS_REPORT.md`** — the "check how the response units are" deliverable you asked for, produced after the G3 sample deployment. It will read like: "at 500 concurrent exam users, p95 was X ms on N tasks, error rate Y%, scaled to Z tasks."

---

## PART 4 — Testing in production (safely, with real users)

You don't stop testing after launch — you test *differently*:
- **Synthetic monitoring:** the smoke script runs on a schedule (e.g. every 5 min) against prod from outside, alerting if a critical path breaks.
- **Health checks:** the ALB's deep `/api/health` continuously verifies each task (DB-connected), auto-pulling unhealthy ones.
- **Real-user metrics (observability):** CloudWatch dashboards for p50/p95/p99, error rate, CPU/memory, AI spend. **Alarms** fire (email/Slack) on thresholds.
- **Canary releases** for risky changes: ship to a small traffic slice, watch, then widen.
- **Never load-test prod with fake data** — it pollutes analytics and can trip rate limits for real users. Load testing belongs on staging.

---

## PART 5 — How we fix a bug or crash AFTER launch (without breaking the live product)

The most important part, and what you specifically asked about. The whole deployment design exists so a post-launch bug is a **routine, low-drama event** — not an emergency that risks the product.

### The incident playbook
```
1. DETECT   → an alarm fires, a user reports it, or synthetic monitoring catches it.
2. ASSESS   → how bad? data loss / security = sev-1; cosmetic = sev-3.
3. CONTAIN (fastest safe option):
     a. FEATURE-FLAG OFF the broken feature  → instant, no deploy, rest of app untouched.
     b. ROLLBACK to the previous image        → ~2–5 min, whole app returns to last-good.
        (Possible because every release is an immutable, SHA-tagged image and deploys
         are zero-downtime rolling — switching the task def back is one action.)
4. DIAGNOSE → reproduce on STAGING using logs/metrics. Never debug by editing prod.
5. FIX      → write the fix on a branch; ADD A REGRESSION TEST that fails without the fix
              and passes with it, so this exact bug can never silently return.
6. SHIP     → through the SAME pipeline: CI → tests → scan → staging → smoke → manual
              approval → rolling prod deploy. A hotfix is small/scoped but does NOT skip gates.
7. VERIFY   → smoke-test prod; confirm the alarm clears; watch metrics.
8. LEARN    → short write-up: what broke, why, what changed so it can't recur.
```

### Why this doesn't break the launched product
- **Zero-downtime rolling deploys:** the fixed version's tasks come up and pass health checks *before* old ones retire — users never see an interruption.
- **Immutable, tagged releases:** you always know exactly what's running and what to roll back to.
- **Feature flags:** the fastest containment needs no deploy — flip the switch, the broken feature disappears, everything else keeps working.
- **Regression tests:** every fix leaves a test behind, so the suite strengthens with each incident and the same bug can't return unnoticed.
- **Database changes are special:** migrations must be **backward-compatible** — the old code must still work while the new rolls out. Add fields, don't rename/drop in the same release; do destructive changes later, once nothing reads the old shape. This stops a deploy from corrupting live data.
- **Staging mirrors prod:** you reproduce and fix on staging, so production is never your debugging environment.

### Severity → response (agree in advance)
| Severity | Example | Response |
|---|---|---|
| **Sev-1** | Data loss, security breach, login down | Contain immediately (flag/rollback), all-hands, fix within hours |
| **Sev-2** | A core feature broken for many users | Rollback or fast hotfix same day |
| **Sev-3** | Cosmetic / minor, workaround exists | Normal pipeline, next regular release |

---

## PART 6 — Testing & post-launch readiness checklist

- [ ] Smoke suite (`scripts/smoke.mjs`) written and passing locally
- [ ] Smoke suite wired to run after every deploy (and on a schedule against prod)
- [ ] Test runner (Vitest/Jest) added; `npm test` actually runs; CI test stage gates deploys
- [ ] Unit tests for highest-risk logic (grading, OTP/lockout, auth roles, ID generator)
- [ ] A regression test exists for each security fix already applied
- [ ] k6 load scripts written for all six scenarios
- [ ] G3 sample deployment load-tested; `RESPONSE_UNITS_REPORT.md` produced
- [ ] CloudWatch dashboards + alarms (latency, error rate, CPU/mem, AI spend) configured
- [ ] Feature-flag mechanism available for instant containment
- [ ] Incident playbook + severity levels agreed with the team (Team Question #7)
- [ ] Backward-compatible-migration rule understood by everyone who touches the DB

When these are in place, "a bug appeared after launch" becomes a calm, repeatable process — contain in minutes, fix on staging, ship through the gates — with the live product never at risk.
