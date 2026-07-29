import { apiClient } from './client';

// Mirrors back-end/routes/auth.js — every login goes through OTP verification,
// there is no direct password-only success path (see requirements doc, FR-AUTH-04).
export const login = (email, password, collegeCode) =>
  apiClient.post('/auth/login', { email, password, collegeCode }).then((r) => r.data);

export const verifyLoginOtp = (tempToken, otp) =>
  apiClient.post('/auth/verify-login-otp', { tempToken, otp }).then((r) => r.data);

export const resendLoginOtp = (tempToken) =>
  apiClient.post('/auth/resend-login-otp', { tempToken }).then((r) => r.data);

export const getMe = () => apiClient.get('/auth/me').then((r) => r.data);

export const logout = () => apiClient.post('/auth/logout').then((r) => r.data);
