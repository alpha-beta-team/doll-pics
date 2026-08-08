import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateQuotationOption, quotationToken } from './quotationForm';

test('quotation option calculation ignores client supplied totals', () => {
  const option = calculateQuotationOption({
    id: 'option-1', name: 'Signature', tagline: '', recommended: true,
    lineItems: [
      { id: 'line-1', eventId: '', title: 'Photography', description: '', quantity: 2, unitPrice: 25_000, amount: 1 },
      { id: 'line-2', eventId: '', title: 'Album', description: '', quantity: 1, unitPrice: 15_000, amount: 1 },
    ],
    inclusions: [], deliverables: [], discountAmount: 5_000,
    subtotal: 2, total: 2, advanceAmount: 10_000,
  });
  assert.equal(option.subtotal, 65_000);
  assert.equal(option.total, 60_000);
  assert.deepEqual(option.lineItems.map(item => item.amount), [50_000, 15_000]);
});

test('quotation token is extracted from the permanent private link', () => {
  assert.equal(quotationToken('https://dollpictures.in/quotation/secure_token-123'), 'secure_token-123');
  assert.equal(quotationToken(''), '');
});
