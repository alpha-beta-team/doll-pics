import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { StaffAccount } from '../types';
import { api } from '../api/client';
import { authStorage } from '../api/authStorage';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error';
type AuthState = { status: AuthStatus; user: StaffAccount | null; token: string | null; error: string | null };
interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  retryVerification: () => Promise<void>;
  login: (email: string, password: string) => Promise<StaffAccount>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}
const anonymous: AuthState = { status: 'anonymous', user: null, token: null, error: null };
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...anonymous, status: 'checking' });
  const generation = useRef(0);
  const verification = useRef<AbortController | null>(null);
  const invalidate = useCallback(() => {
    generation.current += 1;
    verification.current?.abort();
    verification.current = null;
    return generation.current;
  }, []);

  const retryVerification = useCallback(async () => {
    const attempt = invalidate();
    const token = authStorage.getToken();
    if (!token) { authStorage.clear(); setState(anonymous); return; }
    const controller = new AbortController();
    verification.current = controller;
    setState({ ...anonymous, token, status: 'checking' });
    try {
      const user = await api.getCurrentUser(controller.signal);
      if (attempt !== generation.current || controller.signal.aborted) return;
      if (!user) { authStorage.clear(); setState(anonymous); return; }
      authStorage.setUser(user);
      setState({ status: 'authenticated', user, token, error: null });
    } catch (error) {
      if (attempt !== generation.current || controller.signal.aborted) return;
      setState({ status: 'error', user: null, token, error: error instanceof Error ? error.message : 'Could not verify your session. Check your connection and try again.' });
    } finally {
      if (attempt === generation.current) verification.current = null;
    }
  }, [invalidate]);

  useEffect(() => {
    void retryVerification();
    return () => { invalidate(); };
  }, [invalidate, retryVerification]);

  const login = useCallback(async (email: string, password: string) => {
    const attempt = invalidate();
    setState(anonymous);
    const result = await api.login(email, password);
    if (attempt !== generation.current) throw new DOMException('Sign-in was cancelled.', 'AbortError');
    authStorage.setToken(result.token);
    authStorage.setUser(result.user);
    setState({ status: 'authenticated', user: result.user, token: result.token, error: null });
    return result.user;
  }, [invalidate]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const attempt = generation.current;
    const user = await api.changePassword(currentPassword, newPassword);
    if (attempt !== generation.current) throw new DOMException('Session changed.', 'AbortError');
    authStorage.setUser(user);
    setState(previous => ({ ...previous, user }));
  }, []);

  const logout = useCallback(async () => {
    invalidate();
    authStorage.clear();
    setState(anonymous);
  }, [invalidate]);

  return <AuthContext.Provider value={{ ...state, isAuthenticated: state.status === 'authenticated', isLoading: state.status === 'checking', retryVerification, login, changePassword, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
