import { expect, test } from '@playwright/test';

for (const mode of ['create', 'edit', 'convert']) {
  test(`crew selections save and update drafts in ${mode}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/tests/browser/fixtures/booking-discount.html?role=sales&mode=${mode}&crew=1`);
    await page.getByRole('button', { name: 'Add crew member', exact: true }).click();
    await expect(page.getByLabel('Crew service 1', { exact: true }).locator('option')).toHaveCount(15);
    await page.getByLabel('Crew service 1', { exact: true }).selectOption('drone');
    await page.getByLabel('Crew member 1', { exact: true }).selectOption('507f1f77bcf86cd799439011');
    await page.getByRole('button', { name: 'Add crew member', exact: true }).click();
    await page.getByRole('button', { name: 'Remove crew row 2', exact: true }).click();
    const draft = await page.evaluate(() => JSON.parse(localStorage.getItem(`doll_admin_booking_draft:${new URLSearchParams(location.search).get('mode') === 'create' ? 'new' : new URLSearchParams(location.search).get('mode') === 'edit' ? 'booking' : 'enquiry'}`)!));
    expect(draft.crewList[0]).toMatchObject({ serviceType: 'drone', memberName: 'Arun' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('group', { name: 'Crew List', exact: true }).screenshot({ path: `/tmp/doll-crew-${mode}.png` });
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    if (mode === 'create') {
      await page.getByRole('button', { name: /Customer/ }).click();
      await expect(page.locator('html')).toHaveAttribute('data-lookup-complete', 'true');
      await expect(page.getByText('Checking customer history…')).toBeHidden();
      for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Save booking', exact: true }).click();
    await expect(page.getByTestId('saved')).not.toBeEmpty();
    expect(JSON.parse(await page.getByTestId('saved').innerText()).crewList).toEqual([{ serviceType: 'drone', staffAccountId: '507f1f77bcf86cd799439011' }]);
  });
}

for (const width of [390, 1280]) {
  test(`dedicated crew dialog saves only crew and retains failed edits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tests/browser/fixtures/booking-detail.html');
    await page.getByRole('button', { name: 'Crew actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Assign crew', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit crew', exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await expect(dialog.getByRole('button', { name: 'Save booking', exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Add crew member', exact: true }).click();
    await dialog.getByLabel('Crew service 1', { exact: true }).selectOption('drone');
    await dialog.getByRole('button', { name: 'Save crew', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('Select a service and member');
    await dialog.getByLabel('Crew member 1', { exact: true }).selectOption('new');
    await page.evaluate(() => { window.bookingTest.fail = 'update'; });
    await dialog.getByRole('button', { name: 'Save crew', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('Temporary save failure');
    await expect(dialog.getByLabel('Crew member 1', { exact: true })).toHaveValue('new');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.screenshot({ path: `/tmp/doll-crew-modal-${width}.png` });
    await page.evaluate(() => { window.bookingTest.fail = ''; });
    await dialog.getByRole('button', { name: 'Save crew', exact: true }).click();
    await expect(dialog).toBeHidden();
    const calls = await page.evaluate(() => window.bookingTest.calls);
    expect(calls.at(-1)).toEqual({ method: 'update', args: ['one', { crewList: [{ serviceType: 'drone', staffAccountId: 'new' }] }] });
    await page.getByRole('button', { name: 'Crew actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit crew', exact: true }).click();
    await expect(dialog.getByLabel('Crew service 1', { exact: true })).toHaveValue('drone');
    await dialog.getByRole('button', { name: 'Remove crew row 1', exact: true }).click();
    await dialog.getByRole('button', { name: 'Save crew', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect((await page.evaluate(() => window.bookingTest.calls)).at(-1)).toEqual({ method: 'update', args: ['one', { crewList: [] }] });
  });
}

for (const width of [390, 1280]) {
  test(`crew actions stay visible while long lists scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/tests/browser/fixtures/booking-detail.html');
    await page.getByRole('button', { name: 'Crew actions', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Assign crew', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit crew', exact: true });
    const add = dialog.getByRole('button', { name: 'Add crew member', exact: true });
    for (let index = 0; index < 8; index++) await add.click();
    const scrollArea = dialog.getByRole('region', { name: 'Crew list scroll area', exact: true });
    expect(await scrollArea.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    const footer = dialog.locator('[aria-label="Crew actions"]');
    const before = await footer.boundingBox();
    await scrollArea.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(dialog.getByLabel('Crew service 8', { exact: true })).toBeInViewport();
    const after = await footer.boundingBox();
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(1);
    for (const name of ['Add crew member', 'Cancel', 'Save crew']) {
      await expect(dialog.getByRole('button', { name, exact: true })).toBeInViewport();
    }
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.screenshot({ path: `/tmp/doll-crew-fixed-actions-${width}.png` });
  });
}
