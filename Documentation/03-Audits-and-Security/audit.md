SMAART Institute
Responsiveness + OTP Authentication Audit

Date:	2026-05-20
Scope:	Frontend responsiveness (all routes + major components) + OTP authentication (frontend + backend security)
Breakpoints:	320 / 375 / 425 / 768 / 1024 / 1280 / 1440 / Ultrawide

Symbol	Severity	Description
🔴 P0	Critical	Launch blocker / critical security / crashes / inaccessible core flow
🟠 High	High	Major UX break on common devices or critical auth weakness
🟡 Medium	Medium	Noticeable break, workaround exists, impacts significant users
🟢 Low	Low	Minor polish / inconsistency


 
PART A — COMPLETE RESPONSIVENESS AUDIT

A1. Global Responsive System Issues (Cross-cutting)
A1.1 Masked Horizontal Overflow
Severity: 🟡 Medium
Files affected:
•	front-end/src/index.css (global overflow-x: hidden)
Issue: At 320–425px, layouts can overflow horizontally but the scrollbar is clipped, making content unreachable and hiding real bugs.
Root cause: html, body { max-width: 100vw; overflow-x: hidden; }
Exact Fixes:
•	During QA: remove global overflow-x:hidden to expose problems.
•	Replace fixed w-[Npx] with w-full max-w-*.
•	Add min-w-0 on any flex child containing long text.
•	For tables: overflow-x-auto wrapper + min-w-[640px] on table.
•	Force single-column stacks at <768px; collapse side-panels at <1024px.

A1.2 Global No-Selection / No-Caret Harms Mobile Usability
Severity: 🟡 Medium
File: front-end/src/index.css
Issue: body sets user-select: none, caret-color: transparent, cursor: default. While inputs restore selection, overall UX (copy/paste, text selection, assistive tooling) is degraded.
Root cause: Overly broad CSS applied to entire application.
Exact Fix:
•	Remove global user-select:none and caret-color:transparent.
•	Scope only to non-interactive decorative regions.
Mobile impact: Long-press selection inconsistencies in chat, notes, and forms.

A1.3 Dashboard Shell Width + Nested Fixed Widths = Squeeze at 1024px
Severity: 🟡 Medium
File: front-end/src/components/DashboardLayout.jsx
Issue: Shell uses lg:ml-[260px] for the expanded sidebar. Pages with fixed widths or side panels overflow at 1024px.
Root cause: Sidebar margin reduces usable width; pages frequently use fixed sizing.
Exact Fix:
•	Ensure all page roots inside dashboard use max-w-full min-w-0.
•	Any internal 2-column layout must collapse at md or lg breakpoint.

A1.4 Z-Index Layer Collisions (Modals, Overlays, Drawers)
Severity: 🟡 Medium
Files affected:
•	front-end/src/components/LeftSidebar.jsx (mobile drawer z-[100], overlay z-[95])
•	front-end/src/components/DashboardLayout.jsx (sticky header z-40)
•	front-end/src/components/auth/LoginOtpModal.jsx (modal z-[70])
•	front-end/src/pages/ComprehensiveSignup.jsx (header z-[100])
•	front-end/src/pages/GroupChat.jsx (viewer overlay z-[200], poll modal z-[100])
Issue: Some overlays appear behind others depending on navigation state, especially on mobile.
Recommended Z-Index Scale:
•	base: 0–10
•	sticky header: 40
•	sidebar: 80
•	overlay: 90
•	modal: 100
•	toast: 110
 
A2. User Dashboard — Deep Responsiveness + UX Audit
A2.1 Sidebar (Desktop + Mobile)
File: front-end/src/components/LeftSidebar.jsx
Finding	Severity	Fix
Overflow / Horizontal Scrolling	🟡 Medium	Add min-w-0 and truncate to label container; button uses w-full.
Mobile Touch Usability	🟡 Medium	Apply .tap-target utility to icon-only buttons for 44px minimum targets.
Scroll Container Behavior	🟢 Low	Ensure iOS momentum scrolling via -webkit-overflow-scrolling: touch.
Sidebar Collapse Behavior	🟡 Medium	Require click to expand or debounce hover; preserve content width to avoid reflow.
Screenshot Checklist:
•	docs/Reports/QA-Screenshots/dashboard/sidebar-mobile/320.png
•	docs/Reports/QA-Screenshots/dashboard/sidebar-mobile/375.png
•	docs/Reports/QA-Screenshots/dashboard/sidebar-desktop-collapsed/1024.png
•	docs/Reports/QA-Screenshots/dashboard/sidebar-desktop-expanded/1280.png

