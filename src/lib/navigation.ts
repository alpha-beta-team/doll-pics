import { isRecord, normalizePublicLandingPath, publicText } from './publicRoutePath';
import sitemapRoutes from '../data/sitemap-routes.json';
import type { ServiceNavLink, ServiceNavLinkInput } from '../shared/types';

export type { ServiceNavLink, ServiceNavLinkInput };

export type NavLink = { label: string; path: string; sectionId?: string };

export const NAV_LINKS: NavLink[] = [
  { label: 'Gallery', path: '/gallery', sectionId: 'gallery' },
  { label: 'Services', path: '/services', sectionId: 'services' },
  { label: 'Packages', path: '/packages' },
  { label: 'About', path: '/about' },
  { label: 'Stories', path: '/stories' },
  { label: 'Contact', path: '/contact' },
];

export const BOOKING_ROUTE = { path: '/booking', sectionId: 'booking' };

export const PATH_TO_SECTION: Record<string, string> = {
  ...Object.fromEntries(
    NAV_LINKS.filter((link) => link.sectionId).map((link) => [link.path, link.sectionId!]),
  ),
  '/work': 'work',
  [BOOKING_ROUTE.path]: BOOKING_ROUTE.sectionId,
};

export const SECTION_PATHS = Object.keys(PATH_TO_SECTION);

/** Default package-category nav / SEO paths (mirrors Services). */
export type PackageNavLink = {
  label: string;
  path: string;
  categorySlug: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order: number;
  isPublished: boolean;
};

export const DEFAULT_PACKAGE_NAV_LINKS: PackageNavLink[] = [
  {
    label: 'Wedding',
    path: '/wedding-packages-erode',
    categorySlug: 'wedding',
    description: 'Full-day and multi-day wedding coverage packages.',
    order: 0,
    isPublished: true,
  },
  {
    label: 'Pre-Wedding',
    path: '/pre-wedding-packages-erode',
    categorySlug: 'pre-wedding',
    description: 'Romantic pre-wedding sessions and cinematic films.',
    order: 1,
    isPublished: true,
  },
  {
    label: 'Maternity',
    path: '/maternity-packages-erode',
    categorySlug: 'maternity',
    description: 'Tender maternity portrait packages celebrating new beginnings.',
    order: 2,
    isPublished: true,
  },
  {
    label: 'Newborn',
    path: '/newborn-packages-erode',
    categorySlug: 'newborn',
    description: 'Gentle, baby-friendly newborn studio packages.',
    order: 3,
    isPublished: true,
  },
  {
    label: 'Baby Milestone',
    path: '/baby-milestone-packages-erode',
    categorySlug: 'baby-milestone',
    description: 'Packages for early milestone celebrations.',
    order: 4,
    isPublished: true,
  },
  {
    label: 'Cake Smash',
    path: '/cake-smash-packages-erode',
    categorySlug: 'cake-smash',
    description: 'Playful first-birthday cake smash packages.',
    order: 5,
    isPublished: true,
  },
  {
    label: 'Family',
    path: '/family-packages-erode',
    categorySlug: 'family',
    description: 'Warm family portrait packages for every generation.',
    order: 6,
    isPublished: true,
  },
  {
    label: 'Baby Shower',
    path: '/baby-shower-packages-erode',
    categorySlug: 'baby-shower',
    description: 'Candid baby shower ceremony coverage and family portraits.',
    order: 7,
    isPublished: true,
  },
  {
    label: 'Toddler Baby Shoot',
    path: '/toddler-baby-shoot-packages-erode',
    categorySlug: 'toddler-baby-shoot',
    description: 'Creative toddler portraits with child-friendly themes and props.',
    order: 8,
    isPublished: true,
  },
];

export const PACKAGE_ROUTES = DEFAULT_PACKAGE_NAV_LINKS.map((link) => ({
  label: `${link.label} Packages`,
  path: link.path,
  categorySlug: link.categorySlug,
}));

/** @deprecated Prefer live packageNavLinks from SiteData; kept for sitemap/prerender fallbacks. */
export const PACKAGE_PATHS = PACKAGE_ROUTES.map((route) => route.path);

export const LEGAL_LINKS = [
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' },
] as const;

/** Core + default landing paths. Source of truth: src/data/sitemap-routes.json */
export const SITEMAP_ROUTES: string[] = [...sitemapRoutes];

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return pathname || '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

