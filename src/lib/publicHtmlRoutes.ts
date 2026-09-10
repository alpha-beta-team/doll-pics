import type { PublicRouteCatalog } from './publicCatalog';
import { normalizePublicLandingPath } from './publicRoutePath';

/** Historical routes retained for retired-URL smoke probes and media aliases, not rendering eligibility. */
export const PUBLIC_SERVICE_HTML_ROUTES = {
  '/newborn-baby-photography-erode': 'newborn',
  '/wedding-photography-erode': 'wedding',
  '/maternity-photography-erode': 'maternity',
} as const;
export const PUBLIC_PACKAGE_HTML_ROUTES = {
  '/wedding-packages-erode': 'wedding',
  '/newborn-packages-erode': 'newborn',
  '/pre-wedding-packages-erode': 'pre-wedding',
  '/maternity-packages-erode': 'maternity',
  '/baby-milestone-packages-erode': 'baby-milestone',
  '/cake-smash-packages-erode': 'cake-smash',
  '/family-packages-erode': 'family',
  '/baby-shower-packages-erode': 'baby-shower',
  '/toddler-baby-shoot-packages-erode': 'toddler-baby-shoot',
} as const;
export const PUBLIC_CORE_HTML_ROUTES = {
  '/': 'home', '/about': 'about', '/work': 'work', '/gallery': 'gallery',
  '/services': 'services', '/packages': 'packages', '/stories': 'stories',
  '/contact': 'contact', '/privacy': 'privacy', '/terms': 'terms', '/booking': 'booking',
} as const;
export const PUBLIC_HTML_ROUTES = { ...PUBLIC_CORE_HTML_ROUTES, ...PUBLIC_SERVICE_HTML_ROUTES, ...PUBLIC_PACKAGE_HTML_ROUTES } as const;
export type PublicHtmlPath = string;
export const SERVICE_GALLERY_LIMIT = 30;
export const PORTFOLIO_PHOTO_LIMIT = 100;
export function publicHtmlKind(path: string, catalog: PublicRouteCatalog): typeof PUBLIC_CORE_HTML_ROUTES[keyof typeof PUBLIC_CORE_HTML_ROUTES] | 'service' | 'package' | undefined {
  if (Object.prototype.hasOwnProperty.call(PUBLIC_CORE_HTML_ROUTES, path)) return PUBLIC_CORE_HTML_ROUTES[path as keyof typeof PUBLIC_CORE_HTML_ROUTES];
  if (normalizePublicLandingPath(path) !== path || !catalog.paths.includes(path)) return;
  const service = catalog.serviceLinks.filter(link => link.path === path && link.isPublished);
  const packages = catalog.packageLinks.filter(link => link.path === path && link.isPublished);
  if (service.length + packages.length !== 1) return;
  return service.length ? 'service' : 'package';
}
