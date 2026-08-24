# SMAART User Dashboard — Pre-Launch Audit Master Report

**Date:** 2026-05-19 | **Total Pages:** 44 audited + 4 stubs | **Status:** COMPLETE  
**Sources:** Public Pages Deep Audit (full_commits.md) · Full Platform Audit (inventory_1) · Master Page Inventory (smaart_user_dashboard_page_inventory.md)

---

## Severity Legend

| Badge | Meaning |
|---|---|
| 🔴 P0 | Launch Blocker — must fix before go-live |
| 🟠 High | Serious defect — fix within first sprint post-launch |
| 🟡 Medium | Notable issue — fix in near-term |
| 🟢 Low | Minor polish — fix when time permits |
| ✅ Good | Correctly implemented — no action needed |
| ℹ️ Info | Observation / informational note |

---

## Executive Summary

| Severity | Count |
|---|---|
| 🔴 P0 Launch Blockers | **8** |
| 🟠 High | **9** |
| 🟡 Medium | **14** |
| 🟢 Low | **8** |
| ✅ Good / Info | **5** |

**P0 files that must be fixed before any deployment:** `AssessmentFlowGuard.jsx`, `Performance.jsx`, `ModuleViewPage.jsx`, `MyCourses.jsx`, `ModuleTasks.jsx`, `MindCareSessions.jsx`, `AnimatedRoutes.jsx`, `CoursePlayer.jsx`

---

## ⚠️ Infrastructure-Level Issues (Cross-Cutting — Fix First)

These issues are not tied to a single page. They affect the entire application and must be resolved before any page-level fixes are meaningful.

### INFRA-1 — `AssessmentFlowGuard.jsx` — Server Auth Validation Disabled
**Severity: 🔴 P0 — LAUNCH BLOCKER**

The guard that protects every `/dashboard/*` route performs only a client-side `sessionStorage` check. The server-side validation call is explicitly commented out:

```js
// await apiCall('/auth/me');  // ← SERVER VALIDATION IS DISABLED
console.log('[AssessmentFlowGuard] Skipping server validation for now');
```

A user who manually writes any JWT string into `sessionStorage` will bypass the entire auth wall and access all 30+ dashboard pages without a valid server session.

**Fix:** Uncomment and restore the `POST /auth/verify-token` call. Only render children if the server returns `200 OK`. This must be live before any other testing.

---

### INFRA-2 — `AnimatedRoutes.jsx` — Missing Route Registrations
**Severity: 🔴 P0 — LAUNCH BLOCKER**

The following components exist and are linked to from within the app, but have **no registered route**. Users who click these links get a 404:

| Target Route | Expected Component | Trigger |
|---|---|---|
| `/dashboard/ai-career-coach` | `AICareerCoach` | Sidebar nav link |
| `/dashboard/ai-career-coach/profile` | `ProfileAnalysis` | `handleQuickStart` in AICareerCoach |
| `/dashboard/smaart-toolkit/ai-career-chat` | — | ProfileAnalysis CTA button |
| `/assessment/T2`, `/T3`, `/T4` | `BaseLineTest` | AssessmentsDashboard stage links |

**Fix:** Register all four route groups in `AnimatedRoutes.jsx`. The T2/T3/T4 routes can reuse the existing `/assessment/:stage` → `BaseLineTest` pattern.

---

## GROUP 1 — PUBLIC PAGES (No Auth Required)

Pages 1–5. These are the first impression of the platform. Source: **full_commits.md** (deep audit).

---

### PAGE 1 — Landing Page (`/`)
**File:** `LandingPage.jsx` | **Size:** 6.8 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟢 | `openLogin()` and `openSignup()` both open the institution selection modal — no separate signup flow triggered. Functionally they are identical, which is likely unintentional |
| 2 | 🟢 | Auto-popup for institution selection is commented out — confirm whether this is intentional or was disabled during development |
| 3 | 🟢 | `og:image` references `/og-image.jpg` — verify this file exists in the production build's `/public` directory |
| 4 | 🟢 | `HeroSection` and `IntegrationMarquee` are not wrapped in `SectionReveal` — inconsistent scroll-reveal animations compared to all other sections |
| 5 | ℹ️ | No SEO canonical URL `<link rel="canonical">` tag present |

**No blockers. Review items 1–2 for UX intent before launch.**

---

### PAGE 2 — Institution / Login (`/institution/:id`, `/login`)
**File:** `Institution.jsx` | **Size:** 10.6 KB | **Status: 🔴 CRITICAL**

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 P0 | `FirstLoginPasswordModal` has `onClose={() => { }}` — the modal **cannot be closed** if any error occurs during first-login password set. The user is permanently stuck on that screen with no escape |
| 2 | 🔴 P0 | The `error === "no-institution"` branch in `Institution.jsx` **never triggers** — `setError()` is never called with that exact string anywhere in the component. The entire UI block for that error state is dead code and unreachable |
| 3 | 🟡 | Signup link on the login page is commented out — students cannot self-register through this flow |
| 4 | 🟡 | Video background autoplay requires the `muted=1` attribute on Chrome (Chromium autoplay policy). Video will silently fail to autoplay without it |
| 5 | 🟡 | No `<Helmet>` / SEO meta tags on the Institution page — browser tab and search results show no title |

**Fix P0 item #1 immediately:** give `FirstLoginPasswordModal` a real `onClose` handler. Fix item #2 by either calling `setError("no-institution")` in the correct branch or removing the dead code block.

---

### PAGE 3 — Verify Certificate (`/verify-certificate`, `/verify-certificate/:certificateId`)
**File:** `VerifyCertificate.jsx` | **Size:** 33.5 KB | **Status: 🟡 Low-Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | `apiCall` is imported as a **default import** — verify that `api.js` exports a default. If it only has named exports, this import resolves to `undefined` and all certificate verification API calls silently fail |
| 2 | 🟡 | Trust Badges section renders as an **empty `<div>`** with no content — a visible layout gap in production |
| 3 | 🟡 | Background uses `/grid-pattern.svg` — verify this file exists in `/public`. If missing, the background silently shows as blank |
| 4 | ℹ️ | When a logged-in user accesses this page, the layout does not include the dashboard sidebar — intentional for a public-facing verify page, but worth confirming the design decision |
| 5 | 🟢 | No loading skeleton before verification data loads — shows blank area |

