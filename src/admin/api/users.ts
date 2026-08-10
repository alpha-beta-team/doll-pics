import type { User } from '../types';
import { normalizePermissionOverrides, normalizeUserRole } from '../access/roles';
import { request } from './http';

type AdminUserResponse = Omit<User, 'jobTitle' | 'role' | 'permissionOverrides'> & {
  jobTitle?: unknown;
  role?: unknown;
  permissionOverrides?: unknown;
};

export function normalizeAdminUser(user: AdminUserResponse): User {
  return {
    ...user,
    jobTitle: typeof user.jobTitle === 'string' ? user.jobTitle : '',
    role: normalizeUserRole(user.role),
    permissionOverrides: normalizePermissionOverrides(user.permissionOverrides),
  };
}

export const usersApi = {
  async getAdminUsers(): Promise<User[]> {
    const users = await request<AdminUserResponse[]>('/admin/users', { auth: true });
    return users.map(normalizeAdminUser);
  },
  async createAdminUser(data: {
    name: string;
    jobTitle: string;
    email: string;
    temporaryPassword: string;
    role: User['role'];
    permissionOverrides?: User['permissionOverrides'];
  }): Promise<User> {
    const user = await request<AdminUserResponse>('/admin/users', {
      method: 'POST', auth: true, body: JSON.stringify(data),
    });
    return normalizeAdminUser(user);
  },
  async updateAdminUser(id: string, data: Partial<Pick<User, 'name' | 'jobTitle' | 'role' | 'permissionOverrides' | 'isActive'>>): Promise<User> {
    const user = await request<AdminUserResponse>(`/admin/users/${id}`, {
      method: 'PATCH', auth: true, body: JSON.stringify(data),
    });
    return normalizeAdminUser(user);
  },
  async resetAdminUserPassword(id: string, temporaryPassword: string): Promise<User> {
    const user = await request<AdminUserResponse>(`/admin/users/${id}/reset-password`, {
      method: 'POST', auth: true, body: JSON.stringify({ temporaryPassword }),
    });
    return normalizeAdminUser(user);
  },
};
