# 🔍 SMAART Minds Institute — Full Platform Audit Report

> **Date:** February 7, 2026  
> **Branch:** `Basha`  
> **Scope:** Complete frontend + backend codebase review  
> **Auditor:** Basha  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [UI/UX — Strengths](#uiux--strengths)
3. [UI/UX — Issues Found](#uiux--issues-found)
4. [Functionality & Logic — Strengths](#functionality--logic--strengths)
5. [Functionality & Logic — Issues Found](#functionality--logic--issues-found)
6. [Priority Action Items](#priority-action-items)

---

## Executive Summary

A comprehensive audit was performed across **37 frontend files** and **33 backend files** covering all pages, components, routes, models, middleware, and services.

| Category | Strengths | Issues |
|:---------|:---------:|:------:|
| UI/UX | 15 | 20 |
| Functionality & Logic | 17 | 30 |
| **Total** | **32** | **50** |

### Severity Breakdown

```
██████████░░░░░░░░░░  CRITICAL   — 7 issues
████████████░░░░░░░░  HIGH       — 14 issues
██████████████████░░  MEDIUM     — 19 issues
████████████████████  LOW        — 10 issues
```

---

## UI/UX — Strengths

> ✅ Things the platform does well in terms of user experience

| # | Strength | Details |
|:-:|:---------|:--------|
| 1 | **Skeleton Loading States** | Dashboard uses dedicated skeletons (`CourseCardSkeleton`, `StatsCardSkeleton`, `SkillsPassportSkeleton`, `ProfileSkeleton`) instead of generic spinners — smoother perceived performance |
| 2 | **Smooth Page Transitions** | Consistent `framer-motion` + `AnimatePresence` animations across all page routes |
| 3 | **Dark Mode Support** | Most components include `dark:` Tailwind variants for theming |
| 4 | **Empty State Handling** | Proper empty states with CTAs — "No Courses Yet", "No discussions", "All caught up!" |
| 5 | **SEO Metadata** | Landing page uses `react-helmet-async` with Open Graph tags, title, and description |
| 6 | **Code Splitting** | All pages use `React.lazy()` with a branded fallback loader — reduces initial bundle size |
| 7 | **Mobile Sidebar UX** | Body scroll lock, backdrop overlay, and spring animation on mobile drawer |
| 8 | **Accessible Login Form** | Includes `aria-label`, `aria-required`, `autoComplete`, and screen reader live regions |
| 9 | **Notification Grouping** | Groups notifications by "Today", "Yesterday", and specific dates — clear visual hierarchy |
| 10 | **Debounced Search** | Community search input debounces 500ms before fetching results |
| 11 | **Profile Dropdown Hover** | 300ms hover timeout prevents accidental flicker |
| 12 | **Responsive Grid Layouts** | Consistent `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` breakpoint patterns |
| 13 | **Cookie Consent Banner** | Non-intrusive animated slide-in, respects user choice via `localStorage` |
| 14 | **Error Boundary** | Catches React rendering crashes and shows a user-friendly recovery screen |
| 15 | **Signup Step Navigation** | Visual progress dots, step-by-step validation, and skip option for optional fields |

---

## UI/UX — Issues Found

> ❌ Problems affecting user experience, visual consistency, or accessibility

### 🔴 CRITICAL

| # | Issue | File | Details |
|:-:|:------|:-----|:--------|
| 1 | **Settings page is entirely non-functional** | `Settings.jsx` | All form inputs have no `value`/`onChange` binding, no `onSubmit`, no API call. "Save Changes" and "Cancel" buttons are dead — the page is purely visual |
| 2 | **DashboardHeader renders nothing** | `DashboardHeader.jsx` | Returns `<></>` (empty fragment). Every dashboard page imports it, but it contributes zero UI |

### 🟠 HIGH

| # | Issue | File | Details |
|:-:|:------|:-----|:--------|
| 3 | **DEV "Retest" button visible in production** | `DashboardHome.jsx` ~L600 | Calls hardcoded `localhost:5000` to DELETE baseline results. No environment check — visible to all users |
| 4 | **"Seed Sample Data" button in production** | `Community.jsx` ~L804 | Community empty state shows a button to insert fake data into the database. No env gate |
| 5 | **"Generate Test Notification" button in production** | `DashboardSidebar.jsx` ~L317 | Notification empty state shows a dev test button to all users |
| 6 | **Dashboard.jsx has hardcoded stats** | `Dashboard.jsx` ~L60 | Displays fabricated numbers — "My Assessments: 12", "Courses in Progress: 5", "Skills: 28" — never fetched from API |

### 🟡 MEDIUM

| # | Issue | File | Details |
|:-:|:------|:-----|:--------|
| 7 | **Hardcoded "day streak: 12"** | `DashboardHome.jsx` ~L57 | Shows `12` with a `// TODO` comment — never reflects real user activity |
| 8 | **Hardcoded "2h 30m left"** | `DashboardHome.jsx` ~L546 | Course card shows a static time estimate with no calculation |
| 9 | **Hardcoded "+2 this month", "+5 this week"** | `DashboardHome.jsx` ~L459 | Fabricated trend statistics presented as real data |
| 10 | **Hardcoded teacher feedbacks** | `DashboardHome.jsx` ~L397 | Two static entries from "Dr. John Smith" and "Dr. MacAllister" — never from API |
| 11 | **CookieConsent "Preferences" does nothing** | `CookieConsent.jsx` ~L31 | "Preferences" button runs the same function as "Accept All" |
| 12 | **Certificate: no eligibility check** | `Certificate.jsx` ~L95 | Any user can generate any certificate type. Skills scores hardcoded to `85` |
| 13 | **SkillsPassport "Download" is dead** | `SkillsPassport.jsx` ~L193 | Download button has no `onClick` handler |
| 14 | **SkillsPassport broken assessment link** | `SkillsPassport.jsx` ~L176 | Links to `/assessment/baseline` but the route is `/assessments/baseline` (plural) |
| 15 | **Settings & Help dark-mode only** | `Settings.jsx`, `Help.jsx` | Hardcoded `bg-[#001229]` with no light-mode variant — inconsistent with other pages |

### 🔵 LOW

| # | Issue | File | Details |
|:-:|:------|:-----|:--------|
| 16 | **`alert()` instead of toast** | `Community.jsx` ~L154 | Uses browser `alert()` while rest of app uses `sonner` toast library |
| 17 | **Duplicate route definitions** | `AnimatedRoutes.jsx` ~L80 | `/my-courses` and `/dashboard/courses` both map to `MyCourses` — pick one |
| 18 | **Hardcoded "$9.99/month"** | `DashboardHome.jsx` ~L838 | Premium upgrade card with static pricing |
| 19 | **Fake task questions as fallback** | `ModuleViewPage.jsx` ~L79 | Generates fabricated MCQs from keywords when backend has no tasks |
| 20 | **Notification dot at zero count** | `DashboardSidebar.jsx` ~L242 | Red dot appears even when unread count is `0` |

---

## Functionality & Logic — Strengths

> ✅ Strong backend patterns, security measures, and architecture decisions

| # | Strength | Details |
|:-:|:---------|:--------|
| 1 | **Optimistic UI with Rollback** | Task toggle, community likes, bookmarks update locally first, revert on API failure |
| 2 | **Multi-Model Auth Flow** | Login handles Student → Teacher → User → Registration with branching logic for OTP, forced password change, and direct login |
| 3 | **Single-Session Enforcement** | JWT `sessionId` validated against DB on every request. Stale sessions (>24h) auto-cleared |
| 4 | **Strong Password Policy** | 8+ chars, uppercase, lowercase, digit, special char — enforced on register, reset, and first-login-change |
| 5 | **Account Lockout** | 5 failed OTP attempts → 15-minute lock |
| 6 | **Password-Change Token Invalidation** | Auth middleware rejects JWTs issued before the last password change timestamp |
| 7 | **Atomic ID Generation** | User/Student IDs use `Counter.findByIdAndUpdate` with `$inc` — no duplicate IDs |
| 8 | **Content Moderation** | Community posts pass through `textModeration.moderateText()` before saving |
| 9 | **Route Guard** | All dashboard routes wrapped in `AssessmentFlowGuard` ensuring baseline assessment completion |
| 10 | **Course Progression Lock** | ModuleViewPage blocks access to locked days with toast feedback |
| 11 | **Parallel API Fetching** | Community stats/groups/contributors use `Promise.all()` for concurrent requests |
| 12 | **Error Middleware** | Differentiates dev vs prod responses — hides stack traces in production |
| 13 | **Notification Polling** | Sidebar polls unread count every 30s with proper `clearInterval` cleanup |
| 14 | **Token Renewal** | Auto-renews JWT when within 1h of expiry (5-min interval + tab visibility change trigger) |
| 15 | **Ticket System Auth** | Uses `express-validator`, `authorize('admin')`, pagination, and aggregation stats |
| 16 | **Startup Validation** | Server checks for `MONGODB_URI` and `JWT_SECRET` before binding port |
| 17 | **Database Indexes** | User, Student, Course models have proper compound and text indexes for query performance |

---

## Functionality & Logic — Issues Found

> ❌ Security vulnerabilities, logic bugs, and architectural problems

### 🔴 CRITICAL — Immediate Attention Required

| # | Issue | File | Impact |
|:-:|:------|:-----|:-------|
| 1 | **Student routes fully public** | `students.js` | No `protect` middleware at all. Anyone on the internet can list, create, modify, or delete any student record |
| 2 | **Duplicate login bypasses security** | `users.js` ~L305 | `POST /api/users/login` has no rate limiter and no OTP flow. Attackers can brute-force passwords through this endpoint while `/auth/login` is properly protected |
| 3 | **Community trusts `authorId` from request body** | `community.js` ~L267 | Allows user impersonation for creating posts, likes, bookmarks, reports, replies, polls, and reactions. Should use `req.user._id` from the auth token |
| 4 | **`register-details` exposes full user data** | `users.js` ~L392 | `GET /api/users/register-details/:email` requires no authentication. Returns badges, gender, address, DOB, phone, institution — for any email |
| 5 | **Debug endpoint in production** | `users.js` ~L283 | `GET /users/_debug/state/:email` returns password hash prefix and session data. No env check or auth |

### 🟠 HIGH — Should Be Fixed Soon

| # | Issue | File | Impact |
|:-:|:------|:-----|:-------|
| 6 | **No admin check on Course CRUD** | `courses.js` ~L131 | Any authenticated user can create, update, or delete courses |
| 7 | **No admin check on Assessment CRUD** | `assessments.js` ~L197 | Any authenticated user can create, update, or delete assessments |
| 8 | **No admin check on Badge CRUD** | `badges.js` ~L248 | Any authenticated user can create or modify badge definitions |
| 9 | **Certificate revocation unprotected** | `certificates.js` ~L220 | Any logged-in user can revoke any certificate |
| 10 | **No ownership check on enrollments** | `courseEnrollments.js` ~L101 | Any user can modify or delete any other user's enrollment |
| 11 | **Community seed data route unguarded** | `community.js` ~L1000 | `POST /community/seed` has no env check or auth — can insert fake data in production |
| 12 | **`ErrorBoundary` uses wrong env variable** | `ErrorBoundary.jsx` ~L39 | Uses `process.env.NODE_ENV` but Vite uses `import.meta.env.MODE` — dev error details never show |
| 13 | **Hardcoded `localhost:5000` in production code** | `DashboardHome.jsx` ~L607 | "Retest" button makes a `fetch` call to `localhost:5000` — fails in all deployed environments |
| 14 | **Missing `AbortController` on data fetches** | Multiple files | `DashboardHome`, `ModuleViewPage`, `Community` have long `useEffect` fetches with no cancellation — risks state updates on unmounted components |
| 15 | **Inconsistent storage strategy** | Multiple files | Community reads `localStorage`, Dashboard uses `sessionStorage`, SkillsPassport uses `localStorage`. Out-of-sync state causes pages to lose user context |

### 🟡 MEDIUM — Plan to Address

| # | Issue | File | Impact |
|:-:|:------|:-----|:-------|
| 16 | **T1 baseline results saved twice** | `results.js` ~L505 | Submit handler creates duplicate `BaseLineResult` entries |
| 17 | **Wrong `totalQuestions` in T1 response** | `results.js` ~L227 | Returns full question bank size (~300) instead of selected count (36) |
| 18 | **Course completion notification fires too often** | `courseEnrollments.js` ~L351 | Triggers on every video progress update, not just actual completion |
| 19 | **Mass-assignment vulnerability** | Multiple files | `Course.create(req.body)`, `Student.create(req.body)` pass raw request body without field whitelisting — attacker can set admin flags or internal fields |
| 20 | **Unsanitized regex from user input** | `courses.js`, `students.js` | Search parameters passed directly to `$regex` without escaping — ReDoS (Regular Expression Denial of Service) risk |
| 21 | **JWT stored in OTP database record** | `auth.js` ~L721 | If OTP collection is compromised, attackers gain valid authentication tokens |
| 22 | **Resend-login-OTP has no rate limiter** | `auth.js` ~L948 | Users can spam OTP resend requests with no throttling |
| 23 | **50MB JSON payload limit** | `server.js` ~L84 | Extremely large limit for JSON body parsing. Should be 1–5MB with separate higher limits for file upload routes |
| 24 | **Inconsistent error response formats** | Multiple files | Auth returns `{ error }`, courses return `{ success, error }`, notifications return `{ success, message }` |
| 25 | **Hardcoded assessment code** | `results.js` | `'ASM00001'` appears in 5+ places — should be a config constant |

### 🔵 LOW — Nice to Fix

| # | Issue | File | Impact |
|:-:|:------|:-----|:-------|
| 26 | **No pagination on list endpoints** | `students.js`, `assessments.js`, `courseEnrollments.js` | Only `limit` with no offset/page — large datasets returned in full |
| 27 | **N+4 author resolution per post** | `community.js` ~L19 | `hydrateAuthors()` queries User → Student → Teacher → Registration for every post |
| 28 | **6 sequential DB queries on login** | `auth.js` ~L320 | Student → Teacher → User → Registration → College lookups done one at a time |
| 29 | **Full documents returned by default** | `courses.js` ~L46 | No field projection on course queries — a single course with all modules can be megabytes |
| 30 | **Uncached aggregation queries** | `community.js` ~L83, ~L866 | Community stats and top contributors run expensive aggregations on every request |

---

## Priority Action Items

> 🎯 Recommended fix order based on severity and impact

### Tier 1 — Fix Immediately (Security)

| # | Action | Files |
|:-:|:-------|:------|
| 1 | Add `protect` middleware to all student routes | `students.js` |
| 2 | Remove or protect the duplicate login endpoint in `users.js` | `users.js` |
| 3 | Replace `req.body.authorId` with `req.user._id` in community routes | `community.js` |
| 4 | Add authentication to `register-details` endpoint | `users.js` |
| 5 | Remove or env-gate the debug endpoint | `users.js` |
| 6 | Add `authorize('admin')` to Course, Assessment, Badge, Certificate CRUD | `courses.js`, `assessments.js`, `badges.js`, `certificates.js` |

### Tier 2 — Fix This Sprint (Functionality)

| # | Action | Files |
|:-:|:-------|:------|
| 7 | Gate all dev-only buttons behind `import.meta.env.DEV` | `DashboardHome.jsx`, `Community.jsx`, `DashboardSidebar.jsx` |
| 8 | Make Settings page functional (state binding + API) | `Settings.jsx` |
| 9 | Fix `ErrorBoundary` to use `import.meta.env.MODE` | `ErrorBoundary.jsx` |
| 10 | Unify storage strategy (`sessionStorage` as primary + `localStorage` backup) | Multiple frontend files |

### Tier 3 — Fix Next Sprint (Quality)

| # | Action | Files |
|:-:|:-------|:------|
| 11 | Replace all hardcoded dashboard stats with real API calls | `DashboardHome.jsx`, `Dashboard.jsx` |
| 12 | Add `AbortController` to all `useEffect` data fetches | Multiple frontend files |
| 13 | Standardize error response format across all backend routes | All backend route files |
| 14 | Add pagination to student, assessment, and enrollment list endpoints | `students.js`, `assessments.js`, `courseEnrollments.js` |
| 15 | Add field whitelisting to all `Model.create(req.body)` calls | Multiple backend files |

---

<div align="center">

*Generated on February 7, 2026 — SMAART Minds Institute Platform Audit*

</div>
