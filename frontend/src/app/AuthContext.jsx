import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiClient';

const AuthContext = createContext({
  user: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('smog_saathi_token')));

  useEffect(() => {
    const token = localStorage.getItem('smog_saathi_token');
    if (!token) return;
    apiFetch('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('smog_saathi_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await apiFetch('/auth/login', { method: 'POST', body: credentials });
    localStorage.setItem('smog_saathi_token', res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await apiFetch('/auth/register', { method: 'POST', body: payload });
    localStorage.setItem('smog_saathi_token', res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smog_saathi_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