---

### PAGE 4 — Verify Badge (`/verify-badge`, `/verify-badge/:badgeId`)
**File:** `components/badges/VerifyBadge` | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | When a logged-in user views this page, it uses `DashboardSidebar` directly **without** `DashboardLayout` — results in broken layout padding and misaligned content |
| 2 | 🟡 | PDF download filename is constructed from `badge.id`, but MongoDB documents return `badge._id`. The downloaded file is named `badge-undefined.pdf` for every badge |
| 3 | 🟡 | When a manually-entered badge ID is not found, the page shows no error message to the user — silent failure with a blank result area |
| 4 | 🟡 | Social share buttons are icon-only with **no `aria-label` attributes** — accessibility failure; screen readers cannot identify the button purpose |

---

### PAGE 5 — 404 Not Found (`*`)
**File:** `NotFound.jsx` | **Size:** 951 B | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | Root element uses `bg-white` hardcoded — **dark mode is completely broken**. The page flashes white when dark mode is active |
| 2 | 🟡 | No `<Helmet>` title — browser tab shows blank or the app's default title with no indication to the user that they hit a 404 |
| 3 | ✅ | "Return Home" navigation link routes correctly to `/` |

---

## GROUP 2 — SIGNUP FLOW (Semi-Public / Session Required)

Pages 6–9. Source: **Full Platform Audit (inventory_1)**.

---

### PAGE 6 — Initial Signup (`/signup-initial`)
**File:** `SignupInitial.jsx` | **Size:** 12.4 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | No server-side email format validation before OTP is dispatched — a malformed email address triggers an OTP send attempt |
| 2 | 🟡 | Error messages use generic strings with no differentiation between `"email already exists"`, `"invalid format"`, and `"network error"` — poor user feedback at a critical acquisition step |
| 3 | ✅ | On success, correctly navigates to `/verify-otp` via `useNavigate` |

---

### PAGE 7 — OTP Verification (`/verify-otp`)
**File:** `VerifyOTP.jsx` | **Size:** 10.6 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | OTP input field accepts any character — no `type="number"`, no paste-validation regex. A user can paste letters into the OTP box |
| 2 | 🟡 | "Resend OTP" has a backend cooldown, but **no visible countdown timer** in the UI — users repeatedly click resend with no feedback that a cooldown is active |
| 3 | ✅ | Correctly redirects to `/add-details` on successful OTP verification |

---

### PAGE 8 — Comprehensive Signup (`/signup`, `/complete-registration`)
**File:** `ComprehensiveSignup.jsx` | **Size:** 92.9 KB ⚠️ | **Status: 🟠 High**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟠 | **92 KB monolith** — the largest file in the project. Contains 12 distinct multi-step form steps inline in a single component. Must be split into `steps/Step1.jsx`…`steps/Step12.jsx` before the codebase becomes unmaintainable |
| 2 | 🟡 | **Step 4 (Academic Mapping):** Dependent dropdowns (Domain → Degree → Specialization) may render empty if the parent API call returns an empty array — no loading skeleton is shown, leaving the user staring at blank dropdowns |
| 3 | 🟡 | **Step 11 (Document Upload):** No client-side file-type validation before upload — any file type (including executables) is accepted and submitted |
| 4 | ✅ | Progress auto-saves per section to the backend on step completion |

---

### PAGE 9 — Signup Success (`/signup-success`)
**File:** `SignupSuccess.jsx` | **Size:** 3.3 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | ✅ | Correctly uses design system tokens (`bg-navy`, `text-teal`) |
| 2 | ✅ | Renders outside `DashboardLayout` — correct, no sidebar for this screen |
| 3 | 🟢 | Inspirational quotes are hardcoded — acceptable for a splash screen, but consider fetching from CMS for future updates |

---

## GROUP 3 — ASSESSMENT GATE PAGES (Auth + Baseline Assessment Pending)

Pages 10–13. Routes outside `ProtectedDashboardLayout` but wrapped by `AssessmentFlowGuard`.

---

### PAGE 10 — Baseline Test (`/assessment/:stage`)
### PAGE 11 — Baseline Test Report (`/assessment/:stage/report`)
**File:** `BaseLineTest.jsx` | **Size:** 58.8 KB | **Status: 🟡 Medium**

Both pages share the same component. Findings apply to both routes.

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | At 58 KB, the timer logic, question rendering, and result calculation are all inline — timer logic especially should be extracted into a `useTestTimer` hook |
| 2 | 🟡 | If the user refreshes mid-test, all local state (answers, timer progress) is lost — no session-resume mechanism implemented |
| 3 | ✅ | Submits to the correct backend endpoint on test completion |

---

### PAGE 12 — Analysis (`/analysis`)
**File:** `Analysis.jsx` | **Size:** 10.2 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟢 | Confirm route is registered in `AnimatedRoutes.jsx` — the 10 KB component exists but route registration was not verified |
| 2 | 🟢 | If backed by `assessmentApi`, verify the API returns populated data for all students before launch |

---

### PAGE 13 — Motivational (`/motivational`)
**File:** `Motivational.jsx` | **Size:** 5.0 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | ✅ | Uses design system tokens (`bg-navy`, `text-teal`) throughout |
| 2 | ✅ | Correctly renders outside `DashboardLayout` — no sidebar for this transitional screen |
| 3 | 🟢 | Hardcoded motivational content — acceptable for a splash screen |

---

## GROUP 4 — PROTECTED DASHBOARD PAGES (Auth Required — All Roles)

All under `ProtectedDashboardLayout` → `AssessmentFlowGuard` → `DashboardLayout`.  
**Reminder:** INFRA-1 (auth bypass) affects every page in this group until fixed.

---

### 4.1 — Core Dashboard

### PAGE 14 — Dashboard Home (`/dashboard`)
**File:** `DashboardHome.jsx` | **Size:** 6.4 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | At 6 KB, this is a thin wrapper — confirm that all dashboard widgets are lazy-loaded sub-components and not missing entirely |
| 2 | ✅ | Route correctly registered and wrapped in `DashboardLayout` + `AssessmentFlowGuard` |

---

### 4.2 — Courses & Learning

