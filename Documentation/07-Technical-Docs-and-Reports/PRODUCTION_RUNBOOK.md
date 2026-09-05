# SMAART Institute — Production Runbook

**Scope:** both applications, one database, one server to start.

| Repo | What it is | Runtime | Port | Public host |
|---|---|---|---|---|
| `SMAART-INSTITUE-USERDASHBOARD` | Student portal — `back-end/` (Express), `front-end/` (Vite + React), `mobile-app/` (Expo) | Node 22 | 5000 | `https://yourdomain.com` |
| `ADMIN-SMAART-INSTITUTE-26` | Staff portal — `Backend/` (Express), `Frontend/` (Create React App) | Node 22 | 5001 | `https://admin.yourdomain.com` |

Both back-ends connect to **the same MongoDB Atlas database** and verify each other's JWTs, so three values must be identical in both `.env` files: `MONGODB_URI`, `JWT_SECRET`, and (user side only, see §3.4) the cross-app tokens.

This runbook was built from the actual code, the two repos' workflows and Docker files, the pre-launch audits (May–June 2026), the 30 June 2026 handoff, and the *Production Guide v2.0* (23 July 2026). Where those disagree, the code wins and the disagreement is called out.

---

## 0. The decision: what we are building, and why

The repos currently describe **five** different deployment targets (EC2 + pm2, ECS Fargate, EKS, Render, Vercel). Only one of them is actually automated today: `deploy-ec2.yml` in each repo, which pushes to a single EC2 box running Nginx + pm2. The team's own Production Guide prescribes the same thing and calls Docker/ECS "optional".

**Decision for go-live (Phase 1):** one EC2 instance, Nginx on the host as the only public door, both back-ends under pm2, both front-ends as static builds served by Nginx, MongoDB Atlas M10, Let's Encrypt TLS, Hostinger DNS. Docker is used **locally** to run the G0–G2 gates exactly as the team already does (`docker-compose.prod-local.yml`).

**Why not Fargate first:** the G3 staging deploy was never executed, the socket.io Redis adapter the multi-task design depends on is not wired (`docker-compose.prod-local.yml:51` calls it "a known gap"), cron jobs in the user back-end would run once per task, and the admin back-end's Dockerfile is not production grade. All of that is fixable — and §10 is the full path to do it — but none of it should stand between you and a monitored, backed-up, single-box production.

**What a single box gives you:** ~50–80 concurrent students per back-end process (measured locally, `SESSION_HANDOFF_2026-06-30.md`). With pm2 cluster mode on a t3.medium you get 2 workers per app. That is enough for a pilot institution; the moment CloudWatch shows CPU over 70% in busy hours, you move to §10.

The order below is strict. Do not skip to §5 because "the server part is the interesting part" — §2 and §3 are why the last two audits both said *not ready*.

---

## 1. Phase 0 — Decisions the team must make first (1 day)

These are blank in every handoff document. Nothing in §5 onward can be finished without them.

| # | Decision | Owner | Needed by |
|---|---|---|---|
| 1 | **Domain names**: production `yourdomain.com` + `admin.yourdomain.com`; staging `staging.yourdomain.com` + `staging-admin.yourdomain.com`. Who holds the Hostinger login. | | §5.11 |
| 2 | **AWS account**: who owns the root login, which region (**ap-south-1 / Mumbai** — every existing config assumes it), monthly budget ceiling in ₹. | | §5.1 |
| 3 | **MongoDB Atlas**: org owner, production cluster tier (**M10 minimum** — M0/M2/M5 have no point-in-time backup), staging = separate database name in the same cluster. | | §3.1 |
| 4 | **AI model**: `AI_MODEL=openai/gpt-oss-120b:free` returns 404 (`MODEL_ISSUE_DETECTED.md`). Pick one now, e.g. `meta-llama/llama-3.2-3b-instruct:free` for OpenRouter, or commit to Gemini (`GOOGLE_AI_API_KEY`). Set a monthly spend cap on every AI key. | | §3.5 |
| 5 | **Skills Passport verify page**: build `GET /api/passports/verify/:id` or hide the page (it currently always says "unavailable"). | | §2.3 |
| 6 | **ITSM gateway**: the code calls `ITSM_URL` (default `http://localhost:5002`) for ticket escalation. There is no ITSM service in either repo. Decide: deploy it (where is the code?) or accept that escalation is off at launch. | | §3.7 |
| 7 | **On-call**: who watches the first 48 h, who may order a rollback, and the rollback trigger (suggested: error rate > 2% for 5 min, or `/api/health` 503 for 2 min). | | §8 |
| 8 | **Secret rotation window**: a 2-hour slot when everyone stops pushing, for the git-history purge in §2.1. | | §2.1 |
| 9 | **v1 feature flags**: what to hide at launch. Candidates: passport verify, CareerDataFetcher panels, Vision Board NSFW edge cases. `NEW_ASSESSMENT_EVALUATION` **must stay OFF** (`docs/ASSESSMENT-BUILD-PLAN.md`). | | §2.3 |
| 10 | **Data privacy owner** (DPDP Act 2023): student PII is sent to LLM providers and Cloudinary. Not a launch blocker, but someone must own it. | | — |

---

## 2. Phase 1 — Code and repo fixes that must land before any server exists (3–5 days)

### 2.1 🔴 Rotate every secret and purge git history — the #1 blocker in every audit

The repos have had real credentials committed. Moving them into `.env` does not help — a value an attacker already copied stays valid until it is invalidated **at its source**. Two files in the user repo still contain a live OpenRouter key today (`FINAL_DECISION_NEEDED.md`, `MODEL_ISSUE_DETECTED.md`), plus `scratch/`, `import_*.js`, `scripts/.env.example*`, `test-api.bat`, `back-end/logs/error.log`.

**Order of operations (do it in this order, in one sitting):**

1. Generate the new shared secrets locally, never in chat or a doc:
   ```bash
   openssl rand -hex 48   # → JWT_SECRET  (96 chars; admin refuses < 32)
   openssl rand -hex 48   # → ADMIN_SYSTEM_SECRET
   openssl rand -hex 32   # → USERDASHBOARD_SYNC_TOKEN
   openssl rand -hex 32   # → ADMIN_SYNC_TOKEN
   openssl rand -hex 32   # → PROCTORING_WEBHOOK_SECRET
   ```
2. Rotate at each provider and **delete the old key there**:

   | Secret | Where | Used by |
   |---|---|---|
   | MongoDB Atlas DB password → new `MONGODB_URI` | Atlas → Database Access → Edit → Edit Password | both |
   | `CLOUDINARY_API_KEY` / `_SECRET` | Cloudinary Console → Settings → Access Keys → generate new pair, disable old | both |
   | `OPENROUTER_API_KEY` | openrouter.ai → Keys → create, delete old, **set credit limit** | both |
   | `GOOGLE_AI_API_KEY` | Google AI Studio → API keys | both |
   | `ANTHROPIC_API_KEY` | console.anthropic.com → API keys | user |
   | `DEEPGRAM_API_KEY` | console.deepgram.com → API Keys | user |
   | `OCR_SPACE_API_KEY` | ocr.space account | user |
   | `SMTP_PASS` (Gmail app passwords — there are two: `SMTP_PASS` and `EMAIL_PASS`) | Google Account → Security → App passwords → revoke, create | both |
   | `ITSM_API_KEY` | the ITSM provider | both |
   | Supabase anon key | remove entirely (§2.3) | user front-end |
3. Put the new values in the **local** `.env` files only (§3.9 is the full matrix). Confirm `.env` is ignored in both repos (it is: `.gitignore:20` user, `Backend/.gitignore:2` admin).
4. Scrub the tracked files listed above (`git rm --cached back-end/logs/error.log`, edit the markdown, delete `scratch/`), add `scratch/` and `PRELAUNCH_*.md` to `.gitignore`.
5. Purge history — everyone stops pushing first:
   ```bash
   pip install git-filter-repo
   git filter-repo --replace-text secrets.txt    # one old value per line
   git push --force --all && git push --force --tags
   ```
   Then every developer **re-clones** (old clones still hold the history).
6. GitHub → repo → Settings → Code security: enable **Secret scanning** and **Push protection** on both repos.
7. Only now merge the held branch `vickram` (handoff P7).

Rotation is finished when (a) the new value works, (b) the old one is dead at the provider, (c) `git log -p -S '<old value>'` finds nothing.

### 2.2 🔴 Production-breaking configuration in the code

These will break the site on day one even with perfect infrastructure. Each is a small change.

**Admin back-end (`ADMIN-SMAART-INSTITUTE-26/Backend`)**

