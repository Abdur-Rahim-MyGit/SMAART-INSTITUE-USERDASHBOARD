const fs = require("fs");
const d = JSON.parse(fs.readFileSync("scratch/audit_result.json", "utf8"));
const sections = fs.readFileSync("scratch/sections.md", "utf8");
const cost = fs.readFileSync("scratch/cost.md", "utf8").split("\n").slice(1).join("\n").trim();

const head = `# SMAART Platform — Pre-Launch Audit Report
**Date:** 2026-06-09  |  **Branch:** vickram  |  **Audited by:** multi-agent audit teams (16 finder agents + adversarial verification)

---

## Executive Summary

A full-codebase audit was run across the backend (Express/Mongoose, 322 JS files, 50+ routes, 50+ models), the frontend (React 19/Vite, 279 components/pages), and the AWS/Docker deployment configuration.

**163 raw findings** were produced; the **59 critical/high** items were each independently re-verified against the source code. **56 were confirmed, 3 refuted** (removed as false positives). Below are the verified results.

| Severity | Count | Meaning |
|---|---:|---|
| 🔴 **Critical** | 12 | Exploitable now; **block deployment** until fixed |
| 🟠 **High** | 21 | Fix before public launch |
| 🟡 **Medium** | 22 (+ medium/low pool) | First hardening sprint |
| ⚪ **Low** | — | Backlog |

### The headline problem: broken authentication & authorization
The single most serious theme is that **multiple route files have NO authentication at all**. \`students.js\`, \`teachers.js\`, and \`coaches.js\` expose full unauthenticated CRUD over staff and student PII — anyone on the internet can dump your entire student database, create rogue accounts, or delete records. Worse, \`users.js\` lets an attacker **reset any user's password by posting their email** (full account takeover). These must be fixed before the app is reachable from the internet.

### The second headline: leaked production secrets
\`back-end/.env\` and \`back-end/.env.backup\` are **committed to git**. They contain live MongoDB Atlas credentials, the JWT secret, Cloudinary, SMTP, OpenRouter, Deepgram and ITSM keys. The \`.gitignore\` rule does not help because the files were already tracked. **Every one of these secrets must be rotated** — deleting the file is not enough; they live in git history.

### Deployment verdict
Your choice of **Docker on AWS ECS Fargate in Mumbai (ap-south-1)** is the right call and is endorsed below. The deployment config is mostly sound (a \`.dockerignore\` correctly excludes secrets, ECS uses Secrets Manager ARNs), but there are real hardening gaps: JWT-in-websocket-URL (logged in plaintext), \`:latest\` mutable image tags, writable root filesystem, and an overly-open MongoDB network rule.

---

## How to read this report
- **Section 1 (Critical)** and **Section 2 (High)** are the launch blockers — each has location, impact, and a detailed fix.
- **Section 3** is the medium/low backlog.
- **Section 4** is the deployment & cybersecurity deep-dive.
- **Section 5** is the AWS India cost analysis with a budget-friendly recommendation.
- **Section 6** is the prioritized remediation roadmap.
- **Appendix A** lists the 3 findings refuted during verification (checked, not missed).
`;

const refuted = `\n## Appendix A — Refuted findings (checked and dismissed)\n\nThese were flagged by a finder agent but **disproven** during code verification — listed for transparency:\n\n` +
  d.refuted.map((f, i) => `**${i + 1}. ${f.title}**  \nVerifier note: ${f.verdict.note}`).join("\n\n") + "\n";

