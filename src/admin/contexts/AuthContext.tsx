import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { StaffAccount } from '../types';
import { api } from '../api/client';
import { authStorage } from '../api/authStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: StaffAccount | null;
  token: string | null;
  login: (email: string, password: string) => Promise<StaffAccount>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffAccount | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return authStorage.getToken();
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
            setUser(null);
            setToken(null);
            authStorage.clear();
          }
        } catch {
          setUser(null);
          setToken(null);
          authStorage.clear();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    verifyAuth();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setUser(result.user);
    setToken(result.token);
    authStorage.setToken(result.token);
    return result.user;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const updated = await api.changePassword(currentPassword, newPassword);
    setUser(updated);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setToken(null);
    authStorage.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, changePassword, logout, isLoading }}>
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
