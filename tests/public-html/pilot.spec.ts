import { expect, test } from '@playwright/test';

const pilot = '/newborn-baby-photography-erode';
const heading = 'Newborn sessions from the build';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`initial HTML is usable without JavaScript at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport });
    const page = await context.newPage();
    await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4180'
      ? route.continue() : route.abort());
    const response = await page.goto(`http://127.0.0.1:4180${pilot}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('#root h1')).toHaveText(heading);
    await expect(page.getByText('A calm newborn session', { exact: true })).toBeVisible();
    const image = page.locator('#root img[src*="og-share.jpg"]').first();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('a[href^="tel:"]').first()).toHaveAttribute('href', /^tel:\+/);
    await expect(page.locator('a[href*="wa.me"]').first()).toHaveAttribute('href', /wa\.me/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://dollpictures.in${pilot}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}

for (const width of [390, 1440]) {
  test(`hydration retains the heading, saved theme and seeded content during a CMS outage at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const errors: string[] = [];
    const seededRequests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('doll-theme', 'light');
      new MutationObserver((_changes, observer) => {
        const element = document.querySelector('#root h1');
        if (element) {
          Object.assign(window, { originalHeading: element });
          observer.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.port === '4191') {
        if (['/api/site-content', '/api/package-categories', '/api/categories/newborn'].includes(url.pathname)
          || (url.pathname === '/api/photos' && url.searchParams.get('category') === 'newborn')) seededRequests.push(url.pathname);
        return route.fulfill({ status: 503, json: { message: 'Fixture outage' } });
      }
      return url.origin === 'http://127.0.0.1:4180' ? route.continue() : route.abort();
    });
    await page.goto(`${pilot}/`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Book a consultation', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('#root h1') === (window as unknown as { originalHeading: Element }).originalHeading)).toBe(true);
    expect(await page.evaluate(() => (window as unknown as { snapshotInjected?: boolean }).snapshotInjected)).toBeUndefined();
    await page.getByRole('button', { name: 'Close booking form' }).click();
    await page.locator('a[href="/contact"]:visible').first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await page.goBack();
    await expect(page.locator('#root h1')).toHaveText(heading);
    expect(seededRequests).toEqual([]);
    expect(errors.filter(message => /hydration|did not match|server HTML|Minified React error/i.test(message))).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}

test('hydrated enquiry submits once to the mock endpoint', async ({ page }) => {
  const submissions: unknown[] = [];
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.port === '4191') {
      if (url.pathname === '/api/enquiries' && request.method() === 'POST') {
        submissions.push(request.postDataJSON());
        return route.fulfill({ status: 201, json: { id: 'fixture-enquiry' } });
      }
      return route.fulfill({ json: [] });
    }
    return url.origin === 'http://127.0.0.1:4180' ? route.continue() : route.abort();
  });
  await page.goto(pilot);
  await page.getByRole('button', { name: 'Book a consultation', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name (required)').fill('Fixture Visitor');
  await dialog.getByLabel('Phone number (required)').fill('9999999999');
  await expect(dialog.getByLabel('Category (required)')).toHaveValue('Newborn');
  await dialog.getByRole('button', { name: 'Send Enquiry', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Thank you!');
  expect(submissions).toHaveLength(1);
  expect(submissions[0]).toMatchObject({ name: 'Fixture Visitor', shootType: 'Newborn' });
});

test('snapshot excludes unpublished/private fields and does not leak onto other routes', async ({ request }) => {
  const response = await request.get(pilot);
  const html = await response.text();
  expect(html).not.toContain('PRIVATE_DRAFT_SENTINEL');
  expect(html).not.toContain('PRIVATE_FIELD_SENTINEL');
  expect(html).not.toContain('</script><script>window.snapshotInjected=true</script>');
  expect(html).toContain('public-page-snapshot');
  for (const path of ['/', '/wedding-photography-erode', '/admin/bookings', '/employee', '/kiosk', '/quotation/fixture', '/missing-pilot-test']) {
    const other = await request.get(path);
    expect(other.status()).toBe(path === '/missing-pilot-test' ? 404 : 200);
    expect(await other.text()).not.toContain('id="public-page-snapshot"');
  }
});
