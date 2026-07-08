import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('auth_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const currentUser = await api.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setToken(null);
            sessionStorage.removeItem('auth_token');
          }
        } catch {
          setToken(null);
          sessionStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };
    verifyAuth();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setUser(result.user);
    setToken(result.token);
    sessionStorage.setItem('auth_token', result.token);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('auth_token');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
