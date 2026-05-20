# SMAART — Document 2: Full 404 Error Audit
**Date:** 2026-05-19 | **Scope:** Frontend routes + Backend endpoints | **Status:** COMPLETE

---

## Severity Legend
| Badge | Meaning |
|---|---|
| 🔴 P0 | Launch Blocker — user hits 404 on a primary feature |
| 🟠 High | Major feature broken — user flow dead-ends |
| 🟡 Medium | Edge-case or secondary feature 404 |
| 🟢 Low | Minor / internal navigation issue |
| ✅ OK | Route correctly registered and reachable |

---

## PART A — Frontend 404s (Client-Side Routes)

### A1 — Routes Referenced in Code But NOT Registered in `AnimatedRoutes.jsx`

These are routes that components **navigate to** (via `navigate()`, `<Link>`, or `<a href>`) but have **no `<Route>` entry** in `AnimatedRoutes.jsx`. A user who reaches these will see the `NotFound` page.

| Route Navigated To | Where It's Called From | Severity |
|---|---|---|
| `/dashboard/ai-career-coach` | `AICareerCoach.jsx` — main CTA button | 🔴 P0 — Entire AI Career Coach feature unreachable |
| `/dashboard/ai-career-coach/profile` | `AICareerCoach.jsx` — `handleQuickStart()` | 🔴 P0 — Quick start button 404s |
| `/dashboard/smaart-toolkit/ai-career-chat` | `ProfileAnalysis.jsx` — "Open AI Chat" button | 🔴 P0 — Chat entry point 404s |
| `/assessment/T2` | `AssessmentsDashboard.jsx`, `CoursePlayer.jsx` | 🔴 P0 — Stage 2 assessment unreachable |
| `/assessment/T3` | `AssessmentsDashboard.jsx`, `CoursePlayer.jsx` | 🔴 P0 — Stage 3 assessment unreachable |
| `/assessment/T4` | `AssessmentsDashboard.jsx`, `CoursePlayer.jsx` | 🔴 P0 — Stage 4 assessment unreachable |
| `/dashboard/help` | Sidebar navigation link | 🟠 High — Help page unreachable via sidebar |
| `/dashboard/mind-care` | Sidebar navigation link | 🟠 High — MindCare unreachable via sidebar (registered path differs) |
| `/dashboard/modules/:moduleId/tasks` | `ModuleViewPage.jsx` — task links | 🟡 Medium — Tasks page 404 (page is also non-functional) |
| `/dashboard/quotients` | `AssessmentsDashboard.jsx` — view results link | 🟡 Medium — Registered as `/dashboard/quotients-grid`, not `/dashboard/quotients` |
| `/dashboard/my-assessments` | Various sidebar links | 🟢 Low — Redirects to `/dashboard/assessment-centre`, functionally OK |

---

### A2 — Route Path Mismatches (Registered but Wrong Path Used by Navigator)

These routes ARE registered but callers use the WRONG path, causing 404s.

| Registered Path | Path Actually Used in Code | Issue |
|---|---|---|
| `/dashboard/assessment-centre` | `/dashboard/assessments` | ✅ Redirect exists — OK |
| `/dashboard/mindcare-sessions` | `/dashboard/mind-care` | 🟠 Sidebar likely links to `/dashboard/mind-care` — not registered. Registered path is `/dashboard/mindcare-sessions` |
| `/dashboard/quotients-grid` | `/dashboard/quotients` | 🟡 `QuotientsGrid` uses `<a href='/dashboard/assessments/baseline'>` which redirects to assessment-centre — but the quotients page itself is unreachable at `/dashboard/quotients` |
| `/dashboard/assessments/baseline` | `/dashboard/assessments/baseline` | ✅ Correctly registered |
| `/dashboard/career-data-fetcher` | `/dashboard/career-data` | 🟡 `CareerDataFetcher` registered at `career-data-fetcher` but any sidebar link saying `career-data` will 404 |

