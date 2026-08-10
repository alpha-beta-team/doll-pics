import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAdminUser } from './users';

test('normalizes legacy operations users returned by the API', () => {
  const user = normalizeAdminUser({
    id: 'user-1',
    name: 'Maya',
    email: 'maya@example.com',
    role: 'operations',
    permissionOverrides: { bookings: 'view', payments: 'invalid' },
    isActive: true,
    mustChangePassword: false,
  });

  assert.equal(user.role, 'sales');
  assert.deepEqual(user.permissionOverrides, { bookings: 'view' });
});
