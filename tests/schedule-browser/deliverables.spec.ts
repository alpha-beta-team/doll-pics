import { test, expect } from '@playwright/test';
for (const width of [390, 1280]) {
  test(`base package and seasonal extensions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/browser/fixtures/deliverables.html');
    const base = page.getByRole('region', { name: 'Base Package', exact: true });
    await base.getByRole('button', { name: 'Add base item' }).click();
    await base.getByLabel('Item name').fill('Album');
    await base.getByLabel('Quantity', { exact: true }).fill('1');
    await page.getByRole('button', { name: 'Add seasonal extension' }).click();
    const seasonal = page.getByRole('region', { name: 'Seasonal extension 1', exact: true });
    await seasonal.getByLabel('Seasonal list name').fill('Christmas');
    await expect(seasonal).toContainText('Inherits Base Package');
    await expect(seasonal).toContainText('Album × 1');
    await seasonal.getByRole('button', { name: 'Add seasonal item' }).click();
    await seasonal.getByLabel('Item name').fill('Calendar');
    await seasonal.getByLabel('Quantity', { exact: true }).fill('1');
    await base.getByLabel('Quantity', { exact: true }).fill('2');
    await expect(seasonal).toContainText('Album × 2');
    await page.getByRole('button', { name: 'Save configuration', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('seasonal lists saved');
    await page.getByRole('button', { name: 'Edit deliverables', exact: true }).click();
    await page.getByLabel('Deliverable list', { exact: true }).selectOption({ label: 'Base + Christmas' });
    await expect(page.getByRole('region', { name: 'Deliverables editor' })).toContainText('Album');
    await expect(page.getByRole('region', { name: 'Deliverables editor' })).toContainText('Calendar');
    await page.getByLabel('Reason for change').fill('Apply Christmas extension');
    await page.getByRole('button', { name: 'Save deliverables', exact: true }).click();
    const customer = page.getByRole('region', { name: 'Your deliverables' });
    await expect(customer).toContainText('Album');
    await expect(customer).toContainText('Calendar');
    await expect(customer).not.toContainText('Christmas');
    await expect(customer).not.toContainText('Complimentary');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/doll-deliverable-lists-${width}.png`, fullPage: true });
  });
}

for (const mode of ['create', 'convert']) {
  test(`booking wizard saves included defaults and extras separately: ${mode}`, async ({ page }) => {
    await page.goto(`/tests/browser/fixtures/booking-discount.html?role=sales&mode=${mode}&deliverables=1`);
    await expect(page.getByRole('region', { name: 'Deliverables editor' })).toContainText('Frame');
    await page.locator('#booking-discount').click();
      await page.getByRole('option', { name: '₹500', exact: true }).click();
    await page.getByLabel('Deliverable to add').selectOption('frame');
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    const extra = page.getByRole('region', { name: 'Deliverables editor' }).locator('article').nth(1);
    await extra.getByLabel('Inclusion', { exact: true }).selectOption('extra');
    await extra.getByLabel('Quantity (pieces)').fill('3');
    await extra.getByLabel('Extra total (₹)').fill('500');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    if (mode === 'create') {
      await page.getByRole('button', { name: /Customer/ }).click();
      await expect(page.locator('html')).toHaveAttribute('data-lookup-complete', 'true');
      await expect(page.getByText('Checking customer history…')).toBeHidden();
      for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Save booking', exact: true }).click();
    await expect(page.getByTestId('saved')).not.toBeEmpty();
    const payload = JSON.parse(await page.getByTestId('saved').innerText());
    expect(payload.baseAgreedTotal).toBe(9500);
    expect(payload.agreedTotal).toBe(10000);
    expect(payload.deliverables).toHaveLength(2);
    expect(payload.deliverables[0]).toMatchObject({ category: 'included', quantity: 2, amount: 0 });
    expect(payload.deliverables[1]).toMatchObject({ category: 'extra', quantity: 3, amount: 500 });
    expect(payload.deliverables[0]).not.toHaveProperty('specifications');
  });
}


for (const width of [390, 1280]) {
  test(`compact booking deliverables at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/tests/browser/fixtures/booking-discount.html?role=sales&mode=create&compact=1');
    const fields = page.locator('[aria-label="Booking deliverables fields"]');
    const editor = page.getByRole('region', { name: 'Deliverables editor' });
    await expect(editor.locator('article')).toHaveCount(3);
    await expect(editor).not.toContainText('No specifications');
    await expect(editor).not.toContainText('Paid extras: ₹0');
    await expect(page.locator('[aria-label="Booking pricing summary"]')).toHaveCount(1);
    const rowHeight = await editor.locator('article').first().evaluate(element => element.getBoundingClientRect().height);
    expect(rowHeight).toBeLessThan(width < 540 ? 150 : 85);
    await fields.scrollIntoViewIfNeeded();
    expect(await fields.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await fields.screenshot({ path: `/tmp/doll-booking-deliverables-compact-${width}.png` });
    await editor.locator('article').last().getByRole('button', { name: 'Remove Photo frame' }).click();
    await expect(editor.locator('article')).toHaveCount(2);
  });
}
