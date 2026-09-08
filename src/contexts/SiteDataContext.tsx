import type { PortfolioPhoto } from '../lib/galleryPortfolio';
import { packageCatalogSource, publicPackageCategories, readBuildPublicCatalog, resolvePublicCatalog, serviceCatalogSource, type PublicRouteCatalog } from '../lib/publicCatalog';
import { photoLabels } from '../lib/photoLabels';
import type { ServiceMediaSnapshot } from '../lib/serviceMedia';
import { PublicRequestError, publicFailure } from '../lib/publicRequest';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  publicApi,
  getPhotoSources,
  type PhotoSources,
} from '../lib/api';
import type {
  PublicBehindScene,
  PublicHeroSlide,
  PublicPackage,
  PublicPackageCategory,
  PublicPhoto,
  PublicSiteContent,
  PublicStat,
  PublicStoryScene,
  PublicStaffProfile,
  PublicTestimonial,
} from '../shared/types';
import {
  heroSlides as fallbackHeroSlides,
  storyScenes as fallbackStoryScenes,
  featuredWork as fallbackFeaturedWork,
  galleryImages as fallbackGalleryImages,
  stats as fallbackStats,
  testimonials as fallbackTestimonials,
  behindScenes as fallbackBehindScenes,
  staffProfiles as fallbackStaffProfiles,
} from '../data/content';
import {
  getPublishedServiceNavLinks,
  normalizePathname,
  type PackageNavLink,
} from '../lib/navigation';
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_SOCIALS,
  BUSINESS_WHATSAPP,
} from '../lib/businessIdentity';

/** Max published photos for the horizontal gallery / landing imagery. */
const GALLERY_PHOTO_LIMIT = 24;

type DataBucket = 'home' | 'reviews' | 'media' | 'packages' | 'about';

export interface FeaturedWorkItem {
  categorySlugs?: string[];
  title: string;
  category: string;
  image: string;
  alt: string;
  location: string;
  year: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
}

export interface GalleryImageItem {
  categorySlugs?: string[];
  src: string;
  alt: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
}

export interface ServiceItem {
  title: string;
  desc: string;
  icon: string;
  image: string;
  path?: string;
}

export interface SiteData {
  publicCatalog: PublicRouteCatalog;
  serviceMedia?: ServiceMediaSnapshot;
  galleryPortfolio?: { photos: PortfolioPhoto[]; loaded: boolean };
  siteContent: PublicSiteContent;
  heroSlides: PublicHeroSlide[];
  storyScenes: PublicStoryScene[];
  featuredWork: FeaturedWorkItem[];
  galleryImages: GalleryImageItem[];
  services: ServiceItem[];
  packages: PublicPackage[];
  packageCategories: PublicPackageCategory[];
  packageNavLinks: PackageNavLink[];
  stats: PublicStat[];
  testimonials: PublicTestimonial[];
  behindScenes: PublicBehindScene[];
  staffProfiles: PublicStaffProfile[];
  loading: boolean;
  fromApi: boolean;
}

function sourcesToFeatured(
  title: string,
  category: string,
  location: string,
  year: string,
  sources: PhotoSources,
): FeaturedWorkItem {
  return {
    title,
    category,
    image: sources.src,
    alt: sources.alt,
    location,
    year,
    avifSrcSet: sources.avifSrcSet,
    webpSrcSet: sources.webpSrcSet,
  };
}

const fallbackCatalog = resolvePublicCatalog();

const defaultSiteContent: PublicSiteContent = {
  brandName: BUSINESS_NAME,
  tagline: 'Cinematic Wedding & Portrait Photography',
  heroHeading: 'We don\u2019t just take photos \u2014 we preserve emotions.',
  heroSubtext:
    'A premium photography studio crafting cinematic visual stories for weddings, portraits, and brands worldwide.',
  about:
    'A premium photography studio crafting cinematic visual stories for weddings, portraits, and brands worldwide.',
  ourStory:
    'What began as a passion for capturing fleeting moments has grown into a studio devoted to cinematic storytelling. ' +
    'From intimate portraits to grand celebrations, we approach every frame with patience, warmth, and an eye for the details that matter most.\n\n' +
    'Rooted in Erode and serving couples and brands across Tamil Nadu and beyond, Doll Pictures by Ramya Vignesh blends editorial craft with heartfelt connection — ' +
    'so your gallery feels less like documentation and more like a film you can hold.',
  mission:
    'To preserve emotion with elegance — crafting warm, whimsical, and timeless imagery that feels like cinema and lasts a lifetime.',
  aboutHeroSubtext:
    'A warm, inviting studio where craft meets whimsy — dedicated to telling your story through light, emotion, and timeless imagery.',
  contactEmail: BUSINESS_EMAIL,
  whatsapp: BUSINESS_WHATSAPP,
  phone: BUSINESS_PHONE,
  socials: BUSINESS_SOCIALS,
  serviceNavLinks: [],
};

