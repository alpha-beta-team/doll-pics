import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAccessSummary,
  getEffectiveAccess,
  getOverrideCount,
  normalizePermissionOverrides,
  normalizeUserRole,
  ROLE_CATALOG,
  ROLE_ORDER,
} from './roles';

test('normalizes the legacy operations role to sales', () => {
  assert.equal(normalizeUserRole('operations'), 'sales');
  assert.equal(normalizeUserRole('content_manager'), 'content_manager');
  assert.equal(normalizeUserRole(undefined, 'owner'), 'owner');
});

test('defines the fixed roles in their display order', () => {
  assert.deepEqual(ROLE_ORDER, ['owner', 'sales', 'content_manager']);
});

test('content managers can view enquiries and manage content and photos', () => {
  const access = ROLE_CATALOG.content_manager.access;
  assert.equal(access.dashboard, 'view');
  assert.equal(access.enquiries, 'view');
  assert.equal(access.content, 'manage');
  assert.equal(access.photos, 'manage');
  assert.equal(access.payments, 'none');
});

test('sales access is limited to dashboard and studio operations', () => {
  const summary = getAccessSummary('sales');
  assert.deepEqual(summary, ['Dashboard (view only)', 'Enquiries', 'Bookings', 'Schedule']);
});

test('normalizes valid overrides and ignores unknown values', () => {
  const overrides = normalizePermissionOverrides({
    bookings: 'view',
    photos: 'none',
    payments: 'unexpected',
    unknownArea: 'manage',
  });

  assert.deepEqual(overrides, { bookings: 'view', photos: 'none' });
  assert.equal(getOverrideCount(overrides), 2);
});

test('an override takes precedence over the role default', () => {
  assert.equal(getEffectiveAccess('content_manager', 'bookings'), 'none');
  assert.equal(getEffectiveAccess('content_manager', 'bookings', { bookings: 'view' }), 'view');
  assert.equal(getEffectiveAccess('content_manager', 'photos', { photos: 'none' }), 'none');
});