const deployIntro = `\n## Section 4 — Deployment & Cybersecurity (AWS ECS + Docker, India)

**Stack decision — endorsed.** Docker containers on **AWS ECS Fargate** in **ap-south-1 (Mumbai)** is the correct, production-professional choice for an Indian launch. Mumbai has full service parity (Fargate, ALB, WAF, Secrets Manager, ACM, CloudFront edge); ap-south-2 Hyderabad does **not** — keep everything in ap-south-1. The frontend React SPA should be served from **S3 + CloudFront**, not from ECS. MongoDB should be **MongoDB Atlas on AWS Mumbai** (managed HA + backups), not self-managed.

**What is already good in your config:** a \`.dockerignore\` correctly excludes \`.env\`/keys/git from the image; the ECS task definition references **Secrets Manager ARNs** (not inline secrets); ACM gives free TLS; WAF/HTTPS guidance is present.

**Deployment-specific findings** (full detail in Sections 1–3 by severity; summarized here):

- 🔴 Live secrets committed to git (\`back-end/.env\`) — rotate + purge history.
- 🟠 \`OPENROUTER_API_KEY\` and SMTP creds used by the app are **not provisioned** in the ECS task definition — the app will fail or fall back insecurely in production.
- 🟠 JWT passed in the **WebSocket URL query string** — lands in ALB/CloudWatch access logs in plaintext. Move to the \`Sec-WebSocket-Protocol\` header or a short-lived ticket.
- 🟡 MongoDB Atlas reachable from the **entire VPC CIDR + NAT public IP**; restrict to the task security group only.
- 🟡 ECS container runs with a **writable root filesystem**; set \`readonlyRootFilesystem: true\` with a tmpfs for scratch.
- 🟡 CI/CD pushes the **mutable \`:latest\` tag** and does not gate deploy on the image vulnerability scan; pin to immutable digests and block on scan results.
- 🟡 ECS egress security group allows **unrestricted outbound 0.0.0.0/0**; scope to required destinations.
- 🟡 No ulimits/stop-timeout; **50MB JSON body limit on a 512MB task** invites OOM/DoS; lower the body limit and right-size resources.
- ⚪ WAF present but **no rate-limiting rule**; add a rate-based rule and enforce TLS 1.2+.

> **Note on DPDP Act 2023:** a finder raised India data-residency/processor obligations, but it was **refuted** as written (it referenced fabricated leaked-region details). The substance still deserves a real compliance pass: with PII flowing to third-party LLMs (OpenRouter/OpenAI) and Cloudinary, you need a consent gate, data-minimization, and processor agreements. Treat this as a legal/compliance task, not just a code fix.
`;

const roadmap = `\n## Section 6 — Prioritized Remediation Roadmap

### Phase 0 — STOP THE BLEEDING (do today, before any deploy)
1. **Rotate every secret** in \`back-end/.env\`: MongoDB Atlas password, JWT_SECRET, Cloudinary, SMTP, OpenRouter, Deepgram, ITSM. Then \`git rm --cached back-end/.env back-end/.env.backup\`, commit, and purge from history (git filter-repo / BFG). A new JWT_SECRET invalidates existing tokens — acceptable pre-launch.
2. **Add auth to the open route files** — \`students.js\`, \`teachers.js\`, \`coaches.js\`: \`router.use(protect)\` + \`requireRole(...)\`, scope self-reads to \`req.user\`.
3. **Close the account-takeover hole** in \`users.js\`: never set a password from an unauthenticated body; derive identity from \`req.user\`, not \`req.body.email\`.

### Phase 1 — Launch blockers (this sprint)
- Work through all **12 Critical** findings (Section 1), then the **21 High** (Section 2).
- Focus order: auth/authorization → answer-key leakage → IDOR/mass-assignment → injection → crashes.

### Phase 2 — Hardening sprint (before scaling traffic)
- Medium/low backlog (Section 3): error-handler stack-trace leak, \`select:false\` on password fields, NoSQL-injection input validation, websocket JWT-in-URL, debug endpoints.
- Deployment hardening (Section 4): pin image tags, read-only rootfs, tighten MongoDB SG, gate CI on the vuln scan, move JWT out of the websocket URL.

### Phase 3 — Production setup
- Stand up the **Tier A budget-friendly** AWS stack (Section 5), WAF in count mode, single NAT or public-subnet task, MongoDB Atlas M10.
- Add monitoring/alarms, log retention, and a Fargate Savings Plan once load is steady.
- Budget AI/LLM + Cloudinary spend **separately** — they can exceed the AWS bill.
`;

const out = head + sections + deployIntro +
  `\n## Section 5 — AWS India Cost Analysis & Budget Recommendation\n\n` + cost +
  roadmap + refuted;
fs.writeFileSync("PRELAUNCH_AUDIT_2026-06.md", out);
console.log("Wrote PRELAUNCH_AUDIT_2026-06.md", out.length, "chars");
