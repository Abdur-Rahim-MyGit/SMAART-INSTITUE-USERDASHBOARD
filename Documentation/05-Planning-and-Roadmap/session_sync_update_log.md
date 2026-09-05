# Single-Tab Enforcement & Cross-Tab Logout Fixes

This document serves as developer documentation for the updates made to user session state and multi-tab restrictions.

## 1. SingleTabGuard (Strict Double-Tab Prevention)

`component: SingleTabGuard.jsx` (New component)

When attempting to protect the application from dual-tab data corruption, we created a rigid "one-tab-only" environment per user profile.

- **BroadcastChannel Implementation:** Added `SingleTabGuard.jsx` which wraps the inner dashboard routes located inside `App.jsx`.
- **Dynamic Handshakes:** Momentarily upon the user successfully logging in, `SingleTabGuard` queries the `useUser` context hook. Once a valid user string is found, it instantiates `new BroadcastChannel('smaart_tab_lock_[user_id]')` and transmits a `"PING"` signal across the user's OS network stack.
- **Lockout Mechanism:** If an older tab is already running and receives this `"PING"`, it automatically counter-broadcasts a `"PONG"`. The newer tab, upon receiving exactly one `"PONG"`, immediately sets `isDuplicate` to `true`. This entirely unmounts the dashboard React tree and renders an opaque overlay restricting access. The duplicate tab cannot be refreshed to bypass this; the session is entirely shielded.

## 2. Decoupled Cross-Tab Data Synchronizations

`component: LoginCard.jsx`, `component: useAuth.js`, `component: UserContext.jsx`

Previously, the app used to dual-sync user tokens into `sessionStorage` **and** `localStorage`. Our fixes detached `localStorage` to completely isolate the browsing tabs, solving issues where users cross-shared content in multiple tabs.

- **Login Process Isolation:** `LoginCard.jsx` no longer copies the JWT tokens and `user` payload into `localStorage`. The application relies entirely on `sessionStorage` which binds user state securely strictly to a single tab.
- **`useAuth` Cleanup:** Removed the fallback `|| localStorage.getItem("user")` sequence inside `useAuth.js`.
- **UserContext Isolation:** Removed the dual-write array inside the `fetchUserDetails` background sync array. The user's active session is only mapped locally.

## 3. Resolving Cross-Tab Logout Error Boundary Crashes

`component: UserContext.jsx`

Despite the isolation updates, we retained the global **Cross-Tab Logout** feature since logging completely out should inherently log you out everywhere for security. But this previously caused React Error Boundaries to crash the UI gracefully due to state nullification conflicts.

- **Vite HMR Isolation fix:** Modified `useUser` exporter loop inside `UserContext.jsx`. Now, if a React context unloads unexpectedly due to a page teardown (a.k.a a background tab logging out), it suppresses throwing the `"useUser must be used within a UserProvider"` error. Instead, it temporarily returns a fake JSON object to satisfy the dashboard UI until the page has fully torn down and redirected gracefully.
- **Bypassing the React Rendering queue:** When the storage observer inside `UserContext.jsx` detects a `logout-event`, it no longer utilizes `setUser(null)`. Triggering `setUser(null)` would fire a massive React tree re-mount cycle at the exact nanosecond Vite is trashing the DOM. Instead, it immediately bypasses React directly to the DOM sequence: `window.location.replace("/")`.

## 4. Toast Notifications

`component: LandingPage.jsx`

- Added `sessionStorage.setItem("logged_out_other_tab", "true");` directly before triggering the redirect mentioned above.
- When `LandingPage.jsx` completes mounting, it scans for this flag. If discovered, it injects a green success toast stating: `"You have been logged out from another tab"` into the UI.

## 5. Background Polling Fixes (Session Resurrection)

`component: UserContext.jsx`

- **Blocking Background Payloads**: `fetchUserDetails` was routinely gathering background updates from the server. If one of those updates resolved *during* an active logout execution, it would wrap itself in React's setter function and forcibly log the user back in milliseconds after `sessionStorage` was wiped.
- We added a closure blockade: `if (!prev) return null;` which safely destroys late-arriving network packets without injecting them into the DOM if the target has already signed out.