| Problem | Fix |
|---|---|
| `npm start` runs **nodemon**, and `nodemon.json` forces `NODE_ENV=development` — which disables production CORS, raises rate limits to 1000, and makes the auth cookie non-secure. The `deploy-admin-ec2.yml` workflow starts with `pm2 restart smaart-admin-backend` assuming it exists. | `package.json`: `"start": "node server.js"`, `"dev": "nodemon server.js"`. pm2 must run `node server.js`. |
| `controllers/ticketController.js:433` does `require('node-fetch')` — not in `package.json`, not installed. The proctoring-unlock webhook to the student back-end silently never fires. | Delete the require; Node 22 has global `fetch`. |
| `config/secrets.js:15` requires `@google-cloud/secret-manager` — not installed. Harmless (try/catch) but logs a warning every boot. | Remove the GCP branch or add the package. Phase 1 uses `.env`. |
| `server.js:55-58` logs every request with `console.log` unconditionally. | Gate behind `NODE_ENV !== 'production'` or delete; morgan already exists. |
| `server.js:111-118` general limiter is **150 requests / 15 min per IP** in production. Admin screens fire dozens of calls per page, and a whole college shares one NAT IP. Staff will be locked out within minutes. | Raise to ~1500/15 min; keep the auth limiter at 5. |
| `services/emailService.js:72` logs `SMTP_PASS.length`; `authController.js` / `emailService.js` log **plaintext OTPs and reset codes** on success paths (`Documentation/Audit/SMAART_ADMIN_FULL_RESPONSIVENESS_OTP_SECURITY_AUDIT.md`). With CloudWatch shipping logs, OTPs land in a searchable log. | Remove every OTP/code log line. |
| `authController.js` OTP `999999` bypass in development. | Delete it outright rather than leave it env-gated. |
| `GET /api/auth/me` only loads `User`, so Teacher/Student sessions can't refresh. | Look up across collections like `protect` does. |
| `forgotpassword` is only under the loose `/api/` limiter; reset OTP is 4-digit server-side while the UI says 6. | Add `authLimiter` to `/forgotpassword`; make both sides 6 digits. |
| `GET /api/users/:id` (`userController.js:445-453`) checks role but not `user.college === req.user.college` — a college admin can read any college's users (`Users_Page_Bug_Report.md`, Critical). | Add the tenancy check. |
| `Backend/node_modules` is **committed** and stale (Jul 21, predates the Aug 3 `package.json`). | `git rm -r --cached Backend/node_modules`, add to `.gitignore`. |
| `Dockerfile` uses `node:18-alpine`, `npm install`, root user, no healthcheck, copies `.npmrc` after install. | Only needed for §10 — but fix now while you're in the file (template in §10.1). |
| Two env names for the same thing: `MONGODB_URI` (server) vs `MONGO_URI` (8 scripts); `SMTP_PORT` vs `SMPT_PORT` typo. | Standardise on `MONGODB_URI` / `SMTP_PORT`. |

**Admin front-end (`ADMIN-SMAART-INSTITUTE-26/Frontend`)**

| Problem | Fix |
|---|---|
| `src/utils/studentApi.js:9-10` sends a **hard-coded** `x-admin-bypass: true` / `x-admin-secret: smaart-admin-bypass-2026` on every call to the student back-end. The student back-end only honours that header when `NODE_ENV !== 'production'` (`back-end/middleware/auth.js:15`). **In production every admin→student-API call returns 401** — proctoring snapshots, student views, support tickets. | Send the admin's real JWT (`Authorization: Bearer`) instead. Both apps share `JWT_SECRET` and the student back-end's `protect` resolves users from the shared `users` collection, so an admin token is valid there — verify this once on staging. Delete the bypass header and the secret string. |
| `src/context/AuthContext.js:220` redirects student-role logins to `http://localhost:3000/student/dashboard`. | Read `REACT_APP_STUDENT_PORTAL_URL`; set it to `https://yourdomain.com/dashboard`. |
| API base URL is derived in **nine places** with mismatched default ports (`:5000` vs `:5001`): `utils/api.js`, `pages/Admin/RecruiterManagement.js:2809,2871,3449`, `pages/College/PlacementOffice.js:583,4613`, `pages/Colleges/ManageBatches.js:322,397`, `pages/Support/*`. `pages/Admin/Proctor.js:36` even rewrites the URL if it contains `5001`. | Every file imports `API_URL` from `utils/api.js` and `STUDENT_API_URL` from `utils/studentApi.js`. Delete the Proctor hack. |
| `Frontend/Dockerfile` has no `ARG REACT_APP_*` — a container build bakes in `localhost`. | Only matters for §10; add the args then. |
| XSS: `user.fullName`, college emails, export data rendered unsanitised (every file in `Documentation/Bug_Lists/`). | Sanitise on render; escape CSV/Excel cells starting with `= + - @` (formula injection). |

**User back-end (`SMAART-INSTITUE-USERDASHBOARD/back-end`)**

