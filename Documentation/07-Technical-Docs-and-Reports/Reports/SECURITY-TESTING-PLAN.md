# SMAART — Security Testing Plan, Ownership & Explainer

**Date:** 2026-07-15
**Companion to:** `SECURITY-PENTEST-2026-07-15.md` (the findings + fixes)
**Purpose:** answer "what's tested, what's left, who does what, and how each bug was found & prevented."

---

## 0. What is this project, and why security matters

**SMAART Minds** is a **MERN ed-tech SaaS platform**:
- **Backend:** Node/Express + Mongoose, **MongoDB Atlas**, realtime via socket.io.
- **Frontend:** React/Vite SPA (PWA).
- **Third-party:** Cloudinary (image hosting), OpenRouter (LLM), Deepgram (speech), OCR.space (OCR), Supabase (frontend client).
- **Hosting (actual):** a single **EC2** host running nginx + `pm2` (the active `deploy-ec2.yml`), with alternate `render.yaml` (backend) + `vercel.json` (frontend) configs also present. The pentest guide *assumes* AWS ECS/ALB/CloudFront — that does **not** match the live path. **Decide the real target architecture before "AWS hardening."**

**What it does:** students take **staged skill assessments**, enroll in **courses** and track progress, get **AI career intelligence/coaching**, build **vision boards**, earn **badges/certificates**, and use a **community**. It is **multi-tenant** (many colleges) and **multi-role** (student / teacher / coach / admin).

**Why security is critical here:**
- **Privacy:** it stores **student PII** — names, emails, phones, home addresses, DOB, academic records, assessment scores. DPDP (India) / GDPR obligations apply.
- **Integrity:** it **grades assessments** and **issues certificates** — if a student can self-grade or mint a certificate, the credential is worthless.
- **Availability:** colleges depend on it; a cheap DoS (e.g., the sync Excel parse) takes it down for everyone.
- **Cost:** it calls **paid** AI/OCR APIs — unauthenticated/un-rate-limited endpoints are a "denial-of-wallet" risk.

---

## 1. What testing has ALREADY been done (production-level status)

| Test | Tool | When | Result |
|---|---|---|---|
| Code security audit (2 passes) | Multi-agent review | earlier | ~25 issues, ~22 fixed |
| Baseline vuln scan (**passive only**) | OWASP ZAP baseline | earlier | 0 high, config only (not in CI) |
| Load / DoS resilience | k6 | earlier | per-task ceiling found |
| Functional E2E | Playwright (1 spec) | earlier | core flows (non-blocking in CI) |
| Dependency/image scan (**report-only**) | Trivy in CI | earlier | never blocks the build |
| **SCA (deps)** | npm audit | **this session** | FE 20→3, BE →7 (xlsx) |
| **Secret scan (full history)** | trufflehog + gitleaks | **this session** | **B1 confirmed & widened (45 leaks)** |
| **SAST** | Semgrep | **this session** | 9 warnings; found contact.js email injection |
| **Manual code pentest (4 domains)** | review agents | **this session** | 3 unauth CRITICALs + several HIGH |
| **Remediation** | — | **this session** | 12 issue-groups fixed & verified |

**Important caveat:** *every* test done so far is **static / code-level** or runs against a **local/staging-shaped stack**. **No active attack traffic has ever been sent at the live production server.** So "production-level testing" in the DAST/pentest sense is **not** done.

---

## 2. Tests we need to do RIGHT NOW (the remaining gaps, prioritized)

| # | Test | Type | Why it's needed | Blocked on |
|---|---|---|---|---|
| 1 | **Rotate secrets + purge git history** | Secret mgmt | B1 = launch blocker; keys are live in history | **You** |
| 2 | **CI security gates** (gitleaks + Semgrep + npm-audit, blocking) | SAST/SCA/secret | stop regressions automatically | Me |
| 3 | **Authenticated API pentest** (per-role authz matrix) | DAST/manual | IDOR/BFLA/mass-assignment across all routes | Me (build) + You (staging to run live) |
| 4 | **DAST active scan** (ZAP/Burp authenticated) | DAST | baseline was passive only | Staging + authz |
| 5 | **DoS/rate-limit verification** (k6 abuse/spike) | Resilience | confirm 429s, body caps, event-loop safety | Staging |
| 6 | **TLS/transport** (testssl.sh / SSL Labs) | Transport | TLS 1.2+, HSTS, cipher grade | Public HTTPS staging |
| 7 | **AWS/cloud config review** (CSPM) | Infra | IAM, SGs, S3, IMDSv2, WAF, logging | AWS creds + You |
| 8 | **Fix remaining open code items** | Remediation | session token, cert issuance, assessment oracle, students PUT | Me + your decisions |
| 9 | **Re-scan + regression re-test** | Verification | prove fixes hold, no High/Critical open | Me + staging |

