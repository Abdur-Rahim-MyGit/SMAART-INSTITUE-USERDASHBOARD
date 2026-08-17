import axios from 'axios';
import * as storage from '../utils/storage';
import { getDeviceHeaders } from '../utils/device';

// Set EXPO_PUBLIC_API_URL in .env (see .env.example) — Metro exposes EXPO_PUBLIC_*
// vars to the app automatically, no extra config needed.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const TOKEN_KEY = 'smaart_auth_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FR-AUTH-11 — device fingerprint on every request. The backend logs the
  // User-Agent/IP per auth event already; these headers make a React Native
  // client identifiable instead of "Browser / Unknown OS / Desktop".
  try {
    const deviceHeaders = await getDeviceHeaders();
    Object.entries(deviceHeaders).forEach(([k, v]) => {
      if (v && !config.headers[k]) config.headers[k] = v;
    });
  } catch {
    // Fingerprinting is best-effort — never block a request over it.
  }

  return config;
});

// ── FR-AUTH-08 · Silent token renewal ───────────────────────────────────────
// Sessions are 3h server-side. Rather than dumping the student back on the
// login screen the moment a token goes stale, a 401 triggers one renewal
// attempt and the original request is replayed. AuthContext also renews
// proactively on foreground; this interceptor is the safety net for the case
// where the app was backgrounded long enough to miss that window.
//
// `onSessionExpired` is injected by AuthContext so this module doesn't have to
// import React state (and so the sign-out path stays in one place).
let onSessionExpired = null;
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

// Bare client for the renewal call itself — using `apiClient` would recurse
// through this same interceptor if the renewal request also 401s.
const renewalClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

let renewalPromise = null;

/**
 * Exchange the current token for a fresh one. Concurrent callers share a single
 * in-flight request so five parallel 401s don't fire five renewals.
 * @returns {Promise<string|null>} the new token, or null if renewal failed.
 */
export function renewAuthToken() {
  if (renewalPromise) return renewalPromise;

  renewalPromise = (async () => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) return null;

      const res = await renewalClient.post(
        '/auth/renew-token',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newToken = res?.data?.token;
      if (newToken) {
        await storage.setItem(TOKEN_KEY, newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      renewalPromise = null;
    }
  })();

  return renewalPromise;
}

// Normalize errors so screens can just read `err.message` while preserving status and data.
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err?.config;
    const status = err?.response?.status;

    // Only auto-renew for a genuine expired-session 401 on a request we can
    // safely replay. `_retriedAfterRenew` stops an infinite renew→401→renew loop.
    const isAuthEndpoint = original?.url?.includes('/auth/login')
      || original?.url?.includes('/auth/verify-login-otp')
      || original?.url?.includes('/auth/renew-token');

    if (status === 401 && original && !original._retriedAfterRenew && !isAuthEndpoint) {
      original._retriedAfterRenew = true;
      const newToken = await renewAuthToken();
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      }
      // Renewal failed — the session is genuinely gone. Tell AuthContext once.
      if (onSessionExpired) {
        try {
          await onSessionExpired();
        } catch {
          /* ignore */
        }
      }
    }

    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'Something went wrong. Please try again.';
    const normalized = new Error(message);
    normalized.status = status;
    normalized.data = err?.response?.data;
    return Promise.reject(normalized);
  }
);
