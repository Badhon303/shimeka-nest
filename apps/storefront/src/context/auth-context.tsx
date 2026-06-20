'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { UserView } from '@shimeka/shared';
import { apiFetch } from '@/lib/api';

interface AuthResult {
  user: UserView;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: UserView | null;
  token: string | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    name?: string;
    email?: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'shimeka_access_token';
const REFRESH_KEY = 'shimeka_refresh_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserView | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadUser = useCallback(async (accessToken: string) => {
    try {
      const me = await apiFetch<UserView>('/users/me', { token: accessToken });
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      setToken(stored);
      loadUser(stored).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [loadUser]);

  const persist = useCallback((result: AuthResult) => {
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(REFRESH_KEY, result.refreshToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const result = await apiFetch<AuthResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      persist(result);
    },
    [persist],
  );

  const register = useCallback(
    async (data: { name?: string; email?: string; phone?: string; password: string }) => {
      const result = await apiFetch<AuthResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      persist(result);
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) await loadUser(token);
  }, [token, loadUser]);

  return (
    <AuthContext.Provider
      value={{ user, token, ready, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
