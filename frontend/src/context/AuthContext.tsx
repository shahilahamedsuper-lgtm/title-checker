import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { UserProfile } from "../api/authApi";
import { fetchMe } from "../api/authApi";

const TOKEN_KEY = "sv_token";

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    fetchMe()
      .then(setUser)
      .catch(() => {
        setToken(null);
        setUser(null);
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((newToken: string, newUser: UserProfile) => {
    try { localStorage.setItem(TOKEN_KEY, newToken); } catch { /* ignore */ }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await fetchMe();
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
