<!-- ═══════════════════════════════════════════════════════════════════════════
     SMAART INSTITUTE USER DASHBOARD
     Operational Support & Governance Manual
     Production-Specific | Based on ITIL v4 Practices
     Document Version: 1.0 | Date: February 2026
     Classification: INTERNAL — CONFIDENTIAL
═══════════════════════════════════════════════════════════════════════════ -->

# SMAART INSTITUTE USER DASHBOARD — Operational Support & Governance Manual

**Project-Specific | Production-Ready | ITIL v4 Aligned**

| Field | Detail |
|---|---|
| **Application Name** | SMAART Institute User Dashboard |
| **Architecture** | MERN Stack (MongoDB + Express + React + Node.js) |
| **Document Owner** | System Administrator / DevOps Lead |
| **Prepared By** | Production Support Architecture Team |
| **Version** | 1.0 |
| **Effective Date** | February 2026 |
| **Review Cycle** | Quarterly |
| **Classification** | Internal — Confidential |

---

# TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Feature-to-Incident Mapping](#2-feature-to-incident-mapping)
3. [Incident Management (Project-Specific)](#3-incident-management-project-specific)
4. [Monitoring & Alerting Strategy](#4-monitoring--alerting-strategy)
5. [Change Management (For Deployments)](#5-change-management-for-deployments)
6. [Security Governance](#6-security-governance)
7. [Service Level Agreements (Project-Specific)](#7-service-level-agreements-project-specific)
8. [Production Runbook](#8-production-runbook)
9. [Reporting & Metrics](#9-reporting--metrics)
10. [Risk & Failure Scenario Analysis](#10-risk--failure-scenario-analysis)

---

# 1. SYSTEM OVERVIEW

## 1.1 Architecture Summary

The SMAART Institute User Dashboard is a **full-stack MERN application** serving as a learning management and student development platform. It supports multi-role access (students, teachers, coaches, college admins, consultants, and platform admin) with real-time course tracking, gamification, and AI-powered career coaching.

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 (Vite) | JSX components, React Router, Context API for state |
| **Backend** | Node.js + Express.js | REST API, 34+ route modules, middleware chain |
| **Database** | MongoDB Atlas | 32 Mongoose models, indexed collections |
| **Authentication** | JWT (jsonwebtoken) | HTTP-only cookies (primary) + Bearer header (fallback) |
| **File Storage** | Cloudinary CDN | Vision boards, avatars, registration docs, community posts |
| **Email Service** | Nodemailer (SMTP/Gmail) | OTP delivery, notifications |
| **AI Services** | Google AI API / OpenRouter | AI Career Coach, chatbot, profile analysis |
| **Logging** | Winston + Morgan | File-based (error.log, combined.log) + console |
| **Security** | Helmet, express-rate-limit, bcryptjs | XSS protection, brute-force prevention, password hashing |

## 1.2 Dependency Mapping

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SMAART INSTITUTE — DEPENDENCY ARCHITECTURE                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     FRONTEND (React + Vite)                        │ │
│  │  Port: 5173 (dev)                                                 │ │
│  │                                                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐   │ │
│  │  │ Login /  │ │Dashboard │ │ Vision     │ │ Course Module   │   │ │
│  │  │ OTP Flow │ │ Home     │ │ Board Pro  │ │ View + Progress │   │ │
│  │  └─────┬────┘ └────┬─────┘ └──────┬─────┘ └───────┬─────────┘   │ │
│  │        │            │              │               │              │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  services/api.js — Axios-like fetch wrapper                 │ │ │
│  │  │  • Auto-port discovery (5000 → 5001 fallback)               │ │ │
│  │  │  • JWT token renewal (1h before expiry)                     │ │ │
│  │  │  • Dual storage sync (sessionStorage + localStorage)        │ │ │
│  │  └──────────────────────┬──────────────────────────────────────┘ │ │
│  └─────────────────────────┼──────────────────────────────────────────┘ │
│                            │ HTTP / CORS                                │
│                            ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                BACKEND (Node.js + Express)                         │ │
│  │  Port: 5000 (primary) / 5001 (fallback)                           │ │
│  │  Host: 0.0.0.0 (all interfaces for mobile access)                │ │
│  │                                                                    │ │
│  │  Middleware Chain:                                                 │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ Helmet │→│ CORS   │→│ Morgan │→│ Rate     │→│ JWT Auth     │ │ │
│  │  │ (XSS)  │ │(Cookie)│ │(Logger)│ │ Limiter  │ │ (protect)    │ │ │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘ └──────────────┘ │ │
│  │                                                                    │ │
│  │  34+ Route Modules:                                               │ │
│  │  auth │ users │ courses │ courseEnrollments │ avatar │             │ │
│  │  visionBoards │ community │ groups │ assessments │ badges │       │ │
│  │  certificates │ tickets │ notifications │ chatbot │ AI coach     │ │
│  └───────┬─────────────┬──────────────────┬───────────────────────────┘ │
│          │             │                  │                              │
│          ▼             ▼                  ▼                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│  │  MongoDB     │ │  Cloudinary  │ │  Gmail SMTP  │                    │
│  │  Atlas       │ │  CDN         │ │  (Nodemailer)│                    │
│  │              │ │              │ │              │                    │
│  │ 32 Models:   │ │ Folders:     │ │ OTP emails   │                    │
│  │ User         │ │ user-uploads/│ │ Notifications│                    │
│  │ Registration │ │ vision-boards│ │ 5-min expiry │                    │
│  │ Course       │ │ registrations│ │              │                    │
│  │ Enrollment   │ │ community/   │ │              │                    │
│  │ Avatar       │ │              │ │              │                    │
│  │ VisionBoard  │ │              │ │              │                    │
│  │ LoginOtp     │ │              │ │              │                    │
│  │ ...28 more   │ │              │ │              │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
│          │                                                              │
│          ▼                                                              │
│  ┌──────────────┐                                                      │
│  │  Google AI   │  AI Career Coach, Profile Analysis,                  │
│  │  / OpenRouter│  Skill Gap Analysis, Chatbot                         │
│  └──────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1.3 Backend Route Map (API Surface)

| Module | Route Prefix | Key Endpoints | Auth Required |
|---|---|---|---|
| **Auth** | `/api/auth` | login, verify-otp, logout, renew-token, check-session, resend-login-otp | Partial |
| **Users** | `/api/users` | CRUD, register-details, profile, password-change | Yes (protect) |
| **Courses** | `/api/courses` | list, get by code/ID, modules | Optional |
| **Enrollments** | `/api/courseEnrollments` | enroll, progress, video-progress, task-results | Yes |
| **Avatar** | `/api/avatar` | get, level-up, add-xp, streak, toggle-accessory, set-base-model | Yes |
| **Vision Boards** | `/api/vision-boards` | create, list, update layout, delete | Yes |
| **Vision Board Pro** | `/api/vision-boards-pro` | create, edit, save collage, delete | Yes |
| **Community** | `/api/community` | posts, comments, likes, reports | Yes |
| **Groups** | `/api/groups` | create, join, messages, members | Yes |
| **Assessments** | `/api/assessments` | list, take, submit, results | Yes |
| **Badges** | `/api/badges` | list, award, user-badges | Yes |
| **Certificates** | `/api/certificates` | generate, verify, list | Yes |
| **Tickets** | `/api/tickets` | create, list, update, escalate | Yes |
| **Notifications** | `/api/notifications` | list, mark-read, preferences | Yes |
| **AI Career Coach** | `/api/ai-career-coach` | analyze-profile, recommendations, skill-gap, learning-plan | Yes |
| **Chatbot** | `/api/chatbot` | send message, history | Yes |
| **Registrations** | `/api/registrations` | submit, review, approve/reject | Partial |

## 1.4 User Roles & Access Matrix

| Role | Dashboard | Courses | Assessments | Community | Admin Panel | Certificate Mgmt |
|---|---|---|---|---|---|---|
| **student** | ✅ Full | ✅ Enroll + Learn | ✅ Take | ✅ Post + Comment | ❌ | ❌ |
| **teacher** | ✅ Full | ✅ View + Manage | ✅ Create + Grade | ✅ Moderate | ❌ | ✅ Issue |
| **coach** | ✅ Full | ✅ View | ✅ View Results | ✅ Post | ❌ | ❌ |
| **college_admin** | ✅ Full | ✅ Manage College | ✅ View Reports | ✅ Moderate | ✅ College-scoped | ✅ Issue |
| **consultant** | ✅ Full | ✅ View All | ✅ View All | ✅ Post | ✅ Limited | ❌ |
| **admin** | ✅ Full | ✅ Manage All | ✅ Manage All | ✅ Full Mod | ✅ Full | ✅ Manage All |

## 1.5 Authentication Flow

```
┌──────────┐     ┌───────────┐     ┌────────────┐     ┌────────────┐
│ User      │────▶│ POST      │────▶│ Validate   │────▶│ Generate   │
│ Enters    │     │ /api/auth/│     │ Email in   │     │ 6-Digit    │
│ Email +   │     │ login     │     │ User /     │     │ OTP        │
│ Password  │     │           │     │ Registration│    │ (bcrypt    │
└──────────┘     └───────────┘     │ Model      │     │  hashed)   │
                                    └────────────┘     └─────┬──────┘
                                                             │
┌──────────┐     ┌───────────┐     ┌────────────┐           │
│ JWT Token │◀────│ Session   │◀────│ Verify OTP │◀──────────┘
│ Issued    │     │ Created   │     │ POST       │
│ (24h exp) │     │ (single   │     │ /verify-otp│
│           │     │  session  │     │            │
│ Set in:   │     │  enforced)│     │ 5 attempts │
│ • Cookie  │     │           │     │ max, 5-min │
│ • Header  │     │           │     │ TTL        │
└──────────┘     └───────────┘     └────────────┘
```

**Security Controls in Auth Flow:**

| Control | Implementation | File |
|---|---|---|
| Password hashing | bcryptjs (salt rounds: 10) | `models/User.js` pre-save hook |
| OTP hashing | bcryptjs (hashed before storage) | `models/LoginOtp.js` pre-save hook |
| OTP expiry | MongoDB TTL index — 300 seconds | `models/LoginOtp.js` createdAt field |
| OTP max attempts | 5 attempts tracked per OTP record | `models/LoginOtp.js` maxAttempts field |
| OTP reuse prevention | `isUsed` flag set after verification | `models/LoginOtp.js` isUsed field |
| Login rate limiting | 15 attempts / 15 min (per IP + email) | `middleware/rateLimiter.js` loginLimiter |
| OTP rate limiting | 15 attempts / 5 min | `middleware/rateLimiter.js` otpLimiter |
| Password reset limiting | 3 attempts / 1 hour | `middleware/rateLimiter.js` passwordResetLimiter |
| Single session enforcement | sessionId in JWT; validates against user.currentSessionId | `middleware/auth.js` protect() |
| Password-change token invalidation | Compares token iat vs passwordChangedAt | `middleware/auth.js` protect() |
| Token renewal | Auto-renew 1 hour before expiry (frontend) | `services/api.js` tryRenewToken() |
| Multi-model resolution | JWT userType → User / Student / Teacher / Registration | `middleware/auth.js` protect() |

---

# 2. FEATURE-TO-INCIDENT MAPPING

## 2.1 Login & Authentication

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| Login page returns blank screen | Frontend build error, React rendering crash, JS bundle load failure | **High** — All users blocked | **P1** |
| "Invalid credentials" despite correct password | Password double-hashed (pre-save hook bug), bcrypt compare failure, user status = 'pending' | **High** — User locked out | **P2** |
| OTP email not received | SMTP_USER/SMTP_PASS invalid, Gmail app password expired, Nodemailer transport failure, email in spam | **High** — Login flow blocked | **P1** |
| OTP verification fails | OTP expired (>5 min TTL), max attempts exceeded (>5), bcrypt compare mismatch, isUsed=true already | **Medium** — Single user affected | **P3** |
| "Active Session Detected" on login | Previous session not cleared (currentSessionId persists), logout API failed | **Medium** — User blocked until session cleared | **P2** |
| JWT token expired mid-session | 24h expiry reached, token renewal cron failed, browser tab inactive | **Medium** — User forced to re-login | **P3** |
| Rate limit triggered too early | Shared IP (NAT), keyGenerator bug, windowMs misconfigured | **Low** — Temporary lockout | **P4** |

## 2.2 Dashboard & Home Page

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| Dashboard shows loading spinner forever | API /users/register-details returns error, UserContext fetch loop, token expired silently | **High** — User cannot access platform | **P1** |
| Course progress shows incorrect percentage | CourseEnrollment pre-save hook miscalculates, module days mismatch, Set double-counting bug | **Medium** — Data integrity issue | **P2** |
| Streak count incorrect or reset | 7-day cycle logic error in Avatar model, timezone mismatch in `toDateStr()`, `daysBetween()` rounding | **Medium** — Gamification broken | **P3** |
| Badges not displaying | Badge award logic in `badgeUtils.js` fails silently, User badges array malformed | **Low** — Visual only | **P4** |

## 2.3 Vision Board Module

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| Image upload fails | Cloudinary API key invalid/rotated, upload size > 5MB limit, MIME type rejected by fileFilter | **Medium** — Feature unavailable | **P2** |
| Vision board save fails | MongoDB write error, VisionBoardPro validation fails, collageImage field empty | **Medium** — Data loss | **P2** |
| Vision board images not loading | Cloudinary CDN outage, CORS blocking image URLs, public_id mismatch | **Low** — Visual degradation | **P3** |
| Board deletion fails | MongoDB foreign key constraint, Cloudinary folder deletion error, user ownership mismatch | **Low** — Minor inconvenience | **P4** |

## 2.4 Avatar & Gamification

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| Avatar not loading | Avatar.getOrCreate() returns empty, Ready Player Me model URL broken, 3D rendering crash | **Medium** — Feature degraded | **P3** |
| XP not added after course completion | addXP() amount = 0, pre-save hook error, enrollment status mismatch | **Medium** — Gamification broken | **P3** |
| Level-up unlocks not applied | processLevelUnlock() logic miss, unlockHistory not pushed, accessories.unlocked still false | **Low** — Visual only | **P4** |

## 2.5 Course Enrollment & Progress

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| Enrollment fails | Duplicate index violation (student + course), Course model not found, college ref invalid | **High** — Learning blocked | **P2** |
| Video progress not saving | videoProgress array upsert failure, dayId/stepId mismatch, MongoDB update conflict | **Medium** — Progress lost | **P2** |
| Task submission fails | taskResults validation error, BSON size exceeded (large responses), quiz score calc wrong | **Medium** — Assessment blocked | **P2** |
| Certificate not issued at 100% | completionDate not set, certificateIssued flag stuck, progress rounding error (99.5% → 99%) | **Medium** — Student cannot verify completion | **P2** |

## 2.6 Community & Groups

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| Community posts not loading | Community route 500 error, pagination query timeout, large image payloads | **Medium** — Feature unavailable | **P2** |
| Group chat messages lost | WebSocket disconnect (if used), MongoDB write timeout, message validation failure | **Medium** — Communication impacted | **P3** |
| NSFW content bypasses moderation | NSFW route placeholder (not fully implemented), content filter bypass | **High** — Compliance risk | **P1** |

## 2.7 Email & Notification System

| Failure Scenario | Root Cause Possibilities | Impact | Priority |
|---|---|---|---|
| OTP emails delayed > 30 seconds | Gmail SMTP throttling, high email queue volume, DNS resolution delay | **High** — Login experience degraded | **P2** |
| Notification bell shows wrong count | NotificationService counter desync, mark-read API failure, stale cache | **Low** — Visual annoyance | **P4** |
| Email service complete outage | SMTP credentials revoked, Gmail account suspended, network firewall blocking port 587 | **Critical** — All OTP logins blocked | **P1** |

---

# 3. INCIDENT MANAGEMENT (PROJECT-SPECIFIC)

## 3.1 Priority Classification for SMAART Dashboard

| Priority | Definition | SMAART-Specific Examples | Response SLA | Resolution SLA |
|---|---|---|---|---|
| **P1 — Critical** | Core service down; all/most users blocked | Login system down, MongoDB connection lost, email service outage, server crash | **15 minutes** | **2 hours** |
| **P2 — High** | Major feature broken; significant user group affected | Course enrollment failure, OTP emails delayed, dashboard blank screen, progress data loss | **30 minutes** | **4 hours** |
| **P3 — Medium** | Single feature degraded; workaround available | Streak miscalculation, avatar not loading, vision board image error, badge display issue | **2 hours** | **8 hours** |
| **P4 — Low** | Cosmetic or minor issue; single user affected | Notification count wrong, UI glitch, certificate layout offset | **4 hours** | **24 hours** |

## 3.2 Specific Incident Handling Procedures

### 3.2.1 Login Failure Handling

```
┌──────────────────────────────────────────────────────────────────┐
│                    LOGIN FAILURE TRIAGE                            │
│                                                                    │
│  ┌────────────┐                                                   │
│  │ User reports│                                                   │
│  │ login fails │                                                   │
│  └──────┬─────┘                                                   │
│         ▼                                                          │
│  ┌────────────┐  YES   ┌──────────────────────────────────────┐  │
│  │ Can access  │──────▶│ Frontend OK. Check:                   │  │
│  │ login page? │       │ • Password correct? → Reset flow      │  │
│  └──────┬─────┘       │ • "Active Session"? → Clear sessionId │  │
│    NO   │              │ • Rate limited? → Wait 15 min          │  │
│         ▼              └──────────────────────────────────────┘  │
│  ┌────────────┐  YES   ┌──────────────────────────────────────┐  │
│  │ Vite dev   │──────▶│ Frontend crashed. Check:               │  │
│  │ server up? │       │ • npm run dev logs for errors           │  │
│  └──────┬─────┘       │ • React ErrorBoundary triggered?       │  │
│    NO   │              │ • Rebuild: npm run build               │  │
│         ▼              └──────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Server down. Check:                                         │  │
│  │ • node server.js running?                                   │  │
│  │ • Port 5000/5001 available?                                 │  │
│  │ • MongoDB Atlas connection string valid?                    │  │
│  │ • .env file present with correct MONGODB_URI?               │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Resolution Steps:**

| Step | Action | Command / Verification |
|---|---|---|
| 1 | Check backend process | `pm2 status` or `ps aux | grep node` |
| 2 | Check error logs | `tail -f back-end/logs/error.log` |
| 3 | Verify MongoDB connection | Check `MONGODB_URI` in `.env`; test with `mongosh` |
| 4 | Verify JWT_SECRET | Ensure `.env` JWT_SECRET matches production value |
| 5 | Clear stuck session | MongoDB: `db.users.updateOne({email: "x"}, {$set: {currentSessionId: null}})` |
| 6 | Restart backend | `pm2 restart smaart-api` or `node server.js` |

### 3.2.2 JWT Expiry Handling

| Scenario | Detection | Resolution |
|---|---|---|
| Token expired normally (24h) | Frontend interceptor receives 401 | Auto-redirect to login; `tryRenewToken()` should have renewed 1h before |
| Token renewal fails | 401 on `/api/auth/renew-token` | Clear sessionStorage + localStorage; redirect to login |
| Password changed after token issued | `passwordChangedAt > token.iat` check in `auth.js` | User must re-login; working as designed |
| Session invalidated (multi-device) | `currentSessionId !== decoded.sessionId` | "Logged out due to another device" message; re-login required |

### 3.2.3 OTP Delivery Failure

| Step | Action | Details |
|---|---|---|
| 1 | Check `emailService.js` logs | Look for "Error sending OTP email:" in console/error.log |
| 2 | Verify SMTP credentials | Test: `SMTP_USER` and `SMTP_PASS` in `.env` still valid |
| 3 | Check Gmail app password | If using Gmail, verify 2FA is on and app password hasn't been revoked |
| 4 | Test transporter directly | Run: `node -e "require('./utils/emailService').sendOTPEmail('test@test.com','123456')"` |
| 5 | Check spam folder | OTP emails from "SMAART Minds" may be flagged |
| 6 | Verify LoginOtp TTL | Ensure MongoDB TTL index on `createdAt` is set to 300 seconds |
| 7 | Fallback | Provide manual OTP via admin panel or direct DB insertion |

### 3.2.4 MongoDB Connection Issues

| Symptom | Likely Cause | Resolution |
|---|---|---|
| `MongoServerError: connection refused` | Atlas IP whitelist doesn't include server IP | Add server IP to Atlas Network Access |
| `MongooseServerSelectionError: timeout` | DNS resolution fails, or cluster is paused | Check Atlas dashboard; resume cluster if paused |
| Write operations fail | Atlas free tier limits exceeded (512MB) | Monitor storage; upgrade tier or clean old data |
| Slow queries (>2s) | Missing indexes on frequently queried fields | Add indexes per model definitions (User, CourseEnrollment) |
| Connection pool exhausted | Too many concurrent connections without proper pooling | Set `maxPoolSize` in Mongoose connect options |

### 3.2.5 Vision Board Save Failure

| Step | Action |
|---|---|
| 1 | Check Cloudinary API status (<https://status.cloudinary.com>) |
| 2 | Verify `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET` in `.env` |
| 3 | Check if upload size exceeds 5MB limit (`upload.js` fileFilter) |
| 4 | Verify user authentication — `req.user._id` must exist for dynamic storage folder |
| 5 | Check VisionBoardPro model validation — `title` is required |
| 6 | Review `visionBoardProController.js` error response for specifics |

### 3.2.6 Avatar Upload Failure

| Step | Action |
|---|---|
| 1 | Verify Ready Player Me model URL is valid (GLB format) |
| 2 | Check `avatarController.js` → `setBaseModel()` for validation errors |
| 3 | Ensure Avatar document exists: `Avatar.getOrCreate(userId)` |
| 4 | Verify user has correct permissions (protect middleware passes) |

### 3.2.7 Streak Calculation Inconsistency

| Issue | Root Cause | Fix |
|---|---|---|
| Streak resets unexpectedly | Timezone offset in `toDateStr()` using UTC vs local | Ensure server and DB use consistent timezone |
| Day 7 (holiday) counted as missed | Logic doesn't exempt day 7 from activity requirement | Verify `updateStreak()` in Avatar model handles cycleDay === 7 |
| Streak shows 0 after active use | `daysBetween()` returns >1 due to midnight crossing | Normalize dates to start-of-day before comparison |
| Cycle doesn't advance past day 6 | `streakCycleDay` not incremented, `streakHistory` not pushed | Debug `updateStreak()` method step-by-step |

### 3.2.8 Course Enrollment Conflicts

| Issue | Resolution |
|---|---|
| Duplicate enrollment error (E11000) | Catch MongoDB duplicate key error; return "Already enrolled" to user |
| Progress stuck at 0% | Verify `moduleProgress` array is populated; check pre-save hook |
| Status stuck at "enrolled" when partially done | Force recalculation: `enrollment.save()` triggers pre-save progress update |
| Certificate not generated at 100% | Check `certificateIssued` flag; manually trigger certificate generation |

## 3.3 Escalation Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                  SMAART ESCALATION FLOW                             │
│                                                                     │
│  ┌───────────┐   30 min    ┌───────────┐  2 hours   ┌───────────┐│
│  │ L1 Support│────────────▶│ L2 Dev    │───────────▶│ L3 DevOps ││
│  │           │             │ Team      │            │ / Infra   ││
│  └───────────┘             └───────────┘            └───────────┘│
│       │                         │                        │        │
│  ┌───────────┐           ┌───────────┐          ┌───────────┐    │
│  │ Triage:   │           │ Code-level│          │ Server /  │    │
│  │ Known fix │           │ debugging │          │ DB / CDN  │    │
│  │ DB query  │           │ Model fix │          │ recovery  │    │
│  │ Config    │           │ API repair│          │ Scaling   │    │
│  │ checklists│           │ Auth debug│          │ Migration │    │
│  └───────────┘           └───────────┘          └───────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

| Level | Team | Responsibilities | Escalation Trigger |
|---|---|---|---|
| **L1 — Support** | Help Desk / Admin User | Triage user reports; check known issues; perform DB lookups; clear stuck sessions; restart services | Unresolved within 30 min or requires code change |
| **L2 — Development** | Backend / Frontend Devs | Debug API errors; fix controller/model bugs; repair auth flows; update middleware; deploy hotfixes | Unresolved within 2 hours or requires infrastructure change |
| **L3 — DevOps / Infra** | System Admin / Cloud Ops | Server scaling; MongoDB Atlas management; Cloudinary config; DNS/SSL/CORS fixes; disaster recovery | Requires server access, cloud configuration, or vendor engagement |

### Management Escalation (P1 Incidents)

| Elapsed Time | Escalate To |
|---|---|
| 30 minutes | Development Team Lead |
| 1 hour | Project Manager |
| 2 hours | CTO / Technical Director |
| 4 hours | Executive Leadership |

## 3.4 Incident Ticket Template (SMAART-Specific)

| Field | Value |
|---|---|
| **Ticket ID** | SMAART-INC-2026-00001 |
| **Date/Time** | 2026-02-19 09:15 IST |
| **Reported By** | Student Name (<email@college.edu>) |
| **Affected Module** | Login / Dashboard / Vision Board / Course / Avatar / Community |
| **Error Message** | Exact error text or HTTP status code |
| **Browser / Device** | Chrome 121 / Windows 11 / Mobile Android |
| **Priority** | P1 / P2 / P3 / P4 (per Section 3.1 matrix) |
| **Backend Log Reference** | Error line from `back-end/logs/error.log` |
| **Console Error** | Browser DevTools error (if frontend issue) |
| **Steps to Reproduce** | 1. Go to ... 2. Click ... 3. Error appears |
| **Assigned To** | L1 Support / L2 Dev / L3 DevOps |
| **Resolution** | Description of fix applied |
| **Root Cause** | Underlying cause identified |

---

# 4. MONITORING & ALERTING STRATEGY

## 4.1 Application Health Monitoring

### 4.1.1 Backend API Health Checks

| Metric | Source | Threshold | Alert Level | Check Interval |
|---|---|---|---|---|
| Server uptime | PM2 / systemd process monitor | Process exits or restarts | **P1 Critical** | 30 seconds |
| Express 5xx error rate | Winston `error.log` + Morgan HTTP logs | > 10 errors / minute | **P1 Critical** | 1 minute |
| Express 4xx error rate | Winston `combined.log` + Morgan | > 50 errors / minute | **P2 Warning** | 5 minutes |
| API response time (P95) | Morgan HTTP logging → analysis | > 2000ms average | **P2 Warning** | 5 minutes |
| API response time (P99) | Morgan HTTP logging → analysis | > 5000ms | **P1 Critical** | 1 minute |
| Memory usage (Node.js) | `process.memoryUsage()` custom endpoint | > 1.5 GB RSS | **P2 Warning** | 1 minute |
| Event loop lag | `process.hrtime()` or `perf_hooks` | > 500ms lag | **P2 Warning** | 30 seconds |
| Uncaught exceptions | `process.on('uncaughtException')` | Any occurrence | **P1 Critical** | Real-time |
| Unhandled rejections | `process.on('unhandledRejection')` | Any occurrence | **P2 Warning** | Real-time |

### 4.1.2 JWT & Session Monitoring

| Metric | How to Detect | Threshold | Alert Level |
|---|---|---|---|
| JWT validation failures | `auth.js` protect() middleware — 401 responses | > 50 / hour (abnormal) | **P2** — Possible token forgery attempt |
| Session invalidation rate | `currentSessionId` mismatch in `auth.js` | > 20 / hour | **P3** — Multi-device usage spike |
| Token renewal failures | `/api/auth/renew-token` error responses | > 10 / hour | **P2** — Token renewal service degraded |
| Expired OTP lookup rate | `LoginOtp.findOne()` returning null (TTL expired) | > 30% of verifications | **P3** — OTP TTL may be too short |

### 4.1.3 OTP & Email Service Monitoring

| Metric | Source | Threshold | Alert Level |
|---|---|---|---|
| OTP send success rate | `emailService.js` return value `{success: true}` | < 95% success rate | **P1 Critical** |
| OTP email delivery latency | Timestamp diff between OTP creation and sendMail callback | > 30 seconds | **P2 Warning** |
| SMTP connection failures | Nodemailer transport error events | Any failure | **P2 Warning** |
| OTP resend frequency | `/api/auth/resend-login-otp` call rate | > 3 resends / user / session | **P3 Info** — UX issue |
| Gmail daily send limit | Gmail API limit (500/day for consumer, 2000/day for workspace) | > 80% of daily limit | **P2 Warning** |

## 4.2 Database Monitoring (MongoDB Atlas)

| Metric | Source | Threshold | Alert Level |
|---|---|---|---|
| Connection count | Atlas Metrics → Connections | > 80% of max (default: 500 for M10) | **P2 Warning** |
| Database size | Atlas Metrics → Current data size | > 80% of tier limit | **P2 Warning** |
| Slow queries | Atlas Performance Advisor | > 100ms average | **P3 Info** |
| Index coverage | Atlas Index Advisor | Any unindexed field in frequent queries | **P3 Info** |
| Oplog window | Atlas → Replication | < 1 hour oplog window | **P2 Warning** |
| Cluster health | Atlas → Cluster status | Any node unhealthy | **P1 Critical** |

### Key Collections to Monitor

| Collection | Expected Size | Growth Rate | Index Status |
|---|---|---|---|
| `users` | Medium | Slow (new registrations) | `email` (unique), `userId` (unique, sparse) |
| `registrations` | Medium | Moderate | `userId` (ref), email-based queries |
| `courseenrollments` | Large | Fast (daily progress updates) | `{student, course}` (unique compound), `{college, status}`, `{status, progress}` |
| `avatars` | Medium | Moderate (daily streak + XP) | `userId` (unique) |
| `visionboardpros` | Large | Moderate (image data refs) | `{userId, createdAt}` compound |
| `loginotps` | Small (TTL) | High churn (auto-deleted 5-min) | `email` index, TTL on `createdAt` |
| `courses` | Small | Slow (admin creates) | `courseCode` (unique) |

## 4.3 External Service Monitoring

| Service | Health Check Method | Frequency | Fallback |
|---|---|---|---|
| **Cloudinary CDN** | HEAD request to known image URL | 5 minutes | Serve cached / placeholder images |
| **Gmail SMTP** | Transporter verify: `transporter.verify()` | 10 minutes | Queue emails for retry; admin manual OTP |
| **Google AI API** | Lightweight prompt with small token limit | 15 minutes | Disable AI features; show "AI unavailable" |
| **MongoDB Atlas** | `mongoose.connection.readyState` check | 30 seconds | Auto-reconnect (Mongoose default); error page |

## 4.4 Log Management Strategy

### 4.4.1 Current Logging Configuration

| Log Type | File Path | Rotation | Max Size | Max Files |
|---|---|---|---|---|
| Error logs | `back-end/logs/error.log` | Size-based (Winston) | 5 MB | 5 files |
| Combined logs | `back-end/logs/combined.log` | Size-based (Winston) | 5 MB | 5 files |
| HTTP access logs | Combined via Morgan → Winston stream | Follows combined.log rotation | — | — |
| Console logs | stdout (PM2 captures to `~/.pm2/logs/`) | PM2 log rotation | Configurable | Configurable |

### 4.4.2 Log Levels (Winston Configuration)

| Level | Usage in SMAART | Example |
|---|---|---|
| **error** | Server errors (5xx), uncaught exceptions | `logger.error('Server Error:', {message, stack, url, method, ip, userId})` |
| **warn** | Client errors (4xx), expected failures | `logger.warn('Client Error:', {message, statusCode, url, method})` |
| **info** | HTTP requests (via Morgan), operational events | `logger.info(message.trim())` via `logger.stream.write()` |
| **debug** | Detailed internal ops (disabled in production) | Model queries, middleware flow (when LOG_LEVEL=debug) |

### 4.4.3 Structured Error Log Fields

When a 5xx error is logged by `errorMiddleware.js`, the following fields are captured:

```
{
  "level": "error",
  "message": "Server Error:",
  "service": "smaart-minds-api",
  "timestamp": "2026-02-19 09:15:23",
  "message": "Database write failed",
  "stack": "Error: Database write failed\n    at CourseEnrollment.pre(...)",
  "url": "/api/courseEnrollments/progress",
  "method": "PUT",
  "ip": "203.0.113.45",
  "userId": "65a1b2c3d4e5f6g7h8i9j0"
}
```

## 4.5 Recommended Alerting Rules

| Alert Name | Condition | Notification Channel | Auto-Action |
|---|---|---|---|
| `SMAART-DOWN` | Server process not running for > 1 min | SMS + Email + Slack | PM2 auto-restart |
| `SMAART-DB-CONN` | MongoDB connection lost for > 30 sec | Email + Slack | Mongoose auto-reconnect |
| `SMAART-OTP-FAIL` | OTP send failure rate > 5% over 10 min | Email + Slack | Alert L2 Dev team |
| `SMAART-5XX-SPIKE` | > 10 server errors in 1 min window | Slack (urgent) | Capture thread dump |
| `SMAART-DISK-FULL` | Disk usage > 90% | Email | Archive old logs |
| `SMAART-CLOUDINARY` | Cloudinary upload failures > 3 consecutive | Email | Queue locally |
| `SMAART-API-SLOW` | P95 response time > 3s over 5 min | Slack | Scale / investigate |
| `SMAART-RATE-LIMIT` | > 100 rate-limit hits / 5 min on login endpoint | Slack | Potential brute-force; review IPs |

---

# 5. CHANGE MANAGEMENT (FOR DEPLOYMENTS)

## 5.1 Change Classification for SMAART Dashboard

| Change Type | Description | SMAART Examples | Approval Required | Testing Required |
|---|---|---|---|---|
| **Standard** | Pre-approved, low-risk, routine | Updating course content, adding badges, modifying email templates | No (pre-approved) | Smoke test |
| **Normal** | Requires review; moderate risk | New API route, model schema change, middleware update, dependency upgrade | CAB / Lead Dev | Full regression |
| **Emergency** | Critical fix for P1/P2 incident | Login system fix, MongoDB connection patch, security vulnerability | Post-hoc CAB review | Targeted fix verification |

## 5.2 Release Process

```
┌─────────────────────────────────────────────────────────────────┐
│              SMAART RELEASE PIPELINE                              │
│                                                                    │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐            │
│  │ 1. Feature  │────▶│ 2. Code    │────▶│ 3. Build   │            │
│  │ Branch      │     │ Review     │     │ & Test     │            │
│  │ (git)       │     │ (PR + CR)  │     │ (npm test) │            │
│  └────────────┘     └────────────┘     └──────┬─────┘            │
│                                                 │                  │
│  ┌────────────┐     ┌────────────┐     ┌──────▼─────┐            │
│  │ 6. Monitor  │◀────│ 5. Deploy  │◀────│ 4. Staging │            │
│  │ (30 min     │     │ to Prod    │     │ Test       │            │
│  │  observation)│    │ (PM2       │     │ (manual    │            │
│  │              │     │  reload)   │     │  QA pass)  │            │
│  └────────────┘     └────────────┘     └────────────┘            │
│                                                                    │
│  If errors found during monitoring:                               │
│  ┌────────────────────────────────┐                               │
│  │ 7. ROLLBACK (Section 5.4)      │                               │
│  └────────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

## 5.3 Pre-Deployment Checklist (SMAART-Specific)

| # | Check | How to Verify | Pass? |
|---|---|---|---|
| 1 | All `.env` variables present | Compare against `.env.example` (13 variables) | ☐ |
| 2 | `MONGODB_URI` points to correct cluster | Connect via `mongosh` and verify DB name | ☐ |
| 3 | `JWT_SECRET` is production-grade (≥ 32 chars) | Check `.env` — not the example placeholder | ☐ |
| 4 | Cloudinary credentials valid | Test upload via CLI or admin panel | ☐ |
| 5 | SMTP credentials working | Send test email: `node -e "require('./utils/emailService').sendOTPEmail(...)"` | ☐ |
| 6 | MongoDB indexes created | Run `db.collection.getIndexes()` for `users`, `courseenrollments`, `avatars` | ☐ |
| 7 | Rate limiter configured correctly | Verify `rateLimiter.js` settings match production thresholds | ☐ |
| 8 | Error middleware active | Confirm `errorHandler` and `notFound` are mounted in `server.js` | ☐ |
| 9 | CORS origin restricted | Change `CORS_ORIGIN` from `*` to production domain | ☐ |
| 10 | Helmet enabled | Verify `app.use(helmet())` in `server.js` | ☐ |
| 11 | Node.js version compatible | `node --version` — ensure ≥ 18.x | ☐ |
| 12 | Frontend build succeeds | `cd front-end && npm run build` → zero errors | ☐ |
| 13 | Backend starts without errors | `cd back-end && node server.js` → "Server running on port" message | ☐ |
| 14 | Login flow works end-to-end | Register → Login → OTP → Dashboard access | ☐ |

## 5.4 Rollback Plan Template

### 5.4.1 Application Rollback

| Step | Action | Command |
|---|---|---|
| 1 | Identify failing version | `git log --oneline -5` |
| 2 | Checkout previous release | `git checkout <previous-tag>` |
| 3 | Install dependencies | `cd back-end && npm install && cd ../front-end && npm install` |
| 4 | Rebuild frontend | `cd front-end && npm run build` |
| 5 | Restart backend | `pm2 restart smaart-api` |
| 6 | Verify rollback | Test login flow + critical endpoints |
| 7 | Notify team | Post in #operations: "Rollback to v{X.Y.Z} completed due to {reason}" |

### 5.4.2 Database Schema Migration Rollback

| Step | Action | Details |
|---|---|---|
| 1 | Identify breaking change | Which model schema changed? New required fields? Removed fields? |
| 2 | Backup affected collection | `mongodump --collection <name> --db smaart --out backup/` |
| 3 | Revert schema field | If new required field added → make optional with default value |
| 4 | Run migration script | `node scripts/rollback-migration-<ticket>.js` |
| 5 | Verify data integrity | Count documents, spot-check key records |
| 6 | Redeploy previous code | Follow Application Rollback steps above |

### 5.4.3 SMAART-Specific Schema Risk Areas

| Model Change | Risk Level | Rollback Complexity |
|---|---|---|
| Adding optional field to `User` | Low | Remove field or ignore |
| Adding required field to `User` | **High** | Existing docs will fail validation — add default value |
| Changing `CourseEnrollment` progress calculation | **High** | Pre-save hook changes affect all future saves |
| Modifying `Avatar` streak cycle logic | Medium | May reset active streaks; backup `streakHistory` first |
| Updating `LoginOtp` TTL | Low | Only affects new OTP records |
| Changing `VisionBoardPro.userId` type | **High** | ObjectId vs String mismatch breaks existing queries |

## 5.5 Emergency Hotfix Process

```
┌──────────────────────────────────────────────────────────────┐
│                  EMERGENCY HOTFIX FLOW                         │
│                                                                │
│  ┌──────────┐   ┌─────────────┐   ┌──────────────┐          │
│  │ P1/P2    │──▶│ Create      │──▶│ Fix on       │          │
│  │ Incident │   │ hotfix/     │   │ hotfix       │          │
│  │ Declared │   │ SMAART-xxx  │   │ branch       │          │
│  └──────────┘   │ branch      │   │ (minimal     │          │
│                  └─────────────┘   │  change)     │          │
│                                     └──────┬───────┘          │
│                                            │                  │
│  ┌──────────┐   ┌─────────────┐   ┌──────▼───────┐          │
│  │ Monitor  │◀──│ Deploy to   │◀──│ Lead Dev     │          │
│  │ 30 min   │   │ Prod (PM2   │   │ Approves     │          │
│  │          │   │ reload)     │   │ (skip full   │          │
│  └──────────┘   └─────────────┘   │  CAB review) │          │
│                                     └──────────────┘          │
│  Post-deployment:                                             │
│  • Merge hotfix → main branch                                │
│  • Create post-incident report                               │
│  • CAB reviews change in next session                        │
└──────────────────────────────────────────────────────────────┘
```

## 5.6 Change Request Form

| Field | Detail |
|---|---|
| **Change ID** | SMAART-CHG-2026-00001 |
| **Requester** | Developer Name |
| **Date Submitted** | 2026-02-19 |
| **Type** | Standard / Normal / Emergency |
| **Description** | Detailed description of what is changing |
| **Affected Components** | Backend API / Frontend / Database / Config |
| **Affected Models** | User / CourseEnrollment / Avatar / etc. |
| **Risk Assessment** | Low / Medium / High |
| **Rollback Plan** | Reference to rollback procedure |
| **Testing Evidence** | Test results, screenshots, log snippets |
| **Approved By** | Lead Dev / Project Manager (for Normal+) |
| **Deployment Date** | Scheduled date/time |
| **Post-Deployment Verification** | Steps to confirm success |

---

# 6. SECURITY GOVERNANCE

## 6.1 Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│              SMAART SECURITY LAYERS                               │
│                                                                    │
│  Layer 1: NETWORK                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • CORS policy (currently origin: *)                         │  │
│  │ • Helmet.js (XSS, clickjacking, MIME sniffing protection)  │  │
│  │ • MongoDB Atlas IP whitelist                                │  │
│  │ • HTTPS (TLS in production)                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Layer 2: APPLICATION                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Rate limiting (login: 15/15min, OTP: 15/5min,            │  │
│  │   password reset: 3/hour, search: 30/min, general: 100/min)│  │
│  │ • JWT authentication with HTTP-only cookies                 │  │
│  │ • Role-based access control (6 roles)                       │  │
│  │ • Single-session enforcement (currentSessionId)             │  │
│  │ • Input validation (Mongoose schema validation)             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Layer 3: DATA                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Password hashing (bcryptjs, salt rounds: 10)              │  │
│  │ • OTP hashing (bcryptjs before MongoDB storage)             │  │
│  │ • Password field excluded from queries (select: false)      │  │
│  │ • Cloudinary folder scoped to user ID (injection prevention)│  │
│  │ • Crypto-random filenames (upload.js)                       │  │
│  │ • Environment variables for all secrets (.env)              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Layer 4: MONITORING                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Winston structured logging (error.log, combined.log)      │  │
│  │ • Morgan HTTP access logging                                │  │
│  │ • Error middleware captures userId, IP, URL, method          │  │
│  │ • Rate limiter standard headers for visibility              │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 6.2 User Onboarding / Offboarding

### 6.2.1 User Onboarding (Student Registration)

| Step | Action | System Component |
|---|---|---|
| 1 | User submits registration form | Frontend `/register` → `POST /api/registrations` |
| 2 | Registration record created | `Registration` model (status: pending) |
| 3 | Admin reviews & approves | Admin panel → `PUT /api/registrations/:id/approve` |
| 4 | User account created | `User` model with role = 'student' |
| 5 | Welcome email sent | `emailService.sendOTPEmail()` or custom welcome template |
| 6 | First login triggers OTP flow | Login → OTP verification → JWT issued |
| 7 | Avatar auto-created | `Avatar.getOrCreate(userId)` — Level 1, 0 XP |
| 8 | Default preferences set | Notification preferences, dashboard layout defaults |

### 6.2.2 Admin / Privileged User Onboarding

| Step | Action | Security Control |
|---|---|---|
| 1 | Super-admin creates user with elevated role | `POST /api/users` with role = 'admin' / 'college_admin' |
| 2 | Role validated against whitelist | `role` enum in `User` model: ['admin', 'consultant', 'college_admin', 'coach', 'student', 'teacher'] |
| 3 | Credentials provided securely | Out-of-band (not via email) with requirement to change on first login |
| 4 | Access verified | Login + OTP flow identical to students (no bypass) |
| 5 | Audit log entry created | Log admin creation event in `combined.log` |

### 6.2.3 User Offboarding / Account Deactivation

| Step | Action | Implementation |
|---|---|---|
| 1 | Identify account to deactivate | By email or userId |
| 2 | Clear active sessions | `db.users.updateOne({email: "x"}, {$set: {currentSessionId: null}})` |
| 3 | Invalidate JWT | Token will fail on next API call (sessionId mismatch) |
| 4 | Set account status | Add status field if not exists: `{$set: {status: 'deactivated'}}` |
| 5 | Preserve data for compliance | Do NOT delete records; mark as inactive |
| 6 | Revoke cloud storage access | Update Cloudinary folder permissions (if per-user folders used) |
| 7 | Document in offboarding log | Record reason, date, approved by, data retention policy |

## 6.3 Privileged Access Management

### 6.3.1 Role Privilege Matrix (Code-Level)

| Action | student | teacher | coach | college_admin | consultant | admin |
|---|---|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ❌ | ✅ College-scoped | ❌ | ✅ |
| Create courses | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Manage enrollments | ❌ | ✅ Own courses | ❌ | ✅ College | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Access admin panel | ❌ | ❌ | ❌ | ✅ Limited | ✅ Limited | ✅ Full |
| Modify system config | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Generate certificates | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Moderate community | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |

### 6.3.2 Authorization Enforcement Points

| Check Point | Middleware | File | Mechanism |
|---|---|---|---|
| Route-level auth | `protect` | `middleware/auth.js` | JWT verification + user lookup |
| Role-based access | `authorize('admin', 'teacher')` | `middleware/auth.js` | Checks `req.user.role` against allowed list |
| Optional auth | `optionalAuth` | `middleware/auth.js` | Attaches user if token exists; doesn't block |
| Password-change check | Inside `protect` | `middleware/auth.js` | `passwordChangedAt > token.iat` → reject |
| Session validation | Inside `protect` | `middleware/auth.js` | `currentSessionId !== decoded.sessionId` → reject |

## 6.4 Token & Session Security

### 6.4.1 JWT Security Controls

| Property | Current Configuration | Recommendation |
|---|---|---|
| Algorithm | HS256 (jsonwebtoken default) | Consider RS256 for distributed verification |
| Expiry | 24 hours (`JWT_EXPIRES_IN=24h`) | Appropriate for learning platform |
| Secret length | Min 32 chars (per `.env.example`) | Ensure production uses ≥ 64 chars |
| Token storage | HTTP-only cookie (primary), sessionStorage/localStorage (fallback) | Cookie is more secure; minimize fallback usage |
| Renewal window | Auto-renew 1 hour before expiry | Implemented in `services/api.js` |
| Payload contents | `userId`, `userType`, `sessionId`, `iat`, `exp` | Minimal PII — good practice |

### 6.4.2 Session Security Controls

| Control | Implementation | Status |
|---|---|---|
| Single-session enforcement | `currentSessionId` in User model matched against JWT payload | ✅ Active |
| Session clear on logout | Backend `PUT /api/auth/logout` clears `currentSessionId` | ✅ Active |
| Session clear on password change | New JWT issued; old sessionId invalidated | ✅ Active |
| Frontend session cleanup | Clears `sessionStorage`, `localStorage` on logout | ✅ Active |
| Cross-tab session sync | Not implemented | ⚠️ Gap — tabs may desync |

## 6.5 Password Security

| Control | Implementation | Details |
|---|---|---|
| Hashing algorithm | bcryptjs with salt rounds = 10 | Pre-save hook in `User.js` and `Registration.js` |
| Minimum length | 6 characters | `User.js` schema: `minlength: 6` |
| Password reset flow | OTP-based (same flow as login) | `flowType: 'password-reset'` in `LoginOtp` |
| Password reset rate limit | 3 attempts per hour per IP | `passwordResetLimiter` in `rateLimiter.js` |
| Password not returned in queries | `select: false` on password field | `User.js` schema: `password: { select: false }` |
| Old password verification | `matchPassword()` method | Compares bcrypt hash before allowing change |

## 6.6 File Upload Security

| Control | Implementation | File |
|---|---|---|
| File type validation | MIME type whitelist (JPEG, PNG, GIF, WEBP, PDF, MP4) | `upload.js` → `fileFilter()` |
| File size limits | 5 MB (general), 10 MB (registration documents) | `upload.js` → multer `limits.fileSize` |
| Filename sanitization | Crypto-random filenames: `Date.now() + crypto.randomBytes(8)` | `upload.js` → `filename()` callback |
| Folder injection prevention | Folder derived from `req.user._id` (authenticated user only) | `upload.js` → `dynamicStorage` |
| Upload folder path sanitization | `safeFolder = folder.replace(/[^\w\s\-/]/gi, '')` | `upload.js` → `uploadToFolder()` |
| Cloudinary transformation | Max 1000×1000px with crop limit | `upload.js` → `transformation` param |

## 6.7 Secret Management

| Secret | Storage Mechanism | Rotation Frequency | Impact if Leaked |
|---|---|---|---|
| `MONGODB_URI` | `.env` file | On compromise | Full database access |
| `JWT_SECRET` | `.env` file | Quarterly | All tokens can be forged |
| `CLOUDINARY_API_SECRET` | `.env` file | Annually | Unauthorized file uploads/deletions |
| `SMTP_PASS` | `.env` file | Annually | Email spoofing, OTP interception |
| `GOOGLE_AI_API_KEY` | `.env` file | Annually | Unauthorized AI API usage (cost) |

### Recommended Secret Management Practices

| Practice | Status in SMAART | Priority to Fix |
|---|---|---|
| `.env` in `.gitignore` | ✅ Should be (verify) | **Critical** |
| `.env.example` with placeholders (no real secrets) | ✅ Present | — |
| Secrets in environment variables (not hardcoded) | ✅ All via `process.env` | — |
| Secret rotation schedule documented | ❌ Not documented | **Medium** |
| Cloud-based secret manager (AWS SSM, Vault) | ❌ Not implemented | **Low** (for current scale) |
| `.env` file permissions restricted | ❌ 600 on Linux, ACL on Windows | **Medium** |

## 6.8 Audit Logging

### Current Audit Trail Sources

| Event | Where Logged | Detail Level |
|---|---|---|
| HTTP requests | `combined.log` (via Morgan → Winston) | Method, URL, status code, response time |
| 5xx server errors | `error.log` (Winston) | Stack trace, URL, method, IP, userId |
| 4xx client errors | `combined.log` (Winston warn) | Error message, status code, URL |
| Login attempts | Console log (in auth controller) | Email, success/failure (enhance for audit) |
| OTP sends | Console log (`emailService.js`) | Email, messageId |
| Admin actions | Not currently logged separately | ⚠️ **Gap — need admin action audit log** |

### Recommended Audit Enhancements

| Enhancement | Priority | Implementation |
|---|---|---|
| Dedicated admin action log | **High** | Log all admin-panel actions to `admin-audit.log` with userId, action, target, timestamp |
| Login success/failure log | **High** | Structured log entry with email, IP, userAgent, result, sessionId |
| Role change logging | **High** | Log when any user's role is modified: who, by whom, old role → new role |
| Data export/delete logging | **Medium** | Log bulk data operations for compliance |
| Password change logging | **Medium** | Log password change events (without password values) |
| Failed authorization attempts | **Medium** | Log 403 Forbidden responses with `req.user.role` and target route |

---

# 7. SERVICE LEVEL AGREEMENTS (SLAs)

## 7.1 System Availability SLAs

| Service | Target Uptime | Max Monthly Downtime | Measurement Period |
| --- | --- | --- | --- |
| **Login & Authentication System** | 99.9% | 43 minutes | Monthly |
| **Dashboard (Main Application)** | 99.5% | 3.6 hours | Monthly |
| **OTP Email Delivery** | 99.0% | 7.3 hours | Monthly |
| **Course Enrollment & Progress** | 99.5% | 3.6 hours | Monthly |
| **Avatar & Gamification System** | 98.0% | 14.6 hours | Monthly |
| **Vision Board Editor** | 98.0% | 14.6 hours | Monthly |
| **Community Features** | 97.0% | 21.9 hours | Monthly |
| **Admin Management Panel** | 99.0% | 7.3 hours | Monthly |

## 7.2 Performance SLAs

| Metric | Target | Acceptable Range | Measurement |
| --- | --- | --- | --- |
| **Login API response time** | < 500ms | < 1000ms | P95 over 5 min |
| **OTP delivery time** | < 15 seconds | < 30 seconds | End-to-end |
| **Dashboard page load** | < 2 seconds | < 4 seconds | Time to interactive |
| **API response (general)** | < 300ms | < 1000ms | P95 over 5 min |
| **Image upload (Cloudinary)** | < 3 seconds | < 8 seconds | Per upload |
| **Database query time** | < 50ms | < 200ms | P95 per collection |
| **Course progress save** | < 500ms | < 1500ms | Per save operation |

## 7.3 Incident Response SLAs

| Priority | Response Time | Resolution Time | Escalation Trigger |
| --- | --- | --- | --- |
| **P1 Critical** | 15 minutes | 1 hour | Auto-escalate to L2 at 15 min; to L3 at 30 min |
| **P2 High** | 30 minutes | 4 hours | Auto-escalate to L2 at 1 hour |
| **P3 Medium** | 2 hours | 24 hours | Escalate if no progress at 8 hours |
| **P4 Low** | 8 hours | 72 hours | Escalate if no progress at 48 hours |

## 7.4 OTP System-Specific SLAs

| Metric | SLA Target | Breach Action |
| --- | --- | --- |
| OTP generation success rate | > 99.9% | Investigate backend code/MongoDB |
| OTP email send success | > 99.0% | Switch SMTP provider / check Gmail limits |
| OTP email delivery latency | < 15 sec (P95) | Investigate SMTP queue / network |
| OTP verification success (valid OTP) | > 99.5% | Check bcrypt comparison, TTL, clock sync |
| OTP resend within 60 sec | 100% availability | Ensure rate limiter allows ≥ 1 resend |
| OTP TTL accuracy | 5 min ± 10 sec | Check MongoDB TTL index health |

## 7.5 Database SLAs (MongoDB Atlas)

| Metric | SLA Target | Breach Threshold | Action |
| --- | --- | --- | --- |
| Connection availability | 99.95% | > 2 failed connections / hour | Check Atlas cluster health |
| Write latency | < 10ms (P50) | > 50ms sustained | Review indexes, check oplog |
| Read latency | < 5ms (P50) | > 30ms sustained | Review slow query log |
| Backup success | 100% daily | Any missed backup | Alert L3, manual backup |
| Data durability | 99.999% | Any data loss | Atlas built-in replication |

## 7.6 SLA Breach Escalation

```
┌───────────────────────────────────────────────────────────────┐
│                SLA BREACH ESCALATION FLOW                      │
│                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐      │
│  │ SLA Metric   │───▶│ Threshold   │───▶│ Alert Sent   │      │
│  │ Monitored    │    │ Breached    │    │ to L1        │      │
│  └─────────────┘    └─────────────┘    └──────┬───────┘      │
│                                                │              │
│  ┌─────────────┐    ┌─────────────┐    ┌──────▼───────┐      │
│  │ Post-Incident│◀───│ L2/L3       │◀───│ L1 Cannot    │      │
│  │ Review       │    │ Resolves    │    │ Resolve in   │      │
│  │ (update SLA) │    │             │    │ SLA window   │      │
│  └─────────────┘    └─────────────┘    └──────────────┘      │
│                                                                │
│  Monthly SLA Review:                                          │
│  • Calculate actual vs target for each metric                 │
│  • Identify systemic breach patterns                          │
│  • Propose corrective actions                                 │
│  • Update SLA targets if necessary                            │
└───────────────────────────────────────────────────────────────┘
```

---

# 8. PRODUCTION RUNBOOK

## 8.1 Runbook: Server Crash / Application Not Responding

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Check if process is running** | `pm2 status smaart-api` |
| 2 | **If stopped — restart** | `pm2 restart smaart-api` |
| 3 | **If crash-looping — check logs** | `pm2 logs smaart-api --lines 100` |
| 4 | **Check error log** | `tail -100 back-end/logs/error.log` |
| 5 | **Check disk space** | `df -h` (Linux) or `Get-PSDrive C` (Windows) |
| 6 | **Check memory** | `free -m` (Linux) or `Get-Process node \| Select WS` (Windows) |
| 7 | **If out of memory — increase limit** | `pm2 start server.js --node-args="--max-old-space-size=2048"` |
| 8 | **If dependency issue — reinstall** | `cd back-end && rm -rf node_modules && npm install` |
| 9 | **Verify recovery** | `curl http://localhost:5001/api/auth/check` |
| 10 | **Document incident** | Create post-incident ticket with root cause |

## 8.2 Runbook: MongoDB Connection Failure

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Check Mongoose connection state** | In Node: `mongoose.connection.readyState` (0=disconnected, 1=connected, 2=connecting) |
| 2 | **Check Atlas status** | Visit [MongoDB Atlas Dashboard](https://cloud.mongodb.com) → Cluster status |
| 3 | **Verify connection string** | `echo $MONGODB_URI` (ensure no typos, correct password) |
| 4 | **Test connection manually** | `mongosh "mongodb+srv://cluster.mongodb.net/smaart" --username <user>` |
| 5 | **Check IP whitelist** | Atlas → Network Access → Verify server IP is whitelisted |
| 6 | **Check connection count** | Atlas → Metrics → Connections (may be at limit) |
| 7 | **If at connection limit** | Restart application (closes stale connections): `pm2 restart smaart-api` |
| 8 | **If Atlas is down** | Check [Atlas Status Page](https://status.cloud.mongodb.com/) — wait or failover |
| 9 | **Verify recovery** | Check `combined.log` for "Connected to MongoDB" message |
| 10 | **Post-recovery** | Verify data integrity: count documents in critical collections |

## 8.3 Runbook: JWT Authentication Bug (Users Cannot Login)

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Identify symptom** | Users get 401/403 errors; check `error.log` for JWT-related errors |
| 2 | **Check JWT_SECRET** | Verify `JWT_SECRET` in `.env` matches what was used to sign active tokens |
| 3 | **If secret was changed** | All existing tokens are invalid — users must re-login |
| 4 | **Check token expiry config** | Verify `JWT_EXPIRES_IN` in `.env` (should be `24h`) |
| 5 | **Test token generation** | Use Postman: `POST /api/auth/login` with valid credentials |
| 6 | **Decode failing token** | Use [jwt.io](https://jwt.io) to decode a captured token — check `exp`, `userId`, `sessionId` |
| 7 | **Check auth middleware** | Verify `protect()` in `middleware/auth.js` is not throwing unexpected errors |
| 8 | **Check user model resolution** | Verify `userType` in token matches correct model (`User`, `Registration`, `Student`, `Teacher`) |
| 9 | **If sessionId mismatch** | Clear all sessions: `db.users.updateMany({}, {$set: {currentSessionId: null}})` |
| 10 | **Verify fix** | Test complete login → OTP → dashboard flow |

## 8.4 Runbook: OTP Email System Outage

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Identify symptom** | Users report not receiving OTP emails |
| 2 | **Check SMTP credentials** | Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `.env` |
| 3 | **Test SMTP connection** | `node -e "const nm = require('nodemailer'); const t = nm.createTransport({host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}}); t.verify().then(console.log).catch(console.error)"` |
| 4 | **Check Gmail daily limits** | Gmail: 500/day (consumer), 2000/day (Workspace) — check sent count |
| 5 | **Check spam folder** | Ask user to check spam/junk; verify email template renders correctly |
| 6 | **Check OTP record creation** | `db.loginotps.find({email: "user@example.com"}).sort({createdAt: -1}).limit(1)` |
| 7 | **If OTP exists but email failed** | SMTP issue — try sending a test email manually |
| 8 | **If Gmail blocked** | Switch to backup SMTP or use App Password instead of OAuth |
| 9 | **Emergency bypass** | Admin manually provides OTP from database (unhash not possible — generate new one) |
| 10 | **Post-recovery** | Monitor OTP send success rate for next 30 minutes |

## 8.5 Runbook: High CPU / Memory Usage

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Identify the issue** | `pm2 monit` or `top -p $(pgrep -f server.js)` |
| 2 | **Check event loop lag** | Add to health endpoint: `process.cpuUsage()`, `process.memoryUsage()` |
| 3 | **Check for memory leaks** | Look for growing RSS in `pm2 monit` over time |
| 4 | **Check active connections** | MongoDB connection count via Atlas dashboard |
| 5 | **Check for infinite loops** | Review recent code changes — especially pre-save hooks in models |
| 6 | **Check file upload queue** | Large Cloudinary uploads can spike memory — check `upload.js` active requests |
| 7 | **If memory leak confirmed** | Restart with increased memory: `pm2 restart smaart-api --max-memory-restart 1G` |
| 8 | **If CPU spike — Identify route** | Check Morgan logs for high-frequency endpoints |
| 9 | **Short-term fix** | `pm2 restart smaart-api` to reclaim memory |
| 10 | **Long-term fix** | Profile with `--inspect` flag: `node --inspect server.js`, use Chrome DevTools |

## 8.6 Runbook: Cloudinary Upload Failure

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Identify symptom** | Avatar upload, vision board save, or registration doc upload fails |
| 2 | **Check Cloudinary status** | Visit [Cloudinary Status](https://status.cloudinary.com/) |
| 3 | **Verify credentials** | Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env` |
| 4 | **Test upload manually** | `node -e "const c = require('cloudinary').v2; c.config({...}); c.uploader.upload('test.jpg').then(console.log).catch(console.error)"` |
| 5 | **Check storage quota** | Cloudinary dashboard → Usage tab → check bandwidth and storage limits |
| 6 | **Check file size** | Verify uploaded file is within limits (5 MB general, 10 MB registration) |
| 7 | **Check MIME type** | Verify file type is in the allowed list in `upload.js` → `fileFilter()` |
| 8 | **If Cloudinary is down** | Queue uploads locally (write to `back-end/uploads/pending/`) and retry later |
| 9 | **Verify recovery** | Test upload through the admin panel or a test endpoint |
| 10 | **Monitor** | Watch for consecutive upload failures for 30 minutes |

## 8.7 Runbook: Course Enrollment Data Inconsistency

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Identify symptom** | Student progress shows incorrect percentage, or status stuck |
| 2 | **Get enrollment record** | `db.courseenrollments.findOne({student: ObjectId("..."), course: ObjectId("...")})` |
| 3 | **Check progress calculation** | Verify `moduleProgress` array — are completed days counted correctly? |
| 4 | **Check pre-save hook** | Review `CourseEnrollment.js` pre-save for `progress` calculation logic |
| 5 | **Recalculate manually** | Count completed days vs total expected days across all modules |
| 6 | **Force recalculation** | Trigger save: `enrollment.markModified('moduleProgress'); await enrollment.save();` |
| 7 | **Check for race conditions** | Multiple concurrent saves? Lock enrollment during update |
| 8 | **If data corrupted** | Restore from backup: `mongorestore --collection courseenrollments --db smaart backup/` |
| 9 | **Verify fix** | Compare progress on frontend dashboard with database value |
| 10 | **Preventive action** | Add progress validation middleware before save |

## 8.8 Runbook: Avatar Streak Reset Bug

| Step | Action | Command / Detail |
| --- | --- | --- |
| 1 | **Identify symptom** | User's streak unexpectedly reset to 0 or shows wrong day |
| 2 | **Get avatar record** | `db.avatars.findOne({userId: ObjectId("...")})` |
| 3 | **Check streakHistory** | Review the `streakHistory` array — look for gaps or incorrect dates |
| 4 | **Check timezone** | Ensure server timezone matches expected user timezone for day boundaries |
| 5 | **Check 7-day cycle logic** | Day 7 is a "holiday" — no activity needed; day 1-6 require consecutive activity |
| 6 | **Check lastActivityDate** | Compare `lastActivityDate` with current date — was there a skip? |
| 7 | **If bug in cycle calculation** | Fix in `avatarController.js` → `updateStreak()` method |
| 8 | **Restore streak (admin fix)** | `db.avatars.updateOne({userId: ObjectId("...")}, {$set: {currentStreak: <correct_value>, streakHistory: <corrected_array>}})` |
| 9 | **Verify fix** | Trigger streak update via dashboard activity and confirm in DB |
| 10 | **Document** | Note the edge case that caused the reset for future regression testing |

---

# 9. REPORTING & METRICS

## 9.1 Key Performance Indicators (KPIs)

### 9.1.1 Operational KPIs

| KPI | Formula | Target | Frequency |
| --- | --- | --- | --- |
| **System Uptime** | (Total minutes - Downtime minutes) / Total minutes × 100 | > 99.5% | Monthly |
| **MTTR** (Mean Time to Resolve) | Sum of resolution times / Number of incidents | < 2 hours (P1/P2) | Monthly |
| **MTTD** (Mean Time to Detect) | Sum of detection times / Number of incidents | < 5 minutes (P1) | Monthly |
| **Incident Volume** | Count of P1-P4 incidents per period | Decreasing trend | Weekly |
| **Change Success Rate** | Successful deployments / Total deployments × 100 | > 95% | Monthly |
| **SLA Compliance** | Incidents resolved within SLA / Total incidents × 100 | > 95% | Monthly |

### 9.1.2 Application KPIs

| KPI | Data Source | Target | Frequency |
| --- | --- | --- | --- |
| **Login Success Rate** | Auth controller logs | > 99% | Daily |
| **OTP Delivery Rate** | `emailService.js` success count | > 99% | Daily |
| **API Error Rate (5xx)** | `error.log` count | < 0.1% of requests | Daily |
| **API Error Rate (4xx)** | `combined.log` warn count | < 5% of requests | Weekly |
| **Average API Response Time** | Morgan logs P50/P95/P99 | P95 < 500ms | Daily |
| **Active User Sessions** | `users` with non-null `currentSessionId` | Tracking trend | Daily |
| **Course Enrollment Growth** | `courseenrollments.countDocuments()` | Increasing | Weekly |
| **Avatar Engagement** | Avatars with streak > 0 / Total avatars × 100 | > 40% | Weekly |

## 9.2 Incident Trend Report Template

### Monthly Incident Summary

| Category | P1 | P2 | P3 | P4 | Total | vs Last Month |
| --- | --- | --- | --- | --- | --- | --- |
| Authentication / Login | | | | | | |
| OTP / Email Service | | | | | | |
| Database / MongoDB | | | | | | |
| Course Enrollment | | | | | | |
| Avatar / Gamification | | | | | | |
| Vision Board | | | | | | |
| File Upload / Cloudinary | | | | | | |
| Infrastructure / Server | | | | | | |
| **TOTAL** | | | | | | |

### Trend Analysis Questions

- Is overall incident volume increasing or decreasing?
- Are there recurring incidents in the same subsystem?
- Are P1/P2 incidents stable or trending upward?
- Which subsystem has the highest incident density?
- Are resolution times improving or degrading?

## 9.3 SLA Breach Report Template

| SLA Metric | Target | Actual (This Month) | Breach? | Root Cause | Corrective Action |
| --- | --- | --- | --- | --- | --- |
| Login system uptime | 99.9% | | | | |
| Dashboard availability | 99.5% | | | | |
| OTP delivery rate | 99.0% | | | | |
| API P95 response time | < 500ms | | | | |
| P1 incident response | 15 min | | | | |
| P1 incident resolution | 1 hour | | | | |
| Database availability | 99.95% | | | | |

## 9.4 Performance Summary Report Template

| Metric | This Week | Last Week | Trend | Notes |
| --- | --- | --- | --- | --- |
| API requests (total) | | | | |
| API P95 latency (ms) | | | | |
| API P99 latency (ms) | | | | |
| 5xx error count | | | | |
| 4xx error count | | | | |
| Login attempts | | | | |
| Login success rate | | | | |
| OTP sends | | | | |
| OTP success rate | | | | |
| Active users (daily peak) | | | | |
| Database read latency (P50) | | | | |
| Database write latency (P50) | | | | |
| Cloudinary uploads | | | | |
| Server memory usage (peak) | | | | |

## 9.5 Reporting Schedule

| Report | Audience | Frequency | Delivery Method |
| --- | --- | --- | --- |
| Daily Health Check | L1 Support | Daily (8 AM) | Slack / Email |
| Weekly Performance Summary | L2 Dev Team | Weekly (Monday) | Email + Dashboard |
| Incident Trend Report | L2/L3 Team | Weekly (Friday) | Email |
| Monthly SLA Report | Management | Monthly (1st) | PDF Report + Meeting |
| Quarterly Security Review | All Stakeholders | Quarterly | Presentation + Report |
| Annual Risk Assessment | Management | Annually | Formal Document |

---

# 10. RISK & FAILURE SCENARIO ANALYSIS

## 10.1 Single Points of Failure (SPOF)

| Component | SPOF Risk | Current Mitigation | Recommended Enhancement |
| --- | --- | --- | --- |
| **Backend Server** (single Node.js instance) | **Critical** — all API traffic flows through one process | PM2 auto-restart on crash | Run PM2 cluster mode: `pm2 start server.js -i max` for multi-core |
| **MongoDB Atlas** (single cluster) | **High** — all data in one cluster | Atlas built-in replication (3-node replica set) | Enable Atlas cross-region backup; test restore procedure quarterly |
| **Gmail SMTP** (single email provider) | **High** — OTP delivery depends entirely on Gmail | Rate limiting configured | Add fallback SMTP provider (SendGrid, Mailgun); implement email queue |
| **Cloudinary** (single CDN/storage) | **Medium** — file uploads and image serving depend on Cloudinary | No fallback currently | Local upload queue for retry; cache served images on CDN edge |
| **JWT Secret** (single signing key) | **Medium** — if compromised, all tokens can be forged | `.env` file storage | Key rotation plan; consider RS256 with key pair |
| **DNS / Domain** | **Low** — if DNS fails, app is unreachable | Domain registrar manages DNS | Use redundant DNS providers (Cloudflare + registrar) |
| **Single Developer** (bus factor = 1) | **Critical** — knowledge concentrated in one person | This operations manual | Cross-train team members; document all runbooks and procedures |

## 10.2 Dependency Risk Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│           DEPENDENCY RISK HEAT MAP                                │
│                                                                    │
│   IMPACT                                                          │
│     ▲                                                             │
│     │                                                             │
│  Critical │ [MongoDB Atlas]      [Gmail SMTP]                     │
│     │     (data loss)           (OTP blocked)                     │
│     │                                                             │
│  High   │              [JWT Secret]       [Node.js Runtime]       │
│     │                (auth failure)       (full outage)           │
│     │                                                             │
│  Medium │ [Cloudinary]           [Google AI API]                  │
│     │   (uploads fail)          (AI features only)                │
│     │                                                             │
│  Low    │ [npm Packages]         [Ready Player Me]                │
│     │   (build time only)       (avatar model only)               │
│     │                                                             │
│     └──────────┬──────────┬──────────┬──────────▶                 │
│            Unlikely    Possible    Likely     LIKELIHOOD           │
└──────────────────────────────────────────────────────────────────┘
```

## 10.3 Failure Scenario Playbook

### Scenario 1: Complete MongoDB Outage

| Aspect | Detail |
| --- | --- |
| **Trigger** | Atlas cluster unreachable (network, region failure, account suspension) |
| **Impact** | Total application failure — no reads or writes possible |
| **Detection** | `mongoose.connection.readyState !== 1`; health check endpoint returns 503 |
| **Immediate Action** | Display maintenance page; notify all users via Twitter/status page |
| **Recovery** | Wait for Atlas recovery OR restore from backup to new cluster; update `MONGODB_URI` |
| **RTO** | 1 hour (with backup restore) |
| **RPO** | Last backup point (Atlas continuous backup: ~1 minute lag) |
| **Prevention** | Multi-region cluster; regular backup restore drills |

### Scenario 2: JWT Secret Compromised

| Aspect | Detail |
| --- | --- |
| **Trigger** | `.env` file leaked; secret found in git history or logs |
| **Impact** | Attacker can forge any user's JWT — full account takeover possible |
| **Detection** | Unusual login patterns; users report unauthorized access; code scanning alert |
| **Immediate Action** | 1. Rotate `JWT_SECRET` immediately 2. Restart backend (invalidates all tokens) 3. Force all users to re-login |
| **Recovery** | 1. Audit access logs for unauthorized activity 2. Reset passwords for affected accounts 3. Review git history with `git log --all --diff-filter=D -- .env` |
| **RTO** | 15 minutes (secret rotation + restart) |
| **Prevention** | Never commit `.env`; use `git-secrets` pre-commit hook; regular secret scanning |

### Scenario 3: Gmail SMTP Block / Rate Limit

| Aspect | Detail |
| --- | --- |
| **Trigger** | Gmail blocks account (suspicious activity) or daily send limit reached |
| **Impact** | No OTP delivery — new logins, registrations, password resets all blocked |
| **Detection** | `emailService.js` returns `{success: false}`; OTP send failure rate spikes |
| **Immediate Action** | 1. Switch to backup SMTP (if configured) 2. Admin manually generates OTPs for critical users 3. Post status update |
| **Recovery** | 1. Unlock Gmail account (security verification) 2. Or configure alternative SMTP (SendGrid, Mailgun) 3. Drain email queue |
| **RTO** | 30 minutes (with backup SMTP); 2-4 hours (Gmail account recovery) |
| **Prevention** | Monitor daily send count; use professional SMTP service for production |

### Scenario 4: Cloudinary Account Suspension / Outage

| Aspect | Detail |
| --- | --- |
| **Trigger** | Account suspended (billing, TOS); Cloudinary service outage |
| **Impact** | All image uploads fail; existing images may become inaccessible |
| **Detection** | Upload API returns 401/503; health check to known image URL fails |
| **Immediate Action** | 1. Fall back to local storage for new uploads 2. Serve cached images where possible 3. Show placeholder images for missing content |
| **Recovery** | 1. Resolve account issue with Cloudinary support 2. Re-upload any images stored locally during outage 3. Verify all existing image URLs are accessible |
| **RTO** | 1 hour (with local fallback); 24 hours (account reactivation) |
| **Prevention** | Monitor Cloudinary usage; set billing alerts; maintain local backup of critical images |

### Scenario 5: DDoS / Brute-Force Attack on Login

| Aspect | Detail |
| --- | --- |
| **Trigger** | High volume of login attempts from distributed IPs |
| **Impact** | Login service degraded; legitimate users rate-limited; server resource exhaustion |
| **Detection** | Rate limiter triggered > 100 times/5 min; abnormal 429 response rate; CPU spike |
| **Immediate Action** | 1. Tighten rate limiter: reduce `loginLimiter.max` to 5 2. Block attacking IPs at firewall/CDN level 3. Enable CAPTCHA on login form |
| **Recovery** | 1. Analyze attack patterns in logs 2. Add suspicious IPs to blocklist 3. Gradually relax rate limits |
| **RTO** | 30 minutes (rate limiter adjustment) |
| **Prevention** | WAF (Web Application Firewall); CAPTCHA integration; IP reputation scoring |

## 10.4 Security Exposure Summary

| Exposure | Current State | Risk Level | Remediation |
| --- | --- | --- | --- |
| CORS set to `origin: *` | ⚠️ Open to all origins in dev | **High** in production | Set `CORS_ORIGIN` to production domain |
| No CAPTCHA on login | ⚠️ Relies on rate limiting only | **Medium** | Add reCAPTCHA or hCaptcha to login form |
| No Content Security Policy | ⚠️ Helmet defaults | **Medium** | Configure explicit CSP headers |
| Password minimum 6 chars | ⚠️ Below industry standard (8+) | **Medium** | Increase to 8 chars; add complexity requirements |
| No account lockout | ⚠️ Rate limit resets after window | **Medium** | Implement progressive lockout after 5 failures |
| Admin actions not audited | ⚠️ No dedicated admin audit log | **High** | Implement admin action audit logging |
| No 2FA beyond OTP | ⚠️ OTP is the only factor | **Low** | Consider TOTP (authenticator app) for admin accounts |
| Secrets in `.env` file | ⚠️ Single file, no encryption | **Medium** | Migrate to cloud secret manager for production |

## 10.5 Business Continuity Plan Summary

| Scenario | Recovery Strategy | RTO | RPO | Owner |
| --- | --- | --- | --- | --- |
| Server hardware failure | Redeploy to new VM; restore from git + backup | 2 hours | Last backup | L3 DevOps |
| Database corruption | Restore from Atlas continuous backup | 1 hour | < 1 minute data loss | L3 DevOps |
| Complete cloud provider outage | Redeploy to alternative provider | 8 hours | Last backup | L3 DevOps |
| Security breach (data leak) | Incident response plan; notify users; rotate credentials | 4 hours | N/A | Security Team |
| Key personnel unavailability | This manual + cross-trained backup | Immediate | N/A | Management |
| Third-party service shutdown | Switch to alternative service (documented in runbooks) | 4-24 hours | Varies | L2/L3 Team |

---

# APPENDIX

## A. Environment Variables Reference

| Variable | Purpose | Example Value | Required |
| --- | --- | --- | --- |
| `PORT` | Backend server port | `5001` | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` | Yes |
| `JWT_SECRET` | JWT signing key | `<64+ char random string>` | Yes |
| `JWT_EXPIRES_IN` | Token expiration | `24h` | Yes |
| `CORS_ORIGIN` | Allowed frontend origin | `https://smaart-dashboard.com` | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `smaart-media` | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `<secret>` | Yes |
| `SMTP_HOST` | Email server hostname | `smtp.gmail.com` | Yes |
| `SMTP_PORT` | Email server port | `587` | Yes |
| `SMTP_USER` | Email sender address | `noreply@smaart.edu` | Yes |
| `SMTP_PASS` | Email password / app password | `<app-password>` | Yes |
| `GOOGLE_AI_API_KEY` | Google AI API key | `<api-key>` | Optional |
| `LOG_LEVEL` | Logging verbosity | `info` (prod) / `debug` (dev) | Optional |
| `NODE_ENV` | Runtime environment | `production` | Yes |

## B. Contact & Escalation Directory

| Role | Name | Contact | Availability |
| --- | --- | --- | --- |
| L1 Support | [TBD] | [TBD] | Business hours |
| L2 Backend Dev | [TBD] | [TBD] | Business hours + on-call |
| L3 DevOps / Infrastructure | [TBD] | [TBD] | On-call 24/7 |
| Project Manager | [TBD] | [TBD] | Business hours |
| MongoDB Atlas Admin | [TBD] | [TBD] | On-call |
| Cloudinary Account Owner | [TBD] | [TBD] | Business hours |
| SMTP / Email Admin | [TBD] | [TBD] | Business hours |

## C. Document Control

| Property | Value |
| --- | --- |
| **Document Title** | SMAART Institute User Dashboard — Operational Support & Governance Manual |
| **Version** | 1.0 |
| **Created** | 2026-02-19 |
| **Author** | Operations Team |
| **Last Updated** | 2026-02-19 |
| **Review Cycle** | Quarterly |
| **Next Review** | 2026-05-19 |
| **Approved By** | [TBD — Project Lead] |
| **Classification** | Internal — Confidential |

---

*End of Document*
