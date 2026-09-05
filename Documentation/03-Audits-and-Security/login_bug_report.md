# Login Flow — Full Bug Report & Fix Plan

## Login Flow Overview

```
User → LandingPage → InstitutionSelectModal → /login (Institution.jsx)
     → LoginModal (email+password) → POST /api/auth/login
     → Backend returns { requireOtp: true, tempToken }
     → LoginOtpModal (6-digit OTP) → POST /api/auth/verify-login-otp
     → (If first login) FirstLoginPasswordModal → set new password
     → Login success → navigate to /dashboard or /complete-registration
```

---

## 🔴 Critical Bug #1 — Backend `.env` MONGODB_URI Missing / PORT Typo

**File:** [.env](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/.env)

**Problem:** The `MONGODB_URI` line was deleted and `PORT` was corrupted to `4PORT=5000`.
The server crashes on startup with: `❌ CRITICAL ERROR: Missing environment variables: MONGODB_URI`.

**Status:** ✅ **Already Fixed** — `MONGODB_URI` restored from `.env.backup`, `PORT` corrected.

**Root Cause:** The `.env` file was accidentally edited. You should add `.env` to `.gitignore` and never commit it.

---

## 🔴 Critical Bug #2 — `/login` Route Maps to `Institution.jsx`, NOT `LoginModal`

