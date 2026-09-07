import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('development startup removes the old app worker and preserves unrelated caches', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // This fixture does not execute main.tsx, so it can recreate an older dev session.
  await page.goto('/tests/browser/fixtures/cms.html');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/admin-sw.js');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
    const oldCache = await caches.open('doll-work-shell-obsolete');
    await oldCache.put('/old-dev-module.js', new Response('stale module'));
    await caches.open('unrelated-local-cache');
  });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(() => page.evaluate(async () => ({
    controlled: Boolean(navigator.serviceWorker.controller),
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
    appCaches: (await caches.keys()).filter(name => name.startsWith('doll-work-shell-')).length,
  }))).toEqual({ controlled: false, registrations: 0, appCaches: 0 });
  expect(await page.evaluate(() => caches.has('unrelated-local-cache'))).toBe(true);
  await page.goto('/admin');
  await expect(page.locator('body')).toContainText(/sign in|login/i);
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  expect(errors).toEqual([]);
});
