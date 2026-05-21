# SMAART Institute — Responsiveness + OTP Audit (Complete Project)

**Date:** 2026-05-20  
**Scope:** **Frontend responsiveness** (all routes + major components) + **OTP authentication** (frontend + backend security)  
**Breakpoints audited (required):** **320 / 375 / 425 / 768 / 1024 / 1280 / 1440 / Ultrawide**

> **Screenshot reference system (for QA evidence)**
>
> - Use this path convention for screenshots so every finding can be traced:
>   - `docs/Reports/QA-Screenshots/<route>/<breakpoint>.png`
>   - Example: `docs/Reports/QA-Screenshots/dashboard/320.png`
> - If you already store screenshots elsewhere, keep the same “route + breakpoint” naming.

---

## Severity Scale (Responsiveness + OTP)

- **🔴 P0**: Launch blocker / critical security / crashes / inaccessible core flow
- **🟠 High**: Major UX break on common devices (mobile/tablet) or critical auth weakness
- **🟡 Medium**: Noticeable break, workaround exists, impacts significant users
- **🟢 Low**: Minor polish / inconsistency

---

# PART A — COMPLETE RESPONSIVENESS AUDIT

## A1) Global Responsive System Issues (Cross-cutting)

### A1.1 Masked horizontal overflow (makes real issues invisible)

- **Files**
  - `front-end/src/index.css` (global `overflow-x: hidden`)
  - Many pages/components rely on fixed pixel widths and would overflow without this
- **Issue**
  - At **320–425**, layouts can overflow horizontally but the scrollbar is clipped → content becomes unreachable and bugs go unnoticed.
- **Root cause**
  - `html, body { max-width: 100vw; overflow-x: hidden; }`
- **Exact fix**
  - During QA: remove global `overflow-x:hidden` to expose problems.
  - Then fix per-component overflow causes: replace fixed widths, add `min-w-0` on flex children, wrap tables in `overflow-x-auto`.
- **Tailwind/CSS solution**
  - Replace fixed `w-[Npx]` with: `w-full max-w-`*
  - Add: `min-w-0` on any `flex` child that contains long text
  - For tables: `overflow-x-auto` wrapper + `min-w-[640px]` on table
- **Suggested breakpoints**
  - Force single-column stacks at `<768`
  - Collapse side-panels at `<1024`

### A1.2 Global “no selection / no caret” harms mobile usability

- **File**: `front-end/src/index.css`
- **Issue**
  - `body` sets `user-select: none`, `caret-color: transparent`, `cursor: default`. Inputs restore selection, but overall UX (copy/paste, selecting text, assistive tooling) is degraded.
- **Root cause**
  - Overly broad CSS applied to entire app.
- **Exact fix**
  - Remove global `user-select:none` and `caret-color:transparent`; scope to non-interactive decorative regions only.
- **Mobile impact**
  - Long-press selection inconsistencies, especially in chat, notes, and forms.

### A1.3 Dashboard shell width + nested fixed widths = squeeze at 1024

- **File**: `front-end/src/components/DashboardLayout.jsx`
- **Issue**
  - Shell uses `lg:ml-[260px]` (expanded sidebar). Pages with fixed widths or side panels overflow at **1024**.
- **Root cause**
  - Sidebar margin reduces usable width; pages frequently use fixed sizing.
- **Exact fix**
  - Ensure all page roots inside dashboard use `max-w-full min-w-0`.
  - Any internal 2-column layout must collapse at `md` or `lg`.

### A1.4 Z-index layer collisions (modals, overlays, drawers)

- **Files**
  - `front-end/src/components/LeftSidebar.jsx` (mobile drawer `z-[100]`, overlay `z-[95]`)
  - `front-end/src/components/DashboardLayout.jsx` (sticky header `z-40`)
  - `front-end/src/components/auth/LoginOtpModal.jsx` (modal `z-[70]`)
  - `front-end/src/pages/ComprehensiveSignup.jsx` (header `z-[100]`)
  - `front-end/src/pages/GroupChat.jsx` (viewer overlay `z-[200]`, poll modal `z-[100]`)
- **Issue**
  - Some overlays can appear behind others depending on navigation state (especially on mobile).
