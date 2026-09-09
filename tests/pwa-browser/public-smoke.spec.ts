import { test, expect } from '@playwright/test';

for (const path of ['/', '/contact', '/services', '/packages']) test(`public HTML and hydration stay intact: ${path}`, async ({ page, request }) => {
  const html = await request.get(path);
  expect(html.status()).toBe(200);
  expect(await html.text()).toContain('public-page-snapshot');
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(path); await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.locator('h1').first()).toBeVisible();
  expect(errors).toEqual([]);
  await expect(page.getByRole('button', { name: 'Reload page' })).toHaveCount(0);
});
