import assert from 'node:assert/strict';
import test from 'node:test';
import type { User } from '../types';
import { filterAdminUsers } from './users.utils';

const users: User[] = [
  { id: '1', name: 'Anu Kumar', email: 'anu@example.com', role: 'sales', isActive: true, mustChangePassword: false },
  { id: '2', name: 'Meena', email: 'studio@example.com', role: 'content_manager', isActive: true, mustChangePassword: true },
];

test('filters users by name or email without case sensitivity', () => {
  assert.deepEqual(filterAdminUsers(users, 'ANU'), [users[0]]);
  assert.deepEqual(filterAdminUsers(users, 'studio@'), [users[1]]);
  assert.deepEqual(filterAdminUsers(users, '  '), users);
});