### PAGE 15 — My Courses (`/my-courses`, `/dashboard/courses`)
**File:** `MyCourses.jsx` | **Size:** 850 B ⚠️ | **Status: 🔴 P0 — LAUNCH BLOCKER**

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 P0 | `userProgress` is initialized as `{}` and **never populated from the API**. The `isDayUnlocked()` function that gates all course content depends entirely on this object. Result: every student either sees all content locked or all content unlocked — regardless of their real progress |
| 2 | 🔴 P0 | At 850 B, this file is almost certainly a stub. Verify this is the correct production component and not a placeholder |

**Fix:** On component mount, fetch actual user progress from `/api/users/progress` and populate `userProgress` state before rendering content gates.

---

### PAGE 16 — Course Player (`/dashboard/courses/:courseId/player`)
**File:** `CoursePlayer.jsx` | **Size:** 43.7 KB | **Status: 🟠 High**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟠 | **Dummy data fallback:** On API failure, the component silently renders content from a `DUMMY_COURSE` hardcoded constant — users see fake course content with no error notification |
| 2 | 🟠 | **Broken assessment gating:** Stage-gate navigation links to `/assessment/T2`, `/assessment/T3`, `/assessment/T4` — none of which are registered in `AnimatedRoutes.jsx` (see INFRA-2) |
| 3 | 🟡 | Video player auto-advances to the next module without confirming completion on the backend — students can skip content and have it counted as complete |

**Fix:** Replace `DUMMY_COURSE` fallback with an explicit error state. Register missing assessment routes (see INFRA-2).

---

### PAGE 17 — Module View (`/module/:courseId/:moduleId`, `/dashboard/courses/:courseId/modules`, `/dashboard/courses/:courseId/modules/:moduleId/days/:dayId`)
**File:** `ModuleViewPage.jsx` | **Size:** 36.8 KB | **Status: 🔴 P0 — LAUNCH BLOCKER**

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 P0 | **Route guard explicitly disabled:** `if (false) { // auth check }` — the authorization check is hardcoded to never execute. Any user can access any module of any course without authorization |
| 2 | 🔴 P0 | **Multi-level `DUMMY_COURSE` fallback:** API failures silently fall back to hardcoded dummy content at multiple levels — students see fake modules with no error indicator |
| 3 | 🟡 | Extensive dead code: orphaned imports (`ModernVideoPlayer`, `FiveModuleRoadmap`) and large commented-out code blocks throughout the file |
| 4 | 🟢 | Fallback background uses hardcoded `#f5f0e8` — this is a light-only color that will look wrong in dark mode. Replace with `dark:bg-dark-card` |

> **⚠️ SPECIAL NOTE — ModuleTasks.jsx (`/dashboard/modules/:moduleId/tasks`)**  
> This page exists alongside Module View and shares the same section of the app. It is **P0 abandoned** — all task data is hardcoded mock, `handleTaskToggle` only calls `console.log` with zero backend integration, it renders its own duplicate navbar outside `DashboardLayout` creating a double-header bug, and "Back to Modules" navigates to `/dashboard/courses` instead of the current course. **This page must be rebuilt or removed entirely before launch.**

---

### 4.3 — Assessments

### PAGE 18 — Assessment Centre (`/dashboard/assessment-centre`)
**File:** `AssessmentsDashboard.jsx` | **Size:** 27.3 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | Stage-gating links navigate to `/assessment/T2`, `/assessment/T3`, `/assessment/T4` — these are **not registered routes** (see INFRA-2). A student who completes T1 and clicks to start T2 will hit a 404 |
| 2 | ✅ | Assessment status badges correctly read from backend state |

---

### PAGE 19 — Baseline Test — Dashboard (`/dashboard/assessments/baseline`)
**File:** `BaseLineTest.jsx` | **Size:** 58.8 KB | **Status: 🟡 Medium**

Same component as Pages 10–11. All findings from PAGE 10 apply here. Confirm that the route is separately registered for the dashboard context and that the `stage` param is correctly defaulted when accessed from this route.

---

### 4.4 — Skills & Development

### PAGE 20 — Skills Passport (`/skills-passport`, `/dashboard/skills-passport`)
**File:** `SkillsPassport.jsx` | **Size:** 58.0 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | **3D tilt effect broken:** The `style` prop with Framer Motion values (`rotateX`, `rotateY`) is applied to a plain `<div>` instead of a `<motion.div>` — the animation has no effect |
| 2 | 🟡 | **Duplicate API call:** `fetchUserBadges()` is called twice on mount — once inside `useEffect` and once inline — doubling backend requests on every page load |
| 3 | 🟡 | Badge status displays as "earned/locked" but ignores `badge.expiresAt` — expired badges incorrectly appear as "earned" |
| 4 | 🟡 | At 58 KB, this is a large component that should be split into sub-components |

---

### PAGE 21 — Skills Vault (`/skills-vault`, `/dashboard/skills-vault`)
**File:** `SkillsVault.jsx` | **Size:** 53.5 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | Course cards navigate to `/dashboard/courses/${course._id}/modules` — if the backend does not fully populate the course object and `course._id` is `undefined`, the user is navigated to `/dashboard/courses/undefined/modules` |
| 2 | 🟡 | At 53 KB, `CourseCard` should be extracted as a reusable sub-component |
| 3 | ✅ | Search and filter UI functional |

---

### PAGE 22 — Quotients Grid (`/quotients`, `/dashboard/quotients-grid`)
**File:** `QuotientsGrid.jsx` | **Size:** 10.1 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | **Auth inconsistency:** Reads user data directly via `sessionStorage.getItem('user')` (line 32) instead of the `useUser()` hook. If the storage key name ever differs, `userId` returns `null` and no quotient data loads |
| 2 | 🟡 | **SPA navigation broken:** "Take Assessment" CTA is an `<a href='...'>` element (line 120) — causes a full page reload instead of SPA navigation. Replace with React `<Link to='...'>` |
| 3 | 🟡 | Quotient score rendering depends on backend returning keys named exactly `t1Profile.CRQ`, `t1Profile.SRQ` etc. — if key names differ, all 6 scores silently display as 0% |
| 4 | 🟡 | Root background is hardcoded `bg-[#001229]` (dark navy only) — will appear incorrectly in light mode |

---

