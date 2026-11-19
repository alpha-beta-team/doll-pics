import { test, expect, type Page } from '@playwright/test';

const user = { id: 'owner', email: 'owner@example.invalid', name: 'Owner', role: 'owner', isActive: true, permissionOverrides: {}, permissions: [] };
async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem('auth_token', 'test-only'));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    if (path === '/api/auth/me') return route.fulfill({ json: user });
    if (path === '/api/admin/media/hero-slide') return route.fulfill({ json: { url: '/logo-doll.png', originalUrl: '/logo-doll.png', storageKey: 'fixture', imageTransform: null } });
    return route.fulfill({ json: [] });
  });
}

test('bookings list and create form load after splitting', async ({ page }) => {
  await setup(page); await page.goto('/admin/bookings');
  await expect(page.getByRole('heading', { name: 'No bookings yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Add booking', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('deferred photo crop and mocked upload still work', async ({ page }) => {
  await setup(page); await page.goto('/admin/hero-slides');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles('public/logo-doll.png');
  await expect(page.getByRole('button', { name: 'Apply crop' })).toBeEnabled();
  const upload = page.waitForRequest(request => request.method() === 'POST' && request.url().includes('/admin/media/hero-slide'));
  await page.getByRole('button', { name: 'Apply crop' }).click();
  expect((await upload).headers()['content-type']).toContain('multipart/form-data');
  await expect(page.getByRole('button', { name: 'Apply crop' })).toHaveCount(0);
  await expect(page.getByAltText('Hero slide preview')).toBeVisible();
});


for (const path of ['/admin/quotations', '/admin/quotations/q1']) {
  test(`removed quotations route redirects without fetching quotation data: ${path}`, async ({ page }) => {
    await setup(page);
    const quotationRequests: string[] = [];
    page.on('request', request => {
      if (/\/api\/(admin\/)?quotations(?:\/|$)/.test(new URL(request.url()).pathname)) quotationRequests.push(request.url());
    });
    await page.goto(path);
    await expect(page).not.toHaveURL(/\/admin\/quotations/);
    await expect(page.locator('nav').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Quotations', exact: true })).toHaveCount(0);
    expect(quotationRequests).toEqual([]);
  });
}

for (const path of ['/admin/occasions', '/admin/payments', '/admin/integrations', '/admin/help', '/admin/today']) {
  test(`removed operations page redirects without requesting its data: ${path}`, async ({ page }) => {
    await setup(page);
    const removedRequests: string[] = [];
    page.on('request', request => {
      if (/\/api\/admin\/(occasions|reports\/finance|integrations|work\/today)(?:\/|$)/.test(new URL(request.url()).pathname)) removedRequests.push(request.url());
    });
    await page.goto(path);
    await expect(page).not.toHaveURL(path);
    await expect(page.locator('nav').first()).toBeVisible();
    for (const name of ['Occasions', 'Revenue & Payments', 'Integrations', 'Quick Guide / Help', 'Today']) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
    }
    expect(removedRequests).toEqual([]);
  });
}
