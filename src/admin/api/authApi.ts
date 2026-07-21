import type { User } from '../types';
import { request } from './http';

const AUTH_USER_KEY = 'auth_user';

function storeUser(user: User) {
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearUser() {
  sessionStorage.removeItem(AUTH_USER_KEY);
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
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user: User = {
      id: data.id || 'admin',
      email: data.email,
      name: data.name || 'Studio Admin',
    };
    storeUser(user);
    return { user, token: data.accessToken };
  },

  async logout(): Promise<void> {
    clearUser();
  },

  /** Verifies the stored JWT with GET /auth/me; clears session on failure. */
  async getCurrentUser(): Promise<User | null> {
    const token = sessionStorage.getItem('auth_token');
    if (!token) {
      clearUser();
      return null;
    }

    try {
      const data = await request<{ id: string; email: string; name?: string }>(
        '/auth/me',
        { auth: true },
      );
      const user: User = {
        id: data.id,
        email: data.email,
        name: data.name || 'Studio Admin',
      };
      storeUser(user);
      return user;
    } catch {
      sessionStorage.removeItem('auth_token');
      clearUser();
      return null;
    }
  },
};