function servicesFromNavLinks(
  links: ReturnType<typeof getPublishedServiceNavLinks>,
): ServiceItem[] {
  return links.map((link) => ({
    title: link.label,
    desc: link.description,
    icon: link.icon || 'Camera',
    image: link.imageUrl,
    path: link.path,
  }));
}

function normalizePublicPackage(p: PublicPackage): PublicPackage {
  const categoryName = p.categoryName?.trim() || p.shootType?.trim() || '';
  const categorySlug =
    p.categorySlug?.trim().toLowerCase() ||
    categoryName.toLowerCase().replace(/\s+/g, '-');
  const locationType = p.locationType ?? '';
  return {
    ...p,
    inclusions: Array.isArray(p.inclusions) ? p.inclusions : [],
    categoryName: categoryName || undefined,
    categorySlug: categorySlug || undefined,
    shootType: p.shootType || categoryName || undefined,
    durationLabel: p.durationLabel ?? '',
    advanceAmount: p.advanceAmount != null ? p.advanceAmount : null,
    notes: Array.isArray(p.notes) ? p.notes : [],
    slotTimings: Array.isArray(p.slotTimings) ? p.slotTimings : [],
    locationType:
      locationType === 'studio' ||
      locationType === 'home' ||
      locationType === 'outdoor'
        ? locationType
        : '',
    themeGuideUrl: p.themeGuideUrl ?? '',
  };
}

const normalizedFallbackFeatured: FeaturedWorkItem[] = fallbackFeaturedWork.map(
  (w) => ({
    ...w,
    alt: w.alt ?? w.title,
  }),
);

const normalizedFallbackGallery: GalleryImageItem[] = fallbackGalleryImages.map(
  (item) =>
    typeof item === 'string'
      ? { src: item, alt: 'Photography' }
      : item,
);

function isPlaceholderPhoto(photo: PublicPhoto): boolean {
  const original = photo.variants?.original?.url ?? '';
  return (
    photo.storageKey?.startsWith('seed/') === true ||
    original.includes('picsum.photos')
  );
}

function isLegacyHeroSlide(slide: PublicHeroSlide): boolean {
  return [
    '/photos/265722/',
    '/photos/1024993/',
    '/photos/1779415/',
  ].some((legacyPath) => slide.image.includes(legacyPath));
}

function featuredFromPhotos(photos: PublicPhoto[]): FeaturedWorkItem[] {
  return photos
    .filter((photo) => !isPlaceholderPhoto(photo))
    .map<FeaturedWorkItem | null>((p) => {
      const sources = getPhotoSources(p);
      if (!sources) return null;
      const category =
        Array.isArray(p.categoryIds) &&
        p.categoryIds[0] &&
        typeof p.categoryIds[0] === 'object'
          ? (p.categoryIds[0] as { name: string }).name
          : 'Photography';
      return { ...sourcesToFeatured(
        photoLabels(p).title,
        category,
        p.location ?? '',
        p.year ?? '',
        sources,
      ), categorySlugs: photoCategorySlugs(p) };
    })
    .filter((item): item is FeaturedWorkItem => item !== null);
}

function photoCategorySlugs(photo: PublicPhoto): string[] {
  return (photo.categoryIds ?? []).flatMap(category => typeof category === 'object' && category?.slug ? [category.slug] : []);
}

function galleryFromPhotos(photos: PublicPhoto[]): GalleryImageItem[] {
  return photos.filter(photo => !isPlaceholderPhoto(photo)).flatMap(photo => {
    const sources = getPhotoSources(photo);
    return sources ? [{ ...sources, categorySlugs: photoCategorySlugs(photo) }] : [];
  });
}

function bucketsForPath(
  pathname: string,
  packagePaths: Set<string>,
  servicePaths: Set<string>,
): DataBucket[] {
  const path = normalizePathname(pathname);
  const buckets = new Set<DataBucket>();

  if (path === '/') {
    buckets.add('home');
    buckets.add('media');
    buckets.add('packages');
  }
  if (path === '/work') {
    buckets.add('media');
  }
  if (path === '/stories') {
    buckets.add('reviews');
  }
  if (path === '/about') {
    buckets.add('about');
  }
  if (packagePaths.has(path)) {
    buckets.add('packages');
    buckets.add('media');
  }
  if (servicePaths.has(path)) {
    buckets.add('media');
  }
  return [...buckets];
}

