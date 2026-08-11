import assert from 'node:assert/strict';
import test from 'node:test';
import type { StaffAccount } from '../types';
import { filterStaffAccounts } from './staffAccounts.utils';

const accounts: StaffAccount[] = [
  { id: '1', name: 'Anu Kumar', email: 'anu@example.com', role: 'sales', isActive: true, mustChangePassword: false },
  { id: '2', name: 'Meena', email: 'studio@example.com', role: 'content_manager', isActive: true, mustChangePassword: true },
];

test('filters staff accounts by name or email without case sensitivity', () => {
  assert.deepEqual(filterStaffAccounts(accounts, 'ANU'), [accounts[0]]);
  assert.deepEqual(filterStaffAccounts(accounts, 'studio@'), [accounts[1]]);
  assert.deepEqual(filterStaffAccounts(accounts, '  '), accounts);
});