A2.2 Top Navigation + Sticky Header
File: front-end/src/components/DashboardLayout.jsx
•	Text Clipping / Wrapping  |  🟠 High  |  Wrap title in min-w-0; apply truncate at <768. Reduce title size at <375 (text-xl sm:text-2xl md:text-[28px]).
•	Search Bar Responsiveness  |  🟡 Medium  |  Add mobile search modal or use existing Ctrl+K command palette.
•	Z-Index Conflicts  |  🟡 Medium  |  Notification dropdown z-50, profile hover z-[100], header z-40 — unify layering.

A2.3 Profile Section (Header Profile + Hover Card)
File: front-end/src/components/DashboardLayout.jsx (ProfileHoverCard)
•	Modal Responsiveness  |  🟠 High  |  On pointer:coarse (touch), replace hover card with click-to-open drawer/modal. Use max-w-[calc(100vw-2rem)] on small screens.
•	Image / Video Scaling  |  🟡 Medium  |  Lazy-load video sequence; use static poster for mobile.

A2.4 Notifications (Dashboard Dropdown + Page)
Files: DashboardLayout.jsx (dropdown)  |  front-end/src/pages/Notifications.jsx
•	Scroll Container Behavior  |  🟡 Medium  |  max-h-[360px] overflow-y-auto is correct; ensure body scroll is not impacted on mobile.
•	Touch Targets  |  🟡 Medium  |  Notification items need at least 44px row height; ensure adequate padding at 320px.

A2.5 Settings (Dashboard)
File: front-end/src/pages/Settings.jsx
Severity: 🟡 Medium — 3 tabs listed with no rendered content, creating empty screen perception at all widths.
Fix: Implement tab content or hide incomplete tabs until ready.

A2.6 Loading States / Skeletons
Files: front-end/src/components/AnimatedRoutes.jsx  |  front-end/src/components/AssessmentFlowGuard.jsx
•	Consistency  |  🟡 Medium  |  Some pages use Suspense loader, others show blank until fetch completes.
Fix: Enforce a standard per-page skeleton component; use React Query for fetch status.
 
A3. Route-by-Route Responsiveness Audit (All Screens)
Categories checked for each route: overflow, horizontal scrolling, flex/grid breaks, spacing, button wrapping, clipping, icon scaling, navbar/sidebar behavior, tables/modals/cards/images/charts/forms, dashboard widgets, sticky header/footer, z-index, touch, typography, inputs, scroll containers.

