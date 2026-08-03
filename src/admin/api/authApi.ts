import type { User } from '../types';
import { request } from './http';
import { authStorage } from './authStorage';

function storeUser(user: User) {
  authStorage.setUser(user);
}

function clearUser() {
  authStorage.clear();
}

function mapUser(data: {
  id?: string;
  email: string;
  name?: string;
  role?: User['role'];
  isActive?: boolean;
  mustChangePassword?: boolean;
}): User {
  return {
    id: data.id || 'admin',
    email: data.email,
    name: data.name || 'Studio Admin',
    role: data.role || 'owner',
    isActive: data.isActive !== false,
    mustChangePassword: data.mustChangePassword === true,
  };
}

export const authApi = {
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const data = await request<{
      accessToken: string;
      email: string;
      id?: string;
      name?: string;
      role?: User['role'];
      isActive?: boolean;
      mustChangePassword?: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user = mapUser(data);
    storeUser(user);
    return { user, token: data.accessToken };
  },

  async logout(): Promise<void> {
    clearUser();
  },

  /** Verifies the stored JWT with GET /auth/me; clears saved auth on failure. */
  async getCurrentUser(): Promise<User | null> {
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
        role?: User['role'];
        isActive?: boolean;
        mustChangePassword?: boolean;
      }>(
        '/auth/me',
        { auth: true },
      );
      const user = mapUser(data);
      storeUser(user);
      return user;
    } catch {
      authStorage.clear();
      return null;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    const data = await request<Parameters<typeof mapUser>[0]>('/auth/change-password', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const user = mapUser(data);
    storeUser(user);
    return user;
  },
};
