# SMAART Institute System Engineering Audit

Date: 2026-05-14
Scope: Full repository review of `front-end` and `back-end`
Audit type: Static engineering audit from source code, route maps, models, configs, and available scripts

## 1. Executive Summary

The software is not an early prototype. It is a broad full-stack platform with substantial implementation across student onboarding, authentication, assessments, learning flows, notes, certificates, badges, vision boards, community, support tickets, notifications, avatar progression, and AI-assisted career/support features.

At code level, the system is already large:

- Backend: 44 route files, 44 model files
- Frontend: 45 page files plus many feature components
- Real-time layer: WebSocket/Socket.IO notification support
- AI layer: chatbot, AI career coach, career intelligence, OCR, moderation hooks

Current engineering status:

- Core platform features are largely implemented
- Several advanced modules are present and wired
- Production readiness is partial, not complete
- The biggest remaining gaps are reliability, security hardening, test maturity, deployment validation, and cleanup of placeholder or fallback logic

My engineering judgment: this is a feature-rich system that is closer to a late-stage build than a greenfield build, but it still needs a structured hardening phase before it can be called fully production-ready.

## 2. Audit Method

This document is based on:

- Repository structure review
- Backend entrypoint and route registration review
- Frontend app/router review
- Route/model/page inventory
- Search for TODO/placeholder/incomplete logic
- Environment/config review
- Build/lint validation attempts

Validation performed:

- Frontend lint: passed with `npm.cmd run lint`
- Frontend build: could not be fully validated in this sandbox because Vite config resolution was blocked by sandbox path access, not by a confirmed app code failure
- Backend automated test command: not implemented in `back-end/package.json`

## 3. System Architecture Overview

### Frontend

Technology:

- React + Vite
- React Router
- TanStack Query
- Tailwind + Radix UI
- Context-based state providers
- Framer Motion
- Socket.IO client

Main frontend entry:

- `front-end/src/App.jsx`
- `front-end/src/components/AnimatedRoutes.jsx`

Frontend capabilities confirmed in routes:

- Public landing and institution flows
- OTP signup/login journey
- Dashboard home
- Courses, modules, player, notes
- Assessment centre and baseline assessment flow
- Skills Passport and Skills Vault
- Vision Board Pro editor/gallery/view
- Community and groups
- Mind care sessions
- Dictionary and library
- Notifications
- Settings and profile/onboarding
- Support tickets
- Certificates and badge verification
- AI profile analysis / resume builder / career data fetcher

### Backend

Technology:

- Node.js + Express
- MongoDB + Mongoose
- JWT auth
- CORS + Helmet + rate limiting
- Nodemailer
- WebSocket + Socket.IO
- OpenRouter / Google AI integrations

Main backend entry:

- `back-end/server.js`

Confirmed backend domain areas:

- Auth and users
- Colleges, registrations, degrees
- Assessments, results, stage results, question banks
- Courses, enrollments, notes
- Certificates, students, teachers
- Coaches and coach sessions
- Escalations, tickets, support chatbot
- Community, groups, announcements, moderation, PPI
- Avatar and badges
- Vision boards
- OCR and NSFW moderation
- Notifications
- AI career coach
- Career intelligence and simulation

### Data Layer

The data model is extensive and already segmented by business domain. Major model groups include:

- Identity and auth: `User`, `Registration`, `LoginOtp`
- Learning: `Course`, `Enrollment`, `CourseEnrollment`, `Note`, `QuestionBank`
- Assessment: `Assessment`, `BaseLineResult`, `Result`, `StageResult`
- Community: `CommunityPost`, `CommunityGroup`, `ModerationLog`, `MentorshipLog`, `CommunityTaskProgress`
- Recognition: `Certificate`, `UserCertificate`, `Badge`, `UserBadge`
- Guidance: `Coach`, `CoachSession`, `CoachAlert`, `CareerIntelligence`, `AIProfile`
- Engagement: `Avatar`, `Notification`, `Announcement`, `Task`
- Vision system: `VisionBoard`, `VisionBoardPro`, `VisionBoardNew`, `UserVisionBoard`

## 4. What Is Already Done

### 4.1 Platform Foundation

Implemented:

- Separate frontend and backend applications
- API routing structure with broad feature coverage
- MongoDB integration
- Authentication middleware and JWT use
- Central error handlers
- Logging strategy
- CORS and security middleware
- Device fingerprint middleware
- Static upload serving

Assessment: foundation is in place and actively used.

### 4.2 Authentication and User Lifecycle

Implemented:

- Signup and OTP verification flows
- Login and token-based session handling
- Forgot password / first-login password components
- User onboarding / add-details flow
- Profile management pages and routes
- Role-sensitive areas such as admin tickets and announcements

Assessment: user lifecycle is materially implemented, not just scaffolded.

### 4.3 Learning and Academic Stack

Implemented:

- Course listing and enrollment structures
- Module/day learning navigation
- Notes capability
- Assessment centre and baseline flow
- Assessment analysis/motivational follow-up pages
- Question bank backend
- Progress-related utility code

