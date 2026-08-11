import type { StaffAccount } from '../types';
import { normalizePermissionOverrides, normalizeStaffAccountRole } from '../access/roles';
import { request } from './http';
import { authStorage } from './authStorage';

function storeStaffAccount(account: StaffAccount) {
  authStorage.setUser(account);
}

function clearUser() {
  authStorage.clear();
}

function mapStaffAccount(data: {
  id?: string;
  email: string;
  name?: string;
  jobTitle?: string;
  role?: unknown;
  permissionOverrides?: unknown;
  isActive?: boolean;
  mustChangePassword?: boolean;
}): StaffAccount {
  return {
    id: data.id || 'admin',
    email: data.email,
    name: data.name || 'Studio Admin',
    jobTitle: data.jobTitle || '',
    role: normalizeStaffAccountRole(data.role, 'owner'),
    permissionOverrides: normalizePermissionOverrides(data.permissionOverrides),
    isActive: data.isActive !== false,
    mustChangePassword: data.mustChangePassword === true,
  };
}

export const authApi = {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: StaffAccount; token: string }> {
    const data = await request<{
      accessToken: string;
      email: string;
      id?: string;
      name?: string;
      jobTitle?: string;
      role?: unknown;
      permissionOverrides?: unknown;
      isActive?: boolean;
      mustChangePassword?: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user = mapStaffAccount(data);
    storeStaffAccount(user);
    return { user, token: data.accessToken };
  },

  async logout(): Promise<void> {
    clearUser();
  },

  /** Verifies the stored JWT with GET /auth/me; clears saved auth on failure. */
  async getCurrentUser(): Promise<StaffAccount | null> {
    const token = authStorage.getToken();
    if (!token) {
      clearUser();
      return null;
    }

    try {
      const data = await request<{
        id: string;
        email: string;
        name?: string;
        jobTitle?: string;
        role?: unknown;
        permissionOverrides?: unknown;
        isActive?: boolean;
        mustChangePassword?: boolean;
      }>(
        '/auth/me',
        { auth: true },
      );
      const user = mapStaffAccount(data);
      storeStaffAccount(user);
      return user;
    } catch {
      authStorage.clear();
      return null;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<StaffAccount> {
    const data = await request<Parameters<typeof mapStaffAccount>[0]>('/auth/change-password', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const user = mapStaffAccount(data);
    storeStaffAccount(user);
    return user;
  },
};
