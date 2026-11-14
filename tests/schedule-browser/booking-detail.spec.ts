import { test, expect, type Page } from '@playwright/test';
import type {} from '../browser/fixtures/booking-detail';

const open = async (page: Page, query = '') => {
  await page.context().route('https://**', route => route.abort());
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    if (path.endsWith('/customer-page')) return route.fulfill({ json: {
      token: '', expiresAt: '', expectedDeliveryDate: '', update: '', publishedAt: '',
      sources: { galleryUrl: '', editedUrl: '' },
      preview: { customerName: 'Vimala Yuvaraj', shootType: 'Baby Shower', packageName: '', bookingDate: '2026-09-17', startTime: '09:00', endTime: '10:00', location: 'Gopi', status: 'confirmed', expectedDeliveryDate: '', update: '', delivery: {} },
    } });
    return route.fulfill({ json: {} });
  });
  await page.goto(`/tests/browser/fixtures/booking-detail.html?${query}`);
  await expect(page.getByRole('heading', { name: 'Vimala Yuvaraj', exact: true })).toBeVisible();
};
const accept = (page: Page, name: string) => page.getByRole('alertdialog').getByRole('button', { name, exact: true }).click();
const calls = (page: Page) => page.evaluate(() => window.bookingTest.calls);

test('completion requires confirmation and renders only the saved status', async ({ page }) => {
  await open(page);
  await page.locator('header').getByRole('button', { name: /Complete shoot|Mark shoot complete/ }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await calls(page)).toEqual([]);
  await page.locator('header').getByRole('button', { name: /Complete shoot|Mark shoot complete/ }).click();
  await page.evaluate(() => { window.bookingTest.hold = true; });
  await accept(page, 'Mark completed');
  await expect(page.locator('header').getByRole('button', { name: /Complete shoot|Mark shoot complete/ })).toBeDisabled();
  await page.evaluate(() => window.bookingTest.release?.());
  await expect(page.locator('header').getByRole('button', { name: 'Prepare delivery', exact: true })).toBeVisible();
  expect((await calls(page))[0]).toEqual({ method: 'transition', args: ['one', 'shoot_completed', undefined, undefined, undefined] });
});

test('draft confirmation retains pricing confirmation and token', async ({ page }) => {
  await open(page, 'status=draft&package');
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
  await accept(page, 'Confirm booking');
  await expect(page.getByRole('alertdialog')).toContainText('24,000');
  await accept(page, 'Confirm price & booking');
  await expect(page.locator('header')).toContainText(/confirmed/i);
  expect((await calls(page))[0].args[4]).toEqual({ expectedPricingToken: 'price-token', agreedTotal: 24000 });
});

test('cancel and restore preserve composer and overlap acknowledgement', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'More booking actions' }).click();
  await page.getByRole('menuitem', { name: 'Cancel booking' }).click();
  await accept(page, 'Cancel booking');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: /Close/ }).click();
  await page.evaluate(() => { window.bookingTest.fail = 'conflict'; });
  await page.getByRole('button', { name: 'Restore to confirmed' }).click();
  await accept(page, 'Restore booking');
  await accept(page, 'Restore with overlap');
  await expect(page.locator('header')).toContainText(/confirmed/i);
  expect((await calls(page)).at(-1)?.args.slice(0, 4)).toEqual(['one', 'confirmed', false, true]);
});

test('assignment errors retain draft and discard requires confirmation', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').selectOption('new');
  await page.evaluate(() => { window.bookingTest.fail = 'update'; });
  await dialog.getByRole('button', { name: 'Save assignment' }).click();
  await expect(dialog).toContainText('Temporary save failure');
  await expect(dialog.getByRole('combobox')).toHaveValue('new');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.evaluate(() => { window.bookingTest.fail = ''; });
  await dialog.getByRole('button', { name: 'Save assignment' }).click();
  expect((await calls(page)).at(-1)).toEqual({ method: 'update', args: ['one', { assignedStaffAccountId: 'new' }] });
});

test('RAW-only delivery shares separately from completion', async ({ page }) => {
  await open(page, 'status=shoot_completed&raws&tab=delivery');
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Review and open WhatsApp' }).click();
  const whatsapp = await popup;
  await whatsapp.close();
  expect(await calls(page)).toEqual([]);
  await page.getByRole('button', { name: 'Mark delivered', exact: true }).click();
  await accept(page, 'Mark delivered');
  await expect(page.locator('header')).toContainText(/delivered/i);
  expect(await calls(page)).toEqual([{ method: 'delivery', args: ['one'] }]);
});

