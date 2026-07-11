export type NavLink = { label: string; path: string; sectionId?: string };

export type ServiceNavLink = {
  id?: string;
  label: string;
  path: string;
  description: string;
  icon: string;
  imageUrl: string;
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

export const SERVICE_PATHS = SERVICE_ROUTES.map((route) => route.path);

export const LEGAL_LINKS = [
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' },
] as const;

export const SITEMAP_ROUTES = [
  '/',
  '/packages',
  '/about',
  ...SECTION_PATHS,
  ...SERVICE_PATHS,
  ...LEGAL_LINKS.map((link) => link.path),
];

export function normalizeServiceNavLinks(
  links?: Array<Partial<ServiceNavLink> & { _id?: string }> | null,
): ServiceNavLink[] {
  if (!links?.length) return DEFAULT_SERVICE_NAV_LINKS.map((l) => ({ ...l }));
  return links
    .map((link, index) => ({
      id: link.id ?? link._id,
      label: link.label?.trim() || 'Service',
      path: link.path?.trim() || '/services',
      description: link.description?.trim() || '',
      icon: link.icon?.trim() || 'Camera',
      imageUrl: link.imageUrl?.trim() || '',
      order: typeof link.order === 'number' ? link.order : index,
      isPublished: link.isPublished !== false,
    }))
    .sort((a, b) => a.order - b.order);
}

export function getPublishedServiceNavLinks(
  links?: Array<Partial<ServiceNavLink> & { _id?: string }> | null,
): ServiceNavLink[] {
  return normalizeServiceNavLinks(links).filter((link) => link.isPublished);
}
