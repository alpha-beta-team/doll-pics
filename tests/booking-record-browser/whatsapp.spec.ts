import { test, expect, type Page } from '@playwright/test';

async function openComposer(page: Page, query = 'record&workflow&stage=editing&status=shoot_completed') {
  await page.addInitScript(() => {
    document.addEventListener('click', event => {
      const link = (event.target as Element).closest('a[href^="https://wa.me/"]');
      if (link) event.preventDefault();
    }, true);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { sessionStorage.setItem('copied-whatsapp', value); } } });
  });
  await page.goto(`/tests/browser/fixtures/booking-detail.html?${query}`);
  await page.getByRole('button', { name: 'Message customer on WhatsApp', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.getByRole('dialog');
}

test('uses the current stage, fills links, preserves edits, copies and resets', async ({ page }) => {
  const dialog = await openComposer(page);
  const message = dialog.getByRole('textbox', { name: 'Message', exact: true });
  await expect(dialog.getByLabel('All templates')).toHaveValue('edited_photos');
  await expect(message).toHaveValue(/Customer code: DP-C202611-0052/);
  await expect(dialog.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute('aria-disabled', 'true');
  await dialog.getByLabel('Edited photos link', { exact: true }).fill('https://example.com/edited');
  await expect(message).toHaveValue(/https:\/\/example.com\/edited/);
  const text = `${await message.inputValue()}\nPlease check these today.`;
  await message.fill(text);
  await dialog.getByRole('button', { name: 'Copy message' }).click();
  await expect(dialog.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('copied-whatsapp'))).toBe(text);
  const href = await dialog.getByRole('link', { name: 'Open WhatsApp' }).getAttribute('href');
  expect(new URL(href!).pathname).toBe('/919876543210');
  expect(new URL(href!).searchParams.get('text')).toBe(text);
  await dialog.getByRole('button', { name: 'Reset to template' }).click();
  await expect(message).not.toHaveValue(/Please check these today/);
});

test('requires explicit send confirmation, persists a note and can retry a failed log', async ({ page }) => {
  const dialog = await openComposer(page);
  await dialog.getByLabel('All templates').selectOption('custom');
  await dialog.getByRole('textbox', { name: 'Message', exact: true }).fill('Hi, your photos are ready.');
  await dialog.getByRole('link', { name: 'Open WhatsApp' }).click();
  await expect(dialog.getByText('WhatsApp opened. Did you send it?')).toBeVisible();
  expect(await page.evaluate(() => window.bookingTest.calls.filter(item => item.method === 'createNote'))).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Not yet' }).click();
  await expect(dialog.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Hi, your photos are ready.');
  await dialog.getByRole('link', { name: 'Open WhatsApp' }).click();
  await page.evaluate(() => { window.bookingTest.fail = 'workspace'; });
  await dialog.getByRole('button', { name: 'Yes, log it' }).click();
  await expect(dialog.getByRole('alert')).toHaveText(/Temporary workspace save failure/);
  await page.evaluate(() => { window.bookingTest.fail = ''; });
  await dialog.getByRole('button', { name: 'Yes, log it' }).click();
  await expect(dialog).toHaveCount(0);
  const calls = await page.evaluate(() => window.bookingTest.calls.filter(item => item.method === 'createNote'));
  expect(calls).toHaveLength(2);
  expect(calls[0].args[1]).toBe(calls[1].args[1]);
  expect(calls[1].args[0]).toContain('sent (staff confirmed)');
  expect(calls[1].args[0]).toContain('Hi, your photos are ready.');
});

test('supports fixed and undecided rescheduling and blocks unresolved placeholders', async ({ page }) => {
  const dialog = await openComposer(page);
  await dialog.getByLabel('All templates').selectOption('booking_rescheduled');
  await dialog.getByLabel('New date & time', { exact: true }).fill('2026-12-04T10:30');
  await expect(dialog.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(/10:30.*IST/);
  await dialog.getByRole('button', { name: 'Not fixed yet · ask the customer' }).click();
  await expect(dialog.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(/Please reply with a few dates/);
  await dialog.getByLabel('All templates').selectOption('courier_tracking');
  await expect(dialog.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute('aria-disabled', 'true');
  await dialog.getByLabel('Courier', { exact: true }).fill('DTDC');
  await dialog.getByLabel('AWB number', { exact: true }).fill('TEST123');
  await expect(dialog.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute('aria-disabled', 'false');
});

test('retains opt-out restrictions and keyboard dismissal', async ({ page }) => {
  const dialog = await openComposer(page, 'record&optout');
  await expect(dialog.getByLabel('All templates')).toHaveValue('custom');
  await expect(dialog.locator('option[value="booking_confirmation"]')).toHaveAttribute('disabled', '');
  await expect(dialog.getByRole('group', { name: 'Suggested messages' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Message customer on WhatsApp', exact: true })).toBeFocused();
});

test('fits a narrow screen and keeps required-field validation visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openComposer(page);
  await dialog.getByLabel('Edited photos link', { exact: true }).fill('invalid-url');
  await expect(dialog.getByRole('link', { name: 'Open WhatsApp' })).toHaveAttribute('aria-disabled', 'true');
  await expect(dialog.getByText('Enter a valid Edited photos link')).toBeVisible();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  const body = await dialog.locator('.bwa-body').boundingBox();
  const footer = await dialog.locator('.bwa-footer').boundingBox();
  expect(body!.y + body!.height).toBeLessThanOrEqual(footer!.y);
  await page.screenshot({ path: '/tmp/booking-whatsapp-mobile-final.png' });
});
