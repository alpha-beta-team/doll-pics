import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`reopen is only in the overflow menu at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/browser/fixtures/booking-detail.html?status=delivered&workflow&stage=delivered&completed');
    await expect(page.getByText('Order complete', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reopen order', exact: true })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Reopen order' })).toHaveCount(0);
    await page.getByRole('button', { name: 'More booking actions' }).click();
    await page.getByRole('menuitem', { name: 'Reopen order', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Reopen order', exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Reason (required)')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => window.bookingTest.calls.filter(call => call.method === 'order').length)).toBe(0);
  });
}