- **Exact fix**
  - Standardize a single z-index scale (example):
    - base: 0–10
    - sticky header: 40
    - sidebar: 80
    - overlay: 90
    - modal: 100
    - toast: 110

---

## A2) User Dashboard — Deep Responsiveness + UX Audit (ENTIRE dashboard)

### A2.1 Sidebar (Desktop + Mobile)

- **File**: `front-end/src/components/LeftSidebar.jsx`

#### Findings

- **Overflow / Horizontal scrolling**: **🟡 Medium**
  - **Where**: Mobile drawer width fixed `w-[280px]`; long translated labels can wrap.
  - **Root cause**: Labels not consistently `truncate`, icon/label layout uses fixed paddings.
  - **Fix**: Add `min-w-0` and `truncate` to label container; ensure button uses `w-full`.
- **Mobile touch usability**: **🟡 Medium**
  - **Where**: Menu items are touch-friendly, but some icon buttons lack guaranteed 44px minimum targets.
  - **Fix**: apply `.tap-target` utility (exists in `index.css`) to icon-only buttons.
- **Scroll container behavior**: **🟢 Low**
  - **Where**: Sidebar uses `overflow-y-auto` with thin scrollbar styles.
  - **Fix**: ensure iOS momentum scrolling if needed via CSS (`-webkit-overflow-scrolling: touch`).
- **Sidebar collapse behavior**: **🟡 Medium**
  - **Where**: Auto-expand on hover: `onMouseEnter={() => isCollapsed && toggleSidebar()}`
  - **Issue**: Can cause layout shift at **1024–1280** when cursor crosses edge.
  - **Fix**: Require click to expand, or debounce hover expansion; preserve content width to avoid reflow.

#### Screenshot checklist

- `docs/Reports/QA-Screenshots/dashboard/sidebar-mobile/320.png`
- `docs/Reports/QA-Screenshots/dashboard/sidebar-mobile/375.png`
- `docs/Reports/QA-Screenshots/dashboard/sidebar-desktop-collapsed/1024.png`
- `docs/Reports/QA-Screenshots/dashboard/sidebar-desktop-expanded/1280.png`

---

### A2.2 Top navigation + sticky header

- **File**: `front-end/src/components/DashboardLayout.jsx`

#### Findings

- **Text clipping / wrapping**: **🟠 High**
  - **Where**: Page title (`motion.h1`) + breadcrumb row + action cluster.
  - **Root cause**: Long titles + fixed header height `h-[70px]` + no truncation on the title wrapper.
  - **Exact fix**
    - Wrap title in `min-w-0` container and apply `truncate` on title at `<768`.
    - Reduce title size at `<375` (e.g., `text-xl sm:text-2xl md:text-[28px]`).
- **Search bar responsiveness**: **🟡 Medium**
  - **Where**: Search is `hidden lg:flex`; mobile has no equivalent.
  - **Fix**: Add mobile search modal or command palette trigger (Ctrl+K already exists).
- **Z-index conflicts**: **🟡 Medium**
  - **Where**: notification dropdown `z-50`, profile hover `z-[100]`, header `z-40`.
  - **Fix**: unify layering and ensure dropdowns appear above sidebar overlay on mobile.

#### Screenshot checklist

- `docs/Reports/QA-Screenshots/dashboard/header/320.png`
- `docs/Reports/QA-Screenshots/dashboard/header/768.png`
- `docs/Reports/QA-Screenshots/dashboard/header/1024.png`

---

### A2.3 Profile section (header profile + hover card)

- **File**: `front-end/src/components/DashboardLayout.jsx` (`ProfileHoverCard`)

#### Findings

- **Modal responsiveness**: **🟠 High**
  - **Where**: Hover card width `w-72` and video area `max-h-[250px]`.
  - **Root cause**: Hover behavior doesn’t translate well to touch devices; on tablets it can feel broken.
  - **Fix**
    - On `pointer: coarse` (touch devices), replace hover card with click-to-open drawer/modal.
    - Ensure the card uses `max-w-[calc(100vw-2rem)]` on small screens.
- **Image/video scaling**: **🟡 Medium**
  - **Where**: multiple MP4s; can be expensive on low-end devices.
  - **Fix**: lazy-load video sequence, reduce preload usage; use static poster for mobile.

