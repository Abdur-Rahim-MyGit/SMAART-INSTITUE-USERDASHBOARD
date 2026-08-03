import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as storage from '../utils/storage';
import { TOKEN_KEY } from '../api/client';
import { getMe, logout as logoutRequest } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [college, setCollege] = useState(null); // selected institution (pre-login)
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // On app start: if a token is already stored (secure storage, per FR-AUTH-07),
  // validate it against /auth/me instead of trusting it blindly.
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getItem(TOKEN_KEY);
        if (token) {
          const me = await getMe();
          setUser(me.user || me);
        }
      } catch (err) {
        await storage.deleteItem(TOKEN_KEY);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const signIn = async (token, userData) => {
    await storage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const signOut = async () => {
    try {
      await logoutRequest();
    } catch {
      // best-effort — clear local session regardless of server response
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, college, setCollege, isBootstrapping, signIn, signOut }),
    [user, college, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
