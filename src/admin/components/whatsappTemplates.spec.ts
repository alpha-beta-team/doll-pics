import test from 'node:test';
import assert from 'node:assert/strict';
import { manualWhatsAppMessage } from './whatsappTemplates';

test('occasion templates resolve names without empty placeholders', () => {
  const birthday = manualWhatsAppMessage('birthday', {
    customerName: 'Priya', phone: '9876543210', occasionName: 'Anu',
  });
  assert.match(birthday, /Priya/);
  assert.match(birthday, /Anu/);
  assert.doesNotMatch(birthday, /undefined|null/);
});

test('review request includes the configured review link', () => {
  const message = manualWhatsAppMessage('review_request', {
    customerName: 'Kavin', phone: '9876543210', service: 'Newborn',
    reviewUrl: 'https://example.test/review?a=1&b=2',
  });
  assert.match(message, /Newborn/);
  assert.match(message, /https:\/\/example\.test\/review\?a=1&b=2/);
});

test('wedding quotation message contains the secure link without claiming delivery', () => {
  const message = manualWhatsAppMessage('wedding_quotation', {
    customerName: 'Anu', phone: '9876543210',
    quotationUrl: 'https://dollpictures.in/quotation/secure_token',
  });
  assert.match(message, /Anu/);
  assert.match(message, /https:\/\/dollpictures\.in\/quotation\/secure_token/);
  assert.doesNotMatch(message, /sent|delivered|viewed/i);
});