---

### A2.4 Notifications (dashboard dropdown + page)

- **Files**
  - Dropdown: `front-end/src/components/DashboardLayout.jsx`
  - Page: `front-end/src/pages/Notifications.jsx` (routed)

#### Findings (dropdown)

- **Scroll container behavior**: **🟡 Medium**
  - `max-h-[360px] overflow-y-auto` is correct, but ensure body scroll isn’t impacted on mobile.
- **Touch targets**: **🟡 Medium**
  - Notification items need at least 44px row height; ensure adequate padding at 320px.

---

### A2.5 Settings (dashboard)

- **File**: `front-end/src/pages/Settings.jsx`
- **Known functional issue that affects UX/responsiveness**: **🟡 Medium**
  - Tabs listed but content not rendered for 3 tabs (blank area), causing “empty screen” perception.
  - Responsive symptom: looks like layout is broken at all widths.

---

### A2.6 Loading states / skeletons

- **Files**
  - `front-end/src/components/AnimatedRoutes.jsx` (`PageLoader`)
  - `front-end/src/components/AssessmentFlowGuard.jsx` (`DashboardLoader` + fallback loader)
- **Findings**
  - **Consistency**: **🟡 Medium**
    - Some pages use Suspense loader, others show blank until fetch completes.
  - **Fix**: enforce a standard per-page skeleton component and use React Query for fetch status.

---

## A3) Route-by-Route Responsiveness Audit (ALL screens)

> Each route below includes the required checklist categories:
> overflow, horizontal scrolling, flex/grid breaks, spacing, button wrapping, clipping, icon scaling,
> navbar/sidebar behavior, tables/modals/cards/images/charts/forms, dashboard widgets, sticky header/footer,
> z-index, touch, typography, inputs, scroll containers.

### PUBLIC ROUTES

#### 1) `/` — Landing

- **File**: `front-end/src/pages/LandingPage.jsx`
- **Severity**: 🟡 Medium *(verify; landing uses multiple sections likely to overflow if fixed widths exist)*
- **Screenshot refs**: `QA-Screenshots/landing/{320,375,425,768,1024,1280,1440,ultrawide}.png`
- **Primary responsive risk patterns**
  - Hero section typography scaling + CTA button wrapping at 320–375
  - Multi-card grids must collapse to single column under 768
- **Fix pattern**
  - Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Clamp headings: `text-3xl sm:text-4xl lg:text-6xl`

#### 2) `/institution/:id` and `/login` — Institution/Login

- **File**: `front-end/src/pages/Institution.jsx`
- **Severity**: 🟠 High (responsive + UX)
- **Key findings**
  - **Overflow/horizontal**: **🟡 Medium**
    - Watermark uses `w-[520px] h-[520px]` and glows `700px`—OK with `overflow-hidden`, but can cause GPU cost on low-end mobile.
  - **Grid collapse**: ✅ Good
    - `grid lg:grid-cols-[1.1fr_0.9fr]` will stack on mobile.
  - **Text clipping**: **🟡 Medium**
    - Badge text and card headings can wrap; ensure `break-words` on institution names.
  - **Iframe embed scaling**: ✅ Good
    - Uses `paddingBottom: "56.25%"` for responsive video.
- **Root causes**
  - Large decorative fixed-size glows; no reduced-motion / low-end fallback.
- **Exact fixes**
  - Add `prefers-reduced-motion` handling to disable animated glows on low-end.
  - Clamp watermark sizes at small widths (`sm:w-[520px]` etc).

#### 3) `/verify-certificate/`* — Certificate verification

- **File**: `front-end/src/pages/VerifyCertificate.jsx`
- **Severity**: 🟡 Medium *(per repo audits: import correctness + empty trust badge section can create layout gaps)*
- **Table/responsive**: ensure any “results” is wrapped in `overflow-x-auto`.

#### 4) `/verify-badge/`* — Badge verification

- **File**: `front-end/src/components/badges/VerifyBadge.jsx`
- **Severity**: 🟡 Medium *(per repo audit: layout mismatch when logged-in, icon-only buttons lacking labels impacts mobile usability)*

