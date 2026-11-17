import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`current cycle, history and responsive journey at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/tests/browser/fixtures/order-workflow.html?scenario=reopened');
    await expect(page.getByRole('heading', { name: 'Your photos are being edited' })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toContainText('Editing');
    await expect(page.locator('.is-completed')).toHaveCount(2);
    await expect(page.locator('.is-upcoming')).toHaveCount(2);
    await expect(page.getByText('Estimated delivery ·')).toBeVisible();
    await expect(page.getByText(/Editing overdue/)).toHaveCount(0);
    await expect(page.getByText('Customer requested a correction')).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`journey-${width}.png`), fullPage: true });
    await page.getByText('View activity history', { exact: true }).click();
    await expect(page.getByText('Reason: Customer requested a correction')).toBeVisible();
    await expect(page.getByText(/Event time:/)).toContainText('IST');
    await page.getByText('Previous and saved values', { exact: true }).click();
    await expect(page.getByText('Stage: Delivered → Customer photos selected')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`digital completion and read-only permissions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/browser/fixtures/order-workflow.html?scenario=digital&readonly');
    await expect(page.getByRole('heading', { name: 'Your digital photos are delivered' })).toBeVisible();
    await expect(page.locator('.order-journey-phase')).toHaveCount(4);
    await expect(page.locator('.is-completed')).toHaveCount(4);
    await expect(page.locator('.order-journey-track')).not.toContainText('Printing');
    await expect(page.getByText(/Delivered on/)).toContainText('14 Nov 2026');
    await expect(page.getByRole('button', { name: 'Edit order details' })).toHaveCount(0);
    await page.locator('.order-journey-phase').last().locator('summary').click();
    await expect(page.locator('.order-journey-phase').last()).toContainText('Edited photos shared');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