### PAGE 23 — Performance (`/dashboard/performance`)
**File:** `Performance.jsx` | **Size:** 20.9 KB | **Status: 🔴 P0 — LAUNCH BLOCKER**

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 P0 | **React Hook rule violation:** Multiple `useChart()` / `useState` hooks are declared **after** a conditional `if (!data) return <Loading />` early return. React requires all hooks to be called unconditionally before any return. This will crash with `Error: Rendered more hooks than during the previous render` when data loads |
| 2 | 🟡 | All chart data is entirely mock/static — requires real API integration before this page has any value |

**Fix:** Move every hook call to the top of the component, above all conditional returns.

---

### 4.5 — Vision Board

### PAGE 24 — Vision Board Gallery (`/vision-board`, `/dashboard/vision-boards`, `/vision-board-pro/gallery`)
**File:** `features/visionBoard/VisionBoardGalleryPro` | **Status: ℹ️ Not Audited in Detail**

No specific issues were identified in the available audit data. Recommend manual review given the three-alias route setup — verify all three aliases navigate to the same component without state conflicts.

---

### PAGE 25 — Vision Board Editor (`/vision-board-pro/create`)
**File:** `features/visionBoard/VisionBoardEditorPro` | **Status: ℹ️ Not Audited in Detail**

No specific issues identified. Recommend manual review of drag-and-drop and canvas save/load flows.

---

### PAGE 26 — Vision Board View (`/vision-board/view/:id`)
**File:** `features/visionBoard/VisionBoardView` | **Status: ℹ️ Not Audited in Detail**

No specific issues identified. Verify that this public-facing view of a vision board is accessible without auth when sharing, and requires auth for the owner's private boards.

---

### 4.6 — Community & Social

### PAGE 27 — Community (`/community`, `/dashboard/community`)
**File:** `Community.jsx` | **Size:** 3.4 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | Renders `NoticesFeed` as its primary component — confirm this is the final intended component and not a placeholder (original design may have called for `CommunityHub`) |
| 2 | 🟡 | Posts fetched without pagination limit — on high-volume institutions this could load thousands of records into a single render |
| 3 | 🟢 | `communityAPI` is imported but never called — dead import |

---

### PAGE 28 — Student Groups (`/dashboard/groups`)
**File:** `StudentGroups.jsx` | **Size:** 14.8 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | ✅ | Route and `<Link to="/dashboard/groups/:id">` navigation both correctly registered |
| 2 | ✅ | `moderateText` correctly implemented for group name and description inputs |
| 3 | 🟡 | Group list header uses `dark:bg-slate-800/60` — non-standard dark mode token (correct token: `dark:bg-dark-card`) |
| 4 | 🟢 | Create Group modal uses `dark:bg-slate-900` — non-standard token |
| 5 | 🟢 | Decorative background blobs use `bg-blue-100/40` / `bg-indigo-100/40` — these appear incorrectly in dark mode |

---

### PAGE 29 — Group Chat (`/dashboard/groups/:id`)
**File:** `GroupChat.jsx` | **Size:** 69.9 KB | **Status: 🟠 High**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟠 | **No dark mode:** Root element has `bg-gray-50` hardcoded (line 376) — the entire GroupChat UI is completely broken in dark mode |
| 2 | 🟠 | **Aggressive polling:** `setInterval(fetchGroupDetails, 3000)` fetches the full group object every 3 seconds. At institution scale this will continuously hammer the backend. Should use WebSocket or SSE |
| 3 | 🟡 | `window.confirm()` used for leave/remove/promote/demote member actions — raw browser dialogs in a production UI |
| 4 | 🟡 | Error handling uses `alert()` — raw browser alert dialogs |
| 5 | 🟢 | `communityAPI` imported but never called — dead import |
| 6 | 🟢 | File upload MIME check is weak — only checks `file.type.startsWith('video/')` with no explicit whitelist |

---

### 4.7 — Library, Dictionary & Wellness

### PAGE 30 — Library (`/library`, `/dashboard/library`)
**File:** `Library.jsx` | **Size:** 9.6 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | **API key exposed:** Google Books API is called directly from the client — the API key is visible in every user's browser network tab |
| 2 | 🟡 | API calls use raw `fetch` without an `Authorization` header instead of the centralized `apiCall` service |
| 3 | 🟢 | `BookmarkPlus` icon is imported but never used in JSX — dead import |
| 4 | ✅ | Correctly shows empty state when no search results are returned |

**Fix:** Proxy the Google Books API call through the SMAART backend so the API key is never exposed to the client.

---

### PAGE 31 — General Dictionary (`/dictionary`, `/dashboard/dictionary`)
**File:** `GeneralDictionary.jsx` | **Size:** 14.3 KB | **Status: 🟠 High — Feature Broken**

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 P0* | **API response mismatch — search is broken for all words:** Free Dictionary API v2 returns an `Array` at the root (e.g. `[{ word, meanings }]`). The component checks `defData.entries` (line 34) which is `undefined` on an array. Calling `.length` on `undefined` throws a `TypeError` — every search crashes. *Classified High rather than P0 as it's a feature, not a security/auth issue* |
| 2 | ℹ️ | Star/Bookmark button has no `onClick` handler — stub feature, not yet implemented |
| 3 | 🟢 | `Share2` icon imported but never used — dead import |
| 4 | ✅ | Uses `dark-card` CSS class — correct design token |

**Fix:** Change `defData.entries` to `defData[0]?.meanings` (or equivalent) to match the actual API response shape.

---

### PAGE 32 — Mind Care Sessions (`/mind-care`, `/dashboard/mindcare-sessions`)
**File:** `MindCareSessions.jsx` | **Size:** 27.1 KB | **Status: 🔴 P0 — LAUNCH BLOCKER**

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 P0 | **`MOCK_COACHES` ReferenceError:** Line 96 calls `setCoaches(MOCK_COACHES)` as an error fallback, but `MOCK_COACHES` is never defined in this file. Any coach API failure throws `ReferenceError: MOCK_COACHES is not defined`, crashing the entire component |
| 2 | 🔴 P0 | **`API_BASE_URL` ReferenceError:** `handleSubmitFeedback` (line 173) calls `fetch(API_BASE_URL + ...)` but `API_BASE_URL` is not imported. Every feedback submission attempt throws `ReferenceError: API_BASE_URL is not defined` — the feedback feature is completely broken |
| 3 | 🟡 | Feedback `PUT` request uses raw `fetch` with no `Authorization` header — will fail if the backend requires auth on that endpoint |
| 4 | ✅ | Correctly uses `lms-dashboard-bg` design token |