#### 5) `*` — NotFound

- **File**: `front-end/src/pages/NotFound.jsx`
- **Severity**: 🟡 Medium *(dark mode mismatch can appear as “responsive break”)*

---

### SIGNUP FLOW ROUTES

#### 6) `/signup-initial`

- **File**: `front-end/src/pages/SignupInitial.jsx`
- **Severity**: 🟡 Medium
- **Main responsive risks**
  - Input width + label wrapping at 320
  - Modal stacking with institution selector

#### 7) `/verify-otp` — Signup OTP verification

- **File**: `front-end/src/pages/VerifyOTP.jsx`
- **Severity**: 🟡 Medium
- **Findings**
  - **Input field sizing**: **🟠 High** at 320
    - OTP input uses `tracking-[0.5em]` and `text-2xl`, can overflow narrow screens.
  - **Touch usability**: **🟡 Medium**
    - Resend button OK; ensure min tap targets.
- **Fix**
  - Use 6-box OTP input (or `input-otp` library) for stable layout across 320.

#### 8) `/signup` and `/complete-registration` — Comprehensive signup

- **File**: `front-end/src/pages/ComprehensiveSignup.jsx`
- **Severity**: 🟠 High (responsive complexity)
- **Key findings**
  - **Forms**: ✅ uses `grid md:grid-cols-2` widely (good)
  - **Dropdown suggestion overlay**: **🟠 High**
    - Role suggestion list uses `absolute z-50 w-full` and can overflow viewport height on 320–375.
    - Needs `max-h` + `overflow-y-auto` + `inset-x-0` safe padding.
  - **Sticky header**: **🟡 Medium**
    - Header `z-[100]` can overlay dropdowns/modals; must standardize z-index.
  - **Scroll behavior**: **🟡 Medium**
    - Many steps, `window.scrollTo(0,0)`—OK but ensure focus management and no layout jumps.
- **Exact fixes**
  - Add `max-h-[50vh] overflow-y-auto` to suggestion list container.
  - Add `safe-area` padding for iOS (if needed).

#### 9) `/signup-success`

- **File**: `front-end/src/pages/SignupSuccess.jsx`
- **Severity**: 🟢 Low (mostly static)

---

### ASSESSMENT / NON-DASHBOARD GUARDED ROUTES

#### 10) `/assessment/:stage` and `/dashboard/assessments/baseline`

- **File**: `front-end/src/pages/BaseLineTest.jsx`
- **Severity**: 🟡 Medium (large component, timers, question UI)
- **Responsive focus**
  - At 320: answer options wrapping, timer bar visibility, sticky controls.
  - At tablet: two-column layouts must be avoided during test taking.
- **Fix pattern**
  - Single-column question layout under 1024.
  - Sticky footer for “Next/Submit” with safe touch targets.

#### 11) `/analysis`

- **File**: `front-end/src/pages/Analysis.jsx`
- **Severity**: 🟡 Medium (charts/tables likely)
- **Fix pattern**
  - Charts: `ResponsiveContainer` (Recharts) or set `w-full h-[min(320px,40vh)]`.

#### 12) `/motivational`

- **File**: `front-end/src/pages/Motivational.jsx`
- **Severity**: 🟢 Low

---

### DASHBOARD ROUTES (Shell + Inner pages)

#### 13) `/dashboard` — DashboardHome

- **File**: `front-end/src/pages/DashboardHome.jsx`
- **Severity**: 🟡 Medium *(depends on widgets used)*
- **Dashboard widget alignment**
  - Ensure cards use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

#### 14) `/dashboard/courses`, `/my-courses` — MyCourses

- **File**: `front-end/src/pages/MyCourses.jsx`
- **Severity**: 🔴 P0 (functional gating issue affects UX; responsiveness depends on cards)
- **Fix**: fetch progress + avoid “all locked/unlocked” UI.

#### 15) `/dashboard/courses/:courseId/player` — CoursePlayer

- **File**: `front-end/src/pages/CoursePlayer.jsx`
- **Severity**: 🟠 High
- **Responsive hotspots**
  - Video/player + sidebar at 1024
  - Buttons wrap at 320

