# SMAART Minds Institute — Work Log

**Date:** February 7, 2026  
**Branch:** `Basha`  
**Developer:** Basha

---

## Project Overview

**SMAART Minds Institute — User Dashboard** is a full-stack educational platform built with:

- **Backend:** Node.js + Express, MongoDB (Mongoose)
- **Frontend:** React (Vite), Tailwind CSS, Shadcn UI, Framer Motion
- **Auth:** JWT (24h expiry) with session binding, OTP-based 2FA via email, bcrypt password hashing, single-session enforcement, HttpOnly cookies

The platform provides students with account registration & login, baseline & T1 assessments, course enrollment with video lessons, a badge/achievement system, coaching sessions, community groups, vision boards, certificates, and support tickets.

---

## Work Completed — February 7, 2026

### 1. Login & Authentication — Full Security Audit

A comprehensive security audit was performed on the entire login flow in `back-end/routes/auth.js` (~1420 lines). The login system searches across 4 MongoDB collections (**Student → Teacher → User → Registration**), then validates in this order: **status → account lock → password → OTP → session → JWT**.

#### 15 Security Findings & Fixes

| #  | Severity | Finding | Fix Applied |
|----|----------|---------|-------------|
| 1  | CRITICAL | No account status check — suspended/inactive users could still log in | Added status check (`inactive`, `suspended`, `deactivated`) before password verification |
| 2  | CRITICAL | First-login password change accepted empty/missing passwords | Added `!newPassword` check returning 400 error |
| 3  | LOW      | OTP values logged to console in plaintext | **Not fixed** (kept for debugging per team decision) |
| 4  | HIGH     | Auth token only stored in `sessionStorage` — lost when browser tab closes | Implemented dual storage (`sessionStorage` + `localStorage`) with fallback read |
| 5  | HIGH     | Dev bypass in `AssessmentFlowGuard` skipped all auth checks in development mode | Gated behind explicit `VITE_ENABLE_DEV_BYPASS=true` env variable |
| 6  | HIGH     | Signup OTP was simulated with `setTimeout` — no real verification | Built 3 new backend endpoints (`send-signup-otp`, `verify-signup-otp`, `resend-signup-otp`) with temp token binding + full frontend integration |
| 7  | MEDIUM   | `sameSite` cookie attribute set inconsistently across endpoints | Standardized to `sameSite: 'None'` on all cookie operations |
| 8  | MEDIUM   | No password policy enforcement on register or password reset | Added validation: 8+ chars, uppercase, lowercase, number, special character + visual requirement indicators in `ForgotPasswordModal` |
| 9  | MEDIUM   | `AssessmentFlowGuard` only checked `sessionStorage`, no server-side token validation | Added server-side JWT validation call |
| 10 | MEDIUM   | No token renewal — JWT silently expired after 24 hours | Added `POST /auth/renew-token` endpoint + client-side auto-renewal (5-minute interval + tab visibility change trigger) |
| 11 | MEDIUM   | `/complete-registration` page accessible without going through signup flow | Added redirect to `/` if no `signupEmail` and no logged-in user in storage |
| 12 | MEDIUM   | Account lock was checked after `bcrypt.compare` — wasted compute on locked accounts | Moved lock check before password comparison |
| 13 | LOW      | Duplicate `sessionStorage.setItem` calls in `LoginCard.jsx` | Removed duplicates |
| 14 | LOW      | Port probing logic (5000–5010) ran in production builds | Gated to development mode only |
| 15 | LOW      | No input validation on `/register` endpoint | Added `express-validator` rules for email format, password, and fullName |
| 16 | LOW      | Logout didn't clear `currentSessionId` in database | Added DB update to clear session on logout |

#### Files Modified for Auth Fixes