const fallbackData: Omit<SiteData, 'loading' | 'fromApi'> = {
  publicCatalog: fallbackCatalog,
  siteContent: { ...defaultSiteContent, serviceNavLinks: fallbackCatalog.serviceLinks },
  heroSlides: fallbackHeroSlides,
  storyScenes: fallbackStoryScenes,
  featuredWork: normalizedFallbackFeatured,
  galleryImages: normalizedFallbackGallery,
  services: servicesFromNavLinks(fallbackCatalog.serviceLinks),
  packages: [],
  packageCategories: publicPackageCategories(fallbackCatalog),
  packageNavLinks: fallbackCatalog.packageLinks,
  stats: fallbackStats,
  testimonials: fallbackTestimonials,
  behindScenes: fallbackBehindScenes,
  staffProfiles: fallbackStaffProfiles,
};

const SiteDataContext = createContext<SiteData>({
  ...fallbackData,
  loading: true,
  fromApi: false,
});

function readBuildTimeHero(): PublicHeroSlide[] {
  if (typeof document === 'undefined') return fallbackHeroSlides;
  const source = document
    .querySelector<HTMLLinkElement>('link[data-home-hero-source]')
    ?.getAttribute('data-home-hero-source')
    ?.trim();
  return source
    ? [{ image: source, label: 'Featured' }]
    : fallbackHeroSlides;
}

export type CmsResource = 'siteContent' | 'hero' | 'categories' | 'storyScenes' | 'stats'
  | 'testimonials' | 'behindScenes' | 'featuredPhotos' | 'galleryPhotos' | 'packages' | 'staffProfiles';
const CRITICAL_RESOURCES: CmsResource[] = ['siteContent', 'hero', 'categories'];
const ROUTING_RESOURCES: CmsResource[] = ['siteContent', 'categories'];
const BUCKET_RESOURCES: Record<DataBucket, CmsResource[]> = {
  home: ['storyScenes', 'stats', 'testimonials', 'behindScenes'],
  reviews: ['testimonials'],
  media: ['featuredPhotos', 'galleryPhotos'],
  packages: ['packages'],
  about: ['staffProfiles', 'behindScenes'],
};
type SitePatch = Partial<SiteData> | ((previous: SiteData) => Partial<SiteData>);

function collection<T>(value: T[]): T[] {
  if (!Array.isArray(value)) throw new PublicRequestError('invalid_response');
  return value;
}

function catalogPatch(previous: SiteData, sources: Partial<PublicRouteCatalog['sources']>, patch: Partial<SiteData> = {}): Partial<SiteData> {
  const publicCatalog = resolvePublicCatalog({ ...previous.publicCatalog.sources, ...sources });
  return {
    ...patch, publicCatalog,
    siteContent: { ...(patch.siteContent ?? previous.siteContent), serviceNavLinks: publicCatalog.serviceLinks },
    services: servicesFromNavLinks(publicCatalog.serviceLinks),
    packageCategories: publicPackageCategories(publicCatalog),
    packageNavLinks: publicCatalog.packageLinks,
  };
}

