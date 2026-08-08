import type { QuotationOption } from './types';

export function calculateQuotationOption(option: QuotationOption): QuotationOption {
  const lineItems = option.lineItems.map(item => ({
    ...item,
    amount: Math.round(Number(item.quantity || 0) * Number(item.unitPrice || 0) * 100) / 100,
  }));
  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - Number(option.discountAmount || 0)) * 100) / 100);
  return { ...option, lineItems, subtotal, total };
}

export function quotationToken(shareUrl: string) {
  try {
    return new URL(shareUrl, 'https://dollpictures.in').pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return '';
  }
}