| File | Changes |
|------|---------|
| `back-end/routes/auth.js` | Fixes #1, #2, #6, #7, #8, #10, #12, #15, #16 |
| `back-end/middleware/auth.js` | Moved `protect` import to top (was causing `ReferenceError`) |
| `front-end/src/components/LoginCard.jsx` | Fixes #4, #13 |
| `front-end/src/components/AssessmentFlowGuard.jsx` | Fixes #5, #9 |
| `front-end/src/services/api.js` | Fixes #4, #10, #14 |
| `front-end/src/components/auth/ForgotPasswordModal.jsx` | Fix #8 (password policy UI) |
| `front-end/src/pages/SignupInitial.jsx` | Fix #6 (real OTP send) |
| `front-end/src/pages/VerifyOTP.jsx` | Fix #6 (real OTP verify + resend) |
| `front-end/src/pages/ComprehensiveSignup.jsx` | Fix #11 |
| `front-end/src/contexts/UserContext.jsx` | Fix #4 (dual storage sync) |
| `front-end/src/hooks/useAuth.js` | Fix #4 (localStorage fallback read) |

---

### 2. Login — Production Bug Fixes

Three production-breaking bugs were identified and resolved:

#### Bug 1: Server Crash on Startup

- **Error:** `ReferenceError: Cannot access 'protect' before initialization`
- **Root Cause:** `const { protect } = require('../middleware/auth')` was at line ~1405 in `auth.js`, but `protect` was used in routes defined above it
- **Fix:** Moved the import to the top of the file (line 14) with other `require` statements

#### Bug 2: "Already Logged In on Another Device" False Positive

- **Symptom:** Every login attempt showed "You are already logged in on another device" even when no other session existed
- **Root Cause:** `currentSessionId` was never cleared when the browser is closed without logging out. On next login, the stale session ID in the database triggered the single-session check
- **Fix:** Added a 24-hour staleness check — if `lastLogin` is older than the JWT expiry period (24h), the stale `currentSessionId` is automatically cleared instead of blocking login
- **One-Time Cleanup:** Ran a database script to clear all stale `currentSessionId` values (24 students, 20 users affected)

#### Bug 3: Missing `sessionId` in JWT Payloads

- **Symptom:** After token renewal or first-login password change, subsequent API calls failed session validation
- **Root Cause:** Three JWT-issuing endpoints didn't include `sessionId` in the token payload:
  1. `POST /auth/renew-token`
  2. `POST /auth/first-login-change-password` (already-registered user path)
  3. `POST /auth/first-login-change-password` (normal path)
- **Fix:** Added `sessionId` to all three `jwt.sign()` calls

---

### 3. Profile Page — Removed Hardcoded Values

The `/profile` page had multiple hardcoded/static values that didn't reflect actual database data:

| Hardcoded Value | Location | Fix |
|----------------|----------|-----|
| Year of Study = `"3rd Year"` | `Profile.jsx` line 80 (default state) | Changed default to `""`, displays "Not set" when no DB value exists |
| Member Since = `"2024"` | `Profile.jsx` line 44 (default state) | Now derived from `user.createdAt` formatted as "Month Year", falls back to "Not available" |
| `"NEW"` badge always visible | `Profile.jsx` line 178 | Only shown when account is less than 30 days old (`isNewUser` state) |
| Status = `"Available"` | `Profile.jsx` line 219 | Now reads `user.status` from database, falls back to "Active" |
| `"Online"` status badge | `Profile.jsx` line 166 | Added tooltip clarifying it shows because the user is viewing their own profile |

---

### 4. Profile Page — Fixed Non-Functional Buttons

| Button | Was | Now |
|--------|-----|-----|
| "Preview Student Profile" | Did nothing (no `onClick`) | Renamed to "Edit Student Profile", navigates to `/dashboard/settings` |
| "Edit" button (bottom of card) | Did nothing | Navigates to `/dashboard/settings` |
| Edit2 pencil icon (next to name) | Did nothing | Navigates to `/dashboard/settings` with tooltip "Edit profile" |

---

### 5. Profile Page — Active Courses Now Fetches Real Data

The "Active Courses" section was entirely static with placeholder cards.