---

## 3. Ownership split

### 3A. Tests **I (Claude) can do now** — safe, no authorization needed
- **Build the Newman/Postman API collection** — a reusable script hitting every `/api/*` route with student / teacher / admin tokens, asserting the correct 200/403, to systematically catch IDOR/BFLA/mass-assignment. Runs against a **local** stack (I can boot the docker-compose stack).
- **Wire CI security gates** — add gitleaks, Semgrep, and `npm audit` as **blocking** GitHub Actions jobs; flip Trivy off `continue-on-error`.
- **Re-run Trivy scoped to source** (skip `node_modules`) so it actually completes.
- **More manual code review** — routes not yet covered (analytics, community, tickets, groups, careerAgent, etc.).
- **Apply the remaining safe fixes** (nginx headers/HSTS text, Dockerfile digest pinning, `.dockerignore` cleanup, deploy-workflow `npm ci` + SHA-pinned actions).
- **Generate an SBOM** (CycloneDX/syft) for supply-chain inventory.
- **Author regression tests** so fixed vulns can't silently return.

### 3B. Tests **you must do alone** (I cannot / should not)
- **Rotate every leaked secret** (new DB password, API keys, JWT/admin secrets) and **purge git history** (force-push rewrites shared history — your call) — I can't enter credentials or rotate live keys.
- **Provide a staging URL + written authorization** naming targets, test types, testers, and window — required before any active testing.
- **Commission an external third-party pentest** — for a signed report that satisfies customers/DPDP auditors.
- **Legal/HR sign-off** for anything touching real people (social engineering, phishing simulation) — do not do these without it.
- **Accept breaking dependency upgrades** after testing them: `jspdf@4` (fixes remaining FE critical) and replacing `xlsx`→`exceljs` (BE highs).
- **Decide on behavior-risky fixes**: the session-token `sessionId` change (could log users out) and the assessment answer-oracle fix (may change assessment UX).

### 3C. Tests **I can do WITH MCPs** (connected servers available this session)
> All of these need your explicit go, a target, and read-only scope. I will not run write/mutating cloud calls.

- **AWS config review — `AWS API MCP`** (`call_aws`, read-only): CSPM-lite. Check IAM policies for wildcards, security groups exposing non-ALB ports, S3 public-access/ACLs, **IMDSv2 enforcement** (SSRF blast-radius), WAF presence, CloudTrail + GuardDuty enabled, ALB TLS policy. *Needs your AWS credentials configured and a read-only role.*
- **Monitoring/logging validation — `CloudWatch MCP`** (`describe_log_groups`, `get_active_alarms`, `analyze_log_group`, `analyze_metric`): confirm auth-failure/5xx alarms exist (OWASP A09), look for secrets accidentally landing in logs, check for anomaly alarms. *Needs AWS access.*
- **Render config review — `Render MCP`** (`get_service`, `list_env`, `list_logs`): verify backend env vars are set as secrets (not in git), check deploy logs, confirm health checks. *If Render is a real target.*
- **DAST-lite via `Claude Browser MCP`** — drive the **staging** SPA to inspect **CSP & security headers**, **token storage** (is the JWT in `localStorage`, XSS-exposed?), **client-side-only access control** (does the server actually reject, or just the UI hide?), and **network requests** for leaked data. *Staging only, with your go — not live prod.*

---

## 4. For each bug class found: how I found it & how to prevent it

