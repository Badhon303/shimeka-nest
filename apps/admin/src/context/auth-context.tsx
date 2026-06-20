'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserView } from '@shimeka/shared';
import { api, TOKEN_KEY } from '@/lib/api';

const REFRESH_KEY = 'shimeka_admin_refresh';

interface AuthResult {
  user: UserView;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: UserView | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserView | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (token) {
      // Decode payload to restore a minimal user; verified on first protected call.
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.sub,
          role: payload.role,
          email: null,
          phone: null,
          name: null,
          isBlocked: false,
          createdAt: '',
        });
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await api<AuthResult>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(REFRESH_KEY, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
