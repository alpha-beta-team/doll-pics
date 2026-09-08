import seoPages from '../data/seo-pages.json';

export const CORE_PUBLIC_PATHS = Object.keys(seoPages.pages);
const reservedRoots = new Set([
  ...CORE_PUBLIC_PATHS.map(path => path.split('/')[1]),
  'admin', 'employee', 'kiosk', 'quotation', 'api', 'preview', 'assets', 'app-shell',
  'tests', 'src', 'node_modules', '.well-known',
]);

/** CMS landing destinations only; never normalize private tokens or request URLs. */
export function normalizePublicLandingPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  const input = value.trim();
  const path = (input.startsWith('/') ? input : `/${input}`).replace(/\/$/, '').toLowerCase();
  if (!/^\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(path)) return;
  if (reservedRoots.has(path.split('/')[1])) return;
  return path;
}

export const publicText = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
