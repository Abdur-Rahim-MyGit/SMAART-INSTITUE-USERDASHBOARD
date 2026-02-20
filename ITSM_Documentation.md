<!-- ═══════════════════════════════════════════════════════════════════════════
     SMAART INSTITUTE — IT SERVICE MANAGEMENT (ITSM) FRAMEWORK
     Based on ITIL® Best Practices
     Prepared for: SMAART Institute User Dashboard — MERN Stack Application
     Document Version: 1.0 | Date: February 2026
     Classification: INTERNAL — CONFIDENTIAL
═══════════════════════════════════════════════════════════════════════════ -->

# SMAART INSTITUTE — IT SERVICE MANAGEMENT (ITSM) FRAMEWORK

**Based on ITIL® Best Practices — Applied to SMAART Institute User Dashboard**

| Field | Detail |
|---|---|
| **Document Owner** | SMAART Institute IT Leadership |
| **Prepared By** | SMAART DevOps & Service Management Team |
| **Version** | 1.0 |
| **Effective Date** | February 2026 |
| **Review Cycle** | Quarterly |
| **Classification** | Internal — Confidential |
| **Scope** | SMAART Institute User Dashboard — Full-Stack MERN Application |

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [ITIL Service Lifecycle Overview](#2-itil-service-lifecycle-overview)
3. [A — Incident Management](#3-a--incident-management)
4. [B — Problem Management](#4-b--problem-management)
5. [C — Change Management](#5-c--change-management)
6. [D — Service Request Management](#6-d--service-request-management)
7. [E — Service Level Management](#7-e--service-level-management)
8. [F — Asset & Configuration Management](#8-f--asset--configuration-management)
9. [G — Security & Access Management](#9-g--security--access-management)
10. [H — Service Desk Model](#10-h--service-desk-model)
11. [I — Reporting & Metrics](#11-i--reporting--metrics)
12. [J — Continual Service Improvement (CSI)](#12-j--continual-service-improvement-csi)
13. [Appendices & Glossary](#13-appendices--glossary)

---

# 1. EXECUTIVE SUMMARY

This document defines the **IT Service Management (ITSM) Framework** for the **SMAART Institute User Dashboard**, a full-stack MERN application (MongoDB Atlas, Express.js, React + Vite, Node.js) serving students, teachers, coaches, and administrators. Built on the **ITIL® (Information Technology Infrastructure Library)** framework, it provides a standardized, repeatable, and measurable approach to managing the application's services — including JWT authentication, OTP-based login, course enrollment, gamification (avatars & streaks), vision boards, community forums, and certificate management.

### Objectives

- Align IT service operations with the SMAART Institute's educational mission
- Establish clear processes for managing incidents (login failures, OTP outages, MongoDB issues, Cloudinary failures)
- Define enforceable SLAs for authentication (99.9%), dashboard availability (99.5%), and OTP delivery (99.0%)
- Ensure security governance for JWT tokens, bcrypt passwords, file uploads, and role-based access
- Drive continual improvement through monitoring, metrics, and data-driven decision-making

### Target Audience

| Stakeholder | Usage |
|---|---|
| Project Lead / IT Leadership | Strategic oversight & governance |
| DevOps / Backend Team | Operational process execution, server & database management |
| Frontend / Full-Stack Developers | Day-to-day incident handling, UI bug resolution |
| Security & Compliance | JWT/OTP security, access control & audit procedures |
| SMAART Institute Administration | SLA expectations & escalation paths |

---

# 2. ITIL SERVICE LIFECYCLE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ITIL SERVICE LIFECYCLE                            │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   SERVICE     │───▶│   SERVICE    │───▶│  SERVICE             │   │
│  │   STRATEGY    │    │   DESIGN     │    │  TRANSITION          │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│         │                                          │                │
│         │          ┌──────────────────┐             │                │
│         └─────────▶│  CONTINUAL       │◀────────────┘                │
│                    │  SERVICE         │                              │
│                    │  IMPROVEMENT     │                              │
│         ┌─────────▶│  (CSI)           │◀────────────┐                │
│         │          └──────────────────┘             │                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │               SERVICE OPERATION                          │       │
│  │  Incident │ Problem │ Change │ Request │ Access Mgmt     │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

| Phase | Purpose | Key Processes |
|---|---|---|
| **Service Strategy** | Define business value, demand, financial mgmt | Service Portfolio, Demand Management |
| **Service Design** | Architect services, SLAs, security | SLM, Availability, Capacity, ITSCM |
| **Service Transition** | Plan & execute changes safely | Change, Release, Knowledge Management |
| **Service Operation** | Deliver & support live services | Incident, Problem, Request, Access |
| **CSI** | Measure, learn, improve | 7-Step Improvement, PDCA Cycle |

---

# 3. A — INCIDENT MANAGEMENT

## 3.1 Purpose

To restore normal service operation as quickly as possible with minimal business impact, ensuring agreed service quality levels are maintained.

## 3.2 Scope

| In Scope | Out of Scope |
|---|---|
| Unplanned service interruptions | Planned maintenance windows |
| Service degradation events | Service requests (handled via Request Mgmt) |
| Security incidents (initial triage) | Root cause analysis (handled via Problem Mgmt) |
| Hardware & software failures | Project-related work |
| Network & connectivity issues | Application development bugs |

## 3.3 Priority Matrix

Priority is determined by the intersection of **Impact** and **Urgency**.

| | **Urgency: Critical** | **Urgency: High** | **Urgency: Medium** | **Urgency: Low** |
|---|---|---|---|---|
| **Impact: Extensive (Enterprise)** | **P1 — Critical** | **P1 — Critical** | **P2 — High** | **P3 — Medium** |
| **Impact: Significant (Dept/Region)** | **P1 — Critical** | **P2 — High** | **P2 — High** | **P3 — Medium** |
| **Impact: Moderate (Multiple Users)** | **P2 — High** | **P3 — Medium** | **P3 — Medium** | **P4 — Low** |
| **Impact: Minor (Single User)** | **P3 — Medium** | **P3 — Medium** | **P4 — Low** | **P4 — Low** |

### Priority Definitions

| Priority | Definition | Example |
|---|---|---|
| **P1 — Critical** | Complete service outage affecting all users; login/auth system down | JWT auth middleware crash (`auth.js`), MongoDB Atlas connection lost, Express server crash (PM2 process down) |
| **P2 — High** | Major functionality impaired; large user group affected; workaround may exist | OTP email delivery failure (`emailService.js`), course enrollment system error, Cloudinary CDN unreachable |
| **P3 — Medium** | Limited impact; workaround available; single feature affected | Avatar XP calculation error, streak count resetting incorrectly, vision board image upload slow |
| **P4 — Low** | Minimal impact; cosmetic issue; single user affected | Dashboard UI glitch, badge icon not displaying, community post formatting issue |

## 3.4 SLA Targets

| Priority | Response Time | Resolution Time | Update Frequency | Availability |
|---|---|---|---|---|
| **P1 — Critical** | 15 minutes | 4 hours | Every 30 minutes | 24/7/365 |
| **P2 — High** | 30 minutes | 8 hours | Every 2 hours | 24/7/365 |
| **P3 — Medium** | 4 hours | 24 hours | Every 8 hours | Business Hours |
| **P4 — Low** | 8 hours | 72 hours | Daily | Business Hours |

> **Note:** Business Hours = Monday–Friday, 08:00–18:00 local time (adjusted per region).

## 3.5 Escalation Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                     ESCALATION FLOW                                │
│                                                                    │
│  ┌─────────┐   Auto/Manual   ┌─────────┐   Auto/Manual  ┌──────┐ │
│  │  L1      │───────────────▶│  L2      │──────────────▶│  L3   │ │
│  │ Service  │                │ Technical│               │ Expert│ │
│  │ Desk     │                │ Support  │               │ / SME │ │
│  └─────────┘                └─────────┘               └──────┘ │
│       │                          │                        │      │
│  ┌─────────┐              ┌──────────┐            ┌──────────┐  │
│  │ Triage & │              │ Deep     │            │ Vendor / │  │
│  │ Known Fix│              │ Diagnosis│            │ Dev Team │  │
│  │ ≤30 min  │              │ ≤2 hours │            │ As needed│  │
│  └─────────┘              └──────────┘            └──────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

| Level | Team | Responsibility | Escalation Trigger |
|---|---|---|---|
| **L1 — Service Desk** | Global Helpdesk Analysts | First contact, logging, categorization, known-fix application | Unresolved within 30 min or outside knowledge scope |
| **L2 — Technical Support** | Systems / Network / App Engineers | In-depth diagnosis, configuration changes, script-level fixes | Unresolved within 2 hours or requires infrastructure access |
| **L3 — Expert / SME** | Architecture, Vendors, Dev Teams | Code-level fixes, vendor engagement, design changes | Requires code change, vendor patch, or architectural decision |

### Hierarchical (Management) Escalation

| Timeframe (P1) | Escalation To |
|---|---|
| 30 minutes | Service Desk Manager |
| 1 hour | IT Operations Manager |
| 2 hours | IT Director |
| 4 hours | CIO / VP of Technology |

## 3.6 Incident Lifecycle Flow

```
 ┌──────────┐     ┌───────────┐     ┌────────────┐     ┌───────────┐
 │ Detection │────▶│  Logging   │────▶│Categorize &│────▶│ Diagnose  │
 │ & Report  │     │ & Record   │     │ Prioritize │     │ & Invest. │
 └──────────┘     └───────────┘     └────────────┘     └───────────┘
                                                             │
 ┌──────────┐     ┌───────────┐     ┌────────────┐          │
 │  Closure  │◀────│ Recovery & │◀────│ Resolution │◀─────────┘
 │ & Review  │     │ Validation │     │ & Fix      │
 └──────────┘     └───────────┘     └────────────┘
```

| Stage | Description | Owner |
|---|---|---|
| **Detection & Report** | User call, monitoring alert, email, self-service portal | End User / Monitoring System |
| **Logging & Record** | Ticket created with timestamp, user info, description | L1 Service Desk |
| **Categorize & Prioritize** | Apply category, subcategory; determine priority per matrix | L1 Service Desk |
| **Diagnose & Investigate** | First-level troubleshooting; knowledge base search | L1 → L2 → L3 |
| **Resolution & Fix** | Apply fix, patch, configuration change, or workaround | Assigned Engineer |
| **Recovery & Validation** | Confirm service restored; user validates resolution | Assigned Engineer + User |
| **Closure & Review** | Close ticket; capture knowledge; update KEDB if applicable | Service Desk |

## 3.7 Sample Incident Ticket Template

| Field | Value |
|---|---|
| **Ticket ID** | INC-2026-00421 |
| **Date/Time Opened** | 2026-02-19 08:45 UTC |
| **Reported By** | Monitoring Alert (PM2 health check) |
| **Contact Method** | Automated Alert / Server Monitoring |
| **Affected Service** | Login & Authentication System |
| **Category** | Application > Authentication > JWT |
| **Sub-Category** | Login Failure — OTP Not Delivered |
| **Priority** | P2 — High |
| **Impact** | Significant — All new login attempts blocked (students, teachers, coaches) |
| **Urgency** | High — Active learning sessions disrupted |
| **Description** | Users unable to receive OTP emails after entering credentials. Nodemailer transport returns `EAUTH` error. Gmail SMTP rejecting connections. `emailService.js` logging "Invalid login" errors. Issue started at 08:30 UTC after Gmail App Password rotation. |
| **Assigned To** | L2 — Backend/DevOps Team |
| **SLA Target** | Response: 30 min / Resolution: 8 hours |
| **Workaround** | None — OTP is required for all logins |
| **Resolution** | Updated `SMTP_PASS` in `.env` with new Gmail App Password; restarted Node.js server via PM2; verified OTP delivery to test accounts |
| **Resolved Date/Time** | 2026-02-19 09:45 UTC |
| **Resolution Duration** | 1 hour |
| **Root Cause** | Gmail App Password was rotated in Google Account but `.env` file on production server was not updated |
| **Closure Code** | Resolved — Configuration Fix |

## 3.8 KPIs

| KPI | Definition | Target |
|---|---|---|
| **MTTR** (Mean Time to Resolve) | Average time from incident creation to resolution | P1: ≤ 4h, P2: ≤ 8h |
| **MTBF** (Mean Time Between Failures) | Average uptime between service failures | ≥ 720 hours (30 days) |
| **First Call Resolution (FCR)** | % of incidents resolved at L1 without escalation | ≥ 70% |
| **SLA Compliance** | % of incidents resolved within SLA targets | ≥ 95% |
| **Incident Reopen Rate** | % of incidents reopened after closure | ≤ 5% |
| **Customer Satisfaction (CSAT)** | Post-resolution survey score | ≥ 4.2 / 5.0 |
| **Incident Volume Trend** | Month-over-month incident count | Decreasing trend |

---

# 4. B — PROBLEM MANAGEMENT

## 4.1 Purpose

To minimize the adverse impact of incidents by identifying root causes, preventing recurrence, and documenting known errors with permanent solutions.

## 4.2 Root Cause Analysis (RCA) Format

| Section | Content |
|---|---|
| **Problem ID** | PRB-2026-00087 |
| **Related Incident(s)** | INC-2026-00421, INC-2026-00419 |
| **Problem Statement** | Recurring OTP delivery failures during peak login hours (09:00–10:00 IST) due to Gmail SMTP rate limiting |
| **Timeline of Events** | Chronological log: first failure at 09:15 IST, 47 failed OTP attempts logged in 30 min, `emailService.js` returning SMTP 421 errors |
| **5-Why Analysis** | Structured why-chain tracing to root cause (see below) |
| **Root Cause** | Gmail SMTP free tier limits (500 emails/day) exceeded during peak registration period; no fallback SMTP provider configured |
| **Contributing Factors** | No email delivery monitoring; no queue system for OTP emails; single SMTP provider dependency |
| **Corrective Action** | Implement SendGrid as fallback SMTP; add email queue with retry logic in `emailService.js` |
| **Preventive Action** | Add daily email count monitoring; set alert at 400/500 threshold; implement email queue with Bull/Redis |
| **Owner** | Backend Development Team |
| **Target Completion** | 2026-03-15 |
| **Verification Method** | Load test with 100 concurrent OTP requests; verify failover to SendGrid when Gmail limit reached |

### 5-Why Analysis Template

```
WHY 1: Why did OTP emails fail to deliver?
  → Gmail SMTP returned 421 "Too many connections" error in emailService.js.

WHY 2: Why were there too many connections?
  → 200+ students attempted login simultaneously during morning class start.

WHY 3: Why couldn't the SMTP handle 200+ emails?
  → Gmail free tier limits: 500 emails/day, ~20/second rate limit.
  → No connection pooling or queue in Nodemailer transport.

WHY 4: Why was there no queue or fallback provider?
  → emailService.js sends OTPs synchronously with a single SMTP config.
  → No backup provider (SendGrid/Mailgun) was configured.

WHY 5: Why was a single free-tier provider the only option?
  → Email infrastructure was set up for development scale;
    production capacity planning was not performed.

ROOT CAUSE: Single-provider SMTP dependency (Gmail free tier) with no
             queuing, rate limiting awareness, or failover mechanism.
```

## 4.3 Known Error Database (KEDB) Structure

| Field | Description | Example |
|---|---|---|
| **KEDB ID** | Unique identifier | KE-2026-0043 |
| **Problem ID** | Linked problem record | PRB-2026-00087 |
| **Known Error Title** | Short description | OTP Delivery Rate Limit |
| **Symptoms** | Observable indicators | "SMTP 421 Too many connections" in server logs; users report no OTP received |
| **Root Cause** | Confirmed cause | Gmail SMTP rate limit exceeded during peak usage |
| **Workaround** | Temporary fix steps | Manually restart Nodemailer transport; stagger user logins; use `resend-login-otp` endpoint |
| **Permanent Fix** | Long-term solution | SendGrid fallback + Bull queue for email delivery |
| **Fix Status** | Current state | In Progress / Implemented / Pending |
| **Affected CIs** | Configuration Items impacted | `emailService.js`, `authRoutes.js`, `.env` SMTP config |
| **Date Identified** | When error was confirmed | 2026-02-19 |
| **Owner** | Responsible team | Backend Development Team |

## 4.4 Preventive Action Model

```
┌─────────────┐    ┌───────────────┐    ┌────────────────┐
│  Trend       │───▶│  Proactive     │───▶│  Preventive    │
│  Analysis    │    │  Investigation │    │  Action Plan   │
└─────────────┘    └───────────────┘    └────────────────┘
       │                                        │
       ▼                                        ▼
┌─────────────┐                         ┌────────────────┐
│  Incident    │                         │  Update KEDB   │
│  Pattern     │                         │  & Standards   │
│  Detection   │                         └────────────────┘
└─────────────┘
```

| Activity | Description | Frequency |
|---|---|---|
| **Trend Analysis** | Analyze top 10 recurring incident categories | Weekly |
| **Proactive Problem Records** | Create problem tickets from patterns before major failure | As identified |
| **Major Incident Reviews** | Formal RCA for every P1 and recurring P2 | Within 48 hours |
| **KEDB Maintenance** | Review and update known errors; retire obsolete entries | Monthly |
| **Preventive Change Proposals** | Submit RFC for preventive infrastructure changes | As needed |

---

# 5. C — CHANGE MANAGEMENT

## 5.1 Purpose

To control the lifecycle of all changes to the IT environment, enabling beneficial changes with minimum disruption to services.

## 5.2 Change Types

| Type | Definition | Approval | Examples |
|---|---|---|---|
| **Standard** | Pre-approved, low-risk, repeatable | Pre-authorized (no CAB) | Update course content in MongoDB, add new badge to `badgeUtils.js`, update Cloudinary folder config |
| **Normal** | Assessed, scheduled, approved via workflow | CAB / Change Manager | New API route deployment, Mongoose model schema change, authentication flow modification |
| **Emergency** | Urgent fix for P1/P2 incident; expedited process | ECAB (Emergency CAB) | JWT secret compromise hotfix, MongoDB injection vulnerability patch, PM2 crash loop fix |

## 5.3 Risk Assessment Matrix

| | **Likelihood: Rare** | **Likelihood: Unlikely** | **Likelihood: Possible** | **Likelihood: Likely** |
|---|---|---|---|---|
| **Impact: Critical** | Medium | High | **Very High** | **Very High** |
| **Impact: Major** | Low | Medium | High | **Very High** |
| **Impact: Moderate** | Low | Low | Medium | High |
| **Impact: Minor** | Very Low | Low | Low | Medium |

### Risk Score Actions

| Risk Level | Action Required |
|---|---|
| **Very High** | CIO approval required; full rollback plan mandatory; execute in maintenance window only |
| **High** | CAB approval; rollback plan required; enhanced monitoring post-change |
| **Medium** | Change Manager approval; standard rollback plan |
| **Low** | Team Lead approval; documented rollback steps |
| **Very Low** | Standard change process; auto-approved |

## 5.4 Change Advisory Board (CAB) Workflow

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  RFC      │───▶│  Change    │───▶│  CAB      │───▶│ Authorized│
│  Submitted│    │  Manager   │    │  Review   │    │ / Rejected│
└──────────┘    │  Review    │    │  Meeting  │    └───────────┘
                └───────────┘    └──────────┘          │
                                                       ▼
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  Post-    │◀───│  Change    │◀───│  Build &  │◀───│ Schedule  │
│  Implement│    │  Validation│    │  Test     │    │ & Plan    │
│  Review   │    └───────────┘    └──────────┘    └───────────┘
└──────────┘
```

**CAB Membership:**

| Role | Responsibility |
|---|---|
| Change Manager (Chair) | Facilitates CAB; final scheduling authority |
| IT Operations Manager | Assesses operational impact |
| Security Officer | Reviews security implications |
| Application Owners | Validates application-level impact |
| Infrastructure Lead | Assesses infrastructure dependencies |
| Business Representative | Confirms business impact acceptance |
| Release Manager | Coordinates release dependencies |

**CAB Meeting Cadence:** Weekly (Tuesday 10:00 UTC) | Emergency CAB: On-demand via bridge call

## 5.5 Rollback Plan Template

| Section | Content |
|---|---|
| **Change ID** | CHG-2026-00156 |
| **Rollback Trigger** | Define failure criteria (e.g., service health check fails, error rate > 5%) |
| **Rollback Decision Owner** | Change Manager + Service Owner |
| **Rollback Window** | Maximum time allocated (e.g., 2 hours from implementation start) |
| **Pre-Change Backup** | Snapshot/backup details (VM snapshots, DB dump, config backup) |
| **Rollback Steps** | Step-by-step reversal instructions |
| **Step 1** | Restore VM snapshot from Backup ID: SNAP-20260219-001 |
| **Step 2** | Revert DNS/load balancer to previous configuration |
| **Step 3** | Validate service health via monitoring dashboard |
| **Step 4** | Notify stakeholders of rollback completion |
| **Estimated Rollback Duration** | 45 minutes |
| **Post-Rollback Validation** | Health checks, smoke tests, user confirmation |
| **Communication Plan** | Notify: Service Desk, affected business units, management |

## 5.6 Change Approval Form

| Field | Value |
|---|---|
| **Change ID** | CHG-2026-00156 |
| **Change Title** | Implement JWT Token Auto-Refresh & Session Hardening |
| **Requester** | Backend Team Lead — Authentication Module |
| **Change Type** | Normal |
| **Risk Level** | High |
| **Category** | Application > Authentication > JWT |
| **Description** | Modify `auth.js` middleware to implement automatic JWT token refresh 1 hour before expiry. Update `authController.js` to issue refresh tokens. Add `currentSessionId` invalidation on concurrent login. |
| **Business Justification** | Users experiencing session timeouts during active learning; single-session enforcement needed for compliance |
| **Impact Assessment** | All authenticated users affected; existing sessions will need re-login after deployment |
| **Affected CIs** | `middleware/auth.js`, `controllers/authController.js`, `models/User.js`, `models/Registration.js`, `.env` (JWT_EXPIRY) |
| **Implementation Plan** | 1. Deploy to staging → 2. Run auth test suite → 3. Deploy to production via PM2 reload → 4. Monitor JWT errors for 2 hours |
| **Test Results** | Successfully tested on staging: token refresh working, concurrent session blocked, no auth regressions |
| **Rollback Plan** | `git revert` auth changes; restore previous `auth.js` from backup; PM2 reload |
| **Scheduled Window** | 2026-02-22 02:00–04:00 UTC (Low-Traffic Window) |
| **CAB Decision** | ☐ Approved  ☐ Rejected  ☐ Deferred  ☐ More Info Required |
| **Approver Signatures** | Project Lead / Security / Backend Lead |

---

# 6. D — SERVICE REQUEST MANAGEMENT

## 6.1 Purpose

To manage the lifecycle of all service requests from users, providing a standardized channel for requesting predefined services.

## 6.2 Request Fulfillment Workflow

```
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌───────────┐
│  User     │───▶│  Self-     │───▶│  Auto-Route  │───▶│ Approval  │
│  Submits  │    │  Service   │    │  & Categorize│    │ (if req'd)│
│  Request  │    │  Portal    │    └──────────────┘    └───────────┘
└──────────┘    └───────────┘                              │
                                                           ▼
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌───────────┐
│  Closure  │◀───│  User      │◀───│  Fulfillment │◀───│ Assignment│
│  & Survey │    │  Notified  │    │  Action      │    │ to Team   │
└──────────┘    └───────────┘    └──────────────┘    └───────────┘
```

### Service Request Catalog (Sample)

| Request Type | Category | SLA Target | Approval Required | Fulfillment Team |
|---|---|---|---|---|
| New User Account (Student/Teacher/Coach) | Access Management | 4 hours | Admin | Backend Team |
| Role Change (student → teacher / coach) | Access Management | 8 hours | Admin + Project Lead | Backend Team |
| Course Enrollment Override | Course Services | 4 hours | Teacher / Admin | Backend Team |
| Password Reset (manual) | Authentication | 2 hours | None (self-service OTP) | Automated |
| Avatar/Streak Data Reset | Gamification | 8 hours | Admin | Backend Team |
| Certificate Re-issue | Certificate Services | 24 hours | Teacher + Admin | Certificate Module |
| Vision Board Storage Cleanup | Storage Services | 24 hours | None | DevOps / Cloudinary |
| Community Post Moderation | Content Services | 4 hours | Teacher / Admin | Moderation Team |

## 6.3 Access Request Format

| Field | Description |
|---|---|
| **Request ID** | SRQ-2026-01234 |
| **Requester** | User name + registered email |
| **Request Type** | New Access / Modify Role / Revoke |
| **System/Application** | SMAART Dashboard (student portal, admin panel, course module, community) |
| **Access Level** | student / teacher / coach / admin |
| **Business Justification** | Why access or role change is needed |
| **Duration** | Permanent / Temporary (specify end date) |
| **Approval Chain** | Admin → Project Lead (if admin role requested) |
| **Provisioning Team** | Backend Team (via MongoDB `users` / `registrations` collection) |

## 6.4 Approval Hierarchy

| Request Type | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| Student access (new account) | Admin | — | — |
| Teacher / Coach role assignment | Admin | Project Lead | — |
| Admin role grant | Project Lead | IT Leadership | — |
| Course content modification | Teacher | Admin | — |
| Database direct access | Backend Lead | Project Lead | IT Leadership |
| Cloudinary / SMTP config change | Backend Lead | DevOps Lead | — |

---

# 7. E — SERVICE LEVEL MANAGEMENT

## 7.1 Purpose

To negotiate, document, agree, monitor, and review IT service levels, ensuring targets are measurable and achievable.

## 7.2 SLA Template

| Section | Content |
|---|---|
| **Agreement Title** | SLA for SMAART Institute User Dashboard |
| **Service Provider** | SMAART DevOps & Backend Team |
| **Customer** | SMAART Institute — Students, Teachers, Coaches, Administrators |
| **Service Description** | Full-stack MERN application: JWT login + OTP auth, course management, gamification (avatars/streaks/badges), vision board, community forum, certificate management |
| **Service Hours** | 24/7 (application); Business hours for support (Mon–Fri 09:00–18:00 IST) |
| **Availability Target** | Auth system: 99.9% (43 min/month max); Dashboard: 99.5% (3.6 hrs/month max) |
| **Response Times** | P1: 15 min, P2: 30 min, P3: 4 hrs, P4: 8 hrs |
| **Resolution Times** | P1: 4 hrs, P2: 8 hrs, P3: 24 hrs, P4: 72 hrs |
| **Maintenance Windows** | Sundays 02:00–06:00 IST (excluded from SLA calculation) |
| **Exclusions** | MongoDB Atlas outages (cloud provider), Gmail SMTP outages (Google), Cloudinary CDN outages, force majeure |
| **Monitoring Method** | PM2 process monitoring, MongoDB Atlas alerts, server health checks, API response time logging |
| **Reporting** | Monthly SLA performance report to SMAART Institute administration |
| **Review Cycle** | Quarterly SLA review meeting |
| **Penalties / Credits** | < 99.5% dashboard uptime: Formal remediation plan required; < 99.0%: Emergency CAB convened |
| **Signatories** | Project Lead, SMAART Institute Director, Backend Team Lead |

## 7.3 OLA — Operational Level Agreement

| Field | Content |
|---|---|
| **OLA Title** | OLA between Backend Team and Frontend Team |
| **Purpose** | Define internal support commitments for API-related incidents affecting the React frontend |
| **Escalation Handoff** | Frontend team reports API issue → Backend team acknowledges within 15 min |
| **L2 Response Commitment** | Backend team begins diagnosis within 30 min; checks Express logs, MongoDB connection, JWT middleware |
| **Resolution Support** | Provide status updates every hour for P1/P2 API outages |
| **Availability** | Backend on-call during business hours; PM2 monitoring alerts 24/7 |
| **Dependencies** | Access to MongoDB Atlas dashboard, PM2 logs, server SSH access, `.env` configuration |
| **Reporting** | Weekly API error rate and response time metrics to Project Lead |

## 7.4 KPI & Performance Dashboard Format

| KPI | Metric | Target | Measurement Method | Frequency |
|---|---|---|---|---|
| Service Availability | % uptime for auth + dashboard | Auth: ≥ 99.9%, Dashboard: ≥ 99.5% | PM2 process uptime + MongoDB Atlas monitoring | Real-time / Monthly |
| SLA Compliance | % incidents resolved within SLA | ≥ 95% | Incident tracking system / logs | Weekly |
| MTTR | Average resolution time by priority | P1 ≤ 4h, P2 ≤ 8h | Incident log timestamps | Monthly |
| API Response Time | Average response time for key endpoints | ≤ 500ms (login), ≤ 1s (dashboard) | Express request logging middleware | Real-time |
| OTP Delivery Success | % of OTP emails delivered successfully | ≥ 99% | Nodemailer callback logs in `emailService.js` | Daily |
| JWT Auth Error Rate | % of auth middleware failures | ≤ 0.1% | Express error logging (`auth.js` catch blocks) | Daily |
| MongoDB Query Performance | Average query execution time | ≤ 200ms | MongoDB Atlas Performance Advisor | Weekly |
| Change Success Rate | % deployments without rollback | ≥ 95% | Git deployment logs + PM2 restart history | Monthly |

## 7.5 Response & Resolution Time Definitions

| Term | Definition |
|---|---|
| **Response Time** | Time from ticket creation to first meaningful human acknowledgment (not auto-reply) |
| **Resolution Time** | Time from ticket creation to confirmed service restoration |
| **Clock Pause** | SLA clock pauses when: awaiting user response, awaiting vendor, or during approved maintenance |
| **Business Hours** | Mon–Fri 08:00–18:00 local time (per regional calendar) |
| **24/7 Coverage** | SLA clock runs continuously without pause for business hours |

---

# 8. F — ASSET & CONFIGURATION MANAGEMENT

## 8.1 Purpose

To maintain accurate information about Configuration Items (CIs) and their relationships, enabling effective decision-making for change, incident, and problem management.

## 8.2 CMDB Structure

```
┌─────────────────────────────────────────────────────────────────┐
│            SMAART DASHBOARD CMDB ARCHITECTURE              │
│                                                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────────────┐ │
│  │ Application  │    │ Data Layer  │    │ External Services  │ │
│  │ Services     │    │            │    │                    │ │
│  │              │    │            │    │                    │ │
│  │ - Auth/Login │───▶│ - MongoDB   │───▶│ - Cloudinary CDN   │ │
│  │ - Dashboard  │    │   Atlas    │    │ - Gmail SMTP       │ │
│  │ - Courses    │    │ - 32 Models│    │ - Nodemailer       │ │
│  │ - Community  │    │            │    │                    │ │
│  └────────────┘    └────────────┘    └────────────────────┘ │
│                                                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────────────┐ │
│  │ Frontend    │    │ Middleware  │    │ Runtime            │ │
│  │ (React)     │    │ Chain      │    │ Environment        │ │
│  │             │    │            │    │                    │ │
│  │ - Vite SPA  │    │ - auth.js  │    │ - Node.js + PM2    │ │
│  │ - React 18  │    │ - rateLim. │    │ - Express.js       │ │
│  │ - Axios     │    │ - CORS     │    │ - .env config      │ │
│  └────────────┘    └────────────┘    └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### CI Classification

| CI Class | Examples | Key Attributes |
|---|---|---|
| **Application Code** | `server.js`, `auth.js`, `authController.js`, `emailService.js` | Git commit hash, version, deploy date, dependencies |
| **Mongoose Models** | `User.js`, `Registration.js`, `LoginOtp.js`, `CourseEnrollment.js`, `Avatar.js` | Schema version, indexes, validation rules, field count |
| **Middleware** | `auth.js`, `rateLimiter.js`, `corsConfig.js`, `errorHandler.js` | Config params, rate limits, allowed origins |
| **Frontend Components** | React pages, feature modules, `api.js` service | Bundle size, route mappings, API endpoint dependencies |
| **External Services** | MongoDB Atlas, Cloudinary, Gmail SMTP | Connection string, API keys, rate limits, SLA tier |
| **Configuration** | `.env` file, PM2 ecosystem config, `package.json` | Secret count, last rotation, environment (dev/staging/prod) |

## 8.3 Asset Tracking Template

| Field | Description | Example |
|---|---|---|
| **Asset ID** | Unique identifier | CI-APP-AUTH-001 |
| **Asset Type** | Application / Model / Middleware / Service | Application |
| **Component** | Specific component name | `middleware/auth.js` |
| **Version** | Git commit hash or semver | `abc123f` (commit) |
| **Dependencies** | Required packages/services | `jsonwebtoken`, `bcryptjs`, MongoDB connection |
| **Location** | Repository + path | `back-end/middleware/auth.js` |
| **Owned By** | Responsible developer or team | Backend Team |
| **Status** | Active / Deprecated / Under Maintenance | Active |
| **Last Modified** | Most recent change date | 2026-02-10 |
| **Related CIs** | Connected configuration items | `User.js` model, `authController.js`, `.env` JWT_SECRET |
| **SLA Tier** | Criticality level | Critical (P1 if down) |
| **Last Audit Date** | Most recent code review / security audit | 2026-01-15 |

## 8.4 CI Relationship Model

```
                    ┌─────────────────┐
                    │ SMAART Dashboard  │ (Application Service)
                    │ CI-SVC-DASHBOARD  │
                    └────────┬────────┘
                             │ depends on
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │ Express API   │ │ React    │ │ Auth Module   │
     │ CI-APP-API    │ │ Frontend │ │ CI-APP-AUTH   │
     └──────┬───────┘ │ CI-FE-01 │ └──────┬───────┘
            │         └────┬─────┘       │
            ▼              ▼              ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ MongoDB Atlas │ │ Cloudinary   │ │ Gmail SMTP   │
     │ CI-DB-MONGO   │ │ CI-EXT-CDN   │ │ CI-EXT-SMTP  │
     └──────────────┘ └──────────────┘ └──────────────┘
```

| Relationship Type | Description | Example |
|---|---|---|
| **Depends On** | CI requires another CI to function | `auth.js` depends on `User.js` model + JWT_SECRET in `.env` |
| **Hosted On** | CI runs on another CI | Express API hosted on Node.js + PM2 process |
| **Connected To** | API / network connection | React frontend connected to Express API via Axios |
| **Used By** | Feature uses the CI | Course enrollment used by student dashboard |
| **Managed By** | Team responsible for CI | `emailService.js` managed by Backend Team |
| **Part Of** | Component of larger service | `avatarController.js` is part of Gamification Module |

---

# 9. G — SECURITY & ACCESS MANAGEMENT

## 9.1 Purpose

To manage identity, access, and security controls ensuring only authorized users access IT services, while maintaining a comprehensive audit trail for compliance.

## 9.2 User Onboarding Process

```
┌───────────┐   ┌───────────┐   ┌────────────┐   ┌──────────────┐
│ HR Triggers│──▶│ IAM Team  │──▶│ Provision  │──▶│ User         │
│ New Hire   │   │ Receives  │   │ Accounts & │   │ Receives     │
│ Request    │   │ Request   │   │ Access     │   │ Credentials  │
└───────────┘   └───────────┘   └────────────┘   └──────────────┘
                                      │
                                      ▼
                               ┌────────────┐
                               │ Security   │
                               │ Awareness  │
                               │ Training   │
                               └────────────┘
```

| Step | Action | Owner | SLA |
|---|---|---|---|
| 1 | Admin creates user account via admin panel (name, email, role) | Admin | Same day |
| 2 | Registration record created in MongoDB (`registrations` collection) | System (automated) | Immediate |
| 3 | Default role assigned (student); additional roles (teacher/coach) require admin approval | Admin | 1 business day |
| 4 | User receives welcome email with login link via `emailService.js` | System (automated) | Immediate |
| 5 | User completes first login → OTP verified → JWT token issued → `currentSessionId` set | System (automated) | Immediate |
| 6 | Default avatar profile created in `Avatar` model with base accessories | System (automated) | Immediate |
| 7 | Admin verifies user can access appropriate dashboard features | Admin | Within 24 hours |

## 9.3 User Offboarding Process

| Step | Action | Owner | SLA |
|---|---|---|---|
| 1 | Admin initiates account deactivation via admin panel | Admin | Same day |
| 2 | Set user `isActive: false` in MongoDB; clear `currentSessionId` | Backend Team | Within 1 hour |
| 3 | Invalidate all active JWT tokens by rotating `JWT_SECRET` (if compromised) or waiting for token expiry (1 day) | Backend Team | Same day |
| 4 | Delete user's OTP records from `LoginOtp` collection | System (automated on deactivation) | Immediate |
| 5 | Review and archive/delete user's Cloudinary uploads (vision board images, avatar) | DevOps | Within 7 days |
| 6 | Remove user from course enrollments if required (`CourseEnrollment` records) | Admin / Backend | Within 7 days |
| 7 | Audit trail: review admin action logs for the user's last 30 days of activity | Security / Admin | Within 14 days |
| 8 | Permanently delete user data after retention period (90 days) | Backend Team | Automated |

## 9.4 Privileged Access Control Model

| Control | Description |
|---|---|
| **Role-Based Access Control (RBAC)** | 4 roles (student, teacher, coach, admin) with route-level enforcement via `auth.js` middleware |
| **JWT Token Security** | HTTP-only cookies (primary), Bearer header (fallback); 1-day expiry; `JWT_SECRET` stored in `.env` |
| **Single-Session Enforcement** | `currentSessionId` in `User`/`Registration` model; new login invalidates previous session |
| **OTP-Based MFA** | Every login requires email OTP; 5-minute TTL; bcrypt-hashed; max 5 attempts; `isUsed` flag prevents reuse |
| **Rate Limiting** | `rateLimiter.js`: login (15/15min), OTP (15/5min), general API (100/15min) per IP+email |
| **Password Hashing** | All passwords bcrypt-hashed with salt rounds; never stored in plaintext |
| **File Upload Validation** | `multer` middleware: file type whitelist, 10MB size limit, Cloudinary-only storage |
| **Secret Management** | All secrets in `.env` file; `.env` in `.gitignore`; rotation on suspected compromise |

## 9.5 Audit Log Documentation

| Log Type | Source | Retention | Review Frequency |
|---|---|---|---|
| **Authentication Logs** | Express `auth.js` middleware + `authController.js` | 12 months (server logs) | Daily (automated error alerts) |
| **OTP Transaction Logs** | `emailService.js` + `LoginOtp` model operations | 6 months | Weekly |
| **Admin Action Logs** | Admin panel operations (role changes, account modifications) | 12 months | Weekly |
| **API Request Logs** | Express request logger (method, path, status, response time) | 6 months | Daily (error rate monitoring) |
| **Rate Limiter Logs** | `rateLimiter.js` blocked requests (429 responses) | 3 months | Daily (automated alerts on spikes) |
| **Database Audit Logs** | MongoDB Atlas audit logs (CRUD operations, connection events) | 12 months (Atlas retention) | Monthly |

---

# 10. H — SERVICE DESK MODEL

## 10.1 Purpose

To serve as the single point of contact (SPOC) between IT and end-users, managing the lifecycle of all incidents, requests, and communications.

## 10.2 L1 / L2 / L3 Support Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TIERED SUPPORT MODEL                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────┐                │
│  │  TIER 0 — SELF-SERVICE                          │                │
│  │  Knowledge Base │ AI Chatbot │ Self-Service Portal│               │
│  │  Target: 30% of all contacts resolved here       │               │
│  └──────────────────────┬──────────────────────────┘                │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────┐                │
│  │  TIER 1 — SERVICE DESK (L1)                     │                │
│  │  Triage │ Known Fix │ Password Reset │ KB Search │               │
│  │  Target: 70% First Call Resolution               │               │
│  └──────────────────────┬──────────────────────────┘                │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────┐                │
│  │  TIER 2 — TECHNICAL SUPPORT (L2)                │                │
│  │  Systems │ Network │ Apps │ Database │ Cloud     │               │
│  │  In-depth diagnosis and configuration changes    │               │
│  └──────────────────────┬──────────────────────────┘                │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────┐                │
│  │  TIER 3 — EXPERT / SME (L3)                     │                │
│  │  Architects │ Developers │ Vendors │ Engineering │               │
│  │  Code fixes, design changes, vendor escalation   │               │
│  └─────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## 10.3 Ticket Routing Logic

```
┌─────────────┐
│ Ticket       │
│ Submitted    │
└──────┬──────┘
       ▼
┌─────────────┐     YES    ┌──────────────┐
│ Auto-detect  │───────────▶│ Route to      │
│ Category?    │            │ Specialist    │
└──────┬──────┘            │ Queue         │
       │ NO                 └──────────────┘
       ▼
┌─────────────┐     P1/P2  ┌──────────────┐
│ Priority     │───────────▶│ Immediate     │
│ Assessment   │            │ Page On-Call  │
└──────┬──────┘            └──────────────┘
       │ P3/P4
       ▼
┌─────────────┐
│ L1 Queue     │
│ (FIFO with   │
│  SLA timer)  │
└─────────────┘
```

**Routing Rules:**

| Condition | Action |
|---|---|
| Category = Authentication & Priority = P1 | Auto-route to Backend Team + page on-call; check `auth.js` + MongoDB connection |
| Category = OTP/Email Delivery | Auto-route to Backend Team; check `emailService.js` + Gmail SMTP status |
| Category = Database (MongoDB) | Auto-route to DevOps/Backend; check MongoDB Atlas dashboard + connection string |
| Category = File Upload / Cloudinary | Route to Backend Team; check Cloudinary API key + upload middleware |
| Category = Course/Enrollment | Route to Backend Team; check `courseEnrollmentController.js` + enrollment model |
| Category = UI/Frontend Bug | Route to Frontend Team; check React component errors + console logs |

## 10.4 Automation & AI Chatbot Integration

| Capability | Description | Tool |
|---|---|---|
| **AI Chatbot (Tier 0)** | Natural language ticket creation, KB search, guided troubleshooting | Microsoft Copilot / ServiceNow Virtual Agent |
| **Auto-Categorization** | ML-based ticket classification from description text | ITSM AI module |
| **Auto-Assignment** | Rules-based routing to correct queue based on category + priority | ITSM workflow engine |
| **Password Self-Service** | Automated password reset via MFA-verified self-service portal | Azure AD SSPR / Okta |
| **Runbook Automation** | Automated execution of standard fix procedures | Azure Automation / Ansible |
| **Proactive Alerting** | Monitoring system creates and assigns tickets before user reports | Datadog / PagerDuty |
| **Sentiment Analysis** | Detect frustrated users from ticket language; escalate proactively | NLP engine |

## 10.5 24/7 Support Model — Follow-the-Sun

```
┌─────────────────────────────────────────────────────┐
│          FOLLOW-THE-SUN COVERAGE MODEL               │
│                                                       │
│  AMERICAS (UTC-5)    EMEA (UTC+1)     APAC (UTC+8)  │
│  ┌──────────────┐   ┌──────────────┐  ┌────────────┐│
│  │ 08:00 – 17:00│   │ 08:00 – 17:00│  │08:00–17:00 ││
│  │ EST           │   │ CET          │  │ SGT        ││
│  │ Primary: L1/L2│   │ Primary:L1/L2│  │Primary:L1/L2│
│  └──────────────┘   └──────────────┘  └────────────┘│
│                                                       │
│  After-Hours Coverage: On-Call rotation per region    │
│  P1/P2: 24/7 pager duty with 15-min response SLA    │
│  P3/P4: Queued for next business day                 │
└─────────────────────────────────────────────────────┘
```

| Region | Business Hours (Local) | L1 Staff | L2 Staff | On-Call L2/L3 |
|---|---|---|---|---|
| **Americas** | 08:00–17:00 EST | 15 | 8 | 2 per domain |
| **EMEA** | 08:00–17:00 CET | 12 | 6 | 2 per domain |
| **APAC** | 08:00–17:00 SGT | 10 | 5 | 2 per domain |

---

# 11. I — REPORTING & METRICS

## 11.1 Purpose

To provide timely, accurate, and actionable service performance data to IT leadership and business stakeholders for informed decision-making.

## 11.2 Monthly Service Report Format

| Section | Content |
|---|---|
| **Report Period** | Month / Year (e.g., January 2026) |
| **Executive Summary** | 3–5 bullet highlights (achievements, risks, notable events) |
| **Service Availability** | Uptime % per critical service vs. SLA target |
| **Incident Summary** | Total incidents, breakdown by priority, top categories |
| **SLA Performance** | % compliance per priority level; breaches detailed |
| **Problem Management** | New problems, closed problems, open KEDB items |
| **Change Management** | Total changes, success rate, emergency change count |
| **Service Requests** | Volume, avg fulfillment time, top request types |
| **Customer Satisfaction** | Monthly CSAT score with trend |
| **Top 5 Issues** | Most impactful/frequent issues with actions |
| **Improvement Actions** | CSI register updates, planned initiatives |
| **Next Month Outlook** | Planned changes, known risks, capacity concerns |

## 11.3 SLA Breach Report Format

| Field | Description |
|---|---|
| **Ticket ID** | Incident / Request ID that breached SLA |
| **Priority** | P1 / P2 / P3 / P4 |
| **Service** | Affected IT service |
| **SLA Target** | Expected resolution time |
| **Actual Time** | Time taken to resolve |
| **Breach Duration** | Time exceeded beyond SLA |
| **Root Cause of Breach** | Why SLA was missed (e.g., vendor delay, staffing, complexity) |
| **Corrective Action** | Steps taken to prevent recurrence |
| **Owner** | Responsible team / manager |

### SLA Compliance Dashboard

| Service | Target | Jan | Feb | Mar | Q1 Avg | Trend |
|---|---|---|---|---|---|---|
| Login & Auth (JWT+OTP) | 99.90% | 99.95% | 99.92% | 99.94% | 99.94% | ✅ Above |
| Dashboard (React SPA) | 99.50% | 99.60% | 99.55% | 99.58% | 99.58% | ✅ Above |
| OTP Email Delivery | 99.00% | 98.85% | 99.10% | 99.05% | 99.00% | ⚠️ At target |
| Course Enrollment System | 99.50% | 99.70% | 99.65% | 99.68% | 99.68% | ✅ Above |
| Cloudinary (File Uploads) | 98.00% | 99.50% | 99.30% | 99.40% | 99.40% | ✅ Above |

## 11.4 Trend Analysis Template

| Analysis Type | Data Source | Visualization | Frequency |
|---|---|---|---|
| Incident Volume Trend | ITSM ticket data | Line chart (monthly) | Monthly |
| Top Incident Categories | ITSM categorization | Pareto chart (80/20) | Monthly |
| MTTR Trend by Priority | ITSM resolution data | Bar chart (priority breakdown) | Monthly |
| SLA Breach Trend | SLA compliance data | Stacked bar (breach vs. met) | Monthly |
| Customer Satisfaction | CSAT survey data | Line chart with target line | Monthly |
| Change Failure Rate | Change records | Pie chart (success vs. failed) | Monthly |
| Repeat Incidents | Problem correlation | Heat map | Quarterly |

## 11.5 Incident Heatmap Logic

**Purpose:** Identify patterns in incident occurrence by time-of-day and day-of-week to optimize staffing and proactive measures.

```
         Mon    Tue    Wed    Thu    Fri    Sat    Sun
00-04    ⬜ 2   ⬜ 1   ⬜ 3   ⬜ 2   ⬜ 1   ⬜ 1   ⬜ 0
04-08    🟨 8   🟨 7   🟨 9   🟨 6   🟨 5   ⬜ 2   ⬜ 1
08-12    🟥 35  🟥 42  🟥 38  🟥 40  🟧 28  ⬜ 4   ⬜ 3
12-16    🟧 25  🟥 32  🟧 29  🟧 27  🟧 22  ⬜ 3   ⬜ 2
16-20    🟨 15  🟨 18  🟨 14  🟨 16  🟨 12  ⬜ 2   ⬜ 1
20-24    ⬜ 4   ⬜ 5   ⬜ 3   ⬜ 4   ⬜ 3   ⬜ 1   ⬜ 1

Legend: ⬜ Low (0-5) | 🟨 Medium (6-15) | 🟧 High (16-30) | 🟥 Critical (31+)
```

**Insights & Actions:**

| Pattern | Insight | Action |
|---|---|---|
| Peak: Tue–Thu 08:00–12:00 | Morning login surge drives incidents | Ensure full L1 staffing by 07:30 |
| Low: Weekends | Minimal user activity | On-call coverage sufficient |
| Mid-week spike (Tuesday) | Post-weekend changes take effect | Schedule changes for Thursday maintenance window |

---

# 12. J — CONTINUAL SERVICE IMPROVEMENT (CSI)

## 12.1 Purpose

To continually align and re-align IT services with changing business needs by identifying and implementing improvements to processes, services, and overall IT performance.

## 12.2 Service Improvement Plan (SIP) Template

| Field | Content |
|---|---|
| **SIP ID** | CSI-2026-012 |
| **Improvement Title** | Reduce OTP Delivery Failures by 80% |
| **Current State** | OTP delivery failures avg 15/week during peak hours; Gmail SMTP rate limit hit 3x in February |
| **Target State** | OTP delivery failures ≤ 3/week; failover to SendGrid active; email queue implemented |
| **Business Justification** | OTP failures block all user logins; directly impacts student learning sessions and teacher access |
| **Root Cause** | Single Gmail SMTP provider with no failover; synchronous email sending without queue; no rate awareness |
| **Proposed Actions** | 1. Add SendGrid as backup SMTP provider in `emailService.js` |
| | 2. Implement Bull/Redis email queue for rate-limited sending |
| | 3. Add daily email count monitoring with alert at 80% threshold |
| | 4. Add OTP delivery success tracking dashboard |
| **Estimated Cost** | $0 (SendGrid free tier: 100 emails/day) + Redis instance cost |
| **Expected ROI** | Zero login-blocking incidents; improved user satisfaction; reduced P2 incident volume |
| **Owner** | Backend Development Team |
| **Timeline** | Q2 2026 (4 weeks) |
| **Success Metrics** | OTP delivery success rate, SMTP failover count, P2 incident volume |
| **Status** | ☐ Proposed  ☐ Approved  ☐ In Progress  ☐ Completed  ☐ Deferred |
| **Review Date** | Monthly during CSI review meeting |

## 12.3 PDCA Cycle Documentation

```
         ┌──────────────────────────────────────────┐
         │         PLAN-DO-CHECK-ACT CYCLE           │
         │                                            │
         │          ┌──────────┐                      │
         │          │   PLAN   │                      │
         │          │          │                      │
         │          │ Identify │                      │
         │          │ & Design │                      │
         │          └────┬─────┘                      │
         │               │                            │
         │  ┌────────┐   │   ┌─────────┐              │
         │  │  ACT   │◀──┴──▶│   DO    │              │
         │  │        │       │         │              │
         │  │Adopt / │       │Implement│              │
         │  │Adjust  │       │& Execute│              │
         │  └───┬────┘       └────┬────┘              │
         │      │                 │                    │
         │      │   ┌─────────┐  │                    │
         │      └──▶│  CHECK  │◀─┘                    │
         │          │         │                        │
         │          │ Measure │                        │
         │          │& Review │                        │
         │          └─────────┘                        │
         └──────────────────────────────────────────┘
```

| Phase | Activities | Deliverables |
|---|---|---|
| **PLAN** | Analyze current performance data; identify improvement opportunities; define objectives and success criteria; design solution | SIP document, Business case, Project plan |
| **DO** | Implement the improvement in controlled manner; pilot/test; train staff; update documentation | Implementation report, Updated procedures, Training records |
| **CHECK** | Measure results against baseline; compare to targets; gather feedback from stakeholders; analyze effectiveness | Performance report, Gap analysis, Stakeholder feedback |
| **ACT** | If successful: standardize and adopt; if not: analyze why and adjust plan; update CSI register; share lessons learned | Updated standards, CSI register update, Lessons learned |

## 12.4 Feedback Loop Model

```
┌────────────────────────────────────────────────────────────┐
│                   CSI FEEDBACK LOOP                         │
│                                                             │
│  ┌───────────┐   ┌────────────┐   ┌────────────────────┐  │
│  │ DATA       │──▶│ ANALYSIS   │──▶│ IMPROVEMENT        │  │
│  │ COLLECTION │   │ & INSIGHTS │   │ REGISTER           │  │
│  └───────────┘   └────────────┘   └─────────┬──────────┘  │
│       ▲                                      │             │
│       │                                      ▼             │
│  ┌───────────┐                      ┌────────────────┐    │
│  │ MEASURE    │◀─────────────────────│ IMPLEMENT      │    │
│  │ OUTCOMES   │                      │ CHANGES        │    │
│  └───────────┘                      └────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

**Feedback Sources:**

| Source | Method | Frequency | Owner |
|---|---|---|---|
| End-User Surveys (CSAT) | Post-resolution survey (1–5 scale + comments) | Per ticket closure | Service Desk |
| Quarterly Business Review | Formal meeting with business stakeholders | Quarterly | Service Delivery Manager |
| SLA Performance Reports | Automated metrics from ITSM platform | Monthly | SLM Process Owner |
| Major Incident Reviews | Post-mortem review for every P1 incident | Per P1 incident | Problem Manager |
| Staff Feedback | Internal team retrospectives and surveys | Monthly | Team Leads |
| Industry Benchmarking | Compare KPIs against ITIL / HDI industry benchmarks | Annually | CSI Manager |

### CSI Register

| CSI ID | Title | Source | Priority | Status | Owner | Target Date |
|---|---|---|---|---|---|---|
| CSI-001 | Reduce OTP delivery failures | SLA Report | High | In Progress | Backend Team | Q2 2026 |
| CSI-002 | Implement MongoDB query caching | Performance Monitoring | Medium | Proposed | Backend Team | Q3 2026 |
| CSI-003 | Add automated JWT token refresh | Incident Trend Analysis | High | Completed | Backend Team | Q1 2026 |
| CSI-004 | Cloudinary upload optimization | User Feedback | Medium | In Progress | Frontend Team | Q2 2026 |
| CSI-005 | Implement real-time streak notifications | Feature Request | Low | Proposed | Full-Stack Team | Q3 2026 |

---

# 13. APPENDICES & GLOSSARY

## Appendix A — RACI Matrix (Key Processes)

| Process | Backend Team | Frontend Team | DevOps | Project Lead | Security | Admin | Institute Director |
|---|---|---|---|---|---|---|---|
| Incident Detection | **R** | I | **R** | I | I | C | I |
| Incident Resolution | **A/R** | **R** | **R** | I | I | C | I |
| Problem Investigation | **R** | C | **R** | I | C | I | I |
| Change Assessment | **R** | **C** | **C** | **A** | **C** | I | I |
| Change Approval | I | I | I | **A/R** | **C** | I | **A** (High Risk) |
| Service Request | C | I | I | I | I | **A/R** | I |
| Access Provisioning | **R** | I | I | I | **C** | **A** | I |
| SLA Reporting | **R** | C | **R** | **A** | I | I | I |

> **R** = Responsible | **A** = Accountable | **C** = Consulted | **I** = Informed

## Appendix B — Tool Stack Recommendations

| Function | Tools Used | Category |
|---|---|---|
| Backend Framework | Express.js + Node.js | Core Application |
| Frontend Framework | React 18 + Vite | Core Application |
| Database | MongoDB Atlas (Mongoose ODM) | Data Layer |
| Process Management | PM2 | Runtime Management |
| Authentication | jsonwebtoken (JWT) + bcryptjs | Security |
| Email Service | Nodemailer (Gmail SMTP) | Communication |
| File Storage | Cloudinary CDN (via `cloudinary` npm) | Media Management |
| Rate Limiting | express-rate-limit | Security |
| API Client | Axios | Frontend-Backend Integration |
| Version Control | Git + GitHub | Source Control |

## Appendix C — Glossary

| Term | Definition |
|---|---|
| **CAB** | Change Advisory Board — group that evaluates and authorizes changes |
| **CI** | Configuration Item — any component managed to deliver an IT service |
| **CMDB** | Configuration Management Database — repository of CI information |
| **CSAT** | Customer Satisfaction — metric measuring end-user satisfaction |
| **CSI** | Continual Service Improvement — ITIL lifecycle phase for ongoing enhancement |
| **ECAB** | Emergency Change Advisory Board — expedited CAB for urgent changes |
| **FCR** | First Call Resolution — % of incidents resolved at first point of contact |
| **IAM** | Identity and Access Management |
| **ITIL** | Information Technology Infrastructure Library |
| **ITSCM** | IT Service Continuity Management |
| **KEDB** | Known Error Database — repository of known errors and workarounds |
| **KPI** | Key Performance Indicator |
| **MTBF** | Mean Time Between Failures |
| **MTTR** | Mean Time To Resolve |
| **OLA** | Operational Level Agreement — internal agreement between IT teams |
| **PAM** | Privileged Access Management |
| **PDCA** | Plan-Do-Check-Act — continuous improvement cycle |
| **RBAC** | Role-Based Access Control |
| **RFC** | Request For Change |
| **SIP** | Service Improvement Plan |
| **SLA** | Service Level Agreement — formal agreement between IT and business |
| **SLM** | Service Level Management |
| **SLS** | Service Level Specification — internal technical targets |
| **SOC** | Security Operations Center |
| **SPOC** | Single Point of Contact |

---

## Document Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| **CIO** | _________________________ | _____________ | _____________ |
| **IT Director** | _________________________ | _____________ | _____________ |
| **Service Delivery Manager** | _________________________ | _____________ | _____________ |
| **Security Officer (CISO)** | _________________________ | _____________ | _____________ |
| **Change Manager** | _________________________ | _____________ | _____________ |

---

> **Document Control:** This document is subject to quarterly review and must be re-approved after any major revision. All previous versions are archived in the IT Governance repository.

> **© 2026 — IT Service Management Architecture Team. All rights reserved. INTERNAL — CONFIDENTIAL.**
