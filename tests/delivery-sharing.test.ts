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
