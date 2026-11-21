import assert from 'node:assert/strict';
import test from 'node:test';
import type { BookingDeliverable } from '../src/shared/deliverables';
import { editedPhotoCount, rawSelectionMessage } from '../src/admin/components/bookings/deliverySharing';
const row = (name: string, quantity: number, category: BookingDeliverable['category'] = 'included', kind: BookingDeliverable['kind'] = 'digital'): BookingDeliverable => ({ id: name, catalogId: name, name, quantity, category, kind, unit: 'photos', specifications: '', amount: 0 });
test('selection count uses saved edited-photo quantities across categories, excluding other items', () => {
  assert.equal(editedPhotoCount([row('Edited images', 20), row('Edited photos', 5, 'extra'), row('Retouched portraits', 2, 'complimentary'), row('RAW photos', 100), row('Edited photo album', 1, 'included', 'physical')]), 27);
  assert.equal(editedPhotoCount([]), null);
  assert.equal(editedPhotoCount([row('Edited photos', 0)]), null);
});
test('RAW selection wording handles known, singular and missing quantities without inventing a count', () => {
  const links = [{ label: 'RAW files', url: 'https://example.com/raw', emoji: '📁' }];
  assert.match(rawSelectionMessage('Customer', links, 25), /Please select 25 photos from the RAW files for editing/);
  assert.match(rawSelectionMessage('Customer', links, 1), /Please select 1 photo from/);
  assert.match(rawSelectionMessage('Customer', links, null), /Please select your preferred photos/);
});

test('delivery eligibility excludes local, private, staff-only and malformed URLs', async () => {
  const { eligibleDeliveryUrl, normalizeDeliveryUrl, validDeliveryMessage } = await import('../src/admin/components/bookings/deliverySharing');
  for (const url of ['', 'aaa', 'javascript:alert(1)', 'https://user:pass@example.com/files', 'http://localhost:5173/admin/bookings', 'http://127.0.0.1/gallery', 'http://2130706433/gallery', 'http://10.0.0.1/files', 'http://192.168.1.1/files', 'http://172.16.0.1/files', 'http://[::1]/files', 'https://studio.internal/files', 'https://example.com/%61dmin/bookings', 'https://staff.example.com/photos']) {
    assert.equal(eligibleDeliveryUrl(url), false, url);
  }
  const url = normalizeDeliveryUrl('drive.google.com/folders/customer');
  assert.equal(eligibleDeliveryUrl(url), true);
  assert.equal(eligibleDeliveryUrl('https://example.com/gallery'), true);
  assert.equal(validDeliveryMessage(`Here are your photos: ${url}`, [{ url }]), true);
  assert.equal(validDeliveryMessage('No links', [{ url }]), false);
  assert.equal(validDeliveryMessage(`Files: ${url}\nhttps://example.com/other`, [{ url }]), false);
  assert.equal(validDeliveryMessage('Files: http://localhost:5173/admin', [{ url: 'http://localhost:5173/admin' }]), false);
  assert.equal(validDeliveryMessage(`Files: ${url}`, []), false);
});

test('phone defaults and both delivery templates preserve customer identity', async () => {
  const { defaultDeliveryPhone, deliveryRecipient, deliveryMessage } = await import('../src/admin/components/bookings/deliverySharing');
  assert.equal(defaultDeliveryPhone('9842025958'), '+91 9842025958');
  assert.equal(defaultDeliveryPhone('+44 7700 900123'), '+44 7700 900123');
  assert.equal(deliveryRecipient('+44 7700 900123'), '447700900123');
  assert.equal(deliveryRecipient('123'), '');
  const links = [{ label: 'Edited photos', url: 'https://example.com/photos', emoji: '✨' }];
  assert.match(deliveryMessage('Customer', links, undefined, 'DP-001'), /Customer code: DP-001/);
  assert.match(rawSelectionMessage('Customer', links, 25, 'DP-001'), /Customer code: DP-001/);
});