/** Each resource produces its own patch; another endpoint cannot discard it. */
async function loadResource(resource: CmsResource, signal: AbortSignal, supplied?: { siteContent?: PublicSiteContent; categories?: PublicPackageCategory[] }): Promise<SitePatch> {
  const init = { signal };
  switch (resource) {
    case 'siteContent': {
      const content = supplied?.siteContent ?? await publicApi.getSiteContent(init);
      if (!content || typeof content !== 'object' || Array.isArray(content)) throw new PublicRequestError('invalid_response');
      const source = serviceCatalogSource(content);
      if (source.status !== 'cms') throw new PublicRequestError('invalid_response');
      return previous => catalogPatch(previous, { services: source }, {
        siteContent: {
          ...defaultSiteContent, ...content,
          brandName: BUSINESS_NAME, contactEmail: BUSINESS_EMAIL,
          whatsapp: BUSINESS_WHATSAPP, phone: BUSINESS_PHONE, socials: BUSINESS_SOCIALS,
          ourStory: content.ourStory || defaultSiteContent.ourStory,
          mission: content.mission || defaultSiteContent.mission,
          aboutHeroSubtext: content.aboutHeroSubtext || defaultSiteContent.aboutHeroSubtext,
        },
      });
    }
    case 'hero': {
      const slides = collection(await publicApi.getHeroSlides(init)).filter(slide => !isLegacyHeroSlide(slide));
      // Keep the initial HTML/preload hero until a usable CMS hero is available.
      return slides.length ? { heroSlides: slides } : {};
    }
    case 'categories': {
      const result = supplied?.categories ?? await publicApi.getPackageCategories(init);
      const source = packageCatalogSource(result);
      if (source.status !== 'cms') throw new PublicRequestError('invalid_response');
      return previous => catalogPatch(previous, { packages: source });
    }
    case 'storyScenes': {
      const result = collection(await publicApi.getStoryScenes(init));
      return { storyScenes: result.length ? result : fallbackStoryScenes };
    }
    case 'stats': return { stats: collection(await publicApi.getStats(init)) };
    case 'testimonials': return { testimonials: collection(await publicApi.getTestimonials(init)) };
    case 'behindScenes': return { behindScenes: collection(await publicApi.getBehindScenes(init)) };
    case 'staffProfiles': return { staffProfiles: collection(await publicApi.getStaffProfiles(init)) };
    case 'packages': return { packages: collection(await publicApi.getPackages(init)).map(normalizePublicPackage) };
    case 'featuredPhotos': {
      const result = featuredFromPhotos(collection(await publicApi.getPhotos({ featured: true }, init)));
      return { featuredWork: result };
    }
    case 'galleryPhotos': {
      const result = galleryFromPhotos(collection(await publicApi.getPhotos({ limit: GALLERY_PHOTO_LIMIT }, init)));
      return { galleryImages: result };
    }
  }
}

export async function createPrerenderSiteData(content?: PublicSiteContent, categories?: PublicPackageCategory[], home?: { hero?: PublicHeroSlide[]; featured?: PublicPhoto[]; gallery?: PublicPhoto[] }, offers?: PublicPackage[]) {
  let data: SiteData = { ...fallbackData, loading: false, fromApi: false };
  const loaded: CmsResource[] = [];
  const supplied = { siteContent: content, categories };
  for (const resource of ['siteContent', 'categories'] as const) {
    if (supplied[resource] === undefined) continue;
    const patch = await loadResource(resource, new AbortController().signal, supplied);
    data = { ...data, ...(typeof patch === 'function' ? patch(data) : patch), fromApi: true };
    loaded.push(resource);
  }
  if (home?.hero) {
    data.heroSlides = home.hero.filter(slide => typeof slide.image === 'string' && !isLegacyHeroSlide(slide))
      .map(slide => ({ image: slide.image, label: typeof slide.label === 'string' ? slide.label : '' }));
    loaded.push('hero');
  }
  if (home?.featured) { data.featuredWork = featuredFromPhotos(home.featured); loaded.push('featuredPhotos'); }
  if (home?.gallery) { data.galleryImages = galleryFromPhotos(home.gallery); loaded.push('galleryPhotos'); }
  if (offers) {
    const keys: Array<keyof PublicPackage> = ['name', 'shootType', 'categorySlug', 'categoryName', 'description', 'inclusions', 'icon', 'imageUrl', 'pricingMode', 'price', 'durationLabel', 'advanceAmount', 'notes', 'slotTimings', 'locationType', 'themeGuideUrl'];
    data.packages = offers.map(offer => normalizePublicPackage(Object.fromEntries(keys.filter(key => offer[key] !== undefined).map(key => [key, offer[key]])) as PublicPackage));
    loaded.push('packages');
  }
  // Embed only the public view model, never the raw CMS response or metadata.
  data.siteContent = Object.fromEntries(Object.keys(defaultSiteContent).map(key => [key, data.siteContent[key as keyof PublicSiteContent]])) as PublicSiteContent;
  data.siteContent.serviceNavLinks = getPublishedServiceNavLinks(data.siteContent.serviceNavLinks);
  return { data, loaded };
}

