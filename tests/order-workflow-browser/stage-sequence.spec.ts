import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  for (const method of ['Hand over to customer', 'Courier to customer']) {
    test(`${method}: full workflow and final receipt at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/tests/browser/fixtures/order-workflow.html');
      const dialog = page.getByRole('dialog');
      const steps = [
        ['Share for customer selection', 'Confirm photos shared', 'Waiting for your photo selection'],
        ['Customer photos selected', 'Customer photos selected', 'Your photos are being edited'],
        ['Share edited photos', 'Confirm edited photos shared', 'Your edited photos have been shared'],
        ['Customer selected edited photos', 'Customer selected edited photos', 'Your photos are ready for printing'],
        ['Share for printing', 'Share for printing', 'Sent for printing'],
        ['Mark printing received', 'Printing received', 'Your prints are ready for handover'],
        [method, method, method === 'Courier to customer' ? 'Your order is on its way' : 'Handed over · awaiting delivery confirmation'],
        ['Mark delivered', 'Mark delivered', 'Delivered'],
      ];
      for (const [action, confirm, label] of steps) {
        await page.getByRole('button', { name: action, exact: true }).click();
        await expect(dialog).toBeVisible();
        if (action === 'Customer photos selected') await expect(dialog.getByText(/starts the five-calendar-day/)).toBeVisible();
        if (action === 'Share edited photos') await expect(dialog.getByRole('button', { name: 'Share on WhatsApp', exact: true })).toBeDisabled();
        if (action === method) await expect(dialog.getByLabel('Delivery method')).toBeVisible();
        await dialog.getByRole('button', { name: confirm, exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
        if (action === method) await expect(page.getByText(/In progress/)).toBeVisible();
      }
      await expect(page.getByText(/Order complete/)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