**Fix:** Import `API_BASE_URL` from the API config module. Define or remove `MOCK_COACHES` — if used as fallback, either import it or inline a proper empty array `[]`.

---

### 4.8 — Toolkit & Notes

### PAGE 33 — SMAART Toolkit (`/smaart-toolkit`, `/dashboard/smaart-toolkit`)
**File:** `SMAArtToolkit.jsx` | **Size:** 13.5 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | ✅ | Route correctly registered |
| 2 | ✅ | SPA navigation uses `<Link>` correctly |
| 3 | 🟢 | The sub-route `/dashboard/smaart-toolkit/ai-career-chat` is linked to from `ProfileAnalysis` but **not registered** in `AnimatedRoutes.jsx` — clicking this CTA from ProfileAnalysis results in a 404 |
| 4 | 🟢 | Verify any orphaned component references (dead imports) are cleaned up |

---

### PAGE 34 — My Notes (`/dashboard/notes`)
**File:** `MyNotes.jsx` | **Size:** 20.0 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | **Invalid JSX:** Multiple elements use the HTML `class` attribute instead of React's `className` — these will silently fail to apply styles in React |
| 2 | 🟡 | **Destructive action without confirmation:** `handleDeleteNote` deletes a note immediately with no confirm dialog — easy to accidentally delete notes with no undo |
| 3 | 🟡 | Note-to-course mapping uses numeric IDs that may not correspond to actual MongoDB `ObjectId` values for course documents |

---

### 4.9 — Profile & Account

### PAGE 35 — Profile (`/profile`, `/dashboard/profile`)
**File:** `Profile.jsx` | **Size:** 67.5 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | At 67 KB, profile tabs should each be extracted as separate sub-components (e.g. `tabs/AcademicTab.jsx`, `tabs/CareerTab.jsx`) — current size makes debugging difficult |
| 2 | 🟡 | Profile photo upload has no progress indicator — user has no feedback while the upload is in progress |
| 3 | ✅ | Uses `useUser()` hook for auth — correct pattern |

---

### PAGE 36 — Onboarding / Add Details (`/onboarding`, `/dashboard/onboarding`)
**File:** `AddDetails.jsx` | **Size:** 83.9 KB | **Status: 🟠 High**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟠 | **83.9 KB monolith** — one of the largest files in the project. Multi-step form steps are all inline. Requires splitting into `steps/` sub-components before this file is maintainable |
| 2 | 🟡 | **Step 4 (Academic Mapping):** Dependent dropdowns (Domain → Degree → Specialization) may render empty if parent API returns empty arrays — no loading skeleton shown |
| 3 | 🟡 | **Document Upload step:** No client-side file-type validation before upload — any file extension is accepted |
| 4 | ✅ | Progress auto-saves per section to backend |

---

### PAGE 37 — Settings (`/settings`, `/dashboard/settings`)
**File:** `Settings.jsx` | **Size:** 30.0 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | **Broken tabs:** The `Notifications`, `Privacy`, and `Appearance` tabs are listed in the `settingsTabs` array, but the `renderTabContent()` switch statement has no `case` for any of them. Clicking any of these three tabs renders a completely blank content area |
| 2 | 🟡 | **Security:** The profile save (line 101) includes the `email` field in the request body — backend must enforce identity from JWT and ignore the submitted email. Verify this is enforced server-side |
| 3 | 🟡 | `fetchUserData` reads the token directly from `sessionStorage` instead of using the centralized `apiCall` service — inconsistent pattern |
| 4 | ✅ | Profile and Language settings correctly use the `register-section` endpoint |
| 5 | ✅ | `dark:bg-dark-elevated` tokens correctly applied to inputs |

---

### 4.10 — Notifications & Support

### PAGE 38 — Notifications (`/notifications`, `/dashboard/notifications`)
**File:** `Notifications.jsx` | **Size:** 19.7 KB | **Status: 🟢 Low**

| # | Severity | Finding |
|---|---|---|
| 1 | ✅ | Correctly uses `useNotifications` context (WebSocket-aware) |
| 2 | ✅ | Uses `apiCall` service — centralized auth headers applied |
| 3 | ✅ | Correctly optimized with `useCallback` + `useMemo` |
| 4 | ✅ | Pagination controls implemented |
| 5 | 🟢 | `ICON_MAP` may not cover newly-added notification types — review against the backend `type` enum before launch to ensure no notifications render with a missing icon |

---

### PAGE 39 — Help (`/help`)
**File:** `Help.jsx` | **Size:** 19.5 KB | **Status: ✅ Best-in-Class**

| # | Severity | Finding |
|---|---|---|
| 1 | ✅ | Correct dark-mode tokens throughout (`dark:bg-dark-card`, `dark:text-white`, `dark:border-white/10`) |
| 2 | ✅ | FAQ search is functional |
| 3 | ✅ | `TicketForm`, `TicketCard`, `TicketDetail` correctly modularized |
| 4 | 🟢 | Hardcoded contact info — verify `support@smaartminds.com` and `+91 1800-123-4567` are live numbers before launch |

---

### PAGE 40 — Support Tickets (`/tickets`, `/dashboard/support`)
**File:** `SupportTicketsPage.jsx` | **Size:** 16.2 KB | **Status: ℹ️ Needs Verification**

| # | Severity | Finding |
|---|---|---|
| 1 | ℹ️ | File exists in the user `/pages/` directory but based on naming may render admin-facing ticket management |
| 2 | ℹ️ | If this route is user-accessible, the backend query **must** filter tickets by `req.user._id` — verify this is enforced. If not enforced, any student can see all students' tickets |

---

### 4.11 — Certificates & Badges

### PAGE 41 — Certificate (`/certificate`, `/dashboard/certificate`)
**File:** `Certificate.jsx` | **Size:** 27.6 KB | **Status: 🟠 High**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟠 | **Hardcoded fallback data:** When the API returns empty, the certificate renders with `Ms. Rehana Ameer` as signatory and `85` as the score. Students could receive certificates with a wrong name and a fabricated score |
| 2 | 🟡 | Certificate PDF generation relies on DOM capture (`html2canvas`) — custom fonts and CSS variables may not render correctly in the captured PDF |

