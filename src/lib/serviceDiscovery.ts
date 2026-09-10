import type { PackageNavLink } from './navigation';
import { normalizePathname } from './navigation';
import type { ServiceImage } from './serviceImages';
import { isExcludedPhotoUrl } from './publicPhoto';

export const SERVICE_CATEGORY_SLUGS: Record<string, string> = {
  '/wedding-photography-erode': 'wedding',
  '/newborn-baby-photography-erode': 'newborn',
  '/maternity-photography-erode': 'maternity',
  '/family-photography-erode': 'family',
  '/baby-milestone-photography-erode': 'baby-milestone',
  '/cake-smash-photography-erode': 'cake-smash',
  '/baby-shower-photography-erode': 'baby-shower',
  '/toddler-baby-photography-erode': 'toddler-baby-shoot',
  '/birthday-event-photography-erode': 'birthday',
  '/ear-piercing-photography-erode': 'ear-piercing',
  '/kids-photography-erode': 'kids',
  '/fashion-photography-erode': 'fashion',
};
const categoryKey = (slug: string) => slug === 'toddler-baby-shoots' ? 'toddler-baby-shoot' : slug;
const PACKAGE_SERVICES = new Set(['wedding', 'newborn', 'maternity', 'family', 'baby-milestone', 'cake-smash', 'baby-shower', 'toddler-baby-shoot']);

export function servicePackageLink(path: string, packages: PackageNavLink[]) {
  const slug = SERVICE_CATEGORY_SLUGS[normalizePathname(path)];
  const match = PACKAGE_SERVICES.has(slug) ? packages.find(item => item.isPublished && categoryKey(item.categorySlug) === slug) : undefined;
  return match ? { path: match.path, label: `View ${match.label.toLowerCase()} packages` }
    : { path: '/packages', label: 'Explore packages' };
}

const MISSING_LOCAL_IMAGES = new Set(['/images/services/maternity.jpg', '/images/services/newborn.jpg', '/images/services/family.jpg', '/images/services/toddler.jpg', '/images/services/baby-shower.jpg', '/images/services/ear-piercing.jpg', '/images/services/kids-photography.jpg']);
export function usableServiceImage(src: string): boolean {
  if (!src.trim() || isExcludedPhotoUrl(src)) return false;
  try {
    const url = new URL(src, 'https://dollpictures.in');
    return !(['dollpictures.in', 'www.dollpictures.in'].includes(url.hostname) && MISSING_LOCAL_IMAGES.has(url.pathname));
  } catch { return false; }
}

export function selectServicePreview(path: string, configured: string, label: string, photos: Array<ServiceImage & { categorySlugs?: string[] }>): ServiceImage | undefined {
  if (usableServiceImage(configured)) return { src: configured.trim(), alt: `${label} photography` };
  const category = SERVICE_CATEGORY_SLUGS[normalizePathname(path)];
  return category ? photos.find(photo => photo.categorySlugs?.some(slug => categoryKey(slug) === category) && usableServiceImage(photo.src)) : undefined;
}