| Problem | Fix |
|---|---|
| `server.js:335-343`: on `EADDRINUSE` the server **silently moves to `FALLBACK_PORT`** (5001 — which is the admin back-end's port). If the user back-end ever restarts while a stale process holds 5000, it starts on 5001, fights the admin app, and Nginx keeps proxying to a dead 5000. | Remove the fallback in production: `if (NODE_ENV === 'production') process.exit(1)`. |
| `services/websocketService.js:26` builds the socket.io CORS list as `[process.env.FRONTEND_URL]` — **no comma split** — while Express CORS (`server.js:82`) splits on commas. With `FRONTEND_URL=https://a,https://b`, socket.io rejects everyone. | `process.env.FRONTEND_URL.split(',').map(s => s.trim())`. |
| `services/emailService.js:45` and `models/UserCertificate.js:54` use `FRONTEND_URL` **raw** as the link base. With a comma list, every email link and certificate URL is `https://a,https://b/...`. | Use `APP_URL` for links (already read by `helpers/nsfwModeration.js:65`) and set it to `https://yourdomain.com`; or take the first entry. |
| `engine/careerEngine.js:10` `ML_SERVICE_URL` defaults to `http://localhost:5001` — in production that is the **admin back-end**. The career engine will call the admin API expecting an ML service. | Set `ML_SERVICE_URL=` explicitly and make the engine skip the call when unset (it already falls back to MongoDB). |
| `routes/proctoring.js:42-48`: if `PROCTORING_WEBHOOK_SECRET` is unset the unlock webhook is **unauthenticated** (it warns and allows). | Set the secret (§2.1) and make the route refuse when unset. Make the admin side send it (`ticketController.js:433`, header `x-webhook-secret`). |
| `GET /api/users/_debug/state/:email` — unauthenticated, returns a password-hash preview (`api_routing_audit.md` P0). `POST /api/users/_dev/backfill` — env-guard only. | Delete both routes. |
| `GET /users/register-details/:email` — unauthenticated PII read; `students`/`teachers`/`coaches` GET-by-id readable by any logged-in user. | Add `protect` + ownership/role check. |
| `AssessmentFlowGuard.jsx` server token validation commented out; `ModuleViewPage.jsx:325` guard disabled with `if (false)` (P0 in the May audit, re-confirmed 10 June). | Re-enable both or remove the guard code; the gate must be server-side (`/api/auth/me`). |
| Self-score integrity: `courseEnrollments.js` `/quiz-progress` and `/task-result` take `score` from the request body. | Recompute server-side from the answer key. |
| `/api/mindcare-feedback` is called by `MindCareSessions.jsx` but exists nowhere → 404 on every feedback submit. `/forgot-password` and `/reset-password/:token` front-end routes are **not registered** → every password-reset email link 404s. AI Career Coach and `/dashboard/help`, `/dashboard/mind-care` routes unregistered (`404_error_audit.md`). | Register the routes / build the endpoint. Test the reset link end-to-end with a real email in §4. |
| Cron jobs (`services/cronService.js:154` daily 03:00, `utils/cronJobs.js:38` weekly, `:63` **every minute**) run in every process. Fine with pm2 `instances: 1`; with cluster mode or multiple tasks they run N×. | Guard with `if (process.env.RUN_CRON === 'true')` and set it on exactly one pm2 process (see §5.8). |
| `express.json({ limit: '16mb' })` — and admin uses `50mb`. | Keep; Nginx `client_max_body_size 20m` is the real cap. |
| `xlsx` is installed from `https://cdn.sheetjs.com/...` (`back-end/package.json:43`) — `npm ci` needs that host reachable at install time. | Acceptable; know it exists when a build fails with a network error. |

**User front-end (`SMAART-INSTITUE-USERDASHBOARD/front-end`)**

| Problem | Fix |
|---|---|
| `src/services/api.js:5-21` — if `VITE_API_URL` is unset, a non-localhost host gets `http://<host>:5000/api` (plain HTTP, port 5000, blocked by the firewall). `deploy-ec2.yml` builds **without** `VITE_API_URL`. | Always build with `VITE_API_URL=/api` (same-origin, Nginx proxies). `getBackendUrl()` then correctly returns `window.location.origin` for sockets. |
| `front-end/dist/` has 22 files **tracked** in git despite `.gitignore:45`. | `git rm -r --cached front-end/dist`. |
| `public/models` (183 MB) + `public/onnx-wasm` (77 MB) + `public/mediapipe` (22 MB): the ONNX face models are fetched by `npm run setup:models` from Hugging Face and are **not** produced by `npm run build`. The deploy workflow never runs it → face verification has no models in production. | Run `npm run setup:models` in the build step (§6.1), or host the models once on S3 + CloudFront and point `EXPO_PUBLIC_MODEL_BASE_URL` / the web loader there (§10.4). |
| Supabase client (`src/integrations/supabase/`) is installed, unused, and needs two env vars. `Library.jsx` exposes a Google Books key client-side. | Delete the Supabase integration; move the Books call server-side or accept the key as public (restrict it by referrer in Google Cloud). |
| `VITE_ADMIN_URL` (`Navbar.jsx:210`) defaults to `http://localhost:3000`. | Set to `https://admin.yourdomain.com`. |

### 2.3 Repo hygiene (half a day, do it in the same PRs)

- **Pin Node 22 everywhere.** Add `"engines": { "node": ">=22 <23" }` to all four `package.json` files and a `.nvmrc` with `22`. Today: Dockerfiles say 22 (user) / 18 (admin), workflows say 20 (user) / 18 and 20 (admin), the last QA ran on 22.17.
- Delete or move the ~100 `check_*`, `debug_*`, `inspect_*`, `fix_*`, `test_*` scripts at `back-end/` and `Backend/` root into `scripts/dev/` and add that folder to both `.dockerignore` files. Today they ship inside the images.
- Remove the dead targets so nobody deploys to them by accident: `render.yaml`, `front-end/vercel.json`, the Render/Vercel sections of the admin `README.md`, `aws-deployment/PRODUCTION_AWS_GUIDE 2.md` duplicates. Keep `aws-deployment/` (it is §10).
- `seedmoderator.js` promotes a hard-coded `ramesh@gmail.com` — delete it.
- Remove the admin `README.md` default credentials (`admin@smaartminds.com / Admin@123`) and the plaintext demo passwords in `Backend/test-api.http`.
- Admin CI (`ci-cd.yml:37`) runs only `tests/unit`; the five real supertest suites (`tests/*.test.js` — BOLA, tenancy, enrollment auth) never run. Change to `npx jest --forceExit`. Fix `tests/studentModelParity.test.js` — `Student.js` has drifted between the repos (`collegePlacement` exists only on the admin side) despite the "must be byte-identical" comment. Decide which copy is canonical and sync.
- Feature flags: run `back-end/scripts/seed_feature_flags.js` against production in §4.4 with `NEW_ASSESSMENT_EVALUATION=false`.

**Definition of done for Phase 1:** every row above is merged to `main` in both repos, CI is green, the secrets purge is complete, and `git grep -i "sk-or-v1\|mongodb+srv" ` returns nothing in either repo.

---

## 3. Phase 2 — External services: create accounts, keys, and the complete env matrix (1 day)

Every integration the two back-ends actually call, from the code (not from the docs).

### 3.1 MongoDB Atlas (shared by both apps)

1. Atlas → Create project `smaart-prod` → Build a database → **Dedicated M10**, region **Mumbai (ap-south-1)**, cluster name `smaart-prod`.
2. Database Access → Add user `smaart_app` with **readWrite on `smaart`** only (not Atlas admin). Autogenerate the password; this is the one from §2.1.
3. Network Access → **only** the EC2 Elastic IP (§5.2). Never `0.0.0.0/0` — the admin `Documentation/MD Files/DEPLOYMENT_GUIDE.md` tells you to open it wide; don't.
4. Backup tab → enable **Cloud Backup** (snapshot every 6 h, keep 7 daily / 4 weekly / 12 monthly) and **Continuous Cloud Backup** (point-in-time restore).
5. Create a second database name `smaart_staging` in the same cluster for §7 (cheapest) — separate user `smaart_staging_app`.
6. Connection string for both apps: `mongodb+srv://smaart_app:<pw>@smaart-prod.xxxxx.mongodb.net/smaart?retryWrites=true&w=majority`. URL-encode `@ / : ? #` in the password.

### 3.2 Cloudinary (both apps, media)

One account, one cloud. Keys from §2.1. Folder convention already in code. User back-end uses it for vision boards, avatars, community media; admin for course banners/videos/documents (`STORAGE_PROVIDER=cloudinary` is the default). Set an upload preset size limit in Cloudinary (10 MB) to match Nginx.

### 3.3 Email / SMTP (both apps)

Both back-ends use nodemailer. Gmail app passwords work for a pilot (500 mails/day cap). For a real launch use **Amazon SES** in ap-south-1 — verify the domain, request production access (out of sandbox), create SMTP credentials: `SMTP_HOST=email-smtp.ap-south-1.amazonaws.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_FROM="SMAART Institute <noreply@yourdomain.com>"`. Add SPF/DKIM/DMARC records in Hostinger DNS or OTP mails land in spam.

The user back-end has a **second** transport hard-coded to `service: 'gmail'` in `routes/contact.js:22-25` (`EMAIL_USER`/`EMAIL_PASS`, `CONTACT_EMAIL`). Either point it at the same SMTP or fold it into `emailService`.

### 3.4 Cross-app secrets and webhooks (the part no document explains)

| Direction | Endpoint | Auth | Env on sender | Env on receiver |
|---|---|---|---|---|
| Admin → User: unlock proctoring when a ticket resolves | `POST https://yourdomain.com/api/proctoring/webhook/unlock` | header `x-webhook-secret` | `USER_BACKEND_URL=http://127.0.0.1:5000` (same box, internal) + the secret | `PROCTORING_WEBHOOK_SECRET` |
| ITSM → User: work-note sync | `POST /api/tickets/sync-worknote` | bearer token | ITSM config | `USERDASHBOARD_SYNC_TOKEN` |
| ITSM → Admin: work-note sync | `POST /api/tickets/sync-worknote` | bearer token | ITSM config | `ADMIN_SYNC_TOKEN` |
| Admin front-end → User back-end (browser) | `/api/students/...`, `/api/proctoring/...` | admin's JWT (after §2.2 fix) | `REACT_APP_STUDENT_API_URL` | user back-end `FRONTEND_URL` must include `https://admin.yourdomain.com` |
| Both → ITSM gateway | `${ITSM_URL}/api/gateway/*` | bearer | `ITSM_URL`, `ITSM_API_KEY` | — |

`ADMIN_SYSTEM_SECRET` is read **only** by the user back-end and **only** outside production (`middleware/auth.js:15-18`). The Production Guide says it must match in both apps; the admin back-end never reads it. Set it on the user side anyway (harmless) and do not build anything on it.

### 3.5 AI providers

| Provider | Used by | Env | Set a cap |
|---|---|---|---|
| OpenRouter (`openrouter.ai/api/v1/chat/completions`) | user: career coach, chatbot fallback, NSFW text moderation; admin: JD parsing, interview kits, chatbot | `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `AI_MODEL`, `APP_URL` (sent as HTTP-Referer) | Key credit limit in OpenRouter |
| Google Gemini 2.0 Flash (REST, no SDK) | user: support chatbot; admin: placement email drafting, chatbot | `GOOGLE_AI_API_KEY` | Google Cloud quota |
| Anthropic (`claude-3-5-sonnet-20241022`, pinned in `careerAIService.js:10`) | user: career intelligence reports | `ANTHROPIC_API_KEY` | Console spend limit |
| Deepgram nova-2 | user: course-video transcription (`routes/courses.js:662`) | `DEEPGRAM_API_KEY` | Project balance |
| OCR.space | user: vision-board text extraction | `OCR_SPACE_API_KEY` | free tier |
| Sightengine (optional) | user: server-side NSFW image scan; without it the app reports "client-side only" | `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET` | — |

Not used anywhere, remove from any env template: `OPENAI_API_KEY` (the `openai` package is a dependency but nothing reads the key). PaddleOCR (`services/paddleOcr.py`) needs a Python venv that does not exist on the server — OCR.space is the production path.

### 3.6 Other external calls

- **Ready Player Me** (`models.readyplayer.me`) — avatars, no key.
- **Hugging Face** — only at build time for `npm run setup:models`.
- **`cdn.sheetjs.com`** — only at `npm ci` time for `xlsx`.

### 3.7 ITSM gateway and ML service

- `ITSM_URL` / `ITSM_API_KEY` (both apps): if the ITSM service is not deployed, leave `ITSM_API_KEY` empty — `itsmClient.js` warns and the call fails inside a try/catch. Verify on staging that creating and resolving a ticket still works without it.
- `ML_SERVICE_URL` (user only): **set it to an empty string** after the §2.2 fix. Do not leave the default.

### 3.8 AWS services you will create (Phase 1 only)

EC2 (one instance), Elastic IP, Security Group, Key Pair, IAM (one admin user + MFA, one EC2 role for CloudWatch), CloudWatch (agent, 3 alarms, log groups), SNS (one topic), Budgets (one alert), S3 (one private bucket for DB backups). **Not yet:** ECR, ECS, ALB, ElastiCache, CloudFront, Route 53, Secrets Manager — all in §10.

### 3.9 The complete environment matrix

**User back-end — `/var/www/SMAART-INSTITUE-USERDASHBOARD/back-end/.env`**

```ini
# core (server exits without the first two)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://smaart_app:<pw>@smaart-prod.xxxxx.mongodb.net/smaart?retryWrites=true&w=majority
JWT_SECRET=<96-hex>
LOG_LEVEL=info
RUN_CRON=true                       # only on ONE pm2 process (see §5.8)

# origins and links
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
APP_URL=https://yourdomain.com      # email links, certificate URLs, OpenRouter referer
CLIENT_URL=https://yourdomain.com

# cross-app
ADMIN_SYSTEM_SECRET=<96-hex>        # dev-only bypass; set anyway
USERDASHBOARD_SYNC_TOKEN=<64-hex>
PROCTORING_WEBHOOK_SECRET=<64-hex>
ML_SERVICE_URL=                     # empty on purpose
ITSM_URL=                           # empty unless the gateway is deployed
ITSM_API_KEY=

# mail
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<ses-smtp-user>
SMTP_PASS=<ses-smtp-pass>
ADMIN_EMAIL=ops@yourdomain.com
EMAIL_USER=<same as SMTP_USER>      # routes/contact.js second transport
EMAIL_PASS=<same as SMTP_PASS>
CONTACT_EMAIL=hello@yourdomain.com

# media
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AI
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=meta-llama/llama-3.2-3b-instruct:free
GOOGLE_AI_API_KEY=
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
OCR_SPACE_API_KEY=
SIGHTENGINE_API_USER=
SIGHTENGINE_API_SECRET=
```

**Admin back-end — `/var/www/ADMIN-SMAART-INSTITUTE-26/Backend/.env`**

```ini
NODE_ENV=production
PORT=5001
MONGODB_URI=<identical to user>
JWT_SECRET=<identical to user>
JWT_EXPIRE=24h

FRONTEND_URL=https://admin.yourdomain.com
APP_URL=https://admin.yourdomain.com
USER_BACKEND_URL=http://127.0.0.1:5000
PROCTORING_WEBHOOK_SECRET=<same as user>   # after the §2.2 webhook fix
ADMIN_SYNC_TOKEN=<64-hex>
ITSM_URL=
ITSM_API_KEY=

SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="SMAART Institute <noreply@yourdomain.com>"

STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_FILE_SIZE=10485760

GOOGLE_AI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

**User front-end — build-time (`front-end/.env.production`, committed, no secrets)**

```ini
VITE_API_URL=/api
VITE_ADMIN_URL=https://admin.yourdomain.com
```

**Admin front-end — build-time (`Frontend/.env.production`, committed)**

```ini
REACT_APP_API_URL=https://admin.yourdomain.com          # code appends /api
REACT_APP_STUDENT_API_URL=https://yourdomain.com        # check studentApi.js:3 — does it append /api?
REACT_APP_STUDENT_PORTAL_URL=https://yourdomain.com/dashboard
```

**Mobile app — `mobile-app/eas.json` `production.env`**

```json
"env": { "EXPO_PUBLIC_API_URL": "https://yourdomain.com/api",
         "EXPO_PUBLIC_MODEL_BASE_URL": "https://yourdomain.com/models/onnx" }
```

Mobile requests carry no `Origin`, so CORS allows them (`server.js:73`).

---

## 4. Phase 3 — Prove it locally with Docker: gates G0, G1, G2 (1 day)

The team already built this. Run it against the **fixed** code from §2 with the **new** secrets from §3, not the old ones.

### 4.1 G0 — full stack up

```bash
cd SMAART-INSTITUE-USERDASHBOARD
cp back-end/.env.local.example back-end/.env.local    # fill with real values
VITE_API_URL=/api npm --prefix front-end run build
docker compose -p smaart-prod -f docker-compose.prod-local.yml up -d --build --scale backend=2
curl -s localhost/api/health            # 200 {"status":"...","db":"connected"}
```

Pass: healthcheck green, `/api/health` 200 **and** `db:"connected"`, no `undefined` env warnings in `docker compose logs backend`, signup → login → dashboard works in the browser, `X-Upstream` header rotates between the two replicas.

The admin app has no compose stack with a database. Run it natively for now:

```bash
cd ADMIN-SMAART-INSTITUTE-26/Backend && NODE_ENV=production node server.js   # must print "MongoDB connected"
npx jest --forceExit                                                          # all suites, not just tests/unit
```

### 4.2 G1 — smoke

```bash
node scripts/smoke.mjs          # ~25 assertions; exit 0
```

Plus the security regressions from `TESTING_STRATEGY.md` Tier 1 (anonymous `GET /api/students` → 401, other user's results → 403, 31st AI call in 15 min → 429, anonymous `/api/ocr/extract` → 401).

### 4.3 G2 — load, browser, and scanner

```bash
node back-end/scripts/seed-loadtest.js                                     # 2000 students → loadtest/tokens.json
docker run --rm -i --network smaart-prod_default -v "$PWD/loadtest:/loadtest" grafana/k6 run /loadtest/k6/smoke.js
docker run --rm -i --network smaart-prod_default -v "$PWD/loadtest:/loadtest" grafana/k6 run /loadtest/k6/steady.js
docker run --rm -i --network smaart-prod_default -v "$PWD/loadtest:/loadtest" -e BASE_URL=http://nginx mcr.microsoft.com/playwright:v1.49.1-jammy sh -c "cd /loadtest/e2e && npm ci && npx playwright test"
docker run --rm --network smaart-prod_default -v "$PWD/loadtest:/zap/wrk" ghcr.io/zaproxy/zaproxy:stable zap.sh -cmd -autorun /zap/wrk/zap.yaml
```

Pass bar: p95 `http_req_duration` < 800 ms and errors < 5% at the level you intend to run (the committed `ramp-lb-summary.json` shows saturation at 1000 VUs on a laptop — expected). ZAP report has no High. Record the per-container ceiling (it was 50–80 concurrent students); it sizes §5.2.

### 4.4 Database preparation (run once, against the production Atlas DB, from your laptop)

1. **Migrations** — user: `back-end/migrations/2026-05-13-community-reaction-normalization.js`; admin: `Backend/migrations/mergeRegistrationsIntoStudents.js --dry-run` first, then for real (skip if the prod DB never had a `registrations` collection).
2. **Reference data** — admin: `scripts/seedDepartments.js`, `scripts/seedUgCatalog.js`, `scripts/importDegrees.js`, root `seed_skills.js` + `seedSkillAssessments.js` (both need the `Frontend/` folder present — run from a full checkout, not the server). User: `scripts/seedColleges.js`, `seedDegrees.js`, `seed-badges.js`, `seed-course-badges.js`, `seed-t1-bank.js`, `seed-roleskills-compliance.js`, `import_master_roles.js`, `import_intel.js`, `seed_feature_flags.js` (with `NEW_ASSESSMENT_EVALUATION=false`).
3. **Never run in production:** `seed_mock_skills.js`, `seed_mock_students.js`, `seed-loadtest.js`, `seedmoderator.js`.
4. **First admin user** — there is no seeder (`npm run seed` points at a file that doesn't exist). Create it once with `POST /api/auth/register` on the admin back-end with `role: admin`, then either remove the public register route or leave it (new registrations land as `pending`). Enable MFA-equivalent: the admin login already requires email OTP.
5. Indexes are created by Mongoose on first boot (`autoIndex`). On an empty DB that is instant; on a migrated one, boot once and watch Atlas → Metrics for index builds before opening traffic.

**Definition of done for Phase 3:** G0–G2 green on the fixed code with rotated secrets; Atlas holds migrated + seeded data and one admin user; a `mongodump` of that state is saved (first restore point).

---

## 5. Phase 4 — Build the production server on AWS (the 13 steps, with the details the diagram left out) (1 day)

This is the path drawn in `docs/diagrams/smaart-deployment-roadmap.png`. Each step ends with the check that proves it.

### 5.1 AWS account and a safe admin login
Root: MFA on, no access keys. IAM user `smaart-admin` with `AdministratorAccess` + MFA; sign in as that from now on. **Set the budget alert now** (§8.4) — it costs nothing and the most expensive bills are from things nobody was watching. ✅ Signed in as the IAM user; root has MFA and zero keys.

### 5.2 Launch the server
EC2 → Launch instance: **Ubuntu 22.04 LTS**, **t3.medium** (2 vCPU / 4 GB — you are running two Node apps plus pm2 cluster workers; t3.small works but leaves no headroom for the CRA build if you ever build on the box), **30 GB gp3**. Key pair `smaart-prod.pem`. Allocate an **Elastic IP** and associate it. ✅ 2/2 status checks; EIP attached.

### 5.3 Security Group — exactly three inbound rules
SSH 22 from **your IP /32** only · HTTP 80 from 0.0.0.0/0 · HTTPS 443 from 0.0.0.0/0. Nothing for 5000/5001. ✅ Inbound tab shows three rules.

### 5.4 Connect and harden the OS
```powershell
icacls smaart-prod.pem /inheritance:r /grant:r "%USERNAME%:R"
ssh -i smaart-prod.pem ubuntu@<EIP>
```
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades fail2ban ufw
sudo dpkg-reconfigure -plow unattended-upgrades
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo timedatectl set-timezone Asia/Kolkata
```
✅ `ubuntu@ip-…` prompt; `ufw status` shows the three ports.

### 5.5 Install Node 22, git, Nginx, pm2
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm install -g pm2
node -v && git --version && nginx -v && pm2 -v
```
✅ All four print versions; `node -v` starts with `v22`.

### 5.6 Clone both repos with read-only deploy keys
```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_user  -N "" -C "smaart-prod user"
ssh-keygen -t ed25519 -f ~/.ssh/deploy_admin -N "" -C "smaart-prod admin"
cat ~/.ssh/deploy_user.pub   # → GitHub repo → Settings → Deploy keys (read-only)
cat ~/.ssh/deploy_admin.pub
cat >> ~/.ssh/config <<'EOF'
Host gh-user
  HostName github.com
  IdentityFile ~/.ssh/deploy_user
Host gh-admin
  HostName github.com
  IdentityFile ~/.ssh/deploy_admin
EOF
sudo mkdir -p /var/www && sudo chown ubuntu:ubuntu /var/www && cd /var/www
git clone git@gh-user:<org>/SMAART-INSTITUE-USERDASHBOARD.git
git clone git@gh-admin:<org>/ADMIN-SMAART-INSTITUTE-26.git
cd SMAART-INSTITUE-USERDASHBOARD/back-end && npm ci --omit=dev
cd ../../ADMIN-SMAART-INSTITUTE-26/Backend && npm ci --omit=dev --legacy-peer-deps
```
Front-end dependencies are **not** installed on the server — CI builds the front-ends (§6). ✅ Both repos under `/var/www`; both back-ends have `node_modules`.

### 5.7 Create the two `.env` files by hand (never in git)
Paste the §3.9 blocks with real values:
```bash
nano /var/www/SMAART-INSTITUE-USERDASHBOARD/back-end/.env
nano /var/www/ADMIN-SMAART-INSTITUTE-26/Backend/.env
chmod 600 /var/www/SMAART-INSTITUE-USERDASHBOARD/back-end/.env /var/www/ADMIN-SMAART-INSTITUTE-26/Backend/.env
```
Then Atlas → Network Access → add `<EIP>/32`. ✅ `ls -l` shows `-rw-------`; Atlas lists only the EIP.

### 5.8 Run both back-ends under pm2 (ecosystem file, not ad-hoc commands)
Create `/var/www/ecosystem.config.js`:
```js
module.exports = {
  apps: [
    {
      name: 'user-backend',
      cwd: '/var/www/SMAART-INSTITUE-USERDASHBOARD/back-end',
      script: 'server.js',
      instances: 2,                // cluster mode → zero-downtime `pm2 reload`
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 5000 },
      max_memory_restart: '700M',
      kill_timeout: 30000,         // matches the 30 s graceful shutdown in server.js
      time: true,
    },
    {
      name: 'admin-backend',
      cwd: '/var/www/ADMIN-SMAART-INSTITUTE-26/Backend',
      script: 'server.js',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 5001 },
      max_memory_restart: '600M',
      time: true,
    },
  ],
};
```
Cron caveat: with `instances: 2` the user back-end's cron jobs run twice unless you applied the `RUN_CRON` guard from §2.2. With the guard, set `RUN_CRON=true` via `env` on one process (use `instances: 1` for a separate `user-cron` app entry if you prefer, with `PORT` unset and the HTTP listen skipped — simplest: keep `instances: 1` for the user backend until the guard is in).
```bash
cd /var/www && pm2 start ecosystem.config.js
pm2 status && pm2 logs --lines 30      # "MongoDB connected" for each
pm2 startup            # run the sudo command it prints
pm2 save
```
✅ Both `online`, 0 restarts; `curl -s localhost:5000/api/health` → 200 with `db:"connected"`; `curl -s localhost:5001/health` → `{"status":"ok"}`.

### 5.9 Front-end builds
In Phase 1 the builds come from CI (§6) and are copied to `/var/www/user-dist` and `/var/www/admin-dist`. For the very first deploy, build locally and `scp`:
```bash
# laptop — user
cd front-end && npm ci && npm run setup:models && VITE_API_URL=/api VITE_ADMIN_URL=https://admin.yourdomain.com npm run build
scp -i smaart-prod.pem -r dist/* ubuntu@<EIP>:/var/www/user-dist/
# laptop — admin
cd Frontend && npm ci && REACT_APP_API_URL=https://admin.yourdomain.com REACT_APP_STUDENT_API_URL=https://yourdomain.com REACT_APP_STUDENT_PORTAL_URL=https://yourdomain.com/dashboard CI=false npm run build
scp -i smaart-prod.pem -r build/* ubuntu@<EIP>:/var/www/admin-dist/
```
✅ `/var/www/user-dist/index.html` and `/var/www/admin-dist/index.html` exist; `user-dist/models/` and `user-dist/onnx-wasm/` are present (~280 MB).

### 5.10 Nginx — two server blocks, built from the repo's own `nginx/nginx.conf`
The repo's `nginx/nginx.conf` already has the right proxy rules (socket.io upgrade, `/ws/`, `/uploads/`, rate limiting, security headers) but is written for Docker (`server_name localhost`, upstream `backend`). Port it to the host:

`/etc/nginx/conf.d/smaart-common.conf`:
```nginx
limit_req_zone  $binary_remote_addr zone=api_rl:10m rate=20r/s;
limit_conn_zone $binary_remote_addr zone=conn_lim:10m;
limit_req_status 429; limit_conn_status 429;
gzip on; gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
server_tokens off;
map $http_upgrade $connection_upgrade { default upgrade; '' close; }
```

`/etc/nginx/sites-available/smaart-user`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/user-dist;
    index index.html;
    client_max_body_size 20m;

    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "camera=(self), microphone=(self), geolocation=()" always;

    location /api/ {
        limit_req zone=api_rl burst=40 nodelay;
        limit_conn conn_lim 100;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s; proxy_read_timeout 60s;
    }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
    location /ws/ {                      # raw WebSocket channel (/ws/notifications)
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
    location /uploads/ { proxy_pass http://127.0.0.1:5000; proxy_set_header Host $host; }

    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location ~ ^/(models|onnx-wasm|mediapipe)/ { expires 30d; try_files $uri =404; }
    location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate"; }
    location / { try_files $uri $uri/ /index.html; }
}
```

`/etc/nginx/sites-available/smaart-admin`:
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/admin-dist;
    index index.html;
    client_max_body_size 50m;            # admin uploads course videos

    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location /api/ {
        limit_req zone=api_rl burst=40 nodelay;
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;         # JD analyzer / AI drafting are slow
    }
    location /health   { proxy_pass http://127.0.0.1:5001; }
    location /uploads/ { proxy_pass http://127.0.0.1:5001; proxy_set_header Host $host; }
    location /static/  { expires 1y; add_header Cache-Control "public, immutable"; }
    location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate"; }
    location / { try_files $uri $uri/ /index.html; }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/smaart-user  /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/smaart-admin /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Both back-ends have `app.set('trust proxy', 1)` — correct for exactly one proxy hop (this Nginx). ✅ `nginx -t` ok; `curl -H "Host: yourdomain.com" http://<EIP>/api/health` → 200.

### 5.11 DNS at Hostinger
hPanel → Domains → DNS: `A @ → <EIP>`, `A www → <EIP>`, `A admin → <EIP>`, `A staging → <staging EIP>` (§7). Delete parking records. Add the SES `TXT`/`CNAME` records from §3.3. ✅ `nslookup yourdomain.com` and `nslookup admin.yourdomain.com` return the EIP.

### 5.12 HTTPS
```bash
sudo snap install core && sudo snap refresh core && sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d admin.yourdomain.com
sudo certbot renew --dry-run
```
Certbot rewrites both server blocks for 443 and adds the 80→443 redirect. Then add HSTS inside each `listen 443` block: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`. ✅ Padlock on both hosts; `http://` redirects; dry-run prints success; `wss://yourdomain.com/socket.io/` connects (browser devtools → WS tab).

### 5.13 Final production checks
```bash
grep NODE_ENV /var/www/*/back-end/.env /var/www/*/Backend/.env
pm2 reload all --update-env && pm2 save
sudo reboot      # wait 2 min, ssh back in, pm2 status → both online
```
Checklist: student login (proves `/api` + Atlas + SMTP OTP) · notification toast arrives live (proves `/socket.io`) · admin login with OTP (proves 5001 + SMTP) · admin opens a student's proctoring page (proves the §2.2 JWT fix and user-side CORS) · upload a profile image (Cloudinary) · password-reset email link opens the reset page (proves the §2.2 route fix) · `pm2 logs` shows no repeating errors · both apps back after reboot with no manual action.

**Definition of done for Phase 4:** every checklist item passes on the staging host (§7) first, then on production.

---

## 6. Phase 5 — CI/CD: make the existing workflows safe (half a day)

Both repos already have `deploy-ec2.yml` / `deploy-admin-ec2.yml` (push to `main` → build on the runner → scp → ssh → pm2). They need five changes.

### 6.1 User repo `.github/workflows/deploy-ec2.yml`

```yaml
name: Deploy to EC2 (production)
on:
  push: { branches: [main] }
  workflow_dispatch:
concurrency: { group: prod-deploy, cancel-in-progress: false }   # never two deploys at once
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    environment: production                                       # manual approval gate, §6.3
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: front-end/package-lock.json }
      - run: npm ci
        working-directory: front-end
      - run: npm run setup:models                                  # ONNX models — not produced by build
        working-directory: front-end
      - run: npm run build
        working-directory: front-end
        env:
          VITE_API_URL: /api
          VITE_ADMIN_URL: https://admin.yourdomain.com
      - uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          source: front-end/dist/*
          target: /home/ubuntu/user-dist-new
          strip_components: 2
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            set -e
            test -f /home/ubuntu/user-dist-new/index.html            # never wipe the site with an empty upload
            rm -rf /var/www/user-dist-prev && mv /var/www/user-dist /var/www/user-dist-prev || true
            mv /home/ubuntu/user-dist-new /var/www/user-dist        # atomic swap; prev kept for rollback
            sudo nginx -t && sudo systemctl reload nginx
  deploy-backend:
    runs-on: ubuntu-latest
    needs: deploy-frontend
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            set -e
            cd ${{ secrets.EC2_BACKEND_PATH }}
            git fetch origin main
            git reset --hard ${{ github.sha }}                     # exact commit, not "latest main"
            npm ci --omit=dev
            pm2 reload user-backend --update-env                   # reload, not restart: zero-downtime
            sleep 5 && curl -fsS http://127.0.0.1:5000/api/health  # fail the run if unhealthy
```

Changes vs today: Node 22 · `setup:models` · `VITE_API_URL` set (it is missing today, which produces a build that calls `http://host:5000`) · atomic dist swap with a kept previous copy · `git reset --hard <sha>` instead of `origin/main` · `npm ci` instead of `npm install --production` · `pm2 reload` instead of `restart` · post-deploy health check · `environment: production` · concurrency lock.

### 6.2 Admin repo `.github/workflows/deploy-admin-ec2.yml`
Same shape: `node-version: 22`, build with the three `REACT_APP_*` values from §3.9 and `CI: false`, target `/var/www/admin-dist`, backend `git reset --hard ${{ github.sha }}`, `npm ci --omit=dev --legacy-peer-deps`, `pm2 reload admin-backend --update-env`, then `curl -fsS http://127.0.0.1:5001/health`. Remove the Docker Hub `docker-build-push` job from `ci-cd.yml` (it pushes `:latest` to a personal Docker Hub — not used by anything); ECR replaces it in §10.

### 6.3 GitHub configuration (both repos)
- Settings → Secrets and variables → Actions: `EC2_HOST` (the EIP), `EC2_USER` (`ubuntu`), `EC2_SSH_KEY` (a **separate** key pair generated for CI — `ssh-keygen -t ed25519`, public key appended to `/home/ubuntu/.ssh/authorized_keys`; do not reuse `smaart-prod.pem`), `EC2_BACKEND_PATH` (`/var/www/SMAART-INSTITUE-USERDASHBOARD/back-end` / `/var/www/ADMIN-SMAART-INSTITUTE-26/Backend`).
- Settings → Environments → `production` → Required reviewers (the rollback decision-maker from §1). Every production deploy now pauses for a click.
- Settings → Branches → protect `main`: require PR, require `ci.yml` green, no force-push (after the §2.1 purge).
- Security Group: add a rule for GitHub Actions runners? No — instead allow port 22 from `0.0.0.0/0` **only if** fail2ban is on and the key is ed25519, or better, run the deploy via a self-hosted runner / AWS SSM later. Simplest safe option for Phase 1: keep 22 open to the world with password auth disabled (`PasswordAuthentication no` in `/etc/ssh/sshd_config`) and fail2ban active.

### 6.4 Rollback (one command each)
- Front-end: `mv /var/www/user-dist /var/www/user-dist-bad && mv /var/www/user-dist-prev /var/www/user-dist && sudo systemctl reload nginx`.
- Back-end: `cd <path> && git reset --hard <previous sha> && npm ci --omit=dev && pm2 reload user-backend`.
- Database: Atlas → Backup → restore to point-in-time **into a new cluster**, inspect, then switch `MONGODB_URI`. Schema changes must be backward-compatible (add fields, never rename/drop in the same release) so a code rollback never needs a DB rollback.

---

## 7. Phase 6 — Staging first (G3), then production (G4)

The handoff's exact words: G3 was never done. Do not point the real domain at a server that has never run the real build with real TLS.

1. Launch a second, smaller instance (**t3.small**) exactly as §5.2–5.13, but: `staging.yourdomain.com` / `staging-admin.yourdomain.com`, `MONGODB_URI` pointing at the `smaart_staging` database, a `staging` branch in each repo, and a copy of each workflow named `deploy-staging.yml` triggered on `branches: [staging]` with its own `STAGING_EC2_HOST` secret and **no** approval gate.
2. Load an anonymised dataset (decision #8 in §1) — never a production dump with real student PII.
3. Run against staging over HTTPS: `scripts/smoke.mjs` with `BASE_URL=https://staging.yourdomain.com`, `k6 run loadtest/k6/steady.js -e BASE_URL=https://staging.yourdomain.com`, Playwright with `BASE_URL`, the manual checklist from §5.13, and the full human UAT of every screen (P6 in the handoff — it has never been done).
4. Record the numbers: p95 per level, the VU count where it crosses 800 ms. That is the capacity of one t3.medium; it tells you when §10 becomes necessary.
5. Only when staging passes: merge `staging` → `main`, approve the production deploy, and run the §5.13 checklist on production.

Stop staging when idle (`aws ec2 stop-instances`) — a stopped t3.small costs only its disk.

---

## 8. Phase 7 — Go-live day and the first 48 hours

**T-1 day:** Atlas snapshot taken manually · `mongodump` to S3 (§9.2) · on-call roster confirmed · AI spend caps confirmed · Hostinger TTL lowered to 300 s.

**T-0:**
1. Approve the production deploy for both repos (§6.3); watch both Actions runs go green.
2. Run the §5.13 checklist on `https://yourdomain.com` and `https://admin.yourdomain.com`.
3. Create the real colleges and college-admin accounts in the admin portal; have one college admin bulk-onboard a small batch of students; confirm the welcome emails arrive and the first-login → OTP → forced password change → onboarding → T1 baseline path works on a phone and a laptop.
4. Announce.

**Rollback trigger** (from §1 #7): error rate > 2% for 5 min, `/api/health` 503 for 2 min, or login failures. Action: §6.4, then diagnose on staging.

**First 48 h:** check `pm2 logs --err` and CloudWatch every 2 h; watch the OpenRouter / Anthropic / Google consoles for spend; keep the Hostinger TTL low until day 3.

---

## 9. Phase 8 — Day-2 operations (set up during launch week, then weekly)

### 9.1 Monitoring — CloudWatch + SNS
1. IAM → Roles → create `SMAART-EC2-CloudWatch-Role` (EC2 trust, policy `CloudWatchAgentServerPolicy`) → attach to the instance (no reboot).
2. On the box:
   ```bash
   wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
   sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
   sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
   ```
   Collect memory + disk; ship `/var/log/nginx/access.log`, `/var/log/nginx/error.log`, `/home/ubuntu/.pm2/logs/*.log`, `/var/www/SMAART-INSTITUE-USERDASHBOARD/back-end/logs/*.log` into log groups `smaart-user-api`, `smaart-admin-api`, `smaart-nginx`. Retention 30 days.
3. SNS → topic `smaart-alerts` → email subscription → **confirm the email**.
4. Three alarms → `smaart-alerts`: `CPUUtilization > 80%` for 3 of 15 min · `StatusCheckFailed ≥ 1` for 2 min · metric filter on the Nginx access log `[ip, id, user, timestamp, request, status_code=5*, size, ...]` → `Nginx5xxCount > 5` in 5 min. Add a fourth: `mem_used_percent > 85%`.
5. External uptime: a scheduled GitHub Actions workflow (`cron: '*/5 * * * *'`) that curls `https://yourdomain.com/api/health` and `https://admin.yourdomain.com/health` and fails (→ email) on non-200. It is the only check that sees the site the way a student does.

### 9.2 Backups — Atlas plus one you control
- Atlas Cloud Backup + PITR is on from §3.1.
- Nightly `mongodump` to a private S3 bucket `smaart-db-backups` (Block Public Access on, versioning on, lifecycle: expire after 35 days). EC2 role gets `s3:PutObject` on that bucket only.
  ```bash
  # /home/ubuntu/backup.sh — crontab: 30 2 * * * /home/ubuntu/backup.sh
  set -e; export $(grep MONGODB_URI /var/www/SMAART-INSTITUE-USERDASHBOARD/back-end/.env)
  f=/home/ubuntu/backups/smaart-$(date +%F).gz
  mongodump --uri="$MONGODB_URI" --archive="$f" --gzip && aws s3 cp "$f" s3://smaart-db-backups/ && rm "$f"
  ```
- **Restore drill once a month**: restore the latest dump into a local `mongo:7` container, open it, confirm counts. "A backup you have never restored is a hope."
- Uploads on disk (`back-end/uploads/`, `Backend/uploads/`): small today (Cloudinary holds the media). Include both in the nightly `aws s3 sync` until §10.4 moves them.

### 9.3 Security hygiene
- Rotate `JWT_SECRET` every 6 months (logs everyone out — schedule it), provider keys yearly, the CI SSH key when anyone leaves.
- `npm audit --audit-level=high` weekly in CI (user `ci.yml` has Trivy report-only; make it blocking on CRITICAL once the baseline is clean).
- `sudo unattended-upgrades --dry-run` monthly; reboot for kernel updates during the maintenance window.
- Review Atlas → Activity Feed and the admin portal's access logs weekly.

### 9.4 Cost
- Budgets → cost budget (e.g. ₹15,000/month) → alerts at 80% and 100% to `smaart-alerts`.
- Expected Phase 1 bill: t3.medium ~$30 + EIP $0 (attached) + EBS ~$3 + CloudWatch ~$5 + Atlas M10 ~$57 + SES cents + staging t3.small when on ~$15 ≈ **$100–110 / month** (~₹9,000), plus AI usage.
- After a month of CPU data: if CPU < 20% all week, drop to t3.small; if > 70% in busy hours, go to §10.

---

## 10. Phase 9 — The scale path: Docker → ECR → ECS Fargate + ALB + Redis + S3/CloudFront

Trigger to start this: the §7 capacity number is within 2× of real peak concurrency, or a second institution signs. Everything here already has scaffolding in `aws-deployment/` and `cd-deploy.yml`; the list below is what is **missing** to make it real, in order.

### 10.1 Make both images production-grade
- User back-end image: `aws-deployment/Dockerfile` is already good (multi-stage, node 22, non-root `node` user, `HEALTHCHECK` on `/api/health`, `NODE_OPTIONS` memory cap). Build context must be `./back-end` (`ci.yml` and compose do this; `aws-deployment/github-deploy-workflow.yml` and `deployment-instructions.md` wrongly use the repo root — fix them).
- Admin back-end image: rewrite `Backend/Dockerfile` to the same template:
  ```dockerfile
  FROM node:22-alpine AS builder
  WORKDIR /usr/src/app
  COPY package*.json .npmrc ./
  RUN npm ci --omit=dev --legacy-peer-deps
  COPY . .
  FROM node:22-alpine
  RUN apk upgrade --no-cache && adduser -S -u 1001 app || true
  WORKDIR /usr/src/app
  COPY --from=builder --chown=node:node /usr/src/app ./
  USER node
  EXPOSE 5001
  ENV NODE_ENV=production
  HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5001/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
  CMD ["node","server.js"]
  ```
  And make `/health` deep (503 when `mongoose.connection.readyState !== 1`) so the ALB pulls a broken task.
- Front-end images are not needed — the SPAs move to S3 + CloudFront (§10.4).

### 10.2 Code changes required before running more than one task
1. **socket.io Redis adapter** — `aws-deployment/production-websocket-sync.js` is the written-but-unused implementation. Add `redis` and `@socket.io/redis-adapter` to `back-end/package.json`, wire it in `services/websocketService.js` when `REDIS_HOST` is set, fix `broadcastToAll` (`clients.get('*')`), support `rediss://` with TLS for ElastiCache. Test with `docker compose -f docker-compose.prod-local.yml up --scale backend=3`: a notification fired on replica A must reach a browser pinned to replica B.
2. **Cron leader** — run the cron jobs in a separate one-task ECS service (`RUN_CRON=true`, `instances` 1) or gate them with a Redis lock.
3. **Rate limiters** — both apps use the in-memory `express-rate-limit` store; switch to `rate-limit-redis` or the limits are per task.
4. **Uploads on local disk** — must go to S3 (`multer-s3` is already a dependency of the admin app; `STORAGE_PROVIDER=s3`). User back-end has no S3 code; add the same `config/storage.js` pattern or keep everything on Cloudinary and block the `/uploads` disk path.
5. **`trust proxy`** becomes `2` if Nginx stays in front of the ALB, or `1` with the ALB alone.
6. Admin chatbot/`GCP` secret loader: delete; Secrets Manager injects env at task start.

### 10.3 AWS build-out (ap-south-1)
1. **ECR**: `aws ecr create-repository --repository-name smaart-backend --image-tag-mutability IMMUTABLE --image-scanning-configuration scanOnPush=true`; same for `smaart-admin-backend`. Tag images with the git SHA, never `:latest`.
2. **OIDC for GitHub** (no stored AWS keys): IAM → Identity providers → `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`; role `github-deploy-smaart` with a trust policy limited to `repo:<org>/<repo>:ref:refs/heads/main`; permissions: ECR push, `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `iam:PassRole` on the two task roles, S3 sync + CloudFront invalidation. Store the ARN as `AWS_DEPLOY_ROLE_ARN`. This is what `cd-deploy.yml` already expects.
3. **Secrets Manager**: one secret per app (`prod/smaart-user`, `prod/smaart-admin`) holding the §3.9 values as JSON. `aws-deployment/ecs-task-definition.json` already maps individual keys from a secret ARN — reconcile it: it provisions unused `OPENAI_API_KEY` and is missing `OPENROUTER_API_KEY`, `SMTP_*`, `DEEPGRAM_API_KEY`, `ITSM_API_KEY`, `ADMIN_SYSTEM_SECRET`, `USERDASHBOARD_SYNC_TOKEN`, `PROCTORING_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OCR_SPACE_API_KEY`. Execution role gets `secretsmanager:GetSecretValue` on those two ARNs only.
4. **VPC**: two public subnets (ALB) + two private subnets (tasks, NAT gateway) in two AZs. Security groups from `aws-deployment/security-policies.md`: `smaart-prod-alb-sg` (443 from world), `smaart-prod-ecs-sg` (5000/5001 from the ALB SG only), `smaart-prod-redis-sg` (6379 from the ECS SG only).
5. **ElastiCache Redis** (serverless or `cache.t4g.micro`, TLS on) in the private subnets.
6. **ECS**: cluster `smaart-cluster` (the name `cd-deploy.yml` uses; `aws-deployment/github-deploy-workflow.yml` says `smaart-production-cluster` — pick one). Task definitions from `aws-deployment/ecs-task-definition.json` (512 CPU / 1024 MB, `stopTimeout: 30`, awslogs `/ecs/smaart-backend`), one per app, `readonlyRootFilesystem: true` with a tmpfs for `/tmp`. Services `smaart-backend-service` (desired 2) and `smaart-admin-service` (desired 1), plus `smaart-cron-service` (desired 1, `RUN_CRON=true`).
7. **ALB** `smaart-alb`, two target groups (`smaart-user-backend-tg` → 5000, health `/api/health`, success codes **200 only**, interval 15 s, healthy 3 / unhealthy 2; `smaart-admin-backend-tg` → 5001, `/health`), host-based rules on the 443 listener (`api.yourdomain.com` → user TG, `admin-api.yourdomain.com` → admin TG), ACM certificate **in ap-south-1** covering both, 80 → 443 redirect. Stickiness on the user TG (`AWSALB` cookie, 1 day) until the Redis adapter is verified, then off.
8. **WAF** on the ALB: AWS managed core rule set + rate rule 2,000 req / 5 min per IP, stricter on `/api/auth/*` and `/api/ai-*`.
9. **Service auto-scaling**: target tracking CPU 60%, min 2 / max 6 (user), min 1 / max 2 (admin), scale-in cooldown 300 s.

### 10.4 Front-ends and media to S3 + CloudFront
- Buckets (all with Block Public Access **on**): `smaart-frontend-prod` (user SPA), `smaart-admin-frontend-prod`, `smaart-media-prod` (uploads, versioning on, prefixes `registrations/ profile-photos/ vision-boards/ courses/ certificates/`), `smaart-models-prod` (the 280 MB ONNX/MediaPipe assets — uploaded **once**, so CI stops shipping them every deploy).
- One CloudFront distribution per SPA with **OAC**, default root `index.html`, custom error responses 403/404 → `/index.html` 200, ACM cert **in us-east-1** (CloudFront's one exception), behaviours: `/api/*`, `/socket.io/*`, `/ws/*`, `/uploads/*` → ALB origin (forward all headers, no caching, WebSocket on); `/models/*`, `/onnx-wasm/*`, `/mediapipe/*` → `smaart-models-prod`.
- Deploy step: `aws s3 sync dist/ s3://smaart-frontend-prod --delete`, `index.html` with `Cache-Control: no-cache`, `assets/` with `max-age=31536000, immutable`, then `aws cloudfront create-invalidation --paths "/*"`.
- `VITE_API_URL` stays `/api` (same origin through CloudFront) — this is exactly the `G3_DEPLOYMENT_RUNBOOK.md` design.
- Media: admin `STORAGE_PROVIDER=s3`, `AWS_S3_BUCKET_NAME=smaart-media-prod`, `AWS_CLOUDFRONT_URL=https://media.yourdomain.com`; no access keys — the task role carries `s3:PutObject/GetObject/DeleteObject` on that bucket. Private documents are served via 15-minute pre-signed URLs after the auth check.
- DNS moves to Route 53 (alias records to CloudFront and the ALB) or stays on Hostinger with CNAMEs — Route 53 is cleaner once there are four hostnames.

### 10.5 Pipeline
Enable `cd-deploy.yml` (switch `workflow_dispatch` to `push: main` only after one successful manual run): lint + `npm audit --audit-level=high` → G1 smoke (blocks) → `docker build` → push `:${{ github.sha }}` → ECR scan (blocks on CRITICAL) → `aws ecs register-task-definition` + `update-service --force-new-deployment` to **staging** → smoke against staging (blocks) → `environment: production` approval → rolling deploy (`minimumHealthyPercent 100`, `maximumPercent 200`, `wait-for-service-stability: true`) → smoke against production. Rollback = `update-service --task-definition <previous revision>`.

### 10.6 Mobile app (can be done in Phase 1 or here)
- `mobile-app/app.json`: set `android.package` (currently the scaffold default `com.anonymous.smaartinstitutemobile`) to `com.smaartinstitute.app`, add `ios.bundleIdentifier` with the same value, bump `version`.
- `eas.json`: add the `production.env` block from §3.9; keep `autoIncrement: true`.
- Build in the cloud (local `expo export` / `run:android` is blocked on this machine by the Application Control policy on `hermesc.exe`): `eas build --platform android --profile production`, then `eas submit`. iOS needs an Apple Developer account and the bundle id registered.
- Models download on first launch from `EXPO_PUBLIC_MODEL_BASE_URL` — point it at `https://yourdomain.com/models/onnx` (Phase 1) or the models CloudFront host (Phase 9).
- Test on a physical device before submitting: signup OTP, forced first-login password change, reset-password round trip, token renewal on an expired session, biometrics — none of these have been exercised on a device yet.

---

## 11. The one-page order of operations

| # | Step | Section | Gate |
|---|---|---|---|
| 1 | Team answers the 10 decisions | §1 | all filled |
| 2 | Rotate secrets, purge history, enable push protection | §2.1 | old keys dead; history clean |
| 3 | Merge the production-breaking code fixes (both repos) | §2.2 | CI green |
| 4 | Repo hygiene, Node 22 pin, admin tests run in CI | §2.3 | CI green |
| 5 | Atlas M10 + backups, SES, Cloudinary, AI keys with caps | §3 | env matrix complete |
| 6 | G0–G2 with Docker locally on the fixed code | §4.1–4.3 | p95 < 800 ms, ZAP clean |
| 7 | Migrations, reference seeds, first admin, feature flags | §4.4 | `mongodump` saved |
| 8 | AWS account, budget alert, staging EC2 (§5 on a t3.small) | §5, §7 | §5.13 checklist on staging |
| 9 | Fix workflows, GitHub secrets, `production` environment, branch protection | §6 | staging auto-deploys from `staging` |
| 10 | G3: smoke + k6 + Playwright + human UAT over HTTPS on staging | §7 | numbers recorded |
| 11 | Production EC2 (§5 on a t3.medium), DNS, TLS | §5 | §5.13 checklist on production |
| 12 | CloudWatch agent, alarms, SNS, uptime cron, nightly dump, restore drill | §9 | first alert email received |
| 13 | Go-live day | §8 | real students logged in |
| 14 | Mobile: bundle ids, `eas build`, device test, submit | §10.6 | store listing |
| 15 | When capacity or a second institution demands it: Docker → ECR → Fargate + ALB + Redis + S3/CloudFront | §10 | staging first, again |

---

## Appendix A — Ports, hosts, and paths

| Thing | Value |
|---|---|
| User back-end | `127.0.0.1:5000`, health `GET /api/health` (deep, 503 on DB loss), socket.io `/socket.io`, raw WS `/ws/notifications`, static `/uploads` |
| Admin back-end | `127.0.0.1:5001`, health `GET /health` (shallow today; make deep in §10.1), API also mounted at `/api/v1/*` |
| Code on server | `/var/www/SMAART-INSTITUE-USERDASHBOARD`, `/var/www/ADMIN-SMAART-INSTITUTE-26` |
| Built SPAs | `/var/www/user-dist` (Vite `dist/`), `/var/www/admin-dist` (CRA `build/`) |
| pm2 | `/var/www/ecosystem.config.js`; processes `user-backend`, `admin-backend` |
| Logs | `~/.pm2/logs/`, `back-end/logs/` (winston, rotating 5 MB × 5), `/var/log/nginx/` |
| Nginx | `/etc/nginx/sites-available/smaart-user`, `smaart-admin`, `conf.d/smaart-common.conf` |

## Appendix B — GitHub secrets

| Secret | Repo | Value |
|---|---|---|
| `EC2_HOST` | both | production EIP |
| `EC2_USER` | both | `ubuntu` |
| `EC2_SSH_KEY` | both | CI-only ed25519 private key |
| `EC2_BACKEND_PATH` | user | `/var/www/SMAART-INSTITUE-USERDASHBOARD/back-end` |
| `EC2_ADMIN_BACKEND_PATH` | admin | `/var/www/ADMIN-SMAART-INSTITUTE-26/Backend` |
| `STAGING_EC2_HOST` | both | staging EIP |
| `AWS_DEPLOY_ROLE_ARN` | both (§10 only) | `arn:aws:iam::<acct>:role/github-deploy-smaart` |
| `DOCKER_USERNAME` / `DOCKER_PASSWORD` | admin | **delete** — Docker Hub job removed |

## Appendix C — Where the existing documents are wrong (so nobody follows them by accident)

- Production Guide §1 sample `.env` uses `MONGO_URI` — the code reads **`MONGODB_URI`** (both apps). Its folder names `backend/`/`frontend/` are `back-end/`, `front-end/`, `Backend/`, `Frontend/`.
- Production Guide: "`ADMIN_SYSTEM_SECRET` must be identical in both apps" — the admin back-end never reads it.
- Admin `README.md` and `Documentation/MD Files/DEPLOYMENT_GUIDE.md`: Render/Vercel, port 5000, `node utils/seeders.js` (file does not exist), Atlas open to `0.0.0.0/0`. Obsolete.
- `PRODUCTION_AWS_GUIDE.md` (EKS) and `TEAM_DEPLOYMENT_GUIDE.md`/`DEPLOYMENT_GUIDE.md` (Fargate) describe §10, not the launch.
- `aws-deployment/ecs-task-definition.json`: `FRONTEND_URL=https://staging.smaartminds.com`; `production-secrets.env.example`: `https://app.smaartminds.com`; `github-deploy-workflow.yml`: `VITE_API_URL=https://api.smaartminds.com` (no `/api`). Three different hostnames — use the §3.9 values.
- `api_routing_audit.md` "Linux casing risk" on `/api/courseEnrollments` etc.: Express routes are case-insensitive by default; not an issue.
- `loadtest/e2e/README.md` still describes the `getApiBaseUrl()` host bug as live; the handoff marks it fixed — but only when `VITE_API_URL` is set, which is why §6.1 sets it.
