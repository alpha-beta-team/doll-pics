import { expect, test, type BrowserContext, type Route } from '@playwright/test';
import { checkPublicHtmlDeployment } from '../../scripts/check-public-html-deployment';

import { readFileSync } from 'node:fs';
const fixtures: Record<string, unknown> = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'));
// Serve the isolated build under its configured public origin so production analytics
// origin guards are exercised; every network request still stays mocked/local.
test.use({ baseURL: 'https://dollpictures.in' });

// Drain in-flight route.fetch calls while the page and its request context still exist.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

async function closeContext(context: BrowserContext) {
  try {
    for (const page of context.pages()) await page.unrouteAll({ behavior: 'wait' });
    await context.unrouteAll({ behavior: 'wait' });
  } finally { await context.close(); }
}

test('deployment validator accepts the isolated CMS-backed build and route exclusions', async () => {
  const results = await checkPublicHtmlDeployment({ baseUrl: 'http://127.0.0.1:4180', requireCms: true });
  expect(results.filter(result => result.failures.length)).toEqual([]);
});
async function servePublic(route: Route) {
  const url = new URL(route.request().url());
  if (url.origin === 'https://dollpictures.in') {
    const response = await route.fetch({ url: `http://127.0.0.1:4180${url.pathname}${url.search}` });
    return route.fulfill({ response });
  }
  if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType: 'application/javascript', body: '' });
  return url.origin === 'http://127.0.0.1:4180' ? route.continue() : route.abort();
}
const services = [
  { category: 'newborn', label: 'Newborn', path: '/newborn-baby-photography-erode' },
  { category: 'wedding', label: 'Wedding', path: '/wedding-photography-erode' },
  { category: 'maternity', label: 'Maternity', path: '/maternity-photography-erode' },
];
for (const service of services) {
  const pilot = service.path;
  const heading = `${service.label} sessions from the build`;

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`${service.label}: initial HTML is usable without JavaScript at ${viewport.width}px`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport });
      try {
        const page = await context.newPage();
        await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:4180'
          ? route.continue() : route.abort());
        const response = await page.goto(`http://127.0.0.1:4180${pilot}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator('#root h1')).toHaveText(heading);
        await expect(page.getByText(`A calm ${service.category} session`, { exact: true })).toBeVisible();
        const image = page.locator('#root img[src*="fixture-media/"]').first();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await expect(page.locator('a[href^="tel:"]').first()).toHaveAttribute('href', /^tel:\+/);
        await expect(page.locator('a[href*="wa.me"]').first()).toHaveAttribute('href', /wa\.me/);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://dollpictures.in${pilot}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      } finally { await closeContext(context); }
    });
  }

  for (const width of [390, 1440]) {
    test(`${service.label}: hydration retains the heading, saved theme and seeded content during a CMS outage at ${width}px`, async ({ page }) => {
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
          if (['/api/site-content', '/api/package-categories', `/api/categories/${service.category}`].includes(url.pathname)
            || (url.pathname === '/api/photos' && url.searchParams.get('category') === service.category)) seededRequests.push(url.pathname);
          return route.fulfill({ status: 503, json: { message: 'Fixture outage' } });
        }
        return servePublic(route);
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

  test(`${service.label}: hydrated enquiry submits once to the mock endpoint`, async ({ page }) => {
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
      return servePublic(route);
    });
    await page.goto(pilot);
    await page.getByRole('button', { name: 'Book a consultation', exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Send Enquiry', exact: true }).click();
    expect(submissions).toHaveLength(0);
    await expect(dialog.locator('input:invalid').first()).toBeVisible();
    await dialog.getByLabel('Your name (required)').fill('Fixture Visitor');
    await dialog.getByLabel('Phone number (required)').fill('9999999999');
    await expect(dialog.getByLabel('Category (required)')).toHaveValue(service.label);
    await dialog.getByRole('button', { name: 'Send Enquiry', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Thank you!');
    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toMatchObject({ name: 'Fixture Visitor', shootType: service.label });
    const leads = await page.evaluate(() => (window.dataLayer || []).map(entry => Array.from(entry as ArrayLike<unknown>)).filter(entry => entry[0] === 'event' && entry[1] === 'generate_lead'));
    expect(leads).toHaveLength(1);
  });

  test(`${service.label}: snapshot excludes unpublished/private fields and does not leak onto other routes`, async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:4180' });
    const response = await request.get(pilot);
    const html = await response.text();
    expect(html).not.toContain('PRIVATE_DRAFT_SENTINEL');
    expect(html).not.toContain('PRIVATE_FIELD_SENTINEL');
    expect(html).not.toContain('</script><script>window.snapshotInjected=true</script>');
    expect(html).toContain('public-page-snapshot');
    for (const path of ['/', '/family-photography-erode', '/admin/bookings', '/employee', '/kiosk', '/quotation/fixture', '/missing-pilot-test']) {
      const other = await request.get(path);
      expect(other.status()).toBe(path === '/missing-pilot-test' ? 404 : 200);
      expect(await other.text()).not.toContain('id="public-page-snapshot"');
    }
    await request.dispose();
  });

}

async function mockPublic(page: import('@playwright/test').Page) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.port === '4191') {
      const value = (fixtures as Record<string, unknown>)[url.pathname + url.search];
      return route.fulfill({ json: value ?? [] });
    }
    if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType: 'application/javascript', body: '' });
    return servePublic(route);
  });
}

test('cross-service navigation isolates imagery, metadata, enquiry defaults and analytics', async ({ page }) => {
  await mockPublic(page);
  await page.goto(services[0].path);
  for (const service of services) {
    if (service.category !== 'newborn') await page.locator(`a[href="${service.path}"]:visible`).first().click();
    await expect(page.locator('h1')).toHaveText(`${service.label} sessions from the build`);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://dollpictures.in${service.path}`);
    await expect(page.locator('#service-gallery button[aria-label^="Open "]').first()).toHaveAttribute('aria-label', new RegExp(service.label));
    await page.getByRole('button', { name: 'Book a consultation', exact: true }).first().click();
    await expect(page.getByRole('dialog').getByLabel('Category (required)')).toHaveValue(service.label);
    await page.getByRole('button', { name: 'Close booking form' }).click();
  }
  for (const path of ['/contact', '/packages', '/']) {
    await page.locator(`a[href="${path}"]:visible`).first().click();
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : path + '$'}`));
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/packages$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  const events = await page.evaluate(() => (window.dataLayer || []).map(entry => Array.from(entry as ArrayLike<unknown>)).filter(entry => entry[0] === 'event'));
  for (const service of services) {
    expect(events.filter(entry => entry[1] === 'page_view' && (entry[2] as { page_path?: string })?.page_path === service.path)).toHaveLength(1);
    expect(events.filter(entry => entry[1] === 'view_service' && (entry[2] as { page_path?: string })?.page_path === service.path)).toHaveLength(1);
  }
});

for (const service of services) {
  test(`${service.label}: gallery, FAQ and malformed snapshot recovery`, async ({ page }) => {
    await mockPublic(page);
    await page.route(`**${service.path}`, async route => {
      const response = await route.fetch({ url: `http://127.0.0.1:4180${service.path}` });
      const body = (await response.text()).replace(/(<script id="public-page-snapshot"[^>]*>)[\s\S]*?(<\/script>)/, '$1{"version":1,"path":"/wrong"}$2');
      await route.fulfill({ response, body });
    });
    await page.goto(service.path);
    await expect(page.locator('h1')).toHaveText(`${service.label} sessions from the build`);
    const more = page.getByRole('button', { name: /Show more/ });
    await more.click();
    await expect(page.getByRole('button', { name: /Show less/ })).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#service-gallery button[aria-label^="Open "]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const faq = page.locator('#faq details').first();
    await faq.locator('summary').click();
    await expect(faq).toHaveAttribute('open', '');
  });
}

