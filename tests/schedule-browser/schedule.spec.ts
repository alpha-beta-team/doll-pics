import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, query = '') {
  await page.clock.install({ time: new Date('2026-11-14T07:00:00Z') });
  await page.goto(`/tests/browser/fixtures/schedule.html?${query}`);
  await expect(page.getByRole('heading', { name: 'Studio schedule' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading schedule' })).toHaveCount(0);
}

for (const width of [1440, 1024, 768]) {
  test(`all seven equal-width weekdays fit at ${width}px and keep headers while scrolling`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page, width === 1440 ? 'full' : '');
    const headers = page.locator('.sc-day-header');
    await expect(headers).toHaveCount(7);
    expect((await headers.first().boundingBox())!.height).toBeLessThanOrEqual(64);
    await expect(headers.first().locator('.sc-day-heading')).toHaveText('Mon9 Nov');
    await expect(headers.first().locator('.sc-day-stats')).toContainText('0 shoots·9h free');
    await expect(page.locator('.sc-calendar-corner')).toBeEmpty();
    if (width === 1440) await expect(headers.nth(3).locator('.sc-day-stats')).toContainText('Fully booked');
    await expect(page.getByRole('region', { name: 'Schedule controls' }).getByRole('button', { name: 'Review overlaps' })).toBeVisible();
    await expect(page.locator('.sc-overlap-notice')).toHaveCount(0);
    const boxes = await headers.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    }));
    expect(Math.max(...boxes.map(box => box.width)) - Math.min(...boxes.map(box => box.width))).toBeLessThan(1);
    expect(boxes[0].left).toBeGreaterThanOrEqual(0);
    expect(boxes[6].right).toBeLessThanOrEqual(width);
    expect(await page.locator('.sc-calendar-scroll').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`week-${width}.png`), fullPage: true });
    const before = await headers.first().boundingBox();
    await page.locator('.sc-calendar-scroll').evaluate(node => { node.scrollTop = 350; });
    const after = await headers.first().boundingBox();
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(1);
  });
}

test('crowded week opens a readable day with top-aligned details and existing Add controls', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '3 shoots on Wed, 11 Nov. View day' }).click();
  await expect(page.getByRole('region', { name: 'Day calendar' })).toBeVisible();
  const longShoot = page.getByRole('button', { name: /^Long shoot,/ });
  await expect(longShoot).toBeVisible();
  const inset = await longShoot.evaluate(node => node.querySelector('strong')!.getBoundingClientRect().top - node.getBoundingClientRect().top);
  expect(inset).toBeLessThan(12);
  await expect(page.getByRole('button', { name: /Create booking Wed, 11 Nov at 11:00 AM/ })).toBeVisible();
  await page.getByRole('button', { name: /Create booking Wed, 11 Nov at 11:00 AM/ }).click();
  await expect(page.getByRole('dialog', { name: 'Choose shoot duration' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('overlap review lists every pair, exact times, and opens the affected day', async ({ page }) => {
  await open(page);
  await expect(page.locator('.sc-overlap-badge')).toContainText('5 overlaps');
  const review = page.getByRole('button', { name: 'Review overlaps' });
  await review.click();
  const dialog = page.getByRole('dialog', { name: 'Review time overlaps' });
  await expect(dialog.locator('article')).toHaveCount(5);
  const saturday = dialog.locator('article').filter({ hasText: 'Saturday first' });
  await expect(saturday).toContainText('12:00 PM–1:00 PM');
  await expect(saturday).toContainText('Photographer · Studio');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(review).toBeFocused();
  await review.click();
  await dialog.locator('article').filter({ hasText: 'Sunday first' }).getByRole('button', { name: 'View day' }).click();
  await expect(page.getByRole('region', { name: 'Day calendar' })).toBeVisible();
  await expect(page.locator('.sc-period')).toContainText('Sunday, 15 November 2026');
  await expect(page.getByRole('button', { name: /^Sunday first,/ })).toBeVisible();
});

test('review rescheduling uses the original save flow and reloads overlaps', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Review overlaps' }).click();
  await page.getByRole('button', { name: 'Reschedule Saturday first', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Reschedule booking' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Custom start').fill('14:00');
  await dialog.getByLabel('Custom end').fill('16:00');
  await expect(dialog.getByRole('button', { name: 'Save new time' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save new time' }).click();
  await expect(page.locator('.sc-overlap-badge')).toContainText('4 overlaps');
});

for (const width of [390, 320]) {
  test(`mobile agenda has week navigation, grouped free periods and visible Add at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await open(page);
    await expect(page.getByRole('region', { name: 'Day agenda' })).toBeVisible();
    expect((await page.getByLabel('Choose date').boundingBox())!.width).toBeGreaterThan(120);
    await expect(page.getByRole('navigation', { name: 'Choose day of week' }).getByRole('button')).toHaveCount(7);
    await expect(page.locator('.sc-agenda-summary')).toContainText('6h unbooked');
    await expect(page.locator('.sc-agenda-gap')).toHaveCount(1);
    await expect(page.locator('.sc-agenda-gap')).toContainText('2 PM–8 PM');
    await expect(page.getByRole('button', { name: 'Add booking at 2 PM' })).toBeVisible();
    await expect(page.locator('.sc-current-time')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`agenda-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Sun, 15 Nov', exact: true }).click();
    await expect(page.locator('.sc-period')).toContainText('Sunday, 15 November 2026');
    await expect(page.locator('.sc-agenda-summary')).toContainText('7h unbooked');
    await page.getByRole('button', { name: 'Add booking at 11 AM' }).click();
    await expect(page.getByRole('dialog', { name: 'Choose shoot duration' })).toBeVisible();
  });
}

test('untimed bookings warn against relying on unbooked periods; cancelled bookings do not consume time', async ({ page }) => {
  await open(page, 'untimed');
  await page.getByRole('button', { name: 'agenda', exact: true }).click();
  await expect(page.getByText('Set these times before relying on unbooked periods.')).toBeVisible();
  await expect(page.locator('.sc-agenda-summary')).toContainText('3 shoots');
  await page.getByText('Display', { exact: true }).click();
  await page.getByLabel('Show cancelled').check();
  await expect(page.locator('.sc-agenda-booking').filter({ hasText: 'Cancelled shoot' })).toBeVisible();
  await expect(page.locator('.sc-agenda-summary')).toContainText('6h unbooked');
});

test('read-only schedule can inspect overlaps but offers no creation or rescheduling', async ({ page }) => {
  await open(page, 'readonly');
  await expect(page.getByRole('button', { name: /Create booking/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review overlaps' }).click();
  await expect(page.getByRole('button', { name: /Reschedule/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Saturday first', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Booking detail' })).toBeVisible();
});

test('current time uses IST and density toggles without changing times', async ({ page }) => {
  await open(page);
  await expect(page.getByLabel('Current time 12:30 PM')).toHaveCount(1);
  const marker = page.locator('.sc-current-time');
  const compactTop = await marker.evaluate(node => (node as HTMLElement).offsetTop);
  await page.getByText('Display', { exact: true }).click();
  await page.getByLabel('Compact calendar').uncheck();
  expect(await marker.evaluate(node => (node as HTMLElement).offsetTop)).toBeGreaterThan(compactTop);
  await expect(page.getByLabel('Current time 12:30 PM')).toHaveCount(1);
});

test('load failures do not present misleading free time or stale overlaps', async ({ page }) => {
  await open(page, 'error');
  await expect(page.getByRole('alert')).toContainText('Could not load schedule');
  await expect(page.locator('.sc-calendar, .sc-agenda, .sc-overlap-badge')).toHaveCount(0);
});
