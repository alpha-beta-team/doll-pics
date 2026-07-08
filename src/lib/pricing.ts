/** Format a number as Indian Rupee with Indian locale grouping (e.g. ₹1,00,000). */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatPackagePrice(
  pricingMode: string,
  price?: number | null,
): string {
  if (pricingMode === 'enquire' || price == null) return 'Enquire';
  const formatted = formatINR(price);
  if (pricingMode === 'startingFrom') return `Starting from ${formatted}`;
  return formatted;
}

/** Digits-only WhatsApp number for wa.me links. */
export function whatsappDigits(whatsapp: string): string {
  return whatsapp.replace(/\D/g, '');
}

export function packageWhatsAppUrl(whatsapp: string, packageName: string): string {
  const digits = whatsappDigits(whatsapp);
  if (!digits) return '/#booking';
  const text = encodeURIComponent(
    `Hi! I'm interested in booking "${packageName}". Could you please share more details?`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}
