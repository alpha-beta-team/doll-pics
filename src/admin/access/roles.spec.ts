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

test('content managers manage bookings and view enquiries without content permissions', () => {
  const access = ROLE_CATALOG.content_manager.access;
  assert.equal(access.dashboard, 'none');
  assert.equal(access.enquiries, 'view');
  assert.equal(access.bookings, 'manage');
  assert.equal(access.staff_profiles, 'none');
  assert.equal(access.photos, 'none');
  assert.equal(access.services, 'none');
  assert.equal(access.site_content, 'none');
  assert.equal(access.payments, 'none');
});

test('service editors and site settings have independent permissions', () => {
  assert.deepEqual(FEATURE_CATALOG.site_content.routes, ['/admin/site-content']);
  assert.deepEqual(FEATURE_CATALOG.services.routes, [
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
  assert.equal(getEffectiveAccess('content_manager', 'bookings'), 'manage');
  assert.equal(getEffectiveAccess('content_manager', 'bookings', { bookings: 'view' }), 'view');
  assert.equal(getEffectiveAccess('content_manager', 'photos', { photos: 'none' }), 'none');
});

test('salary management is manageable by owners and overrideable for other CMS roles', () => {
  assert.equal(FEATURE_CATALOG.salary_management.navigation.label, 'Salary Management');
  assert.equal(getEffectiveAccess('owner', 'salary_management'), 'manage');
  assert.equal(getEffectiveAccess('sales', 'salary_management'), 'none');
  assert.equal(getEffectiveAccess('sales', 'salary_management', { salary_management: 'view' }), 'view');
  assert.equal(getEffectiveAccess('sales', 'salary_management', { salary_management: 'manage' }), 'manage');
});