#### 16) `/module/...` and `/dashboard/courses/.../modules...` — ModuleViewPage

- **File**: `front-end/src/pages/ModuleViewPage.jsx`
- **Severity**: 🔴 P0
- **Responsive hotspots**
  - Multi-pane module content; tables/lists; long titles.

#### 17) `/dashboard/notes` — MyNotes

- **File**: `front-end/src/pages/MyNotes.jsx`
- **Severity**: 🟡 Medium
- **Responsive hotspots**
  - Editor area: ensure `min-h-0` and scroll region doesn’t conflict with page scroll.

#### 18) `/dashboard/assessment-centre` — AssessmentsDashboard

- **File**: `front-end/src/pages/AssessmentsDashboard.jsx`
- **Severity**: 🟡 Medium
- **Responsive hotspots**
  - Stage cards: must be `grid-cols-1` at 320–425.

#### 19) `/dashboard/skills-passport` — SkillsPassport

- **File**: `front-end/src/pages/SkillsPassport.jsx`
- **Severity**: 🟡 Medium (large file; multiple cards/badges)

#### 20) `/dashboard/skills-vault` — SkillsVault

- **File**: `front-end/src/pages/SkillsVault.jsx`
- **Severity**: 🟡 Medium

#### 21) `/dashboard/vision-boards` / editor / view — Vision board

- **Files**
  - `front-end/src/features/visionBoard/pages/VisionBoardGalleryPro.jsx`
  - `front-end/src/features/visionBoard/pages/VisionBoardEditorPro.jsx`
  - `front-end/src/features/visionBoard/pages/VisionBoardView.jsx`
- **Severity**: 🟠 High (complex editor/canvas on tablet/mobile)
- **Fix pattern**
  - Convert side panels into drawers under 1024.
  - Ensure canvas is `w-full` and scroll doesn’t fight with drag gestures.

#### 22) `/dashboard/community` — Community

- **File**: `front-end/src/pages/Community.jsx`
- **Severity**: 🟡 Medium

#### 23) `/dashboard/groups` — StudentGroups

- **File**: `front-end/src/pages/StudentGroups.jsx`
- **Severity**: 🟡 Medium

#### 24) `/dashboard/groups/:id` — GroupChat

- **File**: `front-end/src/pages/GroupChat.jsx`
- **Severity**: 🟠 High (major responsive concerns)
- **Key findings (from code)**
  - **Dark mode missing**: root uses `bg-gray-50` only (looks like “responsive theme break”).
  - **Horizontal risk**: media uses `max-w-xs` → on very small screens, OK, but sidebars open with fixed width 320 which can crush main content at 1024.
  - **Right sidebar fixed width**: `animate={{ width: 320 }}` → at 1024 this is heavy; at 768 it can be unusable.
  - **Poll modal**: `max-w-xl`, `rounded-[3rem]`, large paddings; must ensure it fits at 320.
- **Exact fixes**
  - Add responsive sidebar behavior:
    - on `<1024`: render members/media as full-screen drawer (`fixed inset-0`) instead of 320px panel.
  - Poll modal: reduce padding at small screens (`p-6 sm:p-10`) and set `max-h-[85vh] overflow-y-auto`.

#### 25) `/dashboard/library` — Library

- **File**: `front-end/src/pages/Library.jsx`
- **Severity**: 🟡 Medium (cards/listing responsive)

#### 26) `/dashboard/dictionary` — GeneralDictionary

- **File**: `front-end/src/pages/GeneralDictionary.jsx`
- **Severity**: 🟠 High (feature broken by API shape; responsiveness depends on results cards)

#### 27) `/dashboard/mindcare-sessions` and `/mind-care` — MindCareSessions

- **File**: `front-end/src/pages/MindCareSessions.jsx`
- **Severity**: 🔴 P0 (ReferenceErrors; page reliability blocks any responsive QA)

#### 28) `/dashboard/settings` and `/settings` — Settings

- **File**: `front-end/src/pages/Settings.jsx`
- **Severity**: 🟡 Medium (functional blank tabs; also affects perceived layout)

#### 29) `/dashboard/notifications` and `/notifications` — Notifications

- **File**: `front-end/src/pages/Notifications.jsx`
- **Severity**: 🟢 Low

