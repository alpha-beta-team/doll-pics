import type { User } from '../types';
import { request } from './http';

export const usersApi = {
  getAdminUsers(): Promise<User[]> {
    return request<User[]>('/admin/users', { auth: true });
  },
  createAdminUser(data: {
    name: string;
    email: string;
    temporaryPassword: string;
    role: User['role'];
  }): Promise<User> {
    return request<User>('/admin/users', {
      method: 'POST', auth: true, body: JSON.stringify(data),
    });
  },
  updateAdminUser(id: string, data: Partial<Pick<User, 'name' | 'role' | 'isActive'>>): Promise<User> {
    return request<User>(`/admin/users/${id}`, {
      method: 'PATCH', auth: true, body: JSON.stringify(data),
    });
  },
  resetAdminUserPassword(id: string, temporaryPassword: string): Promise<User> {
    return request<User>(`/admin/users/${id}/reset-password`, {
      method: 'POST', auth: true, body: JSON.stringify({ temporaryPassword }),
    });
  },
};