**Before:** Two hardcoded cards ("View All Courses" and "Explore Courses") with no API call.

**After:**
- Added `fetchEnrolledCourses()` function that calls `GET /api/courseEnrollments/student/:userId`
- Displays up to 2 enrolled courses with:
  - Course thumbnail image (or gradient fallback)
  - Course title
  - Progress percentage (e.g., "45% complete")
- Shows "No courses yet — Browse courses →" when no enrollments exist
- Always shows an "Explore Courses" card for discovering new courses

---

### 6. BadgeGallery — Fixed 2 Runtime Crash Bugs

The Badge Gallery tab on the Profile page crashed on load due to two bugs in `front-end/src/components/badges/BadgeGallery.jsx`:

#### Crash 1: `ReferenceError: API_BASE_URL is not defined`

- **Cause:** `API_BASE_URL` was used in the `fetch()` call (line 53) but never imported
- **Fix:** Replaced raw `fetch` with the shared `apiCall()` function from `@/services/api` which handles auth headers and base URL automatically

#### Crash 2: `setBadges is not a function`

- **Cause:** `badges` was declared as `const badges = allPossibleBadges` (a plain variable), but the `useEffect` callback called `setBadges(formattedBadges)` which didn't exist
- **Fix:** Changed to `const [badges, setBadges] = useState([])` so fetched badge data actually updates the component state
- **Fallback:** If the API call fails, falls back to badges passed via props

---

### 7. Profile Photo — Fixed Field Name Mismatch

- **Bug:** Profile photo was read from `user.otherDetails?.profilePhoto`, but the Student model stores the field as `profileImage`
- **Fix:** Now checks all possible paths: `user.profileImage || user.otherDetails?.profileImage || user.otherDetails?.profilePhoto`

---

### 8. Backend — Fixed Data Loss in `register-details` Endpoint

**File:** `back-end/routes/users.js` — `GET /api/users/register-details/:email`

- **Bug:** When no Registration document exists for a user (only Student/User record), the endpoint returned only 4 fields: `{ fullName, email, gender, badges }`. This caused the frontend to lose:
  - `createdAt` (member since date)
  - `profileImage` (profile photo)
  - `mobileNumber`, `institution`, `department`, `address`, `dob`
  - `studentId`, `yearSemester`, `status`
  
- **Fix:** Changed from a manual 4-field object to `{ ...user.toObject(), badges, otherDetails: {} }` which preserves all document fields

---

## Summary of All Modified Files

### Backend

| File | Changes |
|------|---------|
| `back-end/routes/auth.js` | 15 security fixes + 3 production bug fixes |
| `back-end/routes/users.js` | Fixed `register-details` data loss |
| `back-end/middleware/auth.js` | Fixed `protect` import order |

### Frontend

| File | Changes |
|------|---------|
| `front-end/src/pages/Profile.jsx` | Removed 5 hardcoded values, fixed buttons, added courses API, fixed profile photo |
| `front-end/src/components/badges/BadgeGallery.jsx` | Fixed 2 crash bugs (API_BASE_URL + useState) |
| `front-end/src/components/LoginCard.jsx` | Dual storage, removed duplicate writes |
| `front-end/src/components/AssessmentFlowGuard.jsx` | Dev bypass gated, server-side validation |
| `front-end/src/services/api.js` | Token renewal, localStorage clear on 401, dev-only port probing |
| `front-end/src/components/auth/ForgotPasswordModal.jsx` | Password policy validation + visual indicators |
| `front-end/src/pages/SignupInitial.jsx` | Real OTP send API call |
| `front-end/src/pages/VerifyOTP.jsx` | Real OTP verify + resend API calls |
| `front-end/src/pages/ComprehensiveSignup.jsx` | Protected route (redirect without signup flow) |
| `front-end/src/contexts/UserContext.jsx` | Dual storage sync |
| `front-end/src/hooks/useAuth.js` | localStorage fallback read |
