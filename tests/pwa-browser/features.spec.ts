import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const user = { id: 'owner', email: 'owner@example.invalid', name: 'Owner', role: 'owner', isActive: true, permissionOverrides: {}, permissions: [] };
const draft = { customerName: 'Test Customer', customerPhone: '9000000001', customerEmail: '', coupleNames: 'Alex & Sam', weddingTitle: 'Wedding photography', validUntil: '2030-12-01', events: [], options: [{ id: 'o1', name: 'Wedding', tagline: '', recommended: true, lineItems: [{ id: 'l1', eventId: '', title: 'Photography', description: '', quantity: 1, unitPrice: 1000, amount: 1000 }], inclusions: [], deliverables: [], discountAmount: 0, subtotal: 1000, total: 1000, advanceAmount: 200 }], addOns: [], paymentMilestones: [], coverPhotoId: '', galleryPhotoIds: [], testimonialId: '', introduction: 'Your celebration', whyDollPictures: 'Photography', deliveryInformation: 'Online delivery', terms: 'Test terms', closingMessage: 'Thank you', palette: 'champagne', visibleSections: [], sectionOrder: [] };
const quote = { id: 'q1', enquiryId: 'e1', quotationNumber: 'QA-001', status: 'published', customerName: draft.customerName, customerPhone: draft.customerPhone, customerEmail: '', draft, publishedRevision: 1, publishedAt: '2026-09-09', shareUrl: '/quotation/test-token', expired: false, metrics: { viewCount: 0, downloadCount: 0, revisionViewCount: 0, revisionDownloadCount: 0 }, publishHistory: [], createdAt: '2026-09-09', updatedAt: '2026-09-09' };
const finance = { period: { dateFrom: '2026-09-01', dateTo: '2026-09-30', timezone: 'Asia/Kolkata', trendGroup: 'day' }, summary: { paymentsReceived: 0, paymentTransactions: 0, bookedRevenue: 0, shootValue: 0, pricedShootBookings: 0, confirmedBookings: 0, outstandingNow: 0, outstandingBookings: 0, overdueNow: 0, overdueBookings: 0, averageBookingValue: 0, salarySpend: 0, netCashAfterSalary: 0, collectionRate: 0, averagePaymentReceived: 0 }, paymentTrend: [], salaryTrend: [], revenueByShootType: [], paymentStatus: { paid: 0, partial: 0, unpaid: 0, overpaid: 0 }, overduePayments: [], recentPayments: [], dataQuality: { unpricedBookings: 0, missingDueDates: 0, overpaidBookings: 0 } };
async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem('auth_token', 'test-only'));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ json: user });
    if (path === '/api/admin/reports/finance') return route.fulfill({ json: finance });
    if (path === '/api/admin/quotations/q1') return route.fulfill({ json: quote });
    if (path === '/api/admin/quotations/assets') return route.fulfill({ json: { packages: [], photos: [], testimonials: [] } });
    if (path === '/api/admin/enquiries/e1') return route.fulfill({ json: { id: 'e1', name: 'Test Customer', whatsappOptIn: true } });
    if (path === '/api/quotations/test-token') return route.fulfill({ json: { ...draft, quotationNumber: 'QA-001', publishedRevision: 1, publishedAt: '2026-09-09', expired: false, coverPhoto: { id: '', url: '', title: '', altText: '' }, galleryPhotos: [], brand: { name: 'Doll Pictures', tagline: '', logoUrl: '', phone: '', email: '', whatsapp: '', instagram: '', website: '' } } });
    if (path === '/api/admin/media/hero-slide') return route.fulfill({ json: { url: '/logo-doll.png', originalUrl: '/logo-doll.png', storageKey: 'fixture', imageTransform: null } });
    return route.fulfill({ json: [] });
  });
}

test('bookings list and create form load after splitting', async ({ page }) => {
  await setup(page); await page.goto('/admin/bookings');
  await expect(page.getByRole('heading', { name: 'No bookings yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Add booking', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('payments dashboard renders unchanged report contract', async ({ page }) => {
  await setup(page); await page.goto('/admin/payments');
  await expect(page.getByText('Customer cash collected', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload page' })).toHaveCount(0);
});

test('deferred photo crop and mocked upload still work', async ({ page }) => {
  await setup(page); await page.goto('/admin/hero-slides');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles('public/logo-doll.png');
  await expect(page.getByRole('button', { name: 'Apply crop' })).toBeEnabled();
  const upload = page.waitForRequest(request => request.method() === 'POST' && request.url().includes('/admin/media/hero-slide'));
  await page.getByRole('button', { name: 'Apply crop' }).click();
  expect((await upload).headers()['content-type']).toContain('multipart/form-data');
  await expect(page.getByRole('button', { name: 'Apply crop' })).toHaveCount(0);
  await expect(page.getByAltText('Hero slide preview')).toBeVisible();
});

test('quotation editor loads PDF renderer only on download and produces a PDF', async ({ page }) => {
  await setup(page); const scripts: string[] = [];
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await page.goto('/admin/quotations/q1');
  await expect(page.getByRole('button', { name: 'PDF', exact: true })).toBeVisible();
  expect(scripts.some(url => url.includes('downloadQuotationPdf'))).toBe(false);
  const downloading = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const download = await downloading; const file = await download.path();
  expect(file).toBeTruthy(); expect((await readFile(file!)).subarray(0, 4).toString()).toBe('%PDF');
  expect(scripts.some(url => url.includes('downloadQuotationPdf'))).toBe(true);
});
