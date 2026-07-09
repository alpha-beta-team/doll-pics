export type NavLink = { label: string; path: string; sectionId?: string };

export const NAV_LINKS: NavLink[] = [
  { label: 'Work', path: '/work', sectionId: 'work' },
  { label: 'Gallery', path: '/gallery', sectionId: 'gallery' },
  { label: 'Services', path: '/services', sectionId: 'services' },
  { label: 'Packages', path: '/packages' },
  { label: 'About', path: '/about' },
  { label: 'Stories', path: '/stories', sectionId: 'testimonials' },
];

export const BOOKING_ROUTE = { path: '/booking', sectionId: 'booking' };

export const PATH_TO_SECTION: Record<string, string> = {
  ...Object.fromEntries(
    NAV_LINKS.filter((link) => link.sectionId).map((link) => [link.path, link.sectionId!]),
  ),
  [BOOKING_ROUTE.path]: BOOKING_ROUTE.sectionId,
};

export const SECTION_PATHS = Object.keys(PATH_TO_SECTION);

export const LEGAL_LINKS = [
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' },
] as const;

export const SITEMAP_ROUTES = [
  '/',
  '/packages',
  '/about',
  ...SECTION_PATHS,
  ...LEGAL_LINKS.map((link) => link.path),
];
