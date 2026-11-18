import { test, expect } from '@playwright/test';

for (const role of ['owner', 'sales', 'content_manager']) {
  for (const mode of ['create', 'convert', 'edit']) {
    test(`${role} can save a discounted booking: ${mode}`, async ({ page }) => {
      await page.goto(`/tests/browser/fixtures/booking-discount.html?role=${role}&mode=${mode}`);
      await expect(page.locator('#booking-agreed-total')).toHaveValue('10000');
      await page.locator('#booking-discount').click();
      await page.getByRole('option', { name: '₹500', exact: true }).click();
      await expect(page.locator('#booking-agreed-total')).toHaveValue('9500');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      // Creation requires a completed lookup, including restored wizard drafts.
      if (mode === 'create') {
        await page.getByRole('button', { name: /Customer/ }).click();
        await expect(page.locator('html')).toHaveAttribute('data-lookup-complete', 'true');
        await expect(page.getByText('Checking customer history…')).toBeHidden();
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await page.getByRole('button', { name: 'Next', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Save booking', exact: true }).click();
      await expect(page.getByTestId('saved')).not.toBeEmpty();
      const payload = JSON.parse(await page.getByTestId('saved').innerText());
      expect(payload.bookingDiscountAmount).toBe(500);
      expect(payload.agreedTotal).toBe(9500);
      if (mode === 'convert') expect(payload.enquiryId).toBe('enquiry');
      if (mode === 'edit') expect(payload).not.toHaveProperty('enquiryId');
    });
  }
}

for (const width of [390, 1280]) {
  test(`select supports keyboard and stays inside viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto('/tests/browser/fixtures/booking-discount.html?role=owner&mode=edit');
    const discount = page.getByRole('button', { name: /Discount \(₹\)/ });
    await discount.focus();
    await discount.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(page.getByRole('option', { name: 'No discount', exact: true })).toHaveAttribute('aria-selected', 'true');
    const bounds = await listbox.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(820);
    await page.screenshot({ path: `/tmp/doll-select-${width}.png` });
    await listbox.press('ArrowDown');
    await listbox.press('Enter');
    await expect(discount).toContainText('₹500');
    await expect(discount).toBeFocused();
    await expect(page.locator('#booking-agreed-total')).toHaveValue('9500');
    await discount.click();
    await listbox.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(discount).toBeFocused();
    await discount.click();
    await page.getByRole('heading', { name: 'Package and ownership' }).click();
    await expect(listbox).toBeHidden();
    // Check the shared source selector in the same wizard with typeahead.
    await page.getByRole('button', { name: /Customer/ }).click();
    const source = page.getByRole('button', { name: /Came from/ });
    await source.click();
    await page.getByRole('listbox').press('w');
    await page.getByRole('listbox').press('Enter');
    await expect(source).toContainText('Website');
  });
}
