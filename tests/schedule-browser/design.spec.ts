import { test, expect, type Page } from '@playwright/test';

async function schedule(page: Page, query = 'workflow') {
  await page.clock.install({ time: new Date('2026-11-14T07:00:00Z') });
  await page.goto(`/tests/browser/fixtures/schedule.html?${query}`);
  await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading schedule' })).toHaveCount(0);
}
const card = (page: Page, name: string) => page.locator('.sc-event').filter({ has: page.locator('strong > span', { hasText: name }) });

test('matches the schedule hierarchy and derives live shoots and alerts from data', async ({ page }) => {
  await schedule(page);
  const summary = page.getByRole('region', { name: 'Today and alerts' });
  await expect(summary.getByText('Now 12:30')).toBeVisible();
  await expect(summary.getByRole('button', { name: /Saturday First.*till/i })).toBeVisible();
  await expect(summary.getByRole('button', { name: /Saturday Second.*till/i })).toBeVisible();
  await expect(summary.getByRole('button', { name: /Future One/i })).toBeVisible();
  await expect(summary.getByRole('button', { name: '4 to close' })).toBeVisible();
  await expect(summary.getByRole('button', { name: '5 clashes' })).toBeVisible();
  await expect(page.locator('.sc-event')).toHaveCount(11);
  await expect(page.getByText('Shoot (photographer named on card)')).toBeVisible();
  await page.screenshot({ path: '/tmp/schedule-desktop-final.png', fullPage: true });
  await expect(card(page, 'Legacy Draft')).toHaveAttribute('data-timing', '');
  await expect(card(page, 'Saturday First')).toHaveCSS('background-color', 'rgb(234, 243, 243)');
});

test('keeps overlapping and short shoots separately readable and clickable', async ({ page }) => {
  await schedule(page);
  for (const name of ['Long Shoot', 'Wednesday Second', 'Wednesday Third', 'Future One', 'Future Two', 'Sunday First', 'Sunday Second']) {
    const event = card(page, name);
    await event.scrollIntoViewIfNeeded();
    const box = await event.boundingBox();
    const content = await event.locator('.sc-event-content').boundingBox();
    expect(content!.y + content!.height).toBeLessThanOrEqual(box!.y + box!.height);
    await event.click();
    await expect(page.getByRole('dialog').getByRole('heading', { name, exact: true })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  }
});

test('shows real clash pairs and opens each booking or its day', async ({ page }) => {
  await schedule(page);
  await page.getByRole('button', { name: '5 clashes' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Photographer clashes' })).toBeVisible();
  await expect(dialog.locator('.sc-overlap-pair')).toHaveCount(5);
  await dialog.getByRole('button', { name: /View day/ }).first().click();
  await expect(page.getByRole('region', { name: 'Day calendar' })).toBeVisible();
  await expect(page.locator('.sc-event')).toHaveCount(3);
});

test('retains cancelled display and photographer highlighting without hiding other shoots', async ({ page }) => {
  await schedule(page);
  await page.getByText('9 – 15 Nov', { exact: true }).click();
  await page.getByLabel('Show cancelled').check();
  await expect(page.locator('.sc-event')).toHaveCount(12);
  await page.getByLabel('Highlight photographer').selectOption('second');
  await page.keyboard.press('Escape');
  await expect(page.locator('.sc-event')).toHaveCount(12);
  await expect(card(page, 'Future Two')).toHaveAttribute('data-dimmed', 'false');
  await expect(card(page, 'Future One')).toHaveAttribute('data-dimmed', 'true');
  await expect(card(page, 'Cancelled Shoot')).toHaveAttribute('data-status', 'cancelled');
  await expect(page.getByRole('button', { name: '5 clashes' })).toBeVisible();
});

test('navigates across dates and returns to today without retaining the old calendar', async ({ page }) => {
  await schedule(page);
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.locator('.sc-event')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '0 clashes' })).toBeDisabled();
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.locator('.sc-event')).toHaveCount(11);
  await page.getByRole('button', { name: 'day', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Day calendar' })).toBeVisible();
  await expect(page.locator('.sc-event')).toHaveCount(5);
});

test('preserves assignment, completion confirmation and keyboard dismissal', async ({ page }) => {
  await schedule(page);
  await card(page, 'Saturday First').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Change', exact: true }).click();
  await dialog.getByLabel('Change photographer').selectOption('second');
  await expect(dialog.locator('dd').first()).toContainText('Second photographer');
  await dialog.getByRole('button', { name: 'Mark as done' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Mark as done' }).click();
  await expect(dialog.getByText('Done', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(card(page, 'Saturday First')).toBeFocused();
});

test('uses a readable mobile agenda without overflowing the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await schedule(page);
  await expect(page.getByRole('region', { name: 'Day agenda' })).toBeVisible();
  expect((await page.locator('.sc-navigation').boundingBox())!.width).toBeGreaterThanOrEqual(200);
  await expect(page.getByLabel('Choose date')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next day' })).toBeInViewport();
  await page.screenshot({ path: '/tmp/schedule-mobile-toolbar-final.png' });
  await expect(page.locator('.sc-agenda-booking')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('navigation', { name: 'Choose day of week' }).getByRole('button', { name: /Wed, 11 Nov/ }).click();
  await expect(page.locator('.sc-agenda-booking')).toHaveCount(3);
  await page.locator('.sc-agenda-booking').first().click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Mark as done' })).toBeVisible();
  await page.screenshot({ path: '/tmp/schedule-mobile-final.png' });
});

test('retains read-only access and suppresses contact and write controls', async ({ page }) => {
  await schedule(page, 'workflow&readonly');
  await expect(page.getByRole('button', { name: 'New booking', exact: true })).toHaveCount(0);
  await card(page, 'Saturday First').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Change', exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Mark as done' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'WhatsApp' })).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: 'Call', exact: true })).toHaveCount(0);
  await expect(dialog.getByText('9876543210')).toHaveCount(0);
});

test('keeps untimed bookings visible and exposes schedule errors', async ({ page }) => {
  await schedule(page, 'workflow&untimed');
  await expect(page.getByRole('button', { name: /Needs Time/i })).toBeVisible();
  await page.goto('/tests/browser/fixtures/schedule.html?error');
  await expect(page.getByRole('alert')).toContainText('Could not load schedule');
  await expect(page.locator('.sc-event')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Today and alerts' })).toHaveCount(0);
});