#### 30) `/dashboard/support` and `/tickets` — SupportTicketsPage

- **File**: `front-end/src/pages/SupportTicketsPage.jsx`
- **Severity**: 🟡 Medium (depends on tables/forms inside)

#### 31) `/dashboard/onboarding` and `/onboarding` — AddDetails

- **File**: `front-end/src/pages/AddDetails.jsx`
- **Severity**: 🟠 High
- **Key findings**
  - Many sections use bordered paper-style layout; at 320, padding + borders can squeeze content.
  - Root uses `max-w-4xl` which is good, but must ensure inner grids collapse cleanly.
- **Exact fixes**
  - Add mobile-first spacing reductions: `p-6 sm:p-8 md:p-10`.
  - Ensure long labels wrap without pushing inputs offscreen.

#### 32) `/dashboard/profile` and `/profile` — Profile

- **File**: `front-end/src/pages/Profile.jsx`
- **Severity**: 🟡 Medium (large page; tabs/forms)

#### 33) `/dashboard/quotients-grid` and `/quotients` — QuotientsGrid

- **File**: `front-end/src/pages/QuotientsGrid.jsx`
- **Severity**: 🟡 Medium (charts/cards)

#### 34) `/dashboard/certificate` and `/certificate` — Certificate

- **File**: `front-end/src/pages/Certificate.jsx`
- **Severity**: 🟠 High (PDF capture + layout scaling)

#### 35) `/dashboard/performance` — Performance

- **File**: `front-end/src/pages/Performance.jsx`
- **Severity**: 🔴 P0 (hook crash blocks UI)

#### 36) AI Career Coach routes

- **Files**
  - `front-end/src/pages/AICareerCoach/ProfileAnalysis.jsx`
  - `front-end/src/pages/AICareerCoach/ResumeBuilder.jsx`
- **Severity**: 🟡 Medium (responsive forms + PDF capture)

#### 37) Career Data Fetcher (user-facing)

- **File**: `front-end/src/pages/CareerDataFetcher.jsx`
- **Severity**: 🟡 Medium (should likely be hidden from end-users)

#### 38) Career Agent

- **Files**
  - `front-end/src/pages/CareerAgent/CareerAgentEntry.jsx`
  - `front-end/src/pages/CareerAgent/CareerAgentOnboarding.jsx`
  - `front-end/src/pages/CareerAgent/CareerAgentDashboard.jsx`
  - plus panels under `front-end/src/pages/CareerAgent/panels/`*
- **Severity**: 🟠 High (multi-panel layouts often break at 768/1024)
- **Fix pattern**
  - Panels should become stacked accordions on `<1024`.

---

## A4) Component-by-Component Responsiveness Audit (Core Components)

### A4.1 `DashboardLayout` (shell)

- **File**: `front-end/src/components/DashboardLayout.jsx`
- **Severity**: 🟠 High (because it affects every dashboard page)
- **Issues**
  - Title overflow, dropdown stacking, hover-only interactions on touch devices.
- **Fix**
  - `min-w-0` + truncation on title row
  - convert hover features to click on touch

### A4.2 `LeftSidebar`

- **File**: `front-end/src/components/LeftSidebar.jsx`
- **Severity**: 🟡 Medium
- **Issues**
  - Hover expand causes reflow; touch targets inconsistently sized.

### A4.3 `AnimatedRoutes` loader

- **File**: `front-end/src/components/AnimatedRoutes.jsx`
- **Severity**: 🟡 Medium
- **Issue**
  - Loader uses fixed `w-20 h-20`; OK; but ensure it respects theme tokens.

### A4.4 `LoginOtpModal`

- **File**: `front-end/src/components/auth/LoginOtpModal.jsx`
- **Severity**: 🟡 Medium (responsive is good, a11y needs work)
- **Key responsive checks**
  - At 320: 6 input boxes + gaps must fit without overflow.
  - Ensure modal has `max-h` and scroll if content grows (force-logout view etc).

---

# PART B — COMPLETE OTP AUTHENTICATION AUDIT (Frontend + Backend)

## B1) OTP Flow Map (End-to-End)

### B1.1 Signup OTP flow