**File:** [AnimatedRoutes.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/AnimatedRoutes.jsx#L97)

```jsx
<Route path="/login" element={<Institution />} />  // ← BUG! Should be Landing or a login page
```

**Problem:** After `InstitutionSelectModal` selects an institution, it calls `navigate('/login')`. But `/login` routes to `Institution.jsx` (the Institution detail page), NOT a login UI. The user will land on the wrong page.

**Fix:** Route `/login` to `LandingPage` with the login modal pre-opened, OR create a dedicated `/login` page that renders `LoginModal` directly.

**Simplest fix:**
```jsx
// In AnimatedRoutes.jsx, change line 97:
<Route path="/login" element={<Landing />} />
```
Then in `LandingPage.jsx`, auto-open the modal when `?modal=true` is present (already handled at line 42) — or pass a prop. The `InstitutionSelectModal` `handleInstitutionSelected` already redirects to `/login`, so add `?modal=true`:

```jsx
// LandingPage.jsx handleInstitutionSelected — line 131
const handleInstitutionSelected = (institution) => {
  setIsInstitutionSelectOpen(false);
  navigate('/login?modal=true');  // ← add ?modal=true so LoginModal auto-opens
};
```

---

## 🟠 Bug #3 — `LoginModal` Not Passed `institution`/`collegeCode` to Backend Login

**File:** [LoginModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/auth/LoginModal.jsx#L44-L48)

```js
body: JSON.stringify(formData),  // formData only has { email, password }
```

**Problem:** The backend `/auth/login` handler uses `collegeCode` or `institution` to filter users by college. Without it, the search fallback applies but may match wrong users across institutions, or fail entirely for institution-specific lookups.

**Fix:** Store the selected institution in `sessionStorage` during `InstitutionSelectModal.onInstitutionSelected`, then read it in `LoginModal.handleSubmit`:

```js
// In LoginModal handleSubmit, update body:
body: JSON.stringify({
  ...formData,
  institution: sessionStorage.getItem('selectedInstitution') || undefined,
}),
```

---

## 🟠 Bug #4 — OTP Auto-Submit Triggers Before `isLoading` State Settles

**File:** [LoginOtpModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/auth/LoginOtpModal.jsx#L57-L62)

```js
useEffect(() => {
  const otpString = otp.join("");
  if (otpString.length === 6 && !isLoading && !showForceLogout) {
    verifyOtp(false);  // ← can trigger twice due to React render batching
  }
}, [otp]);
```

**Problem:** The `useEffect` dependency array only contains `[otp]`, but it also reads `isLoading` and `showForceLogout` which are not in the deps. This can cause the auto-submit to fire with stale `isLoading=false` and trigger duplicate POST requests.

**Fix:** Add missing dependencies OR use a ref to track if a submission is in flight:

```js
const hasAutoSubmittedRef = useRef(false);

useEffect(() => {
  const otpString = otp.join("");
  if (otpString.length === 6 && !isLoading && !showForceLogout && !hasAutoSubmittedRef.current) {
    hasAutoSubmittedRef.current = true;
    verifyOtp(false).finally(() => { hasAutoSubmittedRef.current = false; });
  }
}, [otp, isLoading, showForceLogout]);
```

---

## 🟠 Bug #5 — `sessionExpiresAt` Never Stored in `sessionStorage` After Login

**File:** [LoginModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/auth/LoginModal.jsx#L83-L148)  
**File:** [UserContextFixed.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/contexts/UserContextFixed.jsx#L137-L154)

**Problem:** After a successful OTP verification, the backend returns `{ token, user, sessionId, sessionExpiresAt, nextStep }`. The frontend `handleLoginSuccess` only calls `login(userToStore, data.token)`. The `login()` function in `UserContextFixed.jsx` stores `token` and `user` — but **never stores `sessionExpiresAt` to `sessionStorage`**.

The `useSessionGuard` hook reads `sessionStorage.getItem('sessionExpiresAt')` to enforce the 3-hour session limit. Since this is never set, the guard never fires and the session never expires on the frontend.

**Fix:** In `LoginModal.handleLoginSuccess`, store `sessionExpiresAt`:

```js
// Add inside handleLoginSuccess, after login(userToStore, data.token):
if (data.sessionExpiresAt) {
  sessionStorage.setItem('sessionExpiresAt', data.sessionExpiresAt);
}
if (data.sessionId) {
  sessionStorage.setItem('sessionId', data.sessionId);
}
```

---

## 🟠 Bug #6 — `useSessionGuard` `showWarning` in `setInterval` Deps Causes Re-Subscription Loop

**File:** [useSessionGuard.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/hooks/useSessionGuard.js#L70-L106)

```js
useEffect(() => {
  checkRef.current = setInterval(...)
  ...
}, [getExpiresAt, showWarning, startCountdown, triggerExpiry]); // ← showWarning causes re-mount
```

**Problem:** `showWarning` is in the dependency array. Every time `setShowWarning(true)` is called, the `useEffect` cleanup runs (clearing the interval) and re-registers a NEW interval. This creates a re-subscription storm when warning is triggered.

**Fix:** Use a ref for `showWarning` inside the interval:

```js
const showWarningRef = useRef(false);
// Inside interval callback:
if (remaining <= WARNING_THRESHOLD_MS && !showWarningRef.current) {
  showWarningRef.current = true;
  setShowWarning(true);
  startCountdown(expiresAt);
}
// Remove showWarning from useEffect deps array
```

---

## 🟡 Bug #7 — `Remember Me` Uses `data.user?.email` Which May Be `undefined`

**File:** [LoginModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/auth/LoginModal.jsx#L107)

```js
localStorage.setItem("rememberedEmail", data.user?.email || formData.email);
```

**Problem:** `data.user` is the OTP-verified user object from `LoginOtpModal.onSuccess(data)`. In the regular login flow (non-first-login), the backend returns `data.user` correctly. But if the flow passes through the OTP modal and the `data` shape changes slightly, this could silently store `undefined` in `localStorage`.

**Fix:** Explicitly check before storing:

```js
const emailToRemember = data.user?.email || formData.email;
if (emailToRemember) {
  localStorage.setItem("rememberedEmail", emailToRemember);
}
```

---

## 🟡 Bug #8 — `rememberMe` Init Calls `setFormData` Inside `useState` Initializer

**File:** [LoginModal.jsx](file:///b:/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/auth/LoginModal.jsx#L26-L33)

```js
const [rememberMe, setRememberMe] = useState(() => {
  const savedEmail = localStorage.getItem("rememberedEmail");
  if (savedEmail) {
    setFormData(prev => ({ ...prev, email: savedEmail })); // ← calling a setter during init!
    return true;
  }
  return false;
});
```

**Problem:** Calling `setFormData(...)` from inside a `useState` initializer function is not safe — it references the setter of another `useState` before that state is properly initialized. This can cause React warnings or incorrect state in strict mode.

**Fix:** Use `useEffect` to populate the email after mount:

```js
const savedEmail = localStorage.getItem("rememberedEmail");
const [formData, setFormData] = useState({ email: savedEmail || "", password: "" });
const [rememberMe, setRememberMe] = useState(!!savedEmail);
```

---

## 🟡 Bug #9 — Dev OTP Bypass `999999` Left in Production Code

**File:** [auth.js](file:///b:/SMAART-INSTITUE-USERDASHBOARD/back-end/routes/auth.js#L808-L810)

```js
if (!isValid && process.env.NODE_ENV !== 'production' && otp === '999999') {
  isValid = true;
}
```

**Problem:** While guarded by `NODE_ENV !== 'production'`, this bypass OTP is in the codebase. If `NODE_ENV` is ever misconfigured (e.g., set to `development` on a production server), anyone can bypass OTP with `999999`.

**Fix:** Remove this bypass entirely, or move it to a separate test script:

```js
// REMOVE these 3 lines from auth.js
```

---

## Summary Table

| # | Severity | Problem | File | Fixed? |
|---|----------|---------|------|--------|
| 1 | 🔴 Critical | Backend crashes — MONGODB_URI missing, PORT typo | `.env` | ✅ Fixed |
| 2 | 🔴 Critical | `/login` route points to wrong page (`Institution.jsx`) | `AnimatedRoutes.jsx` | ❌ Needs Fix |
| 3 | 🟠 High | `institution`/`collegeCode` not sent to backend login | `LoginModal.jsx` | ❌ Needs Fix |
| 4 | 🟠 High | OTP auto-submit can double-fire (missing deps) | `LoginOtpModal.jsx` | ❌ Needs Fix |
| 5 | 🟠 High | `sessionExpiresAt` never stored — session guard never fires | `LoginModal.jsx` | ❌ Needs Fix |
| 6 | 🟠 Medium | `useSessionGuard` setInterval re-registers on every warning | `useSessionGuard.js` | ❌ Needs Fix |
| 7 | 🟡 Low | `rememberMe` may store `undefined` email | `LoginModal.jsx` | ❌ Needs Fix |
| 8 | 🟡 Low | `setFormData` called inside `useState` initializer | `LoginModal.jsx` | ❌ Needs Fix |
| 9 | 🟡 Low | Dev OTP bypass `999999` in codebase | `auth.js` | ❌ Optional |

---

## Quick Fix Priority

1. **Fix Bug #2 first** — without this, nobody can get to the login form after selecting an institution
2. **Fix Bug #5** — session expiry guard is completely broken without this
3. **Fix Bug #3** — institution-scoped login filtering is bypassed
4. **Fix Bug #4 & #8** — prevents duplicate OTP calls and React state issues
