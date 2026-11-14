import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryDeadlineLabel } from '../src/admin/components/deliveryQueue.utils';
import { flattenNavigation, PRIMARY_NAVIGATION, resolveNavigation } from '../src/admin/nav/config';
import type { StaffAccount } from '../src/admin/types';

test('delivery deadlines use calendar dates and distinguish today from overdue', () => {
  assert.equal(deliveryDeadlineLabel('', '2026-11-05'), 'Delivery date not set');
  assert.equal(deliveryDeadlineLabel('2026-11-05', '2026-11-05'), 'Due today');
  assert.equal(deliveryDeadlineLabel('2026-11-04', '2026-11-05'), '1 day overdue');
  assert.equal(deliveryDeadlineLabel('2026-11-02', '2026-11-05'), '3 days overdue');
  assert.equal(deliveryDeadlineLabel('2026-11-06', '2026-11-05'), '1 day remaining');
  assert.equal(deliveryDeadlineLabel('2026-11-08', '2026-11-05'), '3 days remaining');
  assert.equal(deliveryDeadlineLabel('2026-11-02', '2026-11-05', true), 'Delivered');
});

test('only the owner receives a delivery queue navigation entry', () => {
  for (const role of ['owner', 'sales', 'content_manager', 'employee'] as const) {
    const account = { id: 'test', name: 'Test', role, isActive: true, permissions: [], permissionOverrides: {} } as StaffAccount;
    const routes = flattenNavigation(resolveNavigation(PRIMARY_NAVIGATION, account)).map(item => item.route);
    assert.equal(routes.includes('/admin/delivery'), role === 'owner');
  }
});
