import type { User } from '../types';

export function filterAdminUsers(users: User[], query: string): User[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return users;
  return users.filter((user) =>
    `${user.name} ${user.email}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}
