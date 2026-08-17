import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as storage from '../utils/storage';
import { TOKEN_KEY, renewAuthToken, setSessionExpiredHandler } from '../api/client';
import { getMe, logout as logoutRequest } from '../api/auth';
import { isBiometricEnabled, setBiometricEnabled as persistBiometricEnabled } from '../utils/biometrics';

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

  const backgroundedAt = useRef(null);
  const renewalTimer = useRef(null);

  // A student who has not finished the intake form (FR-AUTH-12). The backend
  // exposes this as `isRegistered` (and `hasRegistration` on some responses).
  const needsProfileCompletion = !!user && user.isRegistered !== true && user.hasRegistration !== true;

  const clearSession = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    setUser(null);
    setIsLocked(false);
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
          setUser(me.user || me);
          // Gate the restored session behind biometrics if the student opted in.
          if (enabled) setIsLocked(true);
        }
      } catch (err) {
        await storage.deleteItem(TOKEN_KEY);
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
    setUser(userData);
    setIsLocked(false);
  };

  const signOut = async () => {
    try {
      await logoutRequest();
    } catch {
      // best-effort — clear local session regardless of server response
    }
    await clearSession();
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
