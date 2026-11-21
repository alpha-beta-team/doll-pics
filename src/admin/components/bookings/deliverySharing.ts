import type { BookingDeliverable } from '../../../shared/deliverables';

export function normalizeDeliveryUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^localhost(?::\d+)?(?:[/?#]|$)/i.test(trimmed)) return `http://${trimmed}`;
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function validDeliveryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && Boolean(url.hostname) && !url.username && !url.password && !/\s/.test(value);
  } catch { return false; }
}

export function defaultDeliveryPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '+91 ';
  if (trimmed.startsWith('+')) return trimmed;
  const compact = trimmed.replace(/[\s()-]/g, '');
  if (/^\d{10}$/.test(compact)) return `+91 ${compact}`;
  if (/^[1-9]\d{10,14}$/.test(compact)) return `+${compact}`;
  return trimmed;
}

export function deliveryRecipient(value: string): string {
  const compact = value.replace(/[\s()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact.slice(1) : '';
}

export function deliveryMessage(name: string, links: { label: string; url: string; emoji: string }[], studio = 'Doll Pictures', customerCode?: string): string {
  return `Hi ${name.trim() || 'there'},\n\n${customerCode?.trim() ? `Customer code: ${customerCode.trim()}\n\n` : ''}Here are your files from ${studio}:\n\n${links.filter(link => validDeliveryUrl(link.url)).map(link => `${link.emoji} ${link.label}: ${link.url}`).join('\n')}\n\nPlease let us know if you need any help accessing them. Thank you!`;
}

export function editedPhotoCount(deliverables: BookingDeliverable[] = []): number | null {
  const matches = deliverables.filter(row => row.kind === 'digital'
    && /\b(?:edited|editing|retouched)\b/i.test(row.name)
    && /\b(?:photos?|photographs?|images?|portraits?)\b/i.test(row.name));
  if (!matches.length || matches.some(row => !Number.isSafeInteger(row.quantity) || row.quantity <= 0)) return null;
  return matches.reduce((total, row) => total + row.quantity, 0);
}

export function rawSelectionMessage(name: string, links: { label: string; url: string; emoji: string }[], count: number | null, customerCode?: string): string {
  const selection = count === null ? 'your preferred photos' : `${count} ${count === 1 ? 'photo' : 'photos'}`;
  return `Hi ${name.trim() || 'there'},\n\n${customerCode?.trim() ? `Customer code: ${customerCode.trim()}\n\n` : ''}Your RAW photos from Doll Pictures are ready for selection.\n\n${links.filter(link => validDeliveryUrl(link.url)).map(link => `${link.emoji} ${link.label}: ${link.url}`).join('\n')}\n\nPlease select ${selection} from the RAW files for editing and share the selected file names with us.\n\nPlease let us know if you need any help selecting them. Thank you!`;
}

/** Syntactically valid links can still point to staff-only or local resources. */
export function deliveryUrlWarning(value: string): string {
  if (!value.trim()) return '';
  if (!validDeliveryUrl(normalizeDeliveryUrl(value))) return 'Enter a valid public http or https URL.';
  const url = new URL(normalizeDeliveryUrl(value));
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { return 'Enter a valid public URL.'; }
  if (!host.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host)
    || /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
    || host.includes(':') || /^https?:\/\/(?:0x[0-9a-f]+|[0-9]+)(?:[/:?#]|$)/i.test(value) || /(^|[./-])(admin|staff|dashboard)([./-]|$)/i.test(`${host}${path}`)) {
    return 'This looks like a local or internal staff link. Use a customer-accessible link before sharing.';
  }
  return '';
}

export type DeliveryLinkKey = 'driveGalleryUrl' | 'driveEditedUrl' | 'driveRawsUrl';
export const deliveryLinkFields: { key: DeliveryLinkKey; label: string; messageLabel: string; emoji: string }[] = [
  { key: 'driveGalleryUrl', label: 'Gallery folder', messageLabel: 'Gallery', emoji: '📸' },
  { key: 'driveEditedUrl', label: 'Edited photos', messageLabel: 'Edited photos', emoji: '✨' },
  { key: 'driveRawsUrl', label: 'RAW files', messageLabel: 'RAW files', emoji: '📁' },
];

/** Eligibility is a local URL check, not proof of remote folder permissions. */
export function eligibleDeliveryUrl(value: string): boolean {
  return !!value.trim() && validDeliveryUrl(value.trim()) && !deliveryUrlWarning(value.trim());
}

export function validDeliveryMessage(message: string, links: { url: string }[]): boolean {
  const urls = message.match(/https?:\/\/[^\s]+/gi) || [];
  return links.length > 0 && urls.length > 0 && urls.every(url =>
    eligibleDeliveryUrl(url) && links.some(link => link.url === url));
}