/** Derive public package path from slug when CMS omits path. */
export function defaultPackagePathForSlug(slug: string): string {
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/${clean}-packages-erode`;
}

export function normalizeServiceNavLinks(
  links?: Array<ServiceNavLinkInput | (Partial<ServiceNavLink> & { _id?: string })> | null,
): ServiceNavLink[] {
  if (!Array.isArray(links)) return [];
  return links.flatMap((link, index): ServiceNavLink[] => {
    if (!isRecord(link) || (link.isPublished !== undefined && typeof link.isPublished !== 'boolean')) return [];
    const path = normalizePublicLandingPath(link.path);
    const label = publicText(link.label);
    if (!path || !label) return [];
    const next: ServiceNavLink = {
      id: link.id ?? link._id,
      label, path,
      description: publicText(link.description),
      icon: publicText(link.icon) || 'Camera',
      imageUrl: publicText(link.imageUrl),
      sections: (Array.isArray(link.sections) ? link.sections : []).flatMap(section => {
        if (!isRecord(section)) return [];
        const heading = publicText(section.heading);
        const body = publicText(section.body);
        return heading && body ? [{
          id: publicText(section.id ?? ('_id' in section ? section._id : undefined)) || undefined,
          heading, body, imageUrl: publicText(section.imageUrl), imageAlt: publicText(section.imageAlt),
        }] : [];
      }),
      order: typeof link.order === 'number' && Number.isFinite(link.order) ? link.order : index,
      isPublished: link.isPublished !== false,
    };
    for (const field of ['seoTitle', 'seoDescription', 'heading', 'lead'] as const) {
      const value = publicText(link[field]);
      if (value) next[field] = value;
    }
    return [next];
  }).sort((a, b) => a.order - b.order);
}

export function getPublishedServiceNavLinks(
  links?: Array<ServiceNavLinkInput | (Partial<ServiceNavLink> & { _id?: string })> | null,
): ServiceNavLink[] {
  return normalizeServiceNavLinks(links).filter((link) => link.isPublished);
}

export type PackageCategoryInput = {
  name?: string;
  slug?: string;
  path?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order?: number;
  isPublished?: boolean;
};

/** Map API package categories onto SEO nav links (path from CMS or slug rule). */
export function normalizePackageNavLinks(
  categories?: PackageCategoryInput[] | null,
): PackageNavLink[] {
  // Only unavailable input may use defaults; a successful empty response stays empty.
  if (categories == null) return DEFAULT_PACKAGE_NAV_LINKS.map(link => ({ ...link }));
  if (!Array.isArray(categories)) return [];
  return categories.flatMap((cat, index): PackageNavLink[] => {
    if (!isRecord(cat) || (cat.isPublished !== undefined && typeof cat.isPublished !== 'boolean')) return [];
    const slug = publicText(cat.slug).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return [];
    if (cat.path != null && typeof cat.path !== 'string') return [];
    const fallback = DEFAULT_PACKAGE_NAV_LINKS.find(link => link.categorySlug === slug);
    const path = normalizePublicLandingPath(publicText(cat.path) || fallback?.path || defaultPackagePathForSlug(slug));
    if (!path) return [];
    const link: PackageNavLink = {
      label: publicText(cat.name) || fallback?.label || slug.replace(/-/g, ' '),
      path, categorySlug: slug,
      description: publicText(cat.description) || fallback?.description || '',
      order: typeof cat.order === 'number' && Number.isFinite(cat.order) ? cat.order : index,
      isPublished: cat.isPublished !== false,
    };
    for (const field of ['seoTitle', 'seoDescription', 'heading', 'lead'] as const) {
      const value = publicText(cat[field]);
      if (value) link[field] = value;
    }
    return [link];
  }).sort((a, b) => a.order - b.order);
}

export function getPublishedPackageNavLinks(
  categories?: PackageCategoryInput[] | null,
): PackageNavLink[] {
  return normalizePackageNavLinks(categories).filter((link) => link.isPublished);
}

export function packagePathForSlug(
  slug: string,
  categories?: PackageCategoryInput[] | null,
): string | undefined {
  const clean = slug.trim().toLowerCase();
  if (!clean) return undefined;
  const fromCms = getPublishedPackageNavLinks(categories).find(
    (l) => l.categorySlug === clean,
  );
  if (fromCms) return fromCms.path;
  return undefined;
}