for (const width of [390, 1440]) {
  for (const service of services) {
    test(`${service.label}: visual parity with client rendering at ${width}px`, async ({ browser }, testInfo) => {
      const results: { heading: unknown; images: string[] }[] = [];
      for (const baseline of [true, false]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        try {
          const page = await context.newPage();
          await mockPublic(page);
          await page.goto(`http://127.0.0.1:4180${service.path}${baseline ? '?client-only=1' : ''}`);
          await expect(page.locator('h1')).toHaveText(`${service.label} sessions from the build`);
          await page.evaluate(async () => { await document.fonts.ready; });
          await expect(page.locator('#service-gallery button[aria-label^="Open "]').first()).toHaveAttribute('aria-label', new RegExp(service.label));
          await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(resolve => setTimeout(resolve, 80)); } scrollTo(0, 0); });
          await page.waitForTimeout(700); // Let existing reveal transitions settle equally for both renders.
          results.push({ heading: await page.locator('h1').boundingBox(), images: await page.locator('#service-gallery img').evaluateAll(images => images.map(image => image.getAttribute('alt') || '')) });
          await page.screenshot({ path: testInfo.outputPath(`${service.category}-${baseline ? 'before' : 'after'}.png`), fullPage: true, animations: 'disabled' });
        } finally { await closeContext(context); }
      }
      expect(results[1]).toEqual(results[0]);
    });
  }
}
