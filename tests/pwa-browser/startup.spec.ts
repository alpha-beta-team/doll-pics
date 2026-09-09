import { test, expect, type Page } from '@playwright/test';

const user = { id: 'test-owner', email: 'test@example.invalid', name: 'Test Owner', role: 'owner', isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false };
const task = { id: 'e1', entityType: 'enquiry', name: 'Test Client', phone: '9000000001', shootType: 'newborn', dueAt: '2026-09-08T10:00:00Z', overdue: true, whatsappOptIn: true };
const work = { date: '2026-09-09', tomorrow: '2026-09-10', timezone: 'Asia/Kolkata', followUps: [task], newEnquiries: [], todayShoots: [], tomorrowShoots: [] };
async function saved(page: Page) { await page.addInitScript(() => localStorage.setItem('auth_token', 'test-only-token')); }
async function mock(page: Page, options: { authStatus?: number; passwordChange?: boolean; role?: string } = {}) {
  const calls: string[] = [];
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname; calls.push(`${route.request().method()} ${path}`);
    if (path === '/api/auth/me') return route.fulfill({ status: options.authStatus || 200, json: options.authStatus ? { message: 'Temporary error' } : { ...user, role: options.role || user.role, mustChangePassword: options.passwordChange || false } });
    if (path === '/api/auth/login') return route.fulfill({ json: { ...user, accessToken: 'new-test-token' } });
    if (path === '/api/admin/work/today') { expect(new URL(route.request().url()).searchParams.get('view')).toBe('workspace'); return route.fulfill({ json: work }); }
    return route.fulfill({ json: {} });
  });
  return calls;
}

test('Today retains remaining actions and only loads startup chunks', async ({ page }) => {
  await saved(page); await mock(page);
  const scripts: string[] = []; page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await page.goto('/admin/today'); await expect(page.getByRole('heading', { name: 'Today’s work', exact: true })).toBeVisible();
  for (const title of ['Follow-ups', 'New enquiries', 'Today’s shoots', 'Tomorrow’s shoots']) await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  for (const title of ['End of day', 'Review requests', 'Birthdays & anniversaries', 'Payments due']) await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  expect(scripts.some(url => /PhotosWorkspacePage|QuotationCanvasEditorPage|OwnerOverviewPage|downloadQuotationPdf/.test(url))).toBe(false);
  await page.getByRole('button', { name: "Reschedule Test Client's follow-up" }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Message Test Client on WhatsApp' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('503 retains credentials, gates work, and Retry recovers', async ({ page }) => {
  await saved(page); let fail = true, workCalls = 0;
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/auth/me')) return route.fulfill({ status: fail ? 503 : 200, json: fail ? { message: 'Temporary outage' } : user });
    workCalls++; return route.fulfill({ json: work });
  });
  await page.goto('/admin/today'); await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-token'); expect(workCalls).toBe(0);
  fail = false; await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Today’s work', exact: true })).toBeVisible(); expect(workCalls).toBe(1);
});

for (const status of [401, 403]) test(`HTTP ${status} clears expired/revoked credentials`, async ({ page }) => {
  await saved(page); await mock(page, { authStatus: status }); await page.goto('/admin/today');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBeNull();
});

test('password change entry shares recovery and forced-password routing', async ({ page }) => {
  await saved(page); await mock(page, { authStatus: 503 }); await page.goto('/admin/change-password');
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

test('refresh failure retains visible work and retry action', async ({ page }) => {
  await saved(page); await mock(page); await page.goto('/admin/today');
  await expect(page.getByText('Test Client', { exact: true })).toBeVisible();
  await page.route('**/api/admin/work/today?*', route => route.fulfill({ status: 503, json: { message: 'Temporary outage' } }));
  await page.getByRole('button', { name: 'Refresh today’s work' }).click();
  await expect(page.getByText(/Showing previously loaded work/)).toBeVisible();
  await expect(page.getByText('Test Client', { exact: true })).toBeVisible();
});

test('deferred route failure retains navigation and offers manual reload', async ({ page }) => {
  await saved(page); await mock(page); await page.goto('/admin/today');
  await expect(page.getByRole('heading', { name: 'Today’s work', exact: true })).toBeVisible();
  await page.route('**/assets/HelpPage-*.js', route => route.abort());
  await page.evaluate(() => { history.pushState({}, '', '/admin/help'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
  await expect(page.locator('nav').first()).toBeVisible();
  await page.goBack(); await expect(page.getByRole('heading', { name: 'Today’s work', exact: true })).toBeVisible();
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

test('follow-up completion and rescheduling preserve request contracts', async ({ page }) => {
  await saved(page); const calls = await mock(page); await page.goto('/admin/today');
  await page.getByRole('button', { name: "Mark Test Client's follow-up done" }).click();
  await expect(page.getByText("Test Client's follow-up is done.")).toBeVisible();
  expect(calls).toContain('POST /api/admin/enquiries/e1/follow-up/complete');
  await page.getByRole('button', { name: "Reschedule Test Client's follow-up" }).click();
  await page.getByRole('button', { name: 'Tomorrow 10 AM' }).click();
  const patched = page.waitForRequest(request => request.method() === 'PATCH' && request.url().includes('/enquiries/e1/follow-up'));
  await page.getByRole('button', { name: 'Save follow-up' }).click();
  expect((await patched).postDataJSON().scheduledAt).toMatch(/T04:30:00\.000Z$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('restricted role cannot fetch or render owner-only staff screen', async ({ page }) => {
  await saved(page); const calls = await mock(page, { role: 'sales' });
  await page.goto('/admin/staff-accounts'); await expect(page).toHaveURL(/access-denied/);
  expect(calls).toEqual(['GET /api/auth/me']);
});

test('session verification deadline provides Retry instead of endless loading', async ({ page }) => {
  await saved(page); await page.clock.install();
  await page.route('**/api/auth/me', () => new Promise(() => {}));
  const requested = page.waitForRequest('**/api/auth/me');
  await page.goto('/admin/today'); await requested;
  await page.clock.runFor(15_100);
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-token');
});
