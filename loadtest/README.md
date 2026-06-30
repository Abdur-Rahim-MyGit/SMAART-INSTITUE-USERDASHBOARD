# SMAART — Local Load Testing

Find the **per-task ceiling**: how many concurrent students ONE backend
container serves before latency/errors degrade. From that number you size how
many AWS Fargate tasks 10,000 students needs (`tasks ≈ 10000 / per-task-N`).

> **This measures relative capacity and finds cliffs/bugs — it is NOT the
> absolute production number.** Your laptop runs the load generator AND the
> server on the same 8 cores, with one Mongo and no autoscaling. The real 10k
> figure is confirmed later on AWS staging (gate G3 in DEPLOYMENT_GUIDE.md).

## Prerequisites
- Local stack running: `docker compose -f docker-compose.local.yml up -d`
- Node on host (for seeding) — already present.

## Step 1 — Seed fixtures (students + tokens)
Creates a college, an assessment, and N students, then mints a JWT per student
into `loadtest/tokens.json`. Runs against the exposed local Mongo.

```bash
cd back-end
node scripts/seed-loadtest.js          # default 2000 students
# or: COUNT=5000 node scripts/seed-loadtest.js
cd ..
```

## Step 2 — Smoke test (validate, ~20s)
Runs k6 in Docker on the compose network so it can reach `http://backend:5000`.
The compose network is `smaart_default` (project folder is `SMAART`).

```bash
docker run --rm -i --network smaart_default \
  -v "$(pwd)/loadtest:/loadtest" \
  grafana/k6 run /loadtest/k6/smoke.js
```
Expect: checks ~100% passing, `http_req_failed` ~0%.

## Step 3 — Progressive ramp (~8 min)
Climbs 50 → 200 → 500 → 1000 concurrent students, holding at each step.

```bash
docker run --rm -i --network smaart_default \
  -v "$(pwd)/loadtest:/loadtest" \
  grafana/k6 run /loadtest/k6/ramp.js
```

## Reading the results
- **p95 `http_req_duration`** — the headline. Stays < 800ms = healthy.
- **`http_req_failed`** — error rate. Climbing = the task is saturating.
- **per-endpoint** (`http_req_duration{name:courses}` etc.) — which call hurts first.
- Watch `docker stats smaart-backend-local` in another terminal for CPU/memory.

The concurrency level where p95 crosses ~800ms or errors exceed a few percent
is your **per-task ceiling N**.

## Notes
- Each VU sends a unique `X-Forwarded-For` so the per-IP rate limiter (1000/min)
  treats it as a distinct client — realistic, and avoids the single-IP artifact.
- The DB is disposable. Reset fixtures by re-running the seed, or wipe all local
  data with `docker compose -f docker-compose.local.yml down -v`.
