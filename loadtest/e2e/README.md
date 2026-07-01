# SMAART — Browser E2E (Playwright)

Real-browser end-to-end tests against the **production-shaped local stack**
(`docker-compose.prod-local.yml`). They run headless Chromium via the official
Playwright Docker image, on the compose network, hitting the Nginx LB.

## Prerequisites
- Prod-shaped stack up: `docker compose -p smaart-prod -f docker-compose.prod-local.yml up -d --scale backend=3`
- Seeded (creates the real-password `e2e@loadtest.local` user):
  `docker run --rm --network smaart-prod_default -v "<repo>:/app" -w /app/back-end -e LOADTEST_MONGODB_URI=mongodb://mongo:27017/smaart_local node:20-alpine node scripts/seed-loadtest.js`

## Run (from PowerShell)
```
docker run --rm --network smaart-prod_default `
  -v "<repo>\loadtest:/loadtest" -w /loadtest/e2e -e BASE_URL="http://nginx" `
  mcr.microsoft.com/playwright:v1.49.1-jammy `
  bash -c "npm install --no-save @playwright/test@1.49.1 && npx playwright test"
```

## What it checks
1. **Landing page loads** in a real browser with no fatal console errors (proves
   the SPA is served correctly behind Nginx).
2. **College search API** (`GET /api/colleges`) returns the seeded college
   through the load balancer.
3. **Login backend path** (`POST /api/auth/login`) reaches the OTP step with the
   real-password seeded user — proving auth + DB work end-to-end through the LB.

## Known finding (flagged, not a test bug)
The SPA's `getApiBaseUrl()` in `front-end/src/services/api.js` only uses
`VITE_API_URL` (`/api`) when the hostname is `localhost`/`127.0.0.1`; for any
other host it builds `http://<host>:5000/api`. Behind a single domain + load
balancer that misroutes API calls (the UI college search shows "Failed to fetch"
when accessed via a non-localhost host). Should be changed to same-origin `/api`
for production. Tests 2 & 3 therefore exercise the API path directly through the LB.

## Full UI login (manual)
The complete UI funnel is: pick institution → institution page → login modal →
credentials → **OTP**. The OTP is emailed; locally there's no SMTP, but in dev
the code is printed to the backend logs (`docker logs <backend> | grep OTP`),
so a human can complete the flow manually.
