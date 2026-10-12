import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Restore the session from a saved token
  useEffect(() => {
    if (!getToken()) return;
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API signs the user out
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('campusbuddy:unauthorized', onUnauthorized);
    return () => window.removeEventListener('campusbuddy:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (form) => {
    const data = await api.post('/auth/register', form);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const data = await api.post('/auth/reset-password', { token, password });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await api.post('/auth/change-password', { currentPassword, newPassword });
    setToken(data.token); // the old token stops working after a password change
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const data = await api.patch('/auth/me', changes);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, resetPassword, changePassword }),
    [user, loading, login, register, logout, updateProfile, resetPassword, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
