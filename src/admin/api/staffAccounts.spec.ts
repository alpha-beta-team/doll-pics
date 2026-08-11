import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeStaffAccount } from './staffAccounts';

test('normalizes legacy operations staff accounts returned by the API', () => {
  const account = normalizeStaffAccount({
    id: 'user-1',
    name: 'Maya',
    email: 'maya@example.com',
    role: 'operations',
    permissionOverrides: { bookings: 'view', payments: 'invalid' },
    isActive: true,
    mustChangePassword: false,
  });

  assert.equal(account.role, 'sales');
  assert.deepEqual(account.permissionOverrides, { bookings: 'view' });
});