Public Routes
#	Route / File	Severity	Key Risk / Action
1	/ — LandingPage.jsx	🟡 Medium	Hero typography + CTA wrapping at 320–375; multi-card grids must collapse to single column <768.
2	/institution/:id — Institution.jsx	🟠 High	Badge text can wrap; watermark w-[520px] causes GPU cost on mobile. Add prefers-reduced-motion.
3	/verify-certificate/* — VerifyCertificate.jsx	🟡 Medium	Results must be wrapped in overflow-x-auto. Check import correctness.
4	/verify-badge/* — VerifyBadge.jsx	🟡 Medium	Layout mismatch when logged-in; icon-only buttons need labels for mobile usability.
5	* — NotFound.jsx	🟡 Medium	Dark mode mismatch can appear as a responsive break.

Signup Flow Routes
#	Route / File	Severity	Key Risk / Action
6	/signup-initial — SignupInitial.jsx	🟡 Medium	Input width + label wrapping at 320; modal stacking with institution selector.
7	/verify-otp — VerifyOTP.jsx	🟡 Medium	OTP input tracking-[0.5em] + text-2xl can overflow at 320. Use 6-box input-otp library.
8	/signup — ComprehensiveSignup.jsx	🟠 High	Dropdown suggestion overlay uses absolute z-50 and can overflow viewport height. Add max-h-[50vh] overflow-y-auto.
9	/signup-success — SignupSuccess.jsx	🟢 Low	Mostly static — low risk.

Assessment / Non-Dashboard Guarded Routes
#	Route / File	Severity	Key Risk / Action
10	/assessment/:stage — BaseLineTest.jsx	🟡 Medium	Answer options wrapping; timer bar; sticky controls. Single-column layout <1024.
11	/analysis — Analysis.jsx	🟡 Medium	Charts need ResponsiveContainer; set w-full h-[min(320px,40vh)].
12	/motivational — Motivational.jsx	🟢 Low	Low risk.

Dashboard Inner Routes
#	Route / File	Severity	Key Risk / Action
13	/dashboard — DashboardHome.jsx	🟡 Medium	Cards must use grid-cols-1 sm:grid-cols-2 lg:grid-cols-3.
14	/dashboard/courses — MyCourses.jsx	🔴 P0	Functional gating issue: fetch progress + avoid all-locked/unlocked UI bug.
15	/dashboard/courses/:id/player — CoursePlayer.jsx	🟠 High	Video+sidebar at 1024; buttons wrap at 320.
16	/module/... — ModuleViewPage.jsx	🔴 P0	Multi-pane content; tables/lists; long titles overflow.
17	/dashboard/notes — MyNotes.jsx	🟡 Medium	Editor area needs min-h-0 and scroll region isolation.
18	/dashboard/assessment-centre — AssessmentsDashboard.jsx	🟡 Medium	Stage cards must be grid-cols-1 at 320–425.
19	/dashboard/skills-passport — SkillsPassport.jsx	🟡 Medium	Large file; multiple cards/badges — check at 320.
20	/dashboard/skills-vault — SkillsVault.jsx	🟡 Medium	Standard card audit required.
21	/dashboard/vision-boards — VisionBoardEditorPro.jsx	🟠 High	Convert side panels to drawers <1024; ensure canvas is w-full.
22	/dashboard/community — Community.jsx	🟡 Medium	Standard audit.
23	/dashboard/groups — StudentGroups.jsx	🟡 Medium	Standard audit.
24	/dashboard/groups/:id — GroupChat.jsx	🟠 High	Right sidebar fixed width 320 crushes main at 1024. Render as full-screen drawer on mobile.
25	/dashboard/library — Library.jsx	🟡 Medium	Card listing audit.
26	/dashboard/dictionary — GeneralDictionary.jsx	🟠 High	Feature broken by API shape; responsiveness blocked until fixed.
27	/dashboard/mindcare-sessions — MindCareSessions.jsx	🔴 P0	ReferenceErrors block page render — fix before any responsive QA.
28	/dashboard/settings — Settings.jsx	🟡 Medium	Blank tab content creates perceived layout break.
29	/dashboard/notifications — Notifications.jsx	🟢 Low	Low risk.
30	/dashboard/support — SupportTicketsPage.jsx	🟡 Medium	Tables/forms inside; standard audit.
31	/dashboard/onboarding — AddDetails.jsx	🟠 High	Bordered paper layout squeezes at 320. Add mobile-first spacing: p-6 sm:p-8 md:p-10.
32	/dashboard/profile — Profile.jsx	🟡 Medium	Large page; tabs/forms audit.
33	/dashboard/quotients-grid — QuotientsGrid.jsx	🟡 Medium	Charts/cards audit.
34	/dashboard/certificate — Certificate.jsx	🟠 High	PDF capture + layout scaling; needs responsive testing.
35	/dashboard/performance — Performance.jsx	🔴 P0	Hook crash blocks UI — fix crash before responsive QA.
36	AI Career Coach routes	🟡 Medium	Responsive forms + PDF capture; standard audit.
37	CareerDataFetcher.jsx	🟡 Medium	Should likely be hidden from end-users.
38	CareerAgent panels	🟠 High	Multi-panel layouts break at 768/1024. Panels should become stacked accordions <1024.


A4. Component-by-Component Responsiveness Audit (Core Components)
Component / File	Severity	Issues & Fix
DashboardLayout.jsx	🟠 High	Title overflow; dropdown stacking; hover-only interactions on touch. Fix: min-w-0 + truncation on title row; convert hover to click on touch.
LeftSidebar.jsx	🟡 Medium	Hover expand causes reflow; touch targets inconsistently sized.
AnimatedRoutes.jsx	🟡 Medium	Loader uses fixed w-20 h-20 — ensure it respects theme tokens.
LoginOtpModal.jsx	🟡 Medium	At 320: 6 input boxes + gaps must fit without overflow. Add aria-labels; ensure modal has max-h and scroll.
 
PART B — COMPLETE OTP AUTHENTICATION AUDIT

B1. OTP Flow Map (End-to-End)
B1.1 Signup OTP Flow
Backend endpoints (back-end/routes/auth.js):
•	POST /api/auth/send-signup-otp
•	POST /api/auth/verify-signup-otp
•	POST /api/auth/resend-signup-otp
Frontend:
•	/signup-initial  →  SignupInitial.jsx
•	/verify-otp  →  VerifyOTP.jsx
•	/signup  →  ComprehensiveSignup.jsx

B1.2 Login OTP Flow (Always Required)
Backend endpoints:
•	POST /api/auth/login  →  issues OTP + tempToken
•	POST /api/auth/verify-login-otp  →  marks OTP used, issues sessionId + JWT (3h) + cookie
•	POST /api/auth/resend-login-otp
Frontend:
•	LoginCard triggers login; OTP modal:  front-end/src/components/auth/LoginOtpModal.jsx

B1.3 First-Login Password Change Flow
•	Login identifies first-time student  →  sends OTP with flowType: 'first-login'
•	Verify OTP  →  returns requirePasswordChange with new temp token
•	POST /api/auth/first-login-change-password
 
B2. Frontend OTP Audit (UI/UX + Edge Cases + Accessibility)
B2.1 Login OTP Modal — Checklist
File: front-end/src/components/auth/LoginOtpModal.jsx
Check	Status	Notes / Fix
OTP input UI	✅ Pass	6-digit boxes
Auto-focus	✅ Pass	Focuses first box on open
Auto-submit	✅ Pass	Verifies on 6 digits filled
Paste support	✅ Pass	Handles paste into container
Mobile keyboard	✅ Pass	inputMode="numeric" set
Countdown timer	✅ Pass	Client timer present
Resend	✅ Pass	60s cooldown + new tempToken handling
Error handling	🟡 Partial	Toast-based; remaining attempts not surfaced in UI consistently
Disabled/loading states	✅ Pass	Submit disabled during load
Success states	✅ Pass	Toast + callback
Edge case: force-logout (409)	✅ Pass	Handled
Accessibility	🟠 High	Missing aria-label per digit input; SR reads six unlabeled textboxes. Add aria-label={`OTP digit ${index+1} of 6`} and autoComplete='one-time-code'.

B2.2 Signup OTP Page — Checklist
File: front-end/src/pages/VerifyOTP.jsx
Check	Status	Notes / Fix
OTP input UI	🟡 Partial	Single input; functional but less robust than 6-box
Auto-focus	✅ Pass	
Auto-submit	❌ Fail	Submit button required — add auto-submit on 6 digits
Paste support	✅ Pass	Browser default
Mobile keyboard	🟠 High	Missing inputMode="numeric" + autoComplete="one-time-code"
Countdown timer	✅ Pass	
Resend	✅ Pass	Resets timer + receives new tempToken
Accessibility	🟡 Partial	Needs aria-describedby for timer/error

Exact Fixes for VerifyOTP.jsx:
•	Add inputMode="numeric"
•	Add autoComplete="one-time-code"
•	Replace single input with input-otp library (already installed) for consistent layout across 320px.

B3. Backend OTP Audit (Security, Storage, Rate Limit, Replay, Session)
B3.1 OTP Generation Logic
File: back-end/utils/emailService.js
Severity: 🟡 Medium
Current: generateOTP() uses Math.random() — 6-digit numeric.
Risk: Math.random() is not cryptographically strong and is predictable in some environments.
Exact Fix:
•	Replace with: crypto.randomInt(100000, 1000000).toString()  (Node built-in crypto module)

B3.2 OTP Hashing / Storage
File: back-end/models/LoginOtp.js
Status: ✅ Good Foundation
•	OTP hashed with bcrypt in pre-save hook
•	TTL expiry: 300 seconds
Enhancement:
•	Minimize userData (Mixed schema) to reduce stored sensitive data surface area.

B3.3 Rate Limiting / Brute-Force Protection
File: back-end/middleware/rateLimiter.js
Severity: 🟠 High — Config Mismatch Risk
Current configuration:
•	loginLimiter: 15 per 15 minutes — key: ip+email
•	otpLimiter: 15 per 5 minutes
•	passwordResetLimiter: 3 per hour
Root cause: server.js trusts proxy (app.set('trust proxy', 1)) but limiter validation sets trustProxy:false.
Exact Fix:
•	Make rate limiter aware of proxy settings so the IP is accurate in production behind a load balancer.

B3.4 Session Binding + Token Expiration
Files: back-end/routes/auth.js  |  back-end/middleware/auth.js
Status: ✅ Strong Design
•	sessionId issued and validated in middleware
•	3-hour JWT expiry enforced
Key Risks:
•	Frontend logout does not call backend logout — server session may remain active.
•	Mixed cookie + bearer auth increases token ambiguity.

B3.5 Secure Cookies
File: back-end/routes/auth.js
Status: ✅ Good
•	httpOnly: true
•	secure: true in production
•	sameSite: 'strict'
Note: If frontend is hosted on a different domain/subdomain, strict sameSite can break flows — verify deployment topology.

B4. Authentication Bypass Vulnerabilities (OTP Underminers)
B4.1 Admin Bypass Backdoor
Severity: 🔴 P0 — Launch Blocker
File: back-end/middleware/auth.js
Root cause: x-admin-bypass: true + x-admin-secret creates admin identity without JWT or OTP.
Exact Fix:
•	Remove entirely from production code.
•	If required for dev only: wrap with if (NODE_ENV !== 'production').

B4.2 Frontend Auth Wall Bypass (Server Validation Disabled)
Severity: 🔴 P0 — Launch Blocker
File: front-end/src/components/AssessmentFlowGuard.jsx
Root cause: Server-side /api/auth/me validation is explicitly skipped/commented out.
Exact Fix:
•	Restore /api/auth/me validation call.
•	Block rendering if validation returns invalid or unauthenticated.

B4.3 Logout Does Not Invalidate Backend Session
Severity: 🟠 High
Files: front-end/src/contexts/UserContextFixed.jsx  |  back-end/routes/auth.js
Fix:
•	Frontend must call POST /api/auth/logout before clearing local storage.
•	Backend logout must invalidate the sessionId in the database.
 
B5. OTP Replay / Session Hijacking / Timing Risks
Replay Attacks
Mitigation present: isUsed flag exists; OTP record is deleted after successful login.
Remaining risk: OTP is not marked used until after session conflict check. Ensure OTP cannot be reused across repeated force-logout attempts.

Session Hijacking
Mitigation present: sessionId stored in DB and validated in middleware on every request.
Remaining risk: Mixed token storage (sessionStorage token + cookie) complicates which token is authoritative.

Timing Vulnerabilities
Bcrypt compare is constant-time for OTP comparison — acceptable.
Biggest timing risk is the bypass paths (P0 issues above), not bcrypt timing.

B6. Recommended Improved OTP / Auth Architecture (Production-Grade)
Option 1 — Cookie-Only Session (Recommended)
•	Use HttpOnly cookie JWT only — no sessionStorage token.
•	Add CSRF protection via double-submit cookie or dedicated CSRF token endpoint.
•	apiCall utility must not attach Authorization header.

Option 2 — Bearer-Only
•	Remove cookies entirely.
•	Store token in memory (not localStorage) and rotate tokens on each request.

Mandatory Changes Regardless of Option
Action Required	Priority	File(s)
Remove admin bypass header from production	🔴 P0	back-end/middleware/auth.js
Restore server-side session validation in AssessmentFlowGuard	🔴 P0	AssessmentFlowGuard.jsx
Ensure logout hits backend and clears server session	🟠 High	UserContextFixed.jsx + auth.js
Replace Math.random() with crypto.randomInt for OTP	🟡 Medium	back-end/utils/emailService.js
Fix rate limiter proxy trust mismatch	🟠 High	back-end/middleware/rateLimiter.js
Add aria-labels to OTP digit inputs	🟠 High	LoginOtpModal.jsx
Add inputMode + autoComplete to signup OTP input	🟠 High	VerifyOTP.jsx


End of Report — SMAART Institute Responsiveness + OTP Audit  |  2026-05-20