Assessment: the academic stack is one of the stronger implemented areas.

### 4.4 Student Experience Features

Implemented:

- Dashboard
- Skills Passport
- Skills Vault
- Certificates
- Badge system
- Notifications
- Avatar progression system
- Library
- Dictionary
- Mind care session experience
- Continue learning and progress-oriented UI modules

Assessment: strong user-facing feature breadth.

### 4.5 Community and Support

Implemented:

- Community feed and posting
- Groups and group chat screens
- Reaction and composer UI
- Announcements
- Support ticket flow
- Escalations
- Emotion chatbot / support chatbot components
- Moderation queue and moderation action routes

Assessment: collaboration/support layer is substantially present.

### 4.6 Vision Board and Creative Features

Implemented:

- Vision Board gallery
- Vision Board Pro editor
- User vision board APIs
- Asset/text/style/layout panels
- View mode and preview
- Image moderation utility hooks

Assessment: this is a major implemented subsystem, not a placeholder.

### 4.7 AI and Intelligence Layer

Implemented:

- AI support chatbot service
- AI career coach endpoints
- Career recommendations, skill gap, learning plan, resume generation
- Career intelligence report generation
- Career simulation engine
- OCR route
- Moderation-related helpers

Assessment: AI capabilities are present across multiple use cases, but not all are fully hardened.

### 4.8 Real-Time Layer

Implemented:

- WebSocket/Socket.IO initialization
- Authenticated notification channel
- Event emission for notifications
- Ping/pong keepalive behavior

Assessment: real-time notifications are implemented at architecture level.

## 5. What Is Remaining / Missing / Incomplete

This section separates “missing features” from “implemented but not production-safe”.

### 5.1 Critical Remaining Work

#### A. End-to-end production hardening is incomplete

Evidence:

- Only `MONGODB_URI` and `JWT_SECRET` are enforced as critical env vars in `back-end/server.js`.
- Other features depend on SMTP, Cloudinary, OCR, AI, and other service credentials but do not block startup when missing.

Impact:

- The system can start while important features silently degrade or no-op.
- Production issues may appear only after user interaction.

Needed:

- Define required env sets by feature and by deployment mode
- Add startup validation for all production-critical integrations
- Add readiness checks for degraded subsystems

#### B. Assessment authentication guard is partially bypassed

Evidence:

- `front-end/src/components/AssessmentFlowGuard.jsx:69-75` explicitly skips server validation to avoid 401 errors.

Impact:

- Assessment access control is not fully trustworthy
- Session/auth drift may allow incorrect access or broken exam behavior

Needed:

- Fix `/auth/me` or equivalent token validation path
- Re-enable backend validation in the assessment guard
- Re-test protected route behavior and timeout handling

#### C. NSFW moderation is still placeholder-level

Evidence:

- `back-end/helpers/nsfwModeration.js:4-6` says it is a placeholder
- The current logic only checks filenames/strings for banned keywords
- `back-end/routes/nsfwRoutes.js:5` also states real moderation is not enabled

Impact:

- Unsafe image detection is not real content moderation
- This is inadequate for production uploads and community safety

Needed:

- Integrate a real image moderation provider
- Define moderation thresholds and review flow
- Log moderation outcomes for auditability

#### D. OCR uses a hardcoded fallback API key

Evidence:

- `back-end/routes/ocrRoutes.js:14` falls back to a literal OCR API key when env is absent

Impact:

- Security and operational risk
- Shared or exposed third-party key usage
- Hard to control usage limits and abuse

Needed:

- Remove embedded fallback key
- Fail closed when OCR credentials are absent in non-dev environments

#### E. Test maturity is not enough for a system of this size

Evidence:

- `back-end/package.json` has `test` set to a placeholder failure
- No structured frontend test suite was found
- Existing checks are mostly scripts and TestSprite artifacts, not a stable CI-grade suite

Impact:

- Regression risk is high
- Hard to certify releases across assessments, auth, community, and AI modules

Needed:

- Add backend integration tests
- Add frontend route/component smoke tests
- Add critical user-journey E2E tests
- Put test execution into CI

### 5.2 Important Remaining Work

#### F. Secrets and environment hygiene need cleanup

Evidence found in code/scripts:

- `back-end/scripts/checks/check_streak.js:10` contains a hardcoded MongoDB Atlas connection string
- Similar hardcoded fallback DB URLs appear in some other scripts

Impact:

- Security risk
- Environment confusion
- Potential accidental use of wrong data sources

Needed:

- Remove hardcoded credentials and URLs from scripts
- Centralize env loading and config
- Separate local/dev/staging/prod configs clearly

#### G. Transport/session security is only partial

Evidence:

- Frontend derives API URL with plain `http://` for network access in `front-end/src/services/api.js:10`
- Token/user session data is read from `sessionStorage` in `front-end/src/services/api.js:27` and related frontend auth flows

Impact:

- Acceptable for local dev, not ideal for hardened production deployments
- SessionStorage/JWT browser handling increases XSS sensitivity