---

### A3 — Routes Registered But Inaccessible Due to Guard Behavior

| Route | Guard Issue | Result |
|---|---|---|
| All `/dashboard/*` routes | `AssessmentFlowGuard` — auth check bypassed (client-side only) | 🔴 Not a 404 but an unauthorized access — see Auth Audit |
| `/assessment/:stage/report` | Wrapped in `AssessmentFlowGuard` but guard bypassed | 🔴 Same — bypass issue |
| `/motivational` | Wrapped in `AssessmentFlowGuard` — if guard ever restored, users without valid token will be redirected | 🟡 Future regression risk |

---

### A4 — Legacy / Duplicate Routes (Registered Twice)

| Route A | Route B | Component | Issue |
|---|---|---|---|
| `/my-courses` | `/dashboard/courses` | `MyCourses` | ✅ Intentional alias — OK |
| `/skills-vault` | `/dashboard/skills-vault` | `SkillsVault` | ✅ Intentional alias — OK, but duplicate at line 132 AND 147 (same route registered twice inside the same `Route` block) |
| `/smaart-toolkit` | `/dashboard/smaart-toolkit` | `SMAArtToolkit` | ✅ Intentional alias — OK |
| `/community` | `/dashboard/community` | `Community` | ✅ Intentional alias — OK |

> **Note on `/dashboard/skills-vault` double registration (lines 132 and 147):** React Router will use the first match and silently ignore the second. While it works, it generates a console warning in development and is dead code.

---

### A5 — Public Routes That Are Missing

| Route | Expected Behaviour | Registered? |
|---|---|---|
| `/login` | Shows `Institution` (login page) — this is used as an alias for the login modal | ✅ (line 94) — OK but unusual |
| `/forgot-password` | Typically expected by users | ❌ **Not registered** — user who manually types this gets NotFound |
| `/reset-password/:token` | Password reset landing page | ❌ **Not registered** — reset email links will 404 |

---

## PART B — Backend API 404s

### B1 — Frontend Calls That Have No Matching Backend Route

| Frontend Component | API Call Made | Backend Route Exists? | Result |
|---|---|---|---|
| `MindCareSessions.jsx` | `PATCH /api/mindcare-feedback` | ❌ **No such route anywhere** | 404 on every feedback submit |
| `MindCareSessions.jsx` | `GET /api/coaches` | ✅ `/api/coaches` mounted | OK |
| `GeneralDictionary.jsx` | `GET https://api.dictionaryapi.dev/...` | ✅ External API | API response mismatch — crash, not 404 |
| `Library.jsx` | `GET https://www.googleapis.com/books/...` | ✅ External API | No 404 but key exposed |
| `ResumeBuilder.jsx` | `GET /api/resumes/sync-profile` | ⚠️ Needs verification in `routes/resumes.js` | Possible 404 |
| `CareerDataFetcher.jsx` | `POST /api/career-intelligence/generate` | ✅ Inline mounted in server.js | OK |
| `AssessmentsDashboard.jsx` | `GET /api/baselineresults/...` | ✅ `/api/baselineresults` mounted | OK |
| `SkillsPassport.jsx` | `GET /api/badges/user/:userId` | ✅ `/api/badges` mounted | OK |

---

### B2 — Backend Route Segments That Will 404 on Linux (Casing)

On AWS EC2 (Linux), file path and URL path matching is **case-sensitive**. The following camelCase route prefixes in `server.js` will 404 if the frontend sends lowercase or hyphenated versions:

| Mounted Prefix | Risk Path from Frontend | Impact on Linux |
|---|---|---|
| `/api/courseEnrollments` | `apiCall('/courseenrollments/...')` | 🔴 404 |
| `/api/questionBanks` | `apiCall('/questionbanks/...')` | 🔴 404 |
| `/api/coachSessions` | `apiCall('/coachsessions/...')` | 🔴 404 |
| `/api/visionBoards` | `apiCall('/visionboards/...')` | 🔴 404 (mitigated by `/api/vision-boards` duplicate mount) |

