export type NavLink = { label: string; path: string; sectionId?: string };

export type ServiceNavLink = {
  id?: string;
  label: string;
  path: string;
  description: string;
  icon: string;
  imageUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order: number;
  isPublished: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Work', path: '/work', sectionId: 'work' },
  { label: 'Gallery', path: '/gallery', sectionId: 'gallery' },
  { label: 'Services', path: '/services', sectionId: 'services' },
  { label: 'Packages', path: '/packages' },
  { label: 'About', path: '/about' },
  { label: 'Stories', path: '/stories', sectionId: 'testimonials' },
];

export const BOOKING_ROUTE = { path: '/booking', sectionId: 'booking' };

/** Default CMS seed for Services menu / cards / footer when API has none. */
export const DEFAULT_SERVICE_NAV_LINKS: ServiceNavLink[] = [
  {
    label: 'Wedding',
    path: '/wedding-photography-erode',
    description: 'Full-day cinematic coverage from first look to last dance.',
    icon: 'Heart',
    imageUrl:
      'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=640',
    order: 0,
    isPublished: true,
  },
  {
    label: 'Newborn',
    path: '/newborn-baby-photography-erode',
    description: 'Safe, baby-friendly newborn sessions with gentle posing.',
    icon: 'Baby',
    imageUrl:
      'https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg?auto=compress&cs=tinysrgb&w=640',
    order: 1,
    isPublished: true,
  },
  {
    label: 'Maternity',
    path: '/maternity-photography-erode',
    description: 'Tender, timeless portraits celebrating new beginnings.',
    icon: 'Baby',
    imageUrl:
      'https://images.pexels.com/photos/2958995/pexels-photo-2958995.jpeg?auto=compress&cs=tinysrgb&w=640',
    order: 2,
    isPublished: true,
  },
  {
    label: 'Baby Milestone',
    path: '/baby-milestone-photography-erode',
    description: 'Joyful coverage of life’s early milestone celebrations.',
    icon: 'Gift',
    imageUrl:
      'https://images.pexels.com/photos/796444/pexels-photo-796444.jpeg?auto=compress&cs=tinysrgb&w=640',
    order: 3,
    isPublished: true,
  },
  {
    label: 'Cake Smash',
    path: '/cake-smash-photography-erode',
    description: 'Playful first-birthday cake smash sessions full of joy.',
    icon: 'Gift',
    imageUrl:
      'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=640',
    order: 4,
    isPublished: true,
  },
  {
    label: 'Family',
    path: '/family-photography-erode',
    description: 'Warm family portraits for every generation together.',
    icon: 'Camera',
    imageUrl:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=640',
    order: 5,
    isPublished: true,
  },
];

export const SERVICE_ROUTES = DEFAULT_SERVICE_NAV_LINKS.map((link) => ({
  label: `${link.label} Photography`,
  path: link.path,
}));

export const PATH_TO_SECTION: Record<string, string> = {
  ...Object.fromEntries(
    NAV_LINKS.filter((link) => link.sectionId).map((link) => [link.path, link.sectionId!]),
  ),
  [BOOKING_ROUTE.path]: BOOKING_ROUTE.sectionId,
};

export const SECTION_PATHS = Object.keys(PATH_TO_SECTION);

/** @deprecated Prefer live serviceNavLinks from SiteData; kept for sitemap/prerender fallbacks. */
export const SERVICE_PATHS = SERVICE_ROUTES.map((route) => route.path);

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

/** Core + default landing paths for offline sitemap/prerender fallbacks.
 * Keep as string literals (no spreads) so generate-sitemap.mjs can parse it. */
export const SITEMAP_ROUTES = [
  '/',
  '/packages',
  '/about',
  '/work',
  '/gallery',
  '/services',
  '/stories',
  '/booking',
  '/wedding-photography-erode',
  '/newborn-baby-photography-erode',
  '/maternity-photography-erode',
  '/baby-milestone-photography-erode',
  '/cake-smash-photography-erode',
  '/family-photography-erode',
  '/wedding-packages-erode',
  '/pre-wedding-packages-erode',
  '/maternity-packages-erode',
  '/newborn-packages-erode',
  '/baby-milestone-packages-erode',
  '/cake-smash-packages-erode',
  '/family-packages-erode',
  '/privacy',
  '/terms',
];

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
  links?: Array<Partial<ServiceNavLink> & { _id?: string }> | null,
): ServiceNavLink[] {
  if (!links?.length) return DEFAULT_SERVICE_NAV_LINKS.map((l) => ({ ...l }));
  return links
    .map((link, index) => {
      const next: ServiceNavLink = {
        id: link.id ?? link._id,
        label: link.label?.trim() || 'Service',
        path: link.path?.trim() || '/services',
        description: link.description?.trim() || '',
        icon: link.icon?.trim() || 'Camera',
        imageUrl: link.imageUrl?.trim() || '',
        order: typeof link.order === 'number' ? link.order : index,
        isPublished: link.isPublished !== false,
      };
      const seoTitle = link.seoTitle?.trim();
      const seoDescription = link.seoDescription?.trim();
      const heading = link.heading?.trim();
      const lead = link.lead?.trim();
      if (seoTitle) next.seoTitle = seoTitle;
      if (seoDescription) next.seoDescription = seoDescription;
      if (heading) next.heading = heading;
      if (lead) next.lead = lead;
      return next;
    })
    .sort((a, b) => a.order - b.order);
}

export function getPublishedServiceNavLinks(
  links?: Array<Partial<ServiceNavLink> & { _id?: string }> | null,
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
  if (!categories?.length) {
    return DEFAULT_PACKAGE_NAV_LINKS.map((l) => ({ ...l }));
  }

  const links = categories
    .map((cat, index) => {
      const slug = cat.slug?.trim().toLowerCase() || '';
      if (!slug) return null;
      const fallback = DEFAULT_PACKAGE_NAV_LINKS.find((l) => l.categorySlug === slug);
      const rawPath = cat.path?.trim();
      const path = rawPath
        ? normalizePathname(rawPath.startsWith('/') ? rawPath : `/${rawPath}`)
        : fallback?.path ?? defaultPackagePathForSlug(slug);
      const link: PackageNavLink = {
        label: cat.name?.trim() || fallback?.label || 'Packages',
        path,
        categorySlug: slug,
        description: cat.description?.trim() || fallback?.description || '',
        order: typeof cat.order === 'number' ? cat.order : index,
        isPublished: cat.isPublished !== false,
      };
      const seoTitle = cat.seoTitle?.trim();
      const seoDescription = cat.seoDescription?.trim();
      const heading = cat.heading?.trim();
      const lead = cat.lead?.trim();
      if (seoTitle) link.seoTitle = seoTitle;
      if (seoDescription) link.seoDescription = seoDescription;
      if (heading) link.heading = heading;
      if (lead) link.lead = lead;
      return link;
    })
    .filter((link): link is PackageNavLink => link !== null)
    .sort((a, b) => a.order - b.order);

  return links.length ? links : DEFAULT_PACKAGE_NAV_LINKS.map((l) => ({ ...l }));
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
  const fromCms = normalizePackageNavLinks(categories).find(
    (l) => l.categorySlug === clean,
  );
  if (fromCms) return fromCms.path;
  const fallback = DEFAULT_PACKAGE_NAV_LINKS.find((l) => l.categorySlug === clean);
  return fallback?.path ?? defaultPackagePathForSlug(clean);
}
