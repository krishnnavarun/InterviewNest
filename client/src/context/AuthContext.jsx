import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore, unwrap } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!tokenStore.get()) return;
    unwrap(api.get('/auth/me'))
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API means the token expired.
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const startSession = useCallback(({ token, user: account }, remember = true) => {
    tokenStore.set(token, remember);
    setUser(account);
    return account;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async ({ email, password, remember }) =>
        startSession(await unwrap(api.post('/auth/login', { email, password })), remember),
      register: async ({ name, email, password }) =>
        startSession(await unwrap(api.post('/auth/register', { name, email, password }))),
      loginWithGoogle: async (accessToken) =>
        startSession(await unwrap(api.post('/auth/google', { accessToken }))),
      logout,
    }),
    [user, loading, startSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