### Bug class A — Broken access control / IDOR (vision boards, course enrollments, students PUT)
- **What:** authenticated users could read/modify/**delete** objects they don't own by changing an `:id`, and forge course completions/scores.
- **How I found it:** a review agent read **every route with an `:id`/`:email` param** and checked whether, after `findById(...)`, the code verifies the requester **owns** the object (or is staff). Where the ownership check was missing, it's an IDOR.
- **How to prevent it:**
  - **Deny by default:** every object route must enforce *owner-or-authorized-staff* after the lookup.
  - **Never trust client-supplied identity** (`userId`/`student` from body/query) — derive it from the authenticated session.
  - **Scope multi-tenant queries by college** for staff.
  - **Whitelist updatable fields**; never `findByIdAndUpdate(id, req.body)`.
  - Add an **authorization test matrix** (the Newman collection) to CI so a new unprotected route fails the build.

### Bug class B — Unauthenticated endpoints leaking PII + password hashes
- **What:** `GET /register-details/:email` returned full Mongo docs (incl. bcrypt hash + session ids) with no login.
- **How I found it:** mapped which routers apply `protect` vs. which mount **before** it, then inspected the **response shape** for `...doc.toObject()` spreads that leak everything.
- **How to prevent it:**
  - **Authenticate by default**; make "public" an explicit, reviewed exception.
  - **`select:false`** on `password` in every model; return an explicit **field whitelist (DTO)**, never spread the raw document.
  - Bind any legitimately pre-auth flow (registration) to a **signed one-time token**, not a body-supplied email.

### Bug class C — Mass assignment / trusting client flags (self-grade, forged completion)
- **What:** grading honored a `forcePassDev` body flag; enrollment/`students` writes spread `req.body`.
- **How I found it:** searched for `findByIdAndUpdate(id, req.body)` and for **request-body flags in grading/scoring** logic.
- **How to prevent it:** **server-authoritative computation** (never trust a client score/pass), **field whitelisting**, and **no debug/dev backdoors in shipped code** (keep them in tests).

### Bug class D — XSS & HTML injection (first-login modal, contact-form emails)
- **What:** user/registrar-controlled strings rendered as raw HTML (`dangerouslySetInnerHTML` with framework escaping disabled; email bodies built by string interpolation).
- **How I found it:** grepped for `dangerouslySetInnerHTML`/`innerHTML`, plus **Semgrep** `raw-html-format`/`react-dangerouslysetinnerhtml` rules pinpointed the sinks.
- **How to prevent it:** **output-encode by default**; never globally disable framework escaping; **escape all user input** before putting it in HTML (web or email); a strict **CSP** as defense-in-depth.

### Bug class E — Secrets committed to git (B1)
- **What:** live DB/API/JWT keys in `.env` **and** in ~15 committed docs/scripts, across 374 commits.
- **How I found it:** **trufflehog + gitleaks** scanned the **full git history** (not just the working tree).
- **How to prevent it:** **never commit secrets** (`.gitignore` + a **pre-commit hook** like gitleaks); use a **secrets manager** (AWS Secrets Manager / SSM) injected at runtime; **CI secret-scanning gate** on every push; rotate on any exposure.

### Bug class F — Vulnerable dependencies (react-router RCE, xlsx, ws)
- **How I found it:** **`npm audit`** (SCA) against the lockfiles.
- **How to prevent it:** **SCA in CI gated on High/Critical**, automated **Dependabot/Renovate** PRs, and prompt replacement of unmaintained libs (e.g., `xlsx`→`exceljs`).

### Bug class G — Event-loop DoS (`refresh-cache` sync Excel parse)
- **How I found it:** traced the handler into `excelDataLoader` and saw **synchronous `XLSX.readFile` on the request path**, reachable by any logged-in user.
- **How to prevent it:** move heavy work to a **worker thread / background job**, return `202`, **rate-limit**, and **admin-gate** it (done). Never do blocking CPU work on the Node event loop.

### Bug class H — Weak session tokens (missing `sessionId`)
- **How I found it:** compared **every place a JWT is minted** and checked which include the `sessionId` claim that the middleware needs for single-session/expiry/revocation.
- **How to prevent it:** a **single token-issuing function** used everywhere (no divergent copies), **bind tokens to a server-side session**, and test login/logout/multi-device.

---

## 5. The remediation workflow (the steps that must happen, in order)

1. **B1 first:** rotate all secrets → purge history → force-push → re-clone → re-scan clean.
2. **Review & commit** this session's 12 fixes after a **smoke test** (login, registration, vision boards, course progress, certificates, contact form).
3. **Implement the open items** (session token, cert issuance, assessment oracle, students PUT, deploy pipeline, CSP/HSTS, xlsx).
4. **Add CI gates** (secret scan + SAST + SCA blocking) so nothing regresses.
5. **Stand up staging** with **synthetic** data + get **written authorization**.
6. **Run the active tests** (DAST, authenticated API pentest, k6 DoS, TLS) against staging.
7. **Cloud config review** (AWS CSPM via MCP or Prowler) once the target architecture is fixed.
8. **Re-test every finding + re-scan**, then **sign off** — no High/Critical open.

---

## 6. How this helps production (why the effort pays off)

- **Prevents a data breach** of student PII (legal + reputational + DPDP fines).
- **Protects credential integrity** — assessments and certificates stay trustworthy.
- **Keeps the service up** — closes cheap DoS and denial-of-wallet vectors.
- **Makes security continuous** — CI gates + tests mean the *next* risky change is caught automatically, not months later by luck.
- **Produces an audit trail** — the report + this plan are the evidence customers/auditors ask for.
