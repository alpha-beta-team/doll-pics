import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EmployeeAccount } from '../attendance/types';
import { employeeApi, employeeTokenStorage } from './api';

type EmployeeAuthValue = {
  user: EmployeeAccount | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (employeeCode: string, password: string) => Promise<EmployeeAccount>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setPunchPin: (currentPassword: string, pin: string) => Promise<void>;
};

const EmployeeAuthContext = createContext<EmployeeAuthValue | null>(null);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmployeeAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!employeeTokenStorage.get()) {
      setIsLoading(false);
      return;
    }
    employeeApi.me()
      .then(setUser)
      .catch(() => employeeTokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (employeeCode: string, password: string) => {
    const result = await employeeApi.login(employeeCode, password);
    employeeTokenStorage.set(result.accessToken);
    const account: EmployeeAccount = {
      id: result.id,
      employeeCode: result.employeeCode,
      name: result.name,
      jobTitle: result.jobTitle,
      role: result.role,
      attendanceEnabled: result.attendanceEnabled,
      mustChangePassword: result.mustChangePassword,
      punchPinConfigured: result.punchPinConfigured,
    };
    setUser(account);
    return account;
  }, []);

  const logout = useCallback(() => {
    employeeTokenStorage.clear();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setUser(await employeeApi.changePassword(currentPassword, newPassword));
  }, []);

  const setPunchPin = useCallback(async (currentPassword: string, pin: string) => {
    await employeeApi.setPunchPin(currentPassword, pin);
    setUser((current) => current ? { ...current, punchPinConfigured: true } : current);
  }, []);

  const value = useMemo<EmployeeAuthValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user && employeeTokenStorage.get()),
    login,
    logout,
    changePassword,
    setPunchPin,
  }), [changePassword, isLoading, login, logout, setPunchPin, user]);

  return <EmployeeAuthContext.Provider value={value}>{children}</EmployeeAuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEmployeeAuth() {
  const value = useContext(EmployeeAuthContext);
  if (!value) throw new Error('useEmployeeAuth must be used inside EmployeeAuthProvider');
  return value;
}
