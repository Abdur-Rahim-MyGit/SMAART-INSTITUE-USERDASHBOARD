import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as storage from '../utils/storage';
import { TOKEN_KEY, renewAuthToken, setSessionExpiredHandler } from '../api/client';
import { getMe, logout as logoutRequest } from '../api/auth';
import { isBiometricEnabled, setBiometricEnabled as persistBiometricEnabled } from '../utils/biometrics';
import { registerForPushNotifications, unregisterPushNotifications } from '../utils/pushNotifications';

const AuthContext = createContext(null);

// FR-AUTH-08 — the server issues 3h sessions (`/auth/renew-token` resets that
// wall). Renewing every 30 min of foreground time keeps the session alive for
// an actively-used app while staying far enough from the edge that a slow
// network round-trip can't strand the student mid-assessment.
const RENEWAL_INTERVAL_MS = 30 * 60 * 1000;
// Foregrounding after this long re-runs the biometric gate.
const RELOCK_AFTER_MS = 2 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [college, setCollege] = useState(null); // selected institution (pre-login)
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // FR-AUTH-09 — true when a valid session exists but is hidden behind the
  // biometric prompt. RootNavigator renders the unlock screen on this.
  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  // Why the student is looking at the login screen when they did not ask to be.
  // Both paths below used to drop them there silently: a failed session restore
  // and a server-side force-logout are very different problems, and neither is
  // "you typed your password wrong".
  const [authNotice, setAuthNotice] = useState('');

  const backgroundedAt = useRef(null);
  const renewalTimer = useRef(null);

  // A student who has not finished the intake form (FR-AUTH-12). The backend
  // exposes this as `isRegistered` (and `hasRegistration` on some responses).
  const needsProfileCompletion = !!user && user.isRegistered !== true && user.hasRegistration !== true;

  /**
   * Drops the local session.
   *
   * @param {string} notice why, shown on the login screen. The axios
   *   interceptor calls this with no argument when token renewal has failed —
   *   a server-side force-logout — which used to dump the student at the login
   *   screen with no explanation at all.
   */
  const clearSession = useCallback(async (notice = 'Your session has ended. Please sign in again.') => {
    await storage.deleteItem(TOKEN_KEY);
    setUser(null);
    setIsLocked(false);
    setAuthNotice(notice);
  }, []);

  // On app start: if a token is already stored (secure storage, per FR-AUTH-07),
  // validate it against /auth/me instead of trusting it blindly.
  useEffect(() => {
    (async () => {
      try {
        const enabled = await isBiometricEnabled();
        setBiometricEnabledState(enabled);

        const token = await storage.getItem(TOKEN_KEY);
        if (token) {
          const me = await getMe();
          const userData = me.user || me;
          setUser(userData);
          if (userData && userData.college) {
            setCollege(userData.college);
          }
          // Gate the restored session behind biometrics if the student opted in.
          if (enabled) setIsLocked(true);
          registerForPushNotifications().catch(() => {});
        }
      } catch (err) {
        // Only an authentication failure means the stored token is actually
        // dead. Deleting it on *any* thrown error signed the student out for a
        // timeout, a 500 or simply launching with no connection — permanently,
        // because the token was already gone by the time the network returned.
        const status = err?.status;
        if (status === 401 || status === 403) {
          await storage.deleteItem(TOKEN_KEY);
          setAuthNotice('Your session has expired. Please sign in again.');
        } else {
          console.warn('[auth] could not validate the stored session, keeping it:', err?.message);
          setAuthNotice(
            "We couldn't reach SMAART to restore your session. Your sign-in is still saved — reconnect and reopen the app."
          );
        }
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  // Let the axios interceptor sign us out when renewal is no longer possible.
  useEffect(() => {
    setSessionExpiredHandler(clearSession);
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  // FR-AUTH-08 — proactive renewal while signed in and unlocked.
  useEffect(() => {
    if (!user || isLocked) {
      if (renewalTimer.current) {
        clearInterval(renewalTimer.current);
        renewalTimer.current = null;
      }
      return undefined;
    }

    renewalTimer.current = setInterval(() => {
      renewAuthToken();
    }, RENEWAL_INTERVAL_MS);

    return () => {
      if (renewalTimer.current) {
        clearInterval(renewalTimer.current);
        renewalTimer.current = null;
      }
    };
  }, [user, isLocked]);

  // Renew on foreground (a backgrounded app's interval doesn't fire reliably),
  // and re-arm the biometric lock if we were away long enough.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next !== 'active' || !user) return;

      const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
      backgroundedAt.current = null;

      if (biometricEnabled && away > RELOCK_AFTER_MS) {
        setIsLocked(true);
        return; // Don't renew while locked — unlock will do it.
      }
      renewAuthToken();
    });

    return () => sub.remove();
  }, [user, biometricEnabled]);

  const signIn = async (token, userData) => {
    await storage.setItem(TOKEN_KEY, token);
    setAuthNotice('');
    setUser(userData);
    if (userData && userData.college) {
      setCollege(userData.college);
    }
    setIsLocked(false);
    registerForPushNotifications().catch(() => {});
  };

  const signOut = async () => {
    await unregisterPushNotifications();
    try {
      await logoutRequest();
    } catch {
      // best-effort — clear local session regardless of server response
    }
    // A deliberate sign-out needs no explanation on the login screen.
    await clearSession('');
  };

  /** Called by BiometricUnlockScreen once the OS prompt succeeds. */
  const unlock = useCallback(async () => {
    setIsLocked(false);
    // The session may have aged while locked — top it up before use.
    renewAuthToken();
  }, []);

  /** Settings toggle. Disabling never touches the session, only the gate. */
  const setBiometricPreference = useCallback(async (enabled) => {
    await persistBiometricEnabled(enabled);
    setBiometricEnabledState(enabled);
  }, []);

  /**
   * Re-read the user from the server — used after onboarding completes so
   * `isRegistered` flips and `needsProfileCompletion` clears without a re-login.
   */
  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me.user || me);
      return me.user || me;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      college,
      setCollege,
      isBootstrapping,
      isLocked,
      biometricEnabled,
      needsProfileCompletion,
      authNotice,
      clearAuthNotice: () => setAuthNotice(''),
      signIn,
      signOut,
      unlock,
      setBiometricPreference,
      refreshUser,
    }),
    [
      user,
      college,
      isBootstrapping,
      isLocked,
      biometricEnabled,
      needsProfileCompletion,
      authNotice,
      unlock,
      setBiometricPreference,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
