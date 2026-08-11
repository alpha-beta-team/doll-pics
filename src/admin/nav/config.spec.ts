import assert from 'node:assert/strict';
import test from 'node:test';
import type { StaffAccount } from '../types';
import {
  activeNavigationRoute,
  flattenNavigation,
  PRIMARY_NAVIGATION,
  resolveNavigation,
} from './config';

const contentManager: StaffAccount = {
  id: 'content-user',
  email: 'content@example.com',
  name: 'Content Manager',
  role: 'content_manager',
  isActive: true,
  mustChangePassword: false,
};

test('services and site settings are separate visible website destinations', () => {
  const navigation = resolveNavigation(PRIMARY_NAVIGATION, contentManager);
  const leaves = flattenNavigation(navigation);
  const services = leaves.find((item) => item.id === 'services');
  const settings = leaves.find((item) => item.id === 'site-content');

  assert.equal(services?.route, '/admin/services');
  assert.equal(services?.access?.feature, 'site_content');
  assert.equal(settings?.label, 'Site Settings');
  assert.equal(settings?.route, '/admin/site-content');
});

test('nested service editor routes keep Services active in the sidebar', () => {
  const navigation = resolveNavigation(PRIMARY_NAVIGATION, contentManager);
  assert.equal(
    activeNavigationRoute(navigation, '/admin/services/507f1f77bcf86cd799439011'),
    '/admin/services',
  );
  assert.equal(
    activeNavigationRoute(navigation, '/admin/services/new'),
    '/admin/services',
  );
});