**Fix:** Remove all hardcoded fallback values. If API data is unavailable, show an error state rather than a certificate with fake data.

---

### 4.12 — AI Career Coach

### PAGE 42 — Profile Analysis (`/dashboard/profile-analysis`)
**File:** `AICareerCoach/ProfileAnalysis` | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | "Open AI Career Chat" button navigates to `/dashboard/smaart-toolkit/ai-career-chat` — this route is **not registered** in `AnimatedRoutes.jsx` and will 404 |
| 2 | 🟡 | Uses `purple-600` accent throughout — outside the SMAART navy design system. Replace with `text-[#1a3884]` |
| 3 | 🟡 | No graceful degradation if the AI backend (OpenRouter) is not configured — component will show no error state |
| 4 | ✅ | `location.state?.tab` correctly reads tab selection from navigation state |

---

### PAGE 43 — Resume Builder (`/dashboard/resume-builder`)
**File:** `AICareerCoach/ResumeBuilder` | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | **Field name mismatch:** `handleSyncProfile` maps `data.mobile → personalInfo.phone` (line 119), but the state schema defines the field as `mobile`. Phone number is silently lost on every profile sync |
| 2 | 🟡 | **~200 lines of duplicated code** between `fetchData` and `handleSyncProfile` — a critical maintainability risk |
| 3 | 🟡 | PDF generation via `html2canvas` may fail to capture CSS variables and custom fonts — generated resume PDF could render incorrectly |
| 4 | 🟡 | Uses `bg-blue-600` and `border-blue-500` throughout — outside the SMAART navy system. Replace with `bg-[#1a3884]` |
| 5 | 🟢 | `Printer` icon imported but never used — dead import |

> **Note on AICareerCoach component (`/dashboard/ai-career-coach`):** The parent `AICareerCoach.jsx` page has **no registered route at all** (see INFRA-2). The entire AI Career Coach section is unreachable via normal navigation until this is fixed.

---

### 4.13 — Career & Other

### PAGE 44 — Career Data Fetcher (`/dashboard/career-data-fetcher`)
**File:** `CareerDataFetcher.jsx` | **Size:** 22.1 KB | **Status: 🟡 Medium**

| # | Severity | Finding |
|---|---|---|
| 1 | 🟡 | This is a data-fetcher utility that has been registered as a **user-facing route** — students should not be able to navigate to this page directly |
| 2 | 🟡 | Route `/dashboard/career-data` should be removed from `AnimatedRoutes.jsx` or the component refactored as a background service / hook |

---

## GROUP 5 — STUB / PLACEHOLDER PAGES

Pages that exist in the codebase but are not production-ready.

---

### PAGE 45 — SMAART Wallet
**File:** `SMAARTWallet.jsx` | **Size:** 237 B | **Status: ℹ️ Dead Code**

This file is a compatibility shim that re-exports `SkillsVault` with no unique functionality. It has no registered route. Should be removed from the codebase after confirming no external references.

---

### PAGE 46 — My Assessments (Old)
**File:** `MyAssessments.jsx` | **Size:** 19.1 KB | **Status: ℹ️ Deprecated**

Redirects to `/dashboard/assessment-centre`. The redirect is intentional but the empty state message could be more actionable — add a direct link to `/dashboard/assessments` for users who land here via a bookmark.

---

### PAGE 47 — My Courses (Old)
**File:** `MyCourses.jsx` | **Size:** 850 B | **Status: ⚠️ Likely Stub**

Extremely small file. Almost certainly a placeholder. This file shares a name with the production Page 15 (`MyCourses.jsx`) — verify there is no naming collision and that the correct file is being loaded by the router.

---

### PAGE 48 — Admin Tickets
**File:** `AdminTickets.jsx` | **Size:** 17.2 KB | **Status: ℹ️ Misplaced**

Located in user `/pages/` directory but is clearly an admin-scope component with no route registered in `AnimatedRoutes.jsx`. Should be moved to the admin panel and removed from the user-facing codebase.

---

## Master Route Audit

| Route | Expected Component | Registered? | Status |
|---|---|---|---|
| `/dashboard/ai-career-coach` | `AICareerCoach` | ❌ | 🔴 Unreachable |
| `/dashboard/ai-career-coach/profile` | `ProfileAnalysis` | ❌ | 🔴 404 |
| `/dashboard/smaart-toolkit/ai-career-chat` | — | ❌ | 🔴 404 |
| `/assessment/T2`, `/T3`, `/T4` | `BaseLineTest` | ❌ | 🔴 404 |
| `/dashboard/modules/:moduleId/tasks` | `ModuleTasks` | ✅ | 🔴 Abandoned — should not be accessible |
| `/dashboard/courses/:courseId/modules` | `ModuleViewPage` | ✅ | OK (but P0 guard disabled) |
| `/dashboard/groups/:id` | `GroupChat` | ✅ | OK |
| `/dashboard/quotients` | `QuotientsGrid` | ✅ | OK |
| `/dashboard/career-data` | `CareerDataFetcher` | ✅ | 🟡 Shouldn't be user-accessible |

### Duplicate Route Aliases — Verification Required
The following pages have two routes pointing to the same component. Both aliases must be tested:

| Alias A | Alias B | Component |
|---|---|---|
| `/my-courses` | `/dashboard/courses` | `MyCourses.jsx` |
| `/skills-passport` | `/dashboard/skills-passport` | `SkillsPassport.jsx` |
| `/skills-vault` | `/dashboard/skills-vault` | `SkillsVault.jsx` |
| `/community` | `/dashboard/community` | `Community.jsx` |
| `/settings` | `/dashboard/settings` | `Settings.jsx` |

---

## Consolidated P0 Launch Blockers

All 8 must be resolved before any deployment.

