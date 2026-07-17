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

export interface EnquiryWhatsAppContext {
  name?: string;
  shootType?: string;
  preferredEvent?: string;
  shootDate?: string;
  location?: string;
}

export function enquiryWhatsAppUrl(
  whatsapp: string,
  ctx: EnquiryWhatsAppContext = {},
): string {
  const digits = whatsappDigits(whatsapp);
  if (!digits) return '/booking';

  const lines = [
    "Hi! I'd like to book a consultation with DOLL PICTURES.",
    ctx.name?.trim() ? `Name: ${ctx.name.trim()}` : null,
    ctx.shootType?.trim() ? `Shoot type: ${ctx.shootType.trim()}` : null,
    ctx.preferredEvent?.trim() ? `Event: ${ctx.preferredEvent.trim()}` : null,
    ctx.shootDate?.trim() ? `Shoot date: ${ctx.shootDate.trim()}` : null,
    ctx.location?.trim() ? `Location: ${ctx.location.trim()}` : null,
  ].filter(Boolean);

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function packageEnquirePath(pkg: {
  name: string;
  shootType?: string;
  categoryName?: string;
}): string {
  const params = new URLSearchParams();
  if (pkg.name.trim()) params.set('package', pkg.name.trim());
  const shootType = pkg.categoryName?.trim() || pkg.shootType?.trim();
  if (shootType) params.set('shootType', shootType);
  const qs = params.toString();
  return qs ? `/booking?${qs}` : '/booking';
}

export interface DeliveryWhatsAppContext {
  customerName?: string;
  shootType?: string;
  galleryUrl?: string;
  editedUrl?: string;
  rawsUrl?: string;
  driveNotes?: string;
}

/** wa.me link to customer with Drive delivery message; null if phone/links missing. */
export function deliveryWhatsAppUrl(
  customerPhone: string,
  ctx: DeliveryWhatsAppContext,
): string | null {
  const digits = whatsappDigits(customerPhone);
  if (!digits) return null;

  const gallery = ctx.galleryUrl?.trim() ?? '';
  const edited = ctx.editedUrl?.trim() ?? '';
  const raws = ctx.rawsUrl?.trim() ?? '';
  if (!gallery && !edited && !raws) return null;

  const name = ctx.customerName?.trim() || 'there';
  const lines = [
    `Hi ${name},`,
    '',
    'Your photos from DOLL PICTURES are ready.',
    '',
    gallery ? `Gallery: ${gallery}` : null,
    edited ? `Edited: ${edited}` : null,
    raws ? `Raws: ${raws}` : null,
    ctx.driveNotes?.trim() ? '' : null,
    ctx.driveNotes?.trim() || null,
    '',
    'Thank you!',
  ].filter((line): line is string => line !== null);

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
}
