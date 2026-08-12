import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FEATURE_CATALOG,
  getAccessSummary,
  getEffectiveAccess,
  getOverrideCount,
  normalizePermissionOverrides,
  normalizeStaffAccountRole,
  ROLE_CATALOG,
  ROLE_ORDER,
} from './roles';

test('normalizes the legacy operations role to sales', () => {
  assert.equal(normalizeStaffAccountRole('operations'), 'sales');
  assert.equal(normalizeStaffAccountRole('content_manager'), 'content_manager');
  assert.equal(normalizeStaffAccountRole(undefined, 'owner'), 'owner');
});

test('defines CMS and employee roles in their display order', () => {
  assert.deepEqual(ROLE_ORDER, ['owner', 'sales', 'content_manager', 'employee']);
  assert.equal(normalizeStaffAccountRole('employee'), 'employee');
  assert.deepEqual(getAccessSummary('employee'), []);
});

test('content managers can view enquiries and manage content and photos', () => {
  const access = ROLE_CATALOG.content_manager.access;
  assert.equal(access.dashboard, 'view');
  assert.equal(access.enquiries, 'view');
  assert.equal(access.staff_profiles, 'manage');
  assert.equal(access.photos, 'manage');
  assert.equal(access.payments, 'none');
});

test('site content access covers settings and service editor routes', () => {
  assert.deepEqual(FEATURE_CATALOG.site_content.routes, [
    '/admin/site-content',
    '/admin/services',
    '/admin/services/new',
    '/admin/services/:id',
  ]);
  assert.equal(FEATURE_CATALOG.site_content.navigation.label, 'Site Settings');
});

test('sales access is limited to dashboard and studio operations', () => {
  const summary = getAccessSummary('sales');
  assert.deepEqual(summary, [
    'Dashboard (view only)',
    'Today',
    'Enquiries',
    'Bookings',
    'Schedule',
    'Occasions',
    'Quotations',
  ]);
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
