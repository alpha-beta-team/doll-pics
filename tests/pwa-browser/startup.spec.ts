import { test, expect, type Page } from '@playwright/test';

const user = { id: 'test-owner', email: 'test@example.invalid', name: 'Test Owner', role: 'owner', isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false };
async function saved(page: Page) { await page.addInitScript(() => localStorage.setItem('auth_token', 'test-only-token')); }
async function mock(page: Page, options: { authStatus?: number; passwordChange?: boolean; role?: string } = {}) {
  const calls: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue(); calls.push(`${route.request().method()} ${path}`);
    if (path === '/api/auth/me') return route.fulfill({ status: options.authStatus || 200, json: options.authStatus ? { message: 'Temporary error' } : { ...user, role: options.role || user.role, mustChangePassword: options.passwordChange || false } });
    if (path === '/api/auth/login') return route.fulfill({ json: { ...user, accessToken: 'new-test-token' } });
    if (path === '/api/admin/lists/enquiries') return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });
  return calls;
}

test('enquiries loads without removed page links', async ({ page }) => {
  await saved(page); await mock(page);
  await page.goto('/admin/enquiries');
  await expect(page.getByRole('heading', { name: 'No enquiries yet', exact: true })).toBeVisible();
  for (const name of ['Today', 'Integrations', 'Quick Guide / Help']) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
  }
});

test('503 retains credentials, gates work, and Retry recovers', async ({ page }) => {
  await saved(page); await page.clock.install(); let fail = true, workCalls = 0;
  await page.route('**/api/**', route => {
    if (!new URL(route.request().url()).pathname.startsWith('/api/')) return route.continue();
    if (route.request().url().includes('/auth/me')) return route.fulfill({ status: fail ? 503 : 200, json: fail ? { message: 'Temporary outage' } : user });
    workCalls++; return route.fulfill({ json: [] });
  });
  await page.goto('/admin/enquiries');
  await expect(page.getByText('Connecting to your account. This may take up to 90 seconds…')).toBeVisible();
  await page.clock.fastForward(90_100);
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-token'); expect(workCalls).toBe(0);
  fail = false; await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No enquiries yet', exact: true })).toBeVisible(); expect(workCalls).toBeGreaterThan(0);
});

for (const status of [401, 403]) test(`HTTP ${status} clears expired/revoked credentials`, async ({ page }) => {
  await saved(page); await mock(page, { authStatus: status }); await page.goto('/admin/enquiries');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBeNull();
});

test('password change entry shares recovery and forced-password routing', async ({ page }) => {
  await saved(page); await page.clock.install(); await mock(page, { authStatus: 503 }); await page.goto('/admin/change-password');
  await expect(page.getByText('Connecting to your account. This may take up to 90 seconds…')).toBeVisible();
  await page.clock.fastForward(90_100);
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.unrouteAll(); await mock(page, { passwordChange: true }); await page.reload();
  await expect(page.getByRole('heading', { name: 'Choose your password' })).toBeVisible();
});

test('successful login does not issue redundant auth/me', async ({ page }) => {
  const calls = await mock(page); await page.goto('/admin/login');
  await page.locator('#email').fill('test@example.invalid'); await page.locator('#password').fill('test-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_token'))).toBe('new-test-token');
  expect(calls.filter(call => call.includes('/auth/me'))).toHaveLength(0);
});

test('deferred route failure retains navigation and offers manual reload', async ({ page }) => {
  await saved(page); await mock(page); await page.goto('/admin/enquiries');
  await expect(page.getByRole('heading', { name: 'No enquiries yet', exact: true })).toBeVisible();
  await page.route('**/assets/SchedulePage-*.js', route => route.abort());
  await page.evaluate(() => { history.pushState({}, '', '/admin/schedule'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
  await expect(page.locator('nav').first()).toBeVisible();
  await page.goBack(); await expect(page.getByRole('heading', { name: 'No enquiries yet', exact: true })).toBeVisible();
});

for (const action of ['Logout', 'Login new']) test(`late verification cannot overwrite ${action}`, async ({ page }) => {
  await saved(page); await page.route('**/api/auth/login', route => route.fulfill({ json: { ...user, id: 'new-account', accessToken: 'new-token' } }));
  await page.goto('http://127.0.0.1:4179/tests/browser/fixtures/auth.html?hold=1');
  await expect(page.getByTestId('auth')).toContainText('checking');
  await page.getByRole('button', { name: action, exact: true }).click();
  await expect(page.getByTestId('auth')).toContainText(action === 'Logout' ? 'anonymous' : 'new-account');
  await page.getByRole('button', { name: 'Resolve old verification' }).click();
  await expect(page.getByTestId('auth')).not.toContainText('Old Account');
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe(action === 'Logout' ? null : 'new-token');
  const state = JSON.parse(await page.getByTestId('auth').innerText());
  expect(state.id).toBe(action === 'Logout' ? undefined : 'new-account');
});

test('every deferred admin module can be imported from the production build', async ({ page }) => {
  await page.goto('/admin/login');
  const result = await page.evaluate(async () => {
    const manifest = await (await fetch('/.vite/manifest.json')).json();
    const admin = Object.values(manifest).find((entry) => (entry as { name: string }).name === 'AdminApp') as { dynamicImports: string[] };
    return Promise.all(admin.dynamicImports.map(async key => { const file = manifest[key].file; await import('/' + file); return key; }));
  });
  expect(result.length).toBeGreaterThan(30);
});

test('restricted role cannot fetch or render owner-only staff screen', async ({ page }) => {
  await saved(page); const calls = await mock(page, { role: 'sales' });
  await page.goto('/admin/staff-accounts'); await expect(page).toHaveURL(/access-denied/);
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.every(call => call === 'GET /api/auth/me')).toBe(true);
});

test('session verification deadline provides Retry instead of endless loading', async ({ page }) => {
  await saved(page); await page.clock.install();
  await page.route('**/api/auth/me', () => new Promise(() => {}));
  const requested = page.waitForRequest('**/api/auth/me');
  await page.goto('/admin/enquiries'); await requested;
  await page.clock.fastForward(90_100);
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-token');
});
