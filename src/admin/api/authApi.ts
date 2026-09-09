import type { StaffAccount } from '../types';
import { normalizePermissionOverrides, normalizeStaffAccountRole } from '../access/roles';
import { ApiError, request } from './http';
import { authStorage } from './authStorage';

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
  permissions?: unknown;
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
    permissions: Array.isArray(data.permissions) ? data.permissions.filter((item): item is string => typeof item === 'string') : [],
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
      permissions?: unknown;
      isActive?: boolean;
      mustChangePassword?: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user = mapStaffAccount(data);
    return { user, token: data.accessToken };
  },

  async logout(): Promise<void> {
    clearUser();
  },

  /** Read-only verification; the context owns session changes and stale-response protection. */
  async getCurrentUser(signal?: AbortSignal): Promise<StaffAccount | null> {
    const token = authStorage.getToken();
    if (!token) {
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
        permissions?: unknown;
        isActive?: boolean;
        mustChangePassword?: boolean;
      }>(
        '/auth/me',
        { auth: true, signal, timeoutMs: 15_000 },
      );
      const user = mapStaffAccount(data);
      return user;
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) return null;
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<StaffAccount> {
    const data = await request<Parameters<typeof mapStaffAccount>[0]>('/auth/change-password', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const user = mapStaffAccount(data);
    return user;
  },
};