---

### B3 — Dev/Debug Endpoints That Are Live in Production

| Endpoint | Auth? | Risk |
|---|---|---|
| `GET /api/users/_debug/state/:email` | ❌ **None** | Anyone can enumerate user data by email |
| `POST /api/users/_dev/backfill` | ❌ **No `protect` middleware** (only env check in handler) | If NODE_ENV guard fails, mass user record manipulation |

---

## PART C — Current NotFound Page Audit

**File:** `src/pages/NotFound.jsx`

```jsx
// Current implementation
<div className="min-h-screen bg-white flex flex-col ...">
  <img src={error404Gif} ... />
  <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
  <Link to="/">Return Home</Link>
</div>
```

### Issues Found

| Issue | Severity |
|---|---|
| **Light-mode only** — `bg-white`, `text-gray-900` — page breaks in dark mode | 🟠 High |
| **No context** — user has no idea which page they tried to reach or how to get back | 🟡 Medium |
| **Single CTA** — "Return Home" is the only option. No "Go Back", no "Contact Support" | 🟡 Medium |
| **No error code shown** — users and support teams can't identify which URL failed | 🟡 Medium |
| **GIF dependency** — `Error404.gif` is a static asset. If it fails to load, the page renders empty | 🟢 Low |
| **No SEO meta** — page has no `<title>` or meta description update for 404 | 🟢 Low |

### Recommended NotFound Page (Drop-in Replacement)

```jsx
import { Link, useLocation } from "react-router-dom";
import error404Gif from "@/assets/Error404.gif";

const NotFound = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-[#001229] dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
      <img 
        src={error404Gif}
        alt="Page Not Found"
        className="w-auto h-64 object-contain mb-8 opacity-80"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      
      <div className="space-y-4 max-w-md">
        <div className="text-6xl font-black text-[#1a3884]">404</div>
        <h1 className="text-3xl font-bold text-white">Page Not Found</h1>
        <p className="text-gray-400">
          The page <code className="text-teal-400 bg-white/10 px-2 py-0.5 rounded text-sm">
            {location.pathname}
          </code> doesn't exist or has been moved.
        </p>
        
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all"
          >
            ← Go Back
          </button>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-[#1a3884] text-white font-semibold rounded-lg hover:bg-[#132c6b] transition-all hover:scale-105"
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard/help"
            className="px-6 py-3 border border-teal-400/30 text-teal-400 rounded-lg hover:bg-teal-400/10 transition-all"
          >
            Get Help
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
```

---

## PART D — Fix Plan: Missing Frontend Routes

**File to edit:** `src/components/AnimatedRoutes.jsx`

### Step 1 — Add missing imports at the top

```jsx
// Add these imports after line 55 (ResumeBuilder import)
const AICareerCoach = lazy(() => import('@/pages/AICareerCoach/AICareerCoach'));
const ModuleTasks = lazy(() => import('@/pages/ModuleTasks'));
```

### Step 2 — Register missing routes inside `<Route element={<ProtectedDashboardLayout />}>`

```jsx
{/* AI Career Coach — add after line 187 (resume-builder) */}
<Route path="/dashboard/ai-career-coach" element={<AICareerCoach />} />
<Route path="/dashboard/ai-career-coach/profile" element={<ProfileAnalysis />} />
<Route path="/dashboard/ai-career-coach/resume" element={<ResumeBuilder />} />

{/* Fix assessment stage routes — currently only /assessment/:stage is registered */}
{/* T2/T3/T4 are already caught by /assessment/:stage — no new routes needed */}
{/* BUT the assessment-centre links must use /assessment/T2 not /assessment/T2 (verify) */}

{/* Module Tasks */}
<Route path="/dashboard/modules/:moduleId/tasks" element={<ModuleTasks />} />

{/* Fix MindCare path alias */}
<Route path="/dashboard/mind-care" element={<MindCareSessions />} />

{/* Fix Quotients path alias */}
<Route path="/dashboard/quotients" element={<QuotientsGrid />} />

{/* Help page alias */}
<Route path="/dashboard/help" element={<Help />} />
```