for (const role of ['sales', 'content_manager', 'employee']) {
  test(`${role} cannot see payment or owner-only controls`, async ({ page }) => {
    await open(page, `role=${role}${role === 'employee' ? '&readonly' : ''}`);
    await expect(page.getByRole('tab', { name: 'Payments' })).toHaveCount(0);
    await expect(page.getByText('25,000')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Customer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Customer page', exact: true })).toHaveCount(0);
    if (role === 'employee') await expect(page.getByRole('button', { name: 'Edit booking' })).toHaveCount(0);
  });
}

test('payments retain failed input, save reference, edit and delete through existing handlers', async ({ page }) => {
  await open(page, 'tab=payments');
  await page.getByRole('button', { name: 'Record payment', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Amount (₹)').fill('5000');
  await dialog.getByLabel('Payment date').fill('2026-11-09');
  await dialog.getByLabel('Reference').fill('UPI-123');
  await page.evaluate(() => { window.bookingTest.fail = 'addPayment'; });
  await dialog.getByRole('button', { name: 'Save payment' }).click();
  await expect(dialog).toContainText('Temporary save failure');
  await expect(dialog.getByLabel('Amount (₹)')).toHaveValue('5000');
  await page.evaluate(() => { window.bookingTest.fail = ''; });
  await dialog.getByRole('button', { name: 'Save payment' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('tabpanel', { name: 'Payments' })).toContainText('UPI-123');
  const added = (await calls(page)).at(-1)!;
  expect(added.method).toBe('addPayment');
  expect(added.args[1]).toMatchObject({ amount: 5000, method: 'upi', reference: 'UPI-123' });
  await page.getByRole('button', { name: /Edit payment of/ }).click();
  await dialog.getByLabel('Reference').fill('UPI-456');
  await dialog.getByRole('button', { name: 'Save payment' }).click();
  await expect(dialog).toHaveCount(0);
  expect((await calls(page)).at(-1)?.method).toBe('editPayment');
  await page.getByRole('button', { name: 'Delete payment' }).click();
  await accept(page, 'Delete payment');
  await expect(page.getByText('No payments recorded.')).toBeVisible();
  expect((await calls(page)).at(-1)).toEqual({ method: 'deletePayment', args: ['one', 'payment'] });
});

test('follow-up sends Kolkata time and completion clears the saved reminder', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Schedule follow-up', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Date and time').fill('2099-11-10T10:00');
  await dialog.getByLabel('Reminder note').fill('Confirm balance');
  await dialog.getByRole('button', { name: 'Save follow-up' }).click();
  await expect(dialog).toHaveCount(0);
  expect((await calls(page)).at(-1)).toEqual({ method: 'followup', args: ['one', '2099-11-10T04:30:00.000Z', 'Confirm balance'] });
  await page.getByRole('button', { name: 'Mark complete', exact: true }).click();
  await expect(page.getByText('No follow-up scheduled')).toBeVisible();
  expect((await calls(page)).at(-1)?.method).toBe('completeFollowup');
});

test('delivery draft is not shareable until saved; errors preserve links', async ({ page }) => {
  await open(page, 'status=shoot_completed&tab=delivery');
  await expect(page.getByRole('button', { name: 'Mark delivered', exact: true })).toBeDisabled();
  await page.getByRole('tabpanel').getByRole('button', { name: 'Add delivery links', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Gallery folder', { exact: true }).fill('https://drive.google.com/gallery');
  await page.evaluate(() => { window.bookingTest.fail = 'update'; });
  await dialog.getByRole('button', { name: 'Save links' }).click();
  await expect(dialog).toContainText('Temporary save failure');
  await expect(dialog.getByLabel('Gallery folder', { exact: true })).toHaveValue('https://drive.google.com/gallery');
  await page.evaluate(() => { window.bookingTest.fail = ''; });
  await dialog.getByRole('button', { name: 'Save links' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.bd-message-preview')).toContainText('https://drive.google.com/gallery');
  expect((await calls(page)).at(-1)).toEqual({ method: 'update', args: ['one', { driveGalleryUrl: 'https://drive.google.com/gallery', driveEditedUrl: '', driveRawsUrl: '', driveNotes: '' }] });
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.getByRole('button', { name: 'Copy Gallery folder', exact: true }).click();
  await expect(page.getByText('Could not copy.', { exact: false })).toBeVisible();
});

test('activity expands existing messages and preserves notification and calendar handlers', async ({ page }) => {
  await open(page, 'tab=activity&messages&calendarFailed');
  await expect(page.locator('.bd-message-row')).toHaveCount(8);
  await page.getByRole('button', { name: /Show more messages/ }).click();
  await expect(page.locator('.bd-message-row')).toHaveCount(16);
  await page.getByRole('button', { name: /Show more messages/ }).click();
  await expect(page.locator('.bd-message-row')).toHaveCount(17);
  await page.locator('.bd-message-row').getByRole('button', { name: 'Retry' }).click();
  await accept(page, 'Retry notification');
  expect((await calls(page)).at(-1)).toEqual({ method: 'retryMessage', args: ['one', 'message-0'] });
  await page.getByRole('switch', { name: 'Automated WhatsApp updates' }).click();
  await expect(page.getByRole('switch')).not.toBeChecked();
  expect((await calls(page)).at(-1)?.args[1]).toMatchObject({ whatsappNotificationsEnabled: false, customerName: 'Vimala Yuvaraj', customerPhone: '9876543210' });
  await page.getByRole('heading', { name: 'Google Calendar', exact: true }).locator('..').getByRole('button', { name: 'Retry' }).click();
  await accept(page, 'Retry sync');
  expect((await calls(page)).at(-1)?.method).toBe('calendar');
  await expect(page.getByText(/Last synced/)).toBeVisible();
});

test('owner customer-page draft survives tab changes; history and booking navigation work', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Customer', exact: true }).click();
  await page.getByLabel('Customer-facing update', { exact: false }).fill('Editing your portraits');
  await page.getByRole('tab', { name: 'Activity', exact: true }).click();
  await page.getByRole('button', { name: 'History back', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Customer', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Customer-facing update', { exact: false })).toHaveValue('Editing your portraits');
  await page.getByRole('button', { name: 'Next booking', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Second customer', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Activity', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('opt-out and missing phone retain disabled actions; review requires eligibility', async ({ page }) => {
  await open(page, 'status=delivered&optout&noPhone&tab=activity');
  await expect(page.getByRole('switch')).toBeDisabled();
  await expect(page.locator('header').getByRole('button', { name: 'Request review', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Delivery', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Review and open WhatsApp' })).toBeDisabled();
});

test('review controls still record received status after delivery', async ({ page }) => {
  await open(page, 'status=delivered&tab=activity');
  await expect(page.locator('header').getByRole('button', { name: 'Request review', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark received', exact: true }).click();
  expect((await calls(page)).at(-1)).toEqual({ method: 'review', args: ['one', 'received'] });
  await expect(page.locator('header').getByRole('button', { name: 'Request review', exact: true })).toHaveCount(0);
});

test('masked contact stays non-callable and failed transitions do not advance the booking', async ({ page }) => {
  await open(page, 'role=sales&masked');
  await expect(page.locator('header')).toContainText('******3210');
  await expect(page.locator('header a[href^="tel:"]')).toHaveCount(0);
  await page.evaluate(() => { window.bookingTest.fail = 'transition'; });
  await page.locator('header').getByRole('button', { name: 'Mark shoot complete', exact: true }).click();
  await accept(page, 'Mark completed');
  await expect(page.getByText('Temporary save failure')).toBeVisible();
  await expect(page.locator('header').getByRole('button', { name: 'Mark shoot complete', exact: true })).toBeEnabled();
  await expect(page.locator('header').getByRole('button', { name: 'Prepare delivery', exact: true })).toHaveCount(0);
});

test('reverse status changes stay in overflow and do not happen without confirmation', async ({ page }) => {
  await open(page, 'status=shoot_completed&raws');
  await page.getByRole('button', { name: 'More booking actions' }).click();
  await page.getByRole('menuitem', { name: 'Revert to confirmed', exact: true }).click();
  await accept(page, 'Confirm booking');
  await expect(page.locator('header').getByRole('button', { name: 'Mark shoot complete', exact: true })).toBeVisible();
  expect((await calls(page)).at(-1)?.args.slice(0, 2)).toEqual(['one', 'confirmed']);
});

test('due-date shortcut opens the original editor and unpriced bookings stay unpriced', async ({ page }) => {
  await open(page, 'unpriced');
  await expect(page.locator('header')).toContainText('Price not set');
  await page.getByRole('button', { name: 'Set due date', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Edit booking/ })).toBeVisible();
  expect(await calls(page)).toEqual([]);
});

for (const width of [1440, 1024, 768, 390, 720]) {
  test(`layout fits all tabs at ${width}px${width === 720 ? ' (1440px at 200% zoom equivalent)' : ''}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page, 'raws&messages');
    for (const name of ['Overview', 'Payments', 'Delivery', 'Customer', 'Activity']) {
      await page.getByRole('tab', { name, exact: true }).click();
      const tab = page.getByRole('tab', { name, exact: true });
      await expect(page.locator(`#${await tab.getAttribute('aria-controls')}`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (width === 1440 || width === 390) await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-${width}.png`), fullPage: true });
    }
    await page.getByRole('tab', { name: 'Payments', exact: true }).click();
    await page.getByRole('button', { name: 'Record payment', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Record payment', exact: true })).toBeFocused();
    await page.getByRole('tab', { name: 'Overview', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Payments', exact: true })).toBeFocused();
  });
}
