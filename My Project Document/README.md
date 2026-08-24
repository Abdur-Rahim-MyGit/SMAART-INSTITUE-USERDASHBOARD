# My Project Document

The presentation-ready documentation set for the SMAART Institute platform.
Everything here is written to be read on its own, without needing the codebase open.

| File | What it is | Read it when |
|---|---|---|
| **SMAART Institute - Overview Presentation.pptx** | A 16-slide deck explaining what SMAART Institute is, who uses it, how it works and where it stands today. | Presenting the platform to a college, a partner or a stakeholder. |
| **System Document.docx** | The complete platform reference — every feature, every role, the assessment and learning models, the technical architecture, security and integrations. 25 sections. | You need the full picture, or the detail behind one specific part of the system. |
| **Hosting.docx** | The production environment, the build pipeline, the deployment procedure, troubleshooting and the server setup runbook. 18 sections. | You are deploying, verifying, fixing or rebuilding the production environment. |
| **Costing.docx** | What the platform costs to run at 10, 500, 1,000, 2,500 and 5,000 users — line by line, with the full rate card, the MongoDB and Docker breakdown, twelve savings levers and the annual budget. 16 sections. | You are setting a budget, answering "what does this cost", or deciding when to scale up. |
| **SMAART Institute - Cost Overview.pptx** | A 9-slide version of the costing for a budget conversation. | Presenting the numbers rather than reading them. |
| `assets/` | The SMAART Institute logo in the two variants used across these documents. | Producing further material in the same style. |

## The short version

- **Live at** [smaartinstitute.com](https://smaartinstitute.com) (students, coaches, recruiters) and
  [admin.smaartinstitute.com](https://admin.smaartinstitute.com) (colleges and the platform team), in production since 22 August 2026.
- **Two applications, one database.** A course published in the admin panel reaches students immediately; a
  student result reaches college analytics immediately.
- **Measure, teach, prove, place.** A proctored baseline opens the curriculum, stage gates open each stage,
  and the resulting verified profile carries into placement.
- **Hosted** in Docker on one AWS instance in Mumbai, behind HTTPS, with an automated build and a
  health-checked, self-rolling-back deployment.
- **Costs** about $115–156 a month today (one college, 500 students) and about $1,136–1,406 a month
  at 5,000 students — roughly $0.28 per registered student per month. Docker itself is free.

## Brand

| | |
|---|---|
| Primary blue | `#1A3884` |
| Deep navy | `#0E2136` / `#002147` |
| Page white | `#FFFFFF` / `#F8FAFC` |
| Typeface | Calibri (documents), Inter (product) |

## Related material in the repositories

- `DEPLOY.md` (repository root) — the one-page deployment instruction, kept short for day-to-day use.
- `aws-deployment/single-instance/README.md` — the command-by-command server setup.
- `Documentation/` — the working history: audits, bug lists, plans, flows, QA reports and requirements.
