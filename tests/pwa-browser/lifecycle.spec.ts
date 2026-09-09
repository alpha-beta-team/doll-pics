import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('first installation caches executable shell; offline auth stays gated for admin', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('auth_token', 'test-only-token'));
  await page.goto('/__pwa-test/blank');
  await page.evaluate(async () => { await navigator.serviceWorker.register('/admin-sw.js'); await navigator.serviceWorker.ready; });
  const cached = await page.evaluate(async () => { const names = await caches.keys(); return (await (await caches.open(names[0])).keys()).map(request => request.url); });
  for (const pattern of [/work-shell-.*\.html$/, /AdminApp-.*\.js$/, /EmployeeApp-.*\.js$/, /KioskApp-.*\.js$/]) expect(cached.some(url => pattern.test(url))).toBe(true);
  expect(cached.some(url => /PhotosWorkspacePage|QuotationCanvasEditorPage|OwnerOverviewPage/.test(url))).toBe(false);
  expect(cached.some(url => url.includes('/api/'))).toBe(false);
  await context.setOffline(true);
  await page.goto('/admin/today');
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today’s work', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-token');
  await page.goto('/employee/'); await expect(page.locator('#root')).not.toBeEmpty();
  await page.goto('/kiosk/'); await expect(page.getByRole('heading', { name: 'Register office tablet' })).toBeVisible();
});

test('new release waits for old tab closure, then activates without reload', async ({ page, context }) => {
  await page.goto('/__pwa-test/blank');
  await page.evaluate(async () => { await navigator.serviceWorker.register('/admin-sw.js'); await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const initial = await page.evaluate(async () => (await caches.keys()).filter(name => name.startsWith('doll-work-shell-')));
  const next = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register('/admin-sw.js?fixture=next');
    await new Promise<void>(resolve => {
      if (registration.waiting) return resolve();
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed') resolve(); });
    });
    return { waiting: registration.waiting?.scriptURL, controller: navigator.serviceWorker.controller?.scriptURL };
  });
  expect(next.waiting).toContain('fixture=next'); expect(next.controller).not.toContain('fixture=next');
  await page.close();
  const reopened = await context.newPage(); await reopened.goto('/__pwa-test/blank');
  await expect.poll(() => reopened.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL)).toContain('fixture=next');
  const names = await reopened.evaluate(() => caches.keys());
  expect(names).toContain(initial[0]); expect(names.filter(name => name.startsWith('doll-work-shell-'))).toHaveLength(2);
});

test('failed update keeps previous worker and cache', async ({ page }) => {
  await page.goto('/__pwa-test/blank');
  await page.evaluate(async () => { await navigator.serviceWorker.register('/admin-sw.js'); await navigator.serviceWorker.ready; });
  const before = await page.evaluate(() => caches.keys());
  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register('/admin-sw.js?fixture=broken');
    const worker = registration.installing;
    if (worker) await new Promise<void>(resolve => { if (worker.state === 'redundant') return resolve(); worker.addEventListener('statechange', () => { if (worker.state === 'redundant') resolve(); }); });
    return registration.active?.scriptURL;
  });
  expect(state).not.toContain('fixture=broken'); expect(await page.evaluate(() => caches.keys())).toEqual(before);
});