Needed:

- Define production HTTPS-only API strategy
- Review whether auth should move to secure httpOnly cookies end-to-end
- Review CORS, token renewal, and refresh strategy as one design

#### H. Build validation is not fully documented or automated

Evidence:

- Frontend lint passed
- Frontend build could not be confirmed in this sandbox
- Backend lacks formal startup validation tests

Needed:

- Confirm clean build on real developer machine/CI runner
- Add `build`, `lint`, and `test` gates in CI
- Capture deployment checklist and release criteria

#### I. Large codebase cleanup and rationalization is still needed

Evidence:

- Many status docs, fix docs, debug scripts, and repair scripts are present
- Multiple vision board variants and “fixed” context versions exist
- The repo contains troubleshooting and one-off maintenance scripts throughout backend

Impact:

- Harder onboarding
- Higher maintenance cost
- Greater chance of stale or duplicated logic

Needed:

- Archive obsolete docs
- Separate operational scripts from product code
- Standardize naming and ownership of “current” implementations

### 5.3 Medium-Priority Remaining Work

#### J. Formal observability is incomplete

Present:

- Logging exists
- Notification events exist

Still needed:

- Request tracing or correlation IDs
- Error dashboards
- API latency/usage metrics
- Health/readiness checks by subsystem

#### K. Role/security review is still needed

The app clearly has student/admin/moderation/support behaviors, but a full authorization matrix was not visible as a documented artifact.

Needed:

- Endpoint-by-endpoint role matrix
- Frontend route protection review
- Admin-only action verification
- Security review of moderation/support/admin flows

#### L. Data migration discipline should be improved

Present:

- Migrations exist for community reaction normalization

Still needed:

- A clearer migration/seeding strategy for all environments
- Versioned deployment runbooks
- Rollback procedure documentation

## 6. Missing Engineering Deliverables

Even where features exist, the following engineering deliverables are still missing or incomplete:

- CI/CD pipeline definition
- Release checklist
- Deployment architecture document
- Environment variable matrix
- API contract/spec document
- Test strategy document tied to actual executable suites
- Security review checklist
- Backup/recovery runbook
- Incident/support runbook for ops team
- Feature ownership map

## 7. Risks Seen During Audit

### High Risk

- Placeholder NSFW moderation
- Assessment auth guard bypass
- Hardcoded secrets/keys/DB fallbacks in scripts/routes
- Low automated regression coverage

### Medium Risk

- Startup does not guarantee all integrated subsystems are actually ready
- Feature sprawl with limited consolidation
- Real-time, AI, and support flows are implemented but need production validation

### Low to Medium Risk

- Dirty repo state and extra debug/helper files increase noise
- Documentation volume is high, but not always consolidated into one source of truth

## 8. Current Completion View by Domain

Estimated engineering completion, based on visible code:

- Core backend/API framework: 85-90%
- Frontend navigation and main UX shell: 85-90%
- Auth and onboarding: 75-85%
- Learning/course/assessment stack: 75-85%
- Community and support: 75-85%
- Vision board subsystem: 80-90%
- AI features: 65-80%
- Security hardening: 50-65%
- Automated testing/QA automation: 35-50%
- DevOps/release readiness: 40-55%

These are engineering estimates, not business sign-off percentages.

## 9. Recommended Next Action Plan

### Phase 1: Stabilize and Secure

1. Fix assessment auth validation and remove bypass behavior
2. Remove hardcoded secrets, keys, and database URLs
3. Replace placeholder NSFW moderation with a real provider
4. Define production env validation and startup readiness checks
5. Confirm frontend production build outside sandbox and lock build pipeline

### Phase 2: Test the Critical Paths

1. Add backend integration tests for auth, assessments, courses, certificates, community, tickets
2. Add frontend smoke/E2E flows for signup, login, dashboard, assessment, profile, support
3. Add release-blocking CI for lint, build, and tests

### Phase 3: Operational Readiness

1. Produce deployment and rollback documentation
2. Add monitoring, alerting, and error tracking
3. Define environment matrix for dev/staging/prod
4. Validate notifications, AI, email, OCR, and upload services in staging

### Phase 4: Codebase Consolidation

1. Archive outdated reports and duplicate documentation
2. Separate one-off scripts into maintenance folders with naming standards
3. Identify and retire deprecated frontend/backend variants
4. Produce one source-of-truth architecture document after cleanup

## 10. Final Conclusion

This software already contains a serious amount of implementation on both frontend and backend. The product is not “missing everything”; most major business modules are already built in some form.

What is still missing is the engineering finish required to make the system dependable at scale:

- tighter auth validation
- real moderation/security controls
- removal of hardcoded secrets/fallbacks
- stronger automated testing
- deployment readiness and observability
- cleanup and consolidation

In short:

- Feature implementation status: strong
- Engineering maturity status: medium
- Production readiness status: partial

The right next move is not to rebuild the platform. The right next move is a structured stabilization and hardening program.

