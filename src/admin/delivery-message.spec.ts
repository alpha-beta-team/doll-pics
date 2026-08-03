import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryWhatsAppMessage, deliveryWhatsAppUrl } from '../lib/pricing';

test('delivery preview and WhatsApp link use the same staff-controlled message', () => {
  const context = {
    customerName: 'Sri',
    galleryUrl: 'https://drive.example/gallery',
    driveNotes: 'Please download within 30 days.',
  };
  const message = deliveryWhatsAppMessage(context);
  const url = deliveryWhatsAppUrl('+91 98765 43210', context);
  assert.match(message, /Hi Sri/);
  assert.match(message, /Gallery: https:\/\/drive\.example\/gallery/);
  assert.doesNotMatch(message, /start|end time/i);
  assert.equal(url, `https://wa.me/919876543210?text=${encodeURIComponent(message)}`);
});
