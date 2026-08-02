const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

function migrateSessionValue(key: string): string | null {
  const persistentValue = localStorage.getItem(key);
  if (persistentValue) return persistentValue;

  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue) {
    localStorage.setItem(key, sessionValue);
    sessionStorage.removeItem(key);
  }

  return sessionValue;
}

export const authStorage = {
  getToken(): string | null {
    return migrateSessionValue(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  },

  setUser(user: unknown): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(AUTH_USER_KEY);
  },

  clear(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  },
};