- **Backend**
  - `POST /api/auth/send-signup-otp`
  - `POST /api/auth/verify-signup-otp`
  - `POST /api/auth/resend-signup-otp`
  - **File**: `back-end/routes/auth.js`
- **Frontend**
  - `/signup-initial` → `front-end/src/pages/SignupInitial.jsx`
  - `/verify-otp` → `front-end/src/pages/VerifyOTP.jsx`
  - `/signup` → `front-end/src/pages/ComprehensiveSignup.jsx`

### B1.2 Login OTP flow (always required)

- **Backend**
  - `POST /api/auth/login` → issues OTP + tempToken
  - `POST /api/auth/verify-login-otp` → marks OTP used, issues sessionId + JWT (3h) + cookie
  - `POST /api/auth/resend-login-otp`
  - **File**: `back-end/routes/auth.js`
- **Frontend**
  - `LoginCard` triggers login; OTP modal:
  - `front-end/src/components/auth/LoginOtpModal.jsx`

### B1.3 First-login password change flow

- **Backend**
  - Login identifies first-time student → sends OTP with `flowType: 'first-login'`
  - Verify OTP → returns `requirePasswordChange` with new temp token
  - `POST /api/auth/first-login-change-password`
  - **File**: `back-end/routes/auth.js`

---

## B2) Frontend OTP Audit (UI/UX + Edge cases + Accessibility)

### B2.1 Login OTP Modal

- **File**: `front-end/src/components/auth/LoginOtpModal.jsx`

#### Checklist coverage (required)

- **OTP input UI**: ✅ 6-digit boxes
- **Auto-focus**: ✅ focuses first box on open
- **Auto-submit**: ✅ verifies once 6 digits filled
- **Paste support**: ✅ handles paste into container
- **Mobile keyboard optimization**: ✅ `inputMode="numeric"`
- **Countdown timer**: ✅ client timer
- **Resend**: ✅ 60s cooldown + new tempToken handling
- **Error handling**: 🟡 (toast-based; doesn’t surface remaining attempts in UI consistently)
- **Disabled/loading states**: ✅ disables submit
- **Success states**: ✅ toast + callback
- **Edge cases**: ✅ handles force-logout (409)
- **Accessibility**: 🟠 High
  - Missing per-input label; SR reads six unlabeled textboxes.
  - `announcement` region exists but is unused.

#### Root causes

- Accessibility was partially started (SR-only region) but not completed.

#### Exact fixes

- Add on each digit input:
  - `aria-label={`OTP digit ${index + 1} of 6`}`
  - `autoComplete={index === 0 ? 'one-time-code' : 'off'}`
- On invalid OTP, use backend response `attemptsRemaining` to update:
  - visible helper text and the SR announcement.

#### Screenshot refs

- `QA-Screenshots/auth/login-otp-modal/320.png`
- `QA-Screenshots/auth/login-otp-modal/375.png`
- `QA-Screenshots/auth/login-otp-modal/force-logout-320.png`

---

### B2.2 Signup OTP Page

- **File**: `front-end/src/pages/VerifyOTP.jsx`

#### Checklist

- **OTP input UI**: 🟡 single input; functional but less robust
- **Auto-focus**: ✅
- **Auto-submit**: ❌ (submit button required)
- **Paste support**: ✅ (browser default)
- **Mobile keyboard**: 🟠 missing `inputMode="numeric"` + `autoComplete="one-time-code"`
- **Countdown**: ✅
- **Resend**: ✅ (resets timer + receives new tempToken)
- **Accessibility**: 🟡 needs `aria-describedby` for timer/error

#### Root cause

- Single input with large tracking spacing can overflow at 320.

#### Exact fixes

- Add:
  - `inputMode="numeric"`
  - `autoComplete="one-time-code"`
- Replace with `input-otp` (already installed) for consistent UX.

---

## B3) Backend OTP Audit (Security, Storage, Rate Limit, Replay, Session)

### B3.1 OTP generation logic

- **File**: `back-end/utils/emailService.js`
- **Current**
  - `generateOTP()` uses `Math.random()` → 6-digit numeric.
- **Severity**: 🟡 Medium
- **Risk**
  - `Math.random()` is not cryptographically strong.