### Step 3 — Remove duplicate route registration

```jsx
// Remove line 147 — duplicate of line 132:
// <Route path="/dashboard/skills-vault" element={<SkillsVault />} />
```

---

## PART E — Fix Plan: Assessment Stage Routes

**Current state in `AnimatedRoutes.jsx`:**
```jsx
<Route path="/assessment/:stage" element={<BaseLineTest />} />
```

This DOES catch `/assessment/T2`, `/assessment/T3`, `/assessment/T4` via the `:stage` param.

**The actual problem:** `AssessmentsDashboard.jsx` and `CoursePlayer.jsx` may be navigating to `/assessment/T2` using an `<a href>` (hard reload) instead of `<Link to>`, or the `BaseLineTest` component may not handle stages other than baseline.

**Verify in `BaseLineTest.jsx`:**
```jsx
const { stage } = useParams(); // Should read: 'T1', 'T2', 'T3', 'T4'
// If the component only handles baseline and doesn't branch on 'stage', it will render wrong content
```

---

## CONSOLIDATED 404 FIX CHECKLIST

### Frontend (AnimatedRoutes.jsx)

| # | Fix | File | Priority |
|---|---|---|---|
| 1 | Add `<Route path="/dashboard/ai-career-coach" element={<AICareerCoach />} />` | `AnimatedRoutes.jsx` | 🔴 P0 |
| 2 | Add `<Route path="/dashboard/ai-career-coach/profile" element={<ProfileAnalysis />} />` | `AnimatedRoutes.jsx` | 🔴 P0 |
| 3 | Add `<Route path="/dashboard/smaart-toolkit/ai-career-chat" element={<AICareerCoach />} />` | `AnimatedRoutes.jsx` | 🔴 P0 |
| 4 | Verify `BaseLineTest.jsx` handles `stage=T2/T3/T4` params correctly | `BaseLineTest.jsx` | 🔴 P0 |
| 5 | Add `<Route path="/dashboard/mind-care" element={<MindCareSessions />} />` | `AnimatedRoutes.jsx` | 🟠 High |
| 6 | Add `<Route path="/dashboard/quotients" element={<QuotientsGrid />} />` | `AnimatedRoutes.jsx` | 🟠 High |
| 7 | Remove duplicate `/dashboard/skills-vault` route at line 147 | `AnimatedRoutes.jsx` | 🟡 Medium |
| 8 | Replace `NotFound.jsx` with dark-mode version with Go Back + Help CTAs | `NotFound.jsx` | 🟠 High |

### Backend (server.js / routes)

| # | Fix | File | Priority |
|---|---|---|---|
| 1 | Delete `GET /api/users/_debug/state/:email` | `routes/users.js` | 🔴 P0 |
| 2 | Create `PATCH /api/mindcare-feedback` endpoint | New route or `routes/coachSessions.js` | 🔴 P0 |
| 3 | Move AI Career Coach inline routes into `routes/aiCareerCoach.js` | `server.js` + `routes/aiCareerCoach.js` | 🟠 High |
| 4 | Remove duplicate `/api/visionBoards` mount | `server.js` line 216 | 🟠 High |
| 5 | Fix `/api/moderation` + `/api/moderation/actions` overlap | `server.js` lines 161–162 | 🟡 Medium |
| 6 | Lowercase all camelCase route prefixes for Linux compatibility | `server.js` + all `apiCall()` usages | 🟡 Medium |

---

*Document 2 of 2 — 404 Error Audit. Combined with Document 1 (API Routing Audit) for full picture.*