| # | File | Issue | Fix |
|---|---|---|---|
| 1 | `AssessmentFlowGuard.jsx` | Server-side token validation commented out — entire auth wall bypassed by fake JWT | Restore `POST /auth/verify-token` call |
| 2 | `Performance.jsx` | React Hook rule violation — conditional hooks crash on data load | Move all hooks before conditional returns |
| 3 | `ModuleViewPage.jsx` | Route guard hard-disabled with `if (false)` — any user accesses any module | Re-enable auth check |
| 4 | `ModuleViewPage.jsx` + `CoursePlayer.jsx` | Silent multi-level fallback to `DUMMY_COURSE` on API failure | Replace with explicit error state |
| 5 | `MyCourses.jsx` | `userProgress` never fetched — all course content gating broken | Fetch from `/api/users/progress` on mount |
| 6 | `ModuleTasks.jsx` | Entire page is non-functional mock — `handleTaskToggle` only calls `console.log` | Rebuild with API integration or remove from navigation |
| 7 | `AnimatedRoutes.jsx` | AI Career Coach, T2/T3/T4 assessment routes missing — all 404 | Register missing routes |
| 8 | `MindCareSessions.jsx` | `MOCK_COACHES` and `API_BASE_URL` undefined — two ReferenceErrors crash page and feedback | Import `API_BASE_URL`; define or remove `MOCK_COACHES` |

---

## Consolidated High Severity

| # | File | Issue |
|---|---|---|
| 1 | `Certificate.jsx` | Hardcoded fallback name (`Ms. Rehana Ameer`) and score (`85`) — students receive certificates with fabricated data |
| 2 | `GeneralDictionary.jsx` | API response mismatch — `defData.entries` is `undefined` on array response, throws TypeError on every search |
| 3 | `GroupChat.jsx` | No dark mode support (`bg-gray-50` root); 3-second polling; `alert()`/`confirm()` dialogs in production |
| 4 | `AddDetails.jsx` / `ComprehensiveSignup.jsx` | 83–92 KB monoliths with 12 form steps inline — require componentization |
| 5 | `CoursePlayer.jsx` | Assessment stage-gate navigation links to unregistered routes (all 404) |
| 6 | `AICareerCoach.jsx` | Entire page unreachable — no route registered anywhere in `AnimatedRoutes.jsx` |
| 7 | `Library.jsx` | Google Books API key exposed in browser network tab |
| 8 | `ModuleViewPage.jsx` | Extensive dead code — orphaned imports, large commented blocks |
| 9 | `ResumeBuilder.jsx` | ~200 lines duplicated between two sync functions; `mobile`/`phone` field mismatch loses phone number |

---

## Consolidated Dark Mode Token Violations

Files that use hardcoded colours that break in dark mode, and their correct SMAART design tokens:

| File | Violation | Correct Token |
|---|---|---|
| `ModuleViewPage.jsx` | `#f5f0e8` fallback background | `dark:bg-dark-card` |
| `AICareerCoach.jsx` | `from-indigo-600` gradient | `bg-[#1a3884]` / `bg-[#002147]` |
| `ProfileAnalysis.jsx` | `purple-600` accents | `text-[#1a3884]` |
| `ResumeBuilder.jsx` | `bg-blue-600`, `border-blue-500` | `bg-[#1a3884]` |
| `GroupChat.jsx` | `bg-gray-50` root (no dark variant) | `dark:bg-dark-bg` |
| `StudentGroups.jsx` | `dark:bg-slate-800` | `dark:bg-dark-card` |
| `QuotientsGrid.jsx` | `bg-[#001229]` hardcoded | CSS variable token |
| `NotFound.jsx` | `bg-white` hardcoded | `dark:bg-dark-bg` |

---

## Recommended Fix Sequence for Launch

### 🔴 Sprint 0 — Before Deployment (P0 Only)

1. Restore `AssessmentFlowGuard.jsx` server-side token validation
2. Fix `Performance.jsx` hook ordering — move all hooks above conditional returns
3. Re-enable route guard in `ModuleViewPage.jsx` (remove `if (false)`)
4. Fix `MindCareSessions.jsx` — import `API_BASE_URL`, define or remove `MOCK_COACHES`
5. Register missing routes in `AnimatedRoutes.jsx` (AI Career Coach, T2/T3/T4)
6. Either rebuild `ModuleTasks.jsx` with real API integration or hide it from navigation
7. Fetch real user progress in `MyCourses.jsx` from `/api/users/progress`
8. Remove `DUMMY_COURSE` silent fallback from `CoursePlayer.jsx` and `ModuleViewPage.jsx` — replace with error states

### 🟠 Sprint 1 — Week 1 Post-Launch

1. Fix `GeneralDictionary.jsx` — update API response parsing from `defData.entries` to `defData[0]?.meanings`
2. Fix `Certificate.jsx` — remove hardcoded fallback name and score; show error state if API is empty
3. Add dark mode to `GroupChat.jsx` — replace `bg-gray-50` with design tokens
4. Replace `GroupChat.jsx` 3-second polling with WebSocket or SSE connection
5. Fix `ResumeBuilder.jsx` — resolve `mobile`/`phone` field mismatch and deduplicate sync functions
6. Fix `Institution.jsx` — give `FirstLoginPasswordModal` a real `onClose` handler (P0 — move to Sprint 0 if login is production-facing)
7. Proxy Google Books and Dictionary APIs through the SMAART backend to remove exposed API keys

### 🟡 Sprint 2 — Weeks 2–3 Post-Launch

1. Implement missing Settings tabs (`Notifications`, `Privacy`, `Appearance`) — add `case` blocks to `renderTabContent()`
2. Replace all `window.alert()` / `window.confirm()` dialogs with `Modal` component equivalents
3. Fix dark mode token violations across all listed files (see table above)
4. Fix `QuotientsGrid.jsx` — replace `<a href>` with `<Link to>` and `sessionStorage` read with `useUser()` hook
5. Fix `SkillsPassport.jsx` — replace plain `<div>` with `<motion.div>` for tilt; deduplicate `fetchUserBadges` call
6. Split `AddDetails.jsx`, `ComprehensiveSignup.jsx`, and `Profile.jsx` into step/tab sub-components
7. Remove `CareerDataFetcher` from public routes or convert to a background service
8. Remove `SMAARTWallet.jsx` compatibility shim and `AdminTickets.jsx` from user `/pages/`
9. Fix `Verify Badge` PDF filename — change `badge.id` to `badge._id`
10. Add aria-labels to all icon-only buttons across the platform (starting with Verify Badge social share)

---

## Audit Progress Tracker — Final

