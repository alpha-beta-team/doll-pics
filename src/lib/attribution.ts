import type { MarketingAttribution } from '../shared/types';

export const ATTRIBUTION_STORAGE_KEY = 'doll:first-touch:v1';
const campaignFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
let fallback: MarketingAttribution | undefined;

export function isPrivatePath(path: string): boolean {
  try { path = decodeURIComponent(path).toLowerCase(); } catch { return true; }
  return ['/admin', '/employee', '/kiosk', '/quotation'].some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}

export function publicPath(value: string): string {
  const path = value.split(/[?#]/, 1)[0];
  if (!path.startsWith('/') || path.startsWith('//') || isPrivatePath(path)) return '';
  // Public routes use slugs. Do not retain arbitrary encoded or customer paths.
  if (path.length > 300 || !/^\/[a-zA-Z0-9/_-]*$/.test(path) || /\d{8,}/.test(path)) return '/other';
  return path;
}

export function referrerOrigin(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin.length <= 200 ? url.origin : undefined;
  } catch { return undefined; }
}

export function campaignValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  // Campaign labels only: no email, URL, phone number, or arbitrary query fragments.
  return trimmed.length > 0 && trimmed.length <= 100 && /^[a-zA-Z0-9 ._~-]+$/.test(trimmed) && !/\d{8,}/.test(trimmed) ? trimmed : undefined;
}

export function normalizeAttribution(value: unknown): MarketingAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const data = value as Record<string, unknown>;
  const landingPath = typeof data.landingPath === 'string' ? publicPath(data.landingPath) : '';
  if (!landingPath) return undefined;
  const result: MarketingAttribution = { landingPath };
  const origin = typeof data.referrerOrigin === 'string' ? referrerOrigin(data.referrerOrigin) : undefined;
  if (origin) result.referrerOrigin = origin;
  for (const key of campaignFields) {
    const text = campaignValue(data[key]);
    if (text) result[key] = text;
  }
  return result;
}

/** Called before React mounts so navigation cannot replace the first public landing. */
export function captureAttribution(): MarketingAttribution | undefined {
  if (typeof window === 'undefined' || !publicPath(window.location.pathname)) return undefined;
  try {
    const saved = normalizeAttribution(JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || 'null'));
    if (saved) return fallback = saved;
  } catch { /* Storage may be unavailable. Keep an in-memory session fallback. */ }
  if (fallback) return fallback;
  const query = new URLSearchParams(window.location.search);
  fallback = normalizeAttribution({
    landingPath: window.location.pathname,
    referrerOrigin: document.referrer,
    ...Object.fromEntries(campaignFields.map(key => [key, query.get(key)])),
  });
  try { if (fallback) window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(fallback)); } catch { /* Optional metadata must not block enquiries. */ }
  return fallback;
}
