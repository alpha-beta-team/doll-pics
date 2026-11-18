import { test, expect } from '@playwright/test';
import type { TrackingFilters } from '../../src/admin/components/postShootTracking';
import { createStageFixtureRows, trackingFixtureResult } from '../browser/fixtures/post-shoot-data';
const httpRows = createStageFixtureRows();
for (const width of [390, 1280]) {
  test(`post-shoot full-result selection, eligibility and partial retry at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto('/tests/browser/fixtures/post-shoot.html');
    await expect(page.getByText('30 matching orders', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bulk update', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Select all 30 matching orders' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Refresh orders' })).toHaveAttribute('title', 'Refresh orders');
    const stageTabs = page.getByRole('group', { name: 'Order stages', exact: true });
    await expect(stageTabs.getByRole('button', { name: 'Delivered', exact: true })).toHaveCount(0);
    await expect(stageTabs.getByRole('button', { name: 'Cancelled', exact: true })).toHaveCount(0);
    expect(await stageTabs.evaluate(group => {
      const bounds = group.getBoundingClientRect();
      return group.scrollWidth <= group.clientWidth && Array.from(group.querySelectorAll('button')).every(button => {
        const tab = button.getBoundingClientRect();
        return tab.left >= bounds.left && tab.right <= bounds.right && tab.top >= bounds.top && tab.bottom <= bounds.bottom;
      });
    })).toBe(true);
    if (width === 1280) {
      const spaceAboveTable = await page.locator('main').evaluate(main => main.querySelector('table')!.getBoundingClientRect().top - main.getBoundingClientRect().top);
      expect(spaceAboveTable).toBeLessThanOrEqual(190);
    }
    await page.screenshot({ path: info.outputPath(`post-shoot-${width}.png`), fullPage: true });
    await page.getByRole('checkbox', { name: width < 768 ? 'Select current page on mobile' : 'Select current page', exact: true }).check();
    await page.getByRole('button', { name: 'Select all 30 matching orders' }).click();
    await expect(page.getByText('30 orders selected', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(page.getByText('Page 2 of 2', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Bulk update', exact: true }).click();
    const modal = page.getByRole('dialog');
    await modal.getByLabel('Action', { exact: true }).selectOption('received');
    await modal.getByLabel('Action date & time · IST').fill('2026-11-17T10:00');
    await modal.getByLabel('Internal note (optional)').fill('Received and checked');
    await modal.getByRole('button', { name: 'Review eligibility' }).click();
    await expect(modal.getByText('26 eligible · 4 excluded')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`bulk-review-${width}.png`), fullPage: true });
    await expect(modal.getByRole('button', { name: 'Apply to 0 orders' })).toBeDisabled();
    await modal.getByRole('button', { name: 'Select all eligible orders' }).click();
    await modal.getByRole('button', { name: 'Apply to 26 orders' }).click();
    await expect(modal.getByText('25 successful · 1 failed')).toBeVisible();
    await expect(modal.getByText('Printer temporarily unavailable')).toBeVisible();
    await modal.getByRole('button', { name: 'Retry failed updates' }).click();
    await expect(modal.getByText('26 successful · 0 failed')).toBeVisible();
    const calls = await page.evaluate(() => (window as unknown as { trackingTest: { calls: { id: string; input: { requestId: string; occurredAt: string } }[] } }).trackingTest.calls);
    expect(calls).toHaveLength(27);
    expect(calls.filter(call => call.id === 'order-1')[0].input).toEqual(calls.filter(call => call.id === 'order-1')[1].input);
    expect(calls[0].input.occurredAt).toBe('2026-11-17T04:30:00.000Z');
    await modal.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.getByText('4 orders selected', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('filters retain explicit selection, count full results, switch stages and open tracking', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/post-shoot.html');
  await page.getByRole('checkbox', { name: 'Select current page', exact: true }).check();
  await page.getByRole('button', { name: 'Select all 30 matching orders' }).click();
  await page.getByRole('button', { name: 'Overdue', exact: true }).click();
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
  await expect(page.getByText(/29 outside current filters/)).toBeVisible();
  await page.getByRole('button', { name: 'View tracking', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Your photos are being edited' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Ready for handover', exact: true }).click();
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bulk update', exact: true })).toHaveCount(0);
});
test('read-only staff can view tracking without selection or mutation controls', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/post-shoot.html?readonly');
  await expect(page.getByText('30 matching orders', { exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Bulk update' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mark received' })).toHaveCount(0);
  await page.getByRole('button', { name: 'View tracking', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'Edit order details' })).toHaveCount(0);
});
test('row actions open a focused status form and Escape returns to tracking without an update', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/post-shoot.html');
  await page.getByRole('button', { name: 'Mark received', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('dialog')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Printing received', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Order tracking ·/ })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { trackingTest: { calls: unknown[] } }).trackingTest.calls.length)).toBe(0);
});

test('compact stage, search and date filters retain counts and clear together', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/post-shoot.html');
  const stage = page.getByRole('button', { name: 'Awaiting prints', exact: true });
  await expect(stage).toContainText('26');
  await stage.click();
  await expect(page.getByText('26 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search orders' }).fill('Aadhira');
  await expect(page.getByText('7 matching orders', { exact: true })).toBeVisible();
  await page.getByLabel('Shoot from', { exact: true }).fill('2026-11-13');
  await expect(page.getByText('0 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByText('30 matching orders', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All stages', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Shoot from', { exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Search orders' })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toHaveCount(0);
});

test('All and Overdue counts follow the selected stage', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/post-shoot.html');
  const statuses = page.getByRole('group', { name: 'Stage status', exact: true });
  const all = statuses.getByRole('button', { name: 'All', exact: true });
  const overdue = statuses.getByRole('button', { name: 'Overdue', exact: true });
  await page.getByRole('button', { name: 'Editing pending', exact: true }).click();
  await expect(all).toContainText('1');
  await expect(overdue).toContainText('1');
  await overdue.click();
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Awaiting prints', exact: true }).click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toContainText('26');
  await expect(overdue).toContainText('0');
  await overdue.click();
  await expect(page.getByText('0 matching orders', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Awaiting prints', exact: true })).toContainText('26');
  await all.click();
  await expect(page.getByText('26 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ready for handover', exact: true }).click();
  await expect(all).toContainText('1');
  await expect(overdue).toContainText('0');
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
});

test('each stage exposes its next action and courier opens its own workflow form', async ({ page }) => {
  await page.goto('/tests/browser/fixtures/post-shoot.html?stages');
  const table = page.getByRole('table');
  await expect(page.getByRole('columnheader', { name: 'Shoot type', exact: true })).toBeVisible();
  const stages = [
    ['Photos to share', 'Share photos'],
    ['Awaiting customer selection', 'Confirm selection'],
    ['Editing pending', 'Share edited photos'],
    ['Edited photos to share', 'Share edited photos'],
    ['Awaiting print selection', 'Confirm print selection'],
    ['Ready for printing', 'Send for printing'],
    ['Awaiting prints', 'Mark received'],
    ['Ready for handover', 'Record handover'],
    ['Awaiting delivery confirmation', 'Confirm delivery'],
    ['Tracking setup required', 'Start tracking'],
  ];
  for (const [stage, action] of stages) {
    await page.getByRole('group', { name: 'Order stages', exact: true }).getByRole('button', { name: stage, exact: true }).click();
    await expect(table.getByRole('button', { name: action, exact: true }).first()).toBeVisible();
    await expect(table.getByRole('button', { name: action, exact: true }).first()).toBeEnabled();
  }
  await page.getByRole('button', { name: 'Ready for handover', exact: true }).click();
  await table.getByRole('button', { name: 'Send by courier', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Courier to customer', exact: true })).toBeVisible();
  await page.getByRole('dialog').last().getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Awaiting customer selection', exact: true }).click();
  await table.getByRole('button', { name: 'Confirm selection', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Customer photos selected', exact: true })).toBeVisible();
});

test('each filter makes a tracking HTTP request, including repeated chip clicks and clearing', async ({ page }) => {
  const requests: TrackingFilters[] = [];
  await page.route('**/admin/bookings/order-tracking?*', async route => {
    const filters = Object.fromEntries(new URL(route.request().url()).searchParams) as TrackingFilters;
    requests.push(filters);
    await route.fulfill({ json: trackingFixtureResult(httpRows, filters, Date.parse('2026-11-18T06:30:00Z')) });
  });
  await page.goto('/tests/browser/fixtures/post-shoot.html?http');
  await expect(page.getByText('11 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editing pending', exact: true }).click();
  await expect(page.getByText('2 matching orders', { exact: true })).toBeVisible();
  expect(requests.at(-1)?.stage).toBe('editing');
  const previous = requests.length;
  await page.getByRole('button', { name: 'Editing pending', exact: true }).click();
  await expect.poll(() => requests.length).toBe(previous + 1);
  await page.getByRole('button', { name: 'Overdue', exact: true }).click();
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
  expect(requests.at(-1)).toMatchObject({ stage: 'editing', scope: 'overdue' });
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByText('11 matching orders', { exact: true })).toBeVisible();
  expect(requests.at(-1)).toEqual({ scope: 'all' });
  await page.getByRole('textbox', { name: 'Search orders', exact: true }).fill('STAGE-100');
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
  expect(requests.at(-1)?.search).toBe('STAGE-100');
  await page.getByLabel('Shoot from', { exact: true }).fill('2026-11-12');
  await expect.poll(() => requests.at(-1)?.from).toBe('2026-11-12');
  await page.getByLabel('Shoot to', { exact: true }).fill('2026-11-12');
  await expect.poll(() => requests.at(-1)?.to).toBe('2026-11-12');
  await expect(page.getByText('1 matching orders', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByText('11 matching orders', { exact: true })).toBeVisible();
});

test('a slower earlier filter response cannot replace the latest backend result', async ({ page }) => {
  let release: () => void = () => {};
  const delayed = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/admin/bookings/order-tracking?*', async route => {
    const filters = Object.fromEntries(new URL(route.request().url()).searchParams) as TrackingFilters;
    if (filters.stage === 'photos') await delayed;
    await route.fulfill({ json: trackingFixtureResult(httpRows, filters) });
  });
  try {
    await page.goto('/tests/browser/fixtures/post-shoot.html?http');
    await expect(page.getByText('11 matching orders', { exact: true })).toBeVisible();
    const oldRequest = page.waitForRequest(request => new URL(request.url()).searchParams.get('stage') === 'photos');
    await page.getByRole('button', { name: 'Photos to share', exact: true }).click();
    await oldRequest;
    await page.getByRole('button', { name: 'Awaiting customer selection', exact: true }).click();
    const rows = page.getByRole('table');
    await expect(rows.getByText('Awaiting customer selection', { exact: true }).first()).toBeVisible();
    const oldResponse = page.waitForResponse(response => new URL(response.url()).searchParams.get('stage') === 'photos');
    release();
    await oldResponse;
    await expect(rows.getByText('Awaiting customer selection', { exact: true }).first()).toBeVisible();
    await expect(rows.getByText('Photos to share', { exact: true })).toHaveCount(0);
  } finally { release(); }
});

test('BrowserRouter issues exactly one filtered GET per chip click in StrictMode', async ({ page }) => {
  const requests: TrackingFilters[] = [];
  await page.route('**/admin/bookings/order-tracking?*', async route => {
    const filters = Object.fromEntries(new URL(route.request().url()).searchParams) as TrackingFilters;
    requests.push(filters);
    await route.fulfill({ json: trackingFixtureResult(httpRows, filters) });
  });
  await page.goto('/tests/browser/fixtures/post-shoot.html?http&browser&strict&dataset=100');
  await expect(page.getByText('11 matching orders', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load 100 mock orders', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use API data', exact: true })).toHaveCount(0);
  for (const [name, stage] of [['Awaiting customer selection', 'selection'], ['Editing pending', 'editing'], ['Editing pending', 'editing']] as const) {
    const before = requests.length;
    await page.getByRole('button', { name, exact: true }).click();
    await expect.poll(() => requests.at(-1)?.stage).toBe(stage);
    await expect(page.getByText(`${stage === 'editing' ? 2 : 1} matching orders`, { exact: true })).toBeVisible();
    expect(requests.slice(before)).toEqual([{ scope: 'all', stage }]);
  }
});
