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
export const PUBLIC_HTML_ROUTES = { '/': null, '/work': null, '/gallery': null, '/services': null, '/packages': null, ...PUBLIC_SERVICE_HTML_ROUTES, ...PUBLIC_PACKAGE_HTML_ROUTES } as const;
export type PublicHtmlPath = string;
export const SERVICE_GALLERY_LIMIT = 30;
export const PORTFOLIO_PHOTO_LIMIT = 100;
export function publicHtmlKind(path: string, catalog: PublicRouteCatalog): 'home' | 'work' | 'gallery' | 'services' | 'packages' | 'service' | 'package' | undefined {
  if (path === '/') return 'home';
  if (path === '/work') return 'work';
  if (path === '/gallery') return 'gallery';
  if (path === '/services') return 'services';
  if (path === '/packages') return 'packages';
  if (normalizePublicLandingPath(path) !== path || !catalog.paths.includes(path)) return;
  const service = catalog.serviceLinks.filter(link => link.path === path && link.isPublished);
  const packages = catalog.packageLinks.filter(link => link.path === path && link.isPublished);
  if (service.length + packages.length !== 1) return;
  return service.length ? 'service' : 'package';
}
