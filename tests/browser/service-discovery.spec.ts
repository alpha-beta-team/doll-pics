import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const fixtures = JSON.parse(readFileSync(new URL('../public-html/fixtures.json', import.meta.url), 'utf8'));

test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: 'wait' }); });

test('preview keeps card geometry and navigation through missing, failed and repaired images', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => route.fulfill({ json: [] }));
  await page.route('**/broken-image.jpg', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/tests/browser/fixtures/service-preview.html');
  const card = page.getByTestId('card');
  await expect(card.locator('[data-service-image-fallback]')).toBeVisible();
  await expect(card.locator('img')).toHaveCount(0);
  const box = await card.boundingBox();
  await page.getByRole('button', { name: 'Fail image' }).click();
  await expect(card.locator('[data-service-image-fallback]')).toBeVisible();
  await page.getByRole('button', { name: 'Repair image' }).click();
  await expect(card.locator('img')).toBeVisible();
  await expect.poll(() => card.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(card.locator('img')).toHaveAttribute('alt', '');
  expect(await card.boundingBox()).toEqual(box);
  await page.getByRole('button', { name: 'Use category photo' }).click();
  await expect(card.locator('source[type="image/webp"]')).toHaveAttribute('srcset', /400w/);
  await expect(card.locator('img')).toHaveAttribute('loading', 'lazy');
  await card.click();
  await expect(page).toHaveURL(/newborn-baby-photography-erode$/);
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  for (const path of ['/', '/services', '/newborn-baby-photography-erode']) {
    test(`service discovery ${path} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith('/fixture-media/')) return route.fulfill({ contentType: 'image/jpeg', body: readFileSync('public/og-share.jpg') });
        if (url.pathname.startsWith('/api/')) {
          const data = fixtures[url.pathname + url.search] ?? fixtures[url.pathname] ?? [];
          return route.fulfill({ json: data });
        }
        return url.origin === 'http://127.0.0.1:4173' ? route.continue() : route.abort();
      });
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      const fallback = page.locator('[data-service-image-fallback]:visible').first();
      await fallback.scrollIntoViewIfNeeded();
      await expect(fallback).toBeVisible();
      await expect(page.locator('img[src=""]')).toHaveCount(0);
      if (path.includes('newborn')) await expect(page.locator('#contact a[href="/newborn-packages-erode"]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath('service-discovery.png'), fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

for (const path of ['/', '/gallery']) {
  test(`public photograph captions and lightbox labels are cleaned on ${path}`, async ({ page }) => {
    const photo = { id: 'real-photo', title: 'DSC01131', altText: 'IMG_1234.JPG', categoryIds: [{ name: 'Newborn', slug: 'newborn' }], variants: { original: { url: '/og-share.jpg' } } };
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/photos') return route.fulfill({ json: [photo] });
      if (url.pathname.startsWith('/api/')) return route.fulfill({ json: fixtures[url.pathname] ?? [] });
      return url.origin === 'http://127.0.0.1:4173' ? route.continue() : route.abort();
    });
    await page.goto(path);
    await expect(page.getByText('Newborn photography', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText('DSC01131');
    await expect(page.locator('img[alt="IMG_1234.JPG"]')).toHaveCount(0);
    if (path === '/gallery') {
      await page.locator('main button').filter({ has: page.locator('img') }).first().click();
      await expect(page.getByRole('dialog')).toContainText('Newborn photography');
    }
  });
}
