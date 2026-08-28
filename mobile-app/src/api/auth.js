import { apiClient } from './client';

// Mirrors back-end/routes/auth.js — every login goes through OTP verification,
// there is no direct password-only success path (see requirements doc, FR-AUTH-04).
export const login = (email, password, collegeCode) =>
  apiClient.post('/auth/login', { email, password, collegeCode }).then((r) => r.data);

export const verifyLoginOtp = (tempToken, otp, forceLogout = false) =>
  apiClient.post('/auth/verify-login-otp', { tempToken, otp, forceLogout }).then((r) => r.data);

export const resendLoginOtp = (tempToken) =>
  apiClient.post('/auth/resend-login-otp', { tempToken }).then((r) => r.data);

export const getMe = () => apiClient.get('/auth/me').then((r) => r.data);

export const logout = () => apiClient.post('/auth/logout').then((r) => r.data);

// ── FR-AUTH-02 · Signup with email OTP ──────────────────────────────────────
// Three steps, matching routes/auth.js: verify the email owns an inbox first,
// then create the account. The account is created as a `pending` Student with
// no college — an admin provisions it afterwards (see /auth/register, ~line 348).

/** @returns {Promise<{ success, message, tempToken }>} */
export const sendSignupOtp = (email, fullName) =>
  apiClient.post('/auth/send-signup-otp', { email, fullName }).then((r) => r.data);

/** @returns {Promise<{ success, message, email, fullName }>} */
export const verifySignupOtp = (tempToken, otp) =>
  apiClient.post('/auth/verify-signup-otp', { tempToken, otp }).then((r) => r.data);

/** @returns {Promise<{ success, message, tempToken }>} — tempToken is rotated. */
export const resendSignupOtp = (tempToken) =>
  apiClient.post('/auth/resend-signup-otp', { tempToken }).then((r) => r.data);

/** @returns {Promise<{ message, token, user }>} */
export const register = ({ fullName, email, mobileNumber, password, institution }) =>
  apiClient
    .post('/auth/register', { fullName, email, mobileNumber, password, institution })
    .then((r) => r.data);

// ── FR-AUTH-06 · Forgot / reset password ────────────────────────────────────
// collegeCode scopes the lookup to one institution — the backend returns 404
// with `wrongCollege: true` rather than falling back across colleges.

/** @returns {Promise<{ success, message, resetToken }>} */
export const forgotPassword = (email, collegeCode) =>
  apiClient.post('/auth/forgot-password', { email, collegeCode }).then((r) => r.data);

/** Optional pre-check — `resetPassword` re-verifies the OTP itself. */
export const verifyResetOtp = (resetToken, otp) =>
  apiClient.post('/auth/verify-reset-otp', { resetToken, otp }).then((r) => r.data);

/** @returns {Promise<{ success, message }>} — does NOT return a token; user logs in again. */
export const resetPassword = (resetToken, otp, newPassword) =>
  apiClient.post('/auth/reset-password', { resetToken, otp, newPassword }).then((r) => r.data);

// ── FR-AUTH-05 · Forced first-login password change ─────────────────────────
// Reached only after verify-login-otp returns `requirePasswordChange: true`
// along with a fresh `password-change` tempToken.

/** @returns {Promise<{ message, token, sessionExpiresAt, user, alreadyRegistered? }>} */
export const firstLoginChangePassword = (tempToken, newPassword, confirmPassword) =>
  apiClient
    .post('/auth/first-login-change-password', { tempToken, newPassword, confirmPassword })
    .then((r) => r.data);

// ── Self-service password change ────────────────────────────────────────────
// For an already-signed-in student changing their password voluntarily from
// Settings — distinct from `firstLoginChangePassword` (server-forced, tempToken
// flow, no current password known) and `resetPassword` (forgot-password OTP
// flow). Requires the current password.

/** @returns {Promise<{ success, message }>} */
export const changePassword = (currentPassword, newPassword, confirmPassword) =>
  apiClient
    .post('/auth/change-password', { currentPassword, newPassword, confirmPassword })
    .then((r) => r.data);

// ── FR-AUTH-08 · Silent token renewal ───────────────────────────────────────
// Server-side sessions last 3h (`sessionExpiresAt`); this both re-issues the JWT
// and pushes that wall back. Requires a still-valid token.

/** @returns {Promise<{ success, token, sessionExpiresAt }>} */
export const renewToken = () => apiClient.post('/auth/renew-token').then((r) => r.data);