export function SiteDataProvider({ children, initialData, initialLoaded = [] }: {
  children: ReactNode; initialData?: SiteData; initialLoaded?: CmsResource[];
}) {
  const { pathname } = useLocation();
  const [data, setData] = useState<SiteData>(() => {
    if (initialData) return initialData;
    const initial = { ...fallbackData, heroSlides: readBuildTimeHero(), loading: true, fromApi: false };
    const catalog = readBuildPublicCatalog();
    return catalog ? { ...initial, ...catalogPatch(initial, catalog.sources) } : initial;
  });
  const mounted = useRef(false);
  const loaded = useRef(new Set<CmsResource>(initialLoaded));
  const failed = useRef(new Map<CmsResource, number>());
  const inflight = useRef(new Map<CmsResource, AbortController>());
  const settled = useRef(new Set<CmsResource>(initialLoaded));
  const desired = useRef(new Set<CmsResource>(CRITICAL_RESOURCES));
  const lastPath = useRef(pathname);

  const requestResource = useCallback(async (resource: CmsResource) => {
    if (!mounted.current || loaded.current.has(resource) || failed.current.has(resource) || inflight.current.has(resource)) return;
    const controller = new AbortController();
    inflight.current.set(resource, controller);
    const isCurrent = () => mounted.current && !controller.signal.aborted && inflight.current.get(resource) === controller;
    try {
      const patch = await loadResource(resource, controller.signal);
      if (!isCurrent()) return;
      loaded.current.add(resource);
      failed.current.delete(resource);
      setData(previous => ({ ...previous, ...(typeof patch === 'function' ? patch(previous) : patch), fromApi: true }));
    } catch (error) {
      if (!isCurrent()) return;
      failed.current.set(resource, Date.now());
      console.warn('Public CMS resource unavailable', { resource, ...publicFailure(error) });
      if (resource === 'siteContent' || resource === 'categories') {
        const key = resource === 'siteContent' ? 'services' : 'packages';
        setData(previous => {
          const source = previous.publicCatalog.sources[key];
          if (source.status === 'cms') return previous;
          return { ...previous, ...catalogPatch(previous, { [key]: {
            ...source, reason: publicFailure(error).kind === 'invalid_response' ? 'invalid-response' : 'unavailable',
          } }) };
        });
      }
      // Initial fallback or a previously successful response remains untouched.
    } finally {
      if (isCurrent()) {
        inflight.current.delete(resource);
        settled.current.add(resource);
        // Hero availability must not hold up service/package route resolution.
        if (ROUTING_RESOURCES.every(key => settled.current.has(key))) {
          setData(previous => previous.loading ? { ...previous, loading: false } : previous);
        }
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const activeRequests = inflight.current;
    // Strict Mode's discarded mount must not start an extra network attempt.
    queueMicrotask(() => { if (!cancelled) CRITICAL_RESOURCES.forEach(key => void requestResource(key)); });
    const recover = (force: boolean) => {
      for (const [resource, failedAt] of failed.current) {
        if (desired.current.has(resource) && (force || Date.now() - failedAt >= 5000)) {
          failed.current.delete(resource);
          void requestResource(resource);
        }
      }
    };
    const online = () => recover(true);
    const focus = () => recover(false);
    window.addEventListener('online', online);
    window.addEventListener('focus', focus);
    return () => {
      cancelled = true;
      mounted.current = false;
      window.removeEventListener('online', online);
      window.removeEventListener('focus', focus);
      activeRequests.forEach(controller => controller.abort());
      activeRequests.clear();
    };
  }, [requestResource]);

  useEffect(() => {
    const needed = new Set<CmsResource>(CRITICAL_RESOURCES);
    if (!data.loading) {
      const buckets = bucketsForPath(pathname,
        new Set(data.packageNavLinks.map(link => link.path)),
        new Set(getPublishedServiceNavLinks(data.siteContent.serviceNavLinks).map(link => link.path)));
      buckets.forEach(bucket => BUCKET_RESOURCES[bucket].forEach(resource => needed.add(resource)));
    }
    desired.current = needed;
    // Cancel only resources the new route no longer needs. Shared work continues.
    for (const [resource, controller] of inflight.current) {
      if (!needed.has(resource)) {
        controller.abort();
        inflight.current.delete(resource);
      }
    }
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      needed.forEach(resource => failed.current.delete(resource));
      CRITICAL_RESOURCES.forEach(resource => void requestResource(resource));
    }
    let cancelled = false;
    const run = () => {
      if (!cancelled) needed.forEach(resource => {
        if (!CRITICAL_RESOURCES.includes(resource)) void requestResource(resource);
      });
    };
    // Defer noncritical content without delaying navigation or the initial hero.
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => { cancelled = true; cancelIdleCallback(id); };
    }
    const id = setTimeout(run, 1);
    return () => { cancelled = true; clearTimeout(id); };
  }, [pathname, data.loading, data.packageNavLinks, data.siteContent.serviceNavLinks, requestResource]);

  return <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