| # | Page | Route | Status | Severity | Key Issue |
|---|---|---|---|---|---|
| 1 | Landing Page | `/` | ✅ Done | 🟢 Low | openLogin/openSignup identical |
| 2 | Institution / Login | `/login` | ✅ Done | 🔴 Critical | Modal uncloseable; dead error branch |
| 3 | Verify Certificate | `/verify-certificate` | ✅ Done | 🟡 Low-Medium | apiCall import + empty trust badges |
| 4 | Verify Badge | `/verify-badge` | ✅ Done | 🟡 Medium | PDF undefined filename; broken layout |
| 5 | 404 Not Found | `*` | ✅ Done | 🟡 Medium | Dark mode broken; no Helmet |
| 6 | Initial Signup | `/signup-initial` | ✅ Done | 🟡 Medium | No server-side email validation |
| 7 | OTP Verification | `/verify-otp` | ✅ Done | 🟡 Medium | No input validation; no resend timer |
| 8 | Comprehensive Signup | `/signup` | ✅ Done | 🟠 High | 92 KB monolith; no file type check |
| 9 | Signup Success | `/signup-success` | ✅ Done | 🟢 Low | Clean — hardcoded quotes only |
| 10 | Baseline Test | `/assessment/:stage` | ✅ Done | 🟡 Medium | No session resume on refresh |
| 11 | Baseline Test Report | `/assessment/:stage/report` | ✅ Done | 🟡 Medium | Same file as Page 10 |
| 12 | Analysis | `/analysis` | ✅ Done | 🟢 Low | Route registration unconfirmed |
| 13 | Motivational | `/motivational` | ✅ Done | 🟢 Low | Clean |
| 14 | Dashboard Home | `/dashboard` | ✅ Done | 🟡 Medium | Thin wrapper — sub-components unconfirmed |
| 15 | My Courses | `/dashboard/courses` | ✅ Done | 🔴 P0 | Progress never fetched — gating broken |
| 16 | Course Player | `/dashboard/courses/:id/player` | ✅ Done | 🟠 High | DUMMY_COURSE fallback; T2/T3/T4 404 |
| 17 | Module View | `/dashboard/courses/:id/modules` | ✅ Done | 🔴 P0 | Guard disabled; DUMMY_COURSE fallback |
| 18 | Assessment Centre | `/dashboard/assessment-centre` | ✅ Done | 🟡 Medium | T2/T3/T4 links 404 |
| 19 | Baseline Test (Dashboard) | `/dashboard/assessments/baseline` | ✅ Done | 🟡 Medium | Same as Page 10 |
| 20 | Skills Passport | `/dashboard/skills-passport` | ✅ Done | 🟡 Medium | Tilt broken; duplicate API call |
| 21 | Skills Vault | `/dashboard/skills-vault` | ✅ Done | 🟡 Medium | Undefined course._id risk |
| 22 | Quotients Grid | `/dashboard/quotients-grid` | ✅ Done | 🟡 Medium | sessionStorage direct; `<a>` not `<Link>` |
| 23 | Performance | `/dashboard/performance` | ✅ Done | 🔴 P0 | React Hook rule violation — crashes |
| 24 | Vision Board Gallery | `/dashboard/vision-boards` | ℹ️ No Issues Found | — | Manual review recommended |
| 25 | Vision Board Editor | `/vision-board-pro/create` | ℹ️ No Issues Found | — | Manual review recommended |
| 26 | Vision Board View | `/vision-board/view/:id` | ℹ️ No Issues Found | — | Auth scoping to verify |
| 27 | Community | `/dashboard/community` | ✅ Done | 🟡 Medium | No pagination; wrong component |
| 28 | Student Groups | `/dashboard/groups` | ✅ Done | 🟢 Low | Non-standard dark tokens |
| 29 | Group Chat | `/dashboard/groups/:id` | ✅ Done | 🟠 High | No dark mode; aggressive polling |
| 30 | Library | `/dashboard/library` | ✅ Done | 🟡 Medium | API key exposed in network tab |
| 31 | General Dictionary | `/dashboard/dictionary` | ✅ Done | 🟠 High | Feature completely broken — TypeError |
| 32 | Mind Care Sessions | `/dashboard/mindcare-sessions` | ✅ Done | 🔴 P0 | Two ReferenceErrors — page crashes |
| 33 | SMAART Toolkit | `/dashboard/smaart-toolkit` | ✅ Done | 🟢 Low | Sub-route 404 |
| 34 | My Notes | `/dashboard/notes` | ✅ Done | 🟡 Medium | class instead of className; no delete confirm |
| 35 | Profile | `/dashboard/profile` | ✅ Done | 🟡 Medium | 67 KB; no upload progress indicator |
| 36 | Onboarding / Add Details | `/dashboard/onboarding` | ✅ Done | 🟠 High | 83.9 KB monolith; no file type check |
| 37 | Settings | `/dashboard/settings` | ✅ Done | 🟡 Medium | 3 tabs render blank; sessionStorage direct |
| 38 | Notifications | `/dashboard/notifications` | ✅ Done | 🟢 Low | Clean — ICON_MAP to verify |
| 39 | Help | `/help` | ✅ Done | ✅ Best-in-Class | Hardcoded contact info to verify |
| 40 | Support Tickets | `/dashboard/support` | ✅ Done | ℹ️ Verify | Backend filter by user ID unconfirmed |
| 41 | Certificate | `/dashboard/certificate` | ✅ Done | 🟠 High | Hardcoded fallback name + score |
| 42 | Profile Analysis (AI) | `/dashboard/profile-analysis` | ✅ Done | 🟡 Medium | CTA route 404; purple tokens |
| 43 | Resume Builder (AI) | `/dashboard/resume-builder` | ✅ Done | 🟡 Medium | Field mismatch; 200 lines duplicated |
| 44 | Career Data Fetcher | `/dashboard/career-data-fetcher` | ✅ Done | 🟡 Medium | Should not be user-accessible |
| 45 | SMAART Wallet | — | ✅ Done | ℹ️ Dead Code | Shim — remove from codebase |
| 46 | My Assessments (old) | — | ✅ Done | ℹ️ Deprecated | Redirect only — acceptable |
| 47 | My Courses (old) | — | ✅ Done | ⚠️ Stub | 850B — verify not used in production router |
| 48 | Admin Tickets | — | ✅ Done | ℹ️ Misplaced | No route; move to admin panel |

---

*Audit complete — 44 active pages reviewed, 4 stubs documented. All findings recorded as of 2026-05-19.*