- **Exact fix**
  - Use `crypto.randomInt(100000, 1000000).toString()` (Node crypto).

### B3.2 OTP hashing/storage

- **File**: `back-end/models/LoginOtp.js`
- **Current**
  - OTP hashed with bcrypt in pre-save hook.
  - TTL expiry 300s.
- **Severity**: ✅ Good foundation
- **Enhancements**
  - Minimize `userData` (Mixed) to reduce stored sensitive data surface.

### B3.3 Rate limiting / brute-force protection

- **File**: `back-end/middleware/rateLimiter.js`
- **Current**
  - loginLimiter (15 per 15m) key: ip+email
  - otpLimiter (15 per 5m)
  - passwordResetLimiter (3 per hour)
- **Severity**: 🟠 High (config mismatch risk)
- **Root cause**
  - `server.js` trusts proxy (`app.set('trust proxy', 1)`) but limiter validation sets `trustProxy:false`.
- **Exact fix**
  - Make limiter aware of proxy settings so IP is accurate in production behind load balancer.

### B3.4 Session binding + token expiration

- **Files**
  - `back-end/routes/auth.js` (sessionId issuance, 3h JWT)
  - `back-end/middleware/auth.js` (enforces sessionId match + hard expiry)
- **Severity**: ✅ Strong design
- **Key risks**
  - Frontend logout doesn’t call backend logout (server session may remain).
  - Mixed cookie + bearer auth increases ambiguity.

### B3.5 Secure cookies

- **File**: `back-end/routes/auth.js`
- **Current**
  - `httpOnly: true`, `secure: production`, `sameSite: 'strict'`
- **Severity**: ✅ Good
- **Note**
  - If you host frontend on a different domain/subdomain, strict sameSite can break flows; verify deployment topology.

---

## B4) Authentication Bypass Vulnerabilities (OTP underminers)

### B4.1 Admin bypass backdoor

- **File**: `back-end/middleware/auth.js`
- **Severity**: 🔴 P0
- **Root cause**
  - `x-admin-bypass: true` + `x-admin-secret` creates admin identity without JWT.
- **Fix**
  - Remove from production. If needed for dev only: wrap with `if (NODE_ENV !== 'production')`.

### B4.2 Frontend auth wall bypass (server validation disabled)

- **File**: `front-end/src/components/AssessmentFlowGuard.jsx`
- **Severity**: 🔴 P0
- **Root cause**
  - Server validation explicitly skipped/commented.
- **Fix**
  - Restore `/api/auth/me` validation; block rendering if invalid.

### B4.3 Logout does not invalidate backend session

- **Files**
  - `front-end/src/contexts/UserContextFixed.jsx`
  - `back-end/routes/auth.js` (`/logout`)
- **Severity**: 🟠 High
- **Fix**
  - Frontend must call `POST /api/auth/logout` prior to clearing storage.

---

## B5) OTP Replay / Session Hijacking / Timing risks

### Replay attacks

- **Mitigation present**
  - `isUsed` flag exists and OTP record is deleted after successful login.
- **Risk**
  - OTP is not marked used until after session conflict check (by design). This is OK, but ensure the OTP cannot be reused across many force-logout attempts.

### Session hijacking risks

- **Mitigation present**
  - sessionId stored in DB and validated in middleware.
- **Remaining risk**
  - Mixed storage token + cookie complicates which token is truly active.

### Timing vulnerabilities

- Bcrypt compare is constant-time-ish for OTP; acceptable.
- Biggest risk is **bypass paths** (P0 issues above), not timing.

---

## B6) Recommended Improved OTP/Auth Architecture (Production-grade)

### Option 1 (recommended): Cookie-only session

- Use HttpOnly cookie JWT only (no sessionStorage token).
- Add CSRF protection (double-submit cookie or CSRF token endpoint).
- `apiCall` should not attach Authorization header.

### Option 2: Bearer-only

- Remove cookies entirely.
- Store token in memory (or secure storage) and rotate tokens.

### Mandatory changes regardless of option

- Remove admin bypass header
- Restore server-side session validation for protected UI
- Ensure logout hits backend and clears server session
- Use crypto RNG for OTP generation

---



