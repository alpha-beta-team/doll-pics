import { test, expect } from '@playwright/test';

for (const role of ['owner', 'sales', 'content_manager']) {
  for (const mode of ['create', 'convert', 'edit']) {
    test(`${role} can save a discounted booking: ${mode}`, async ({ page }) => {
      await page.goto(`/tests/browser/fixtures/booking-discount.html?role=${role}&mode=${mode}`);
      await expect(page.locator('#booking-agreed-total')).toHaveValue('10000');
      await page.locator('#booking-discount').selectOption('500');
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
