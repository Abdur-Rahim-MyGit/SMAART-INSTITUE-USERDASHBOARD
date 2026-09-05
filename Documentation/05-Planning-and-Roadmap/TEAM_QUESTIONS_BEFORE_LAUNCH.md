# SMAART — Questions to Settle With the Team Before Launch
**Date:** 2026-06-11 | Owner: Vickram | Purpose: the decisions that are **not** code problems — they need a human/team call before we deploy.

Each item has: the question, why it matters, the options, and my recommendation. Bring this to the team meeting and tick a decision next to each.

---

## 1. SECRETS — the #1 launch blocker (cannot be fixed by code alone)
**Question:** Who rotates each live credential, and when do we schedule the git-history purge + force-push?

**Why it matters:** `back-end/.env` (and `.env.backup`) were committed to git with **real, working** credentials, and the same secrets are *also* hardcoded in ~18 other tracked files. Anyone who has ever cloned the repo — or who clones it from GitHub now — has our database, mail, and AI keys. Deleting the files does **not** help; they live in git history. Until every key is rotated, we are exposed even after we "remove" them.

**What must happen (in order):**
1. **Rotate every credential** (make the leaked values worthless):
   - [ ] MongoDB Atlas — new least-privilege user, delete `souban`, drop `authSource=admin` — **owner: ____**
   - [ ] `JWT_SECRET` — regenerate (logs everyone out once; fine pre-launch) — **owner: ____**
   - [ ] Cloudinary API secret — **owner: ____**
   - [ ] Gmail SMTP app passwords (×2 accounts) — **owner: ____**
   - [ ] OpenRouter keys (×2) — **owner: ____**
   - [ ] Deepgram, ITSM, OCR.space keys — **owner: ____**
   - [ ] `ADMIN_SYSTEM_SECRET`, `USERDASHBOARD_SYNC_TOKEN` — **owner: ____**
2. **Scrub the straggler files** (I can do this part): remove hardcoded keys from `import_*.js`, `scratch/*.js`, `scripts/.env.example*`, `FINAL_DECISION_NEEDED.md`, `test-api.bat`; untrack `back-end/logs/error.log`.
3. **Purge git history** (`git filter-repo`/BFG) → **force-push** → **everyone re-clones**. This is disruptive and must be coordinated — pick a window when no one has unpushed work. **owner + date: ____**
4. **Turn on GitHub secret scanning + push protection.**

**My recommendation:** Do steps 1–2 this week; schedule step 3 for a specific 1-hour window with the whole team notified. Nothing else launches until rotation (step 1) is done.

---

## 2. Where does production actually run? (hosting + budget sign-off)
**Question:** Do we commit to **AWS ECS Fargate in Mumbai (ap-south-1)** at the Tier-A budget (~₹11,000–14,500/mo), and who owns the AWS account?

**Why it matters:** Everything in the deployment guide assumes this. The team needs to approve the monthly spend and decide who has admin on the AWS account (and the MongoDB Atlas org).

**Options:** (a) AWS Fargate Tier-A as planned *(recommended — managed, India-resident, cheapest path that's still production-grade)*; (b) a cheaper single-VPS stopgap (more ops risk); (c) someone's existing cloud account.

**Decision needed:** account owner ____, budget approved Y/N ____, region confirmed ____.

---

## 3. The AI/LLM cost ceiling
**Question:** What monthly cap do we set on OpenRouter/Anthropic spend, and what happens when we hit it?

**Why it matters:** The AI features (career coach, onboarding, resume) call paid APIs. We added per-user rate limits in code, but a real **billing cap** is an account-level setting only the team can decide. This can quietly become our biggest bill.

**Decision needed:** monthly USD cap ____, alert threshold ____, who watches it ____.

---

## 4. The two features that are intentionally "honest-but-incomplete"
**Question:** Do we build the **Passport verification backend endpoint** before launch, or ship with the page showing "verification unavailable"?

**Why it matters:** The Skills Passport verify page used to *fake* an "Authenticated" result for anyone — that was credential fraud, so it's now fixed to only trust the server. But the server endpoint (`GET /api/passports/verify/:id`) **doesn't exist yet**, so the page currently always says "unavailable." Either we build the endpoint, or we hide the passport-verify feature at launch.

**Options:** (a) build the backend endpoint now *(recommended if passports are a launch feature)*; (b) hide the verify page until post-launch.

**Decision needed:** ____

---

## 5. Data-privacy / DPDP compliance (legal, not code)
**Question:** Who owns the consent + data-processing review before we send student PII to third-party LLMs and Cloudinary?

**Why it matters:** We send names/education to OpenRouter (which may route to community models) and store media on Cloudinary. Under India's DPDP Act 2023 this needs a consent gate, data-minimization, and processor agreements. This is a legal/governance task, not a bug.

**Decision needed:** owner ____, target date ____.

---

## 6. Launch scope — what's in, what's hidden?
**Question:** Are there features we should **feature-flag off** for the first launch to reduce risk?

**Why it matters:** Fewer live surfaces = fewer things that can break in front of real users. Candidates to consider hiding for v1: Skills Passport verify (see #4), Vision Board NSFW edge cases, any half-finished CareerAgent panels.

**Decision needed:** list of v1-hidden features ____.

---

## 7. Who is on-call for launch day, and what's the rollback trigger?
**Question:** Who watches the dashboards during the first 48 hours, and at what point do we roll back?

**Why it matters:** The deployment uses staged rollout — we can roll back in minutes *if someone is watching and empowered to pull the trigger*. Define that now, not during an incident.

**Decision needed:** on-call person(s) ____, rollback decision-maker ____, "roll back if" threshold (e.g. error rate > 2% for 5 min) ____.

---

## 8. Test data + a staging dataset
**Question:** Can we get a small, **anonymized** copy of realistic data (colleges, courses, a few students) for the staging/load tests?

**Why it matters:** Load tests and the sample deployment are far more meaningful against realistic data shapes. It must be anonymized (no real student PII in staging).

**Decision needed:** who provides it ____, anonymization confirmed ____.

---

### Summary — what only the team can decide
| # | Decision | Blocks launch? |
|---|---|---|
| 1 | Secret rotation + history purge | 🔴 YES |
| 2 | Hosting + budget + account owner | 🔴 YES |
| 3 | AI spend cap | 🟠 Strongly advised |
| 4 | Passport endpoint: build or hide | 🟠 Feature decision |
| 5 | DPDP/privacy owner | 🟡 Legal track |
| 6 | v1 feature-flag scope | 🟡 Risk reduction |
| 7 | On-call + rollback trigger | 🟠 Launch-day readiness |
| 8 | Anonymized staging data | 🟡 Improves testing |

Everything else (the actual bugs and vulnerabilities) is being handled in code — see `SECURITY_FIXES_APPLIED_2026-06-10.md`, `DEPLOYMENT_GUIDE.md`, and `TESTING_GUIDE.md`.
