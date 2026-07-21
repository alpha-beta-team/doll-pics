import {
  createContext,
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
  PublicTeamMember,
  PublicTestimonial,
} from '../shared/types';
import {
  heroSlides as fallbackHeroSlides,
  storyScenes as fallbackStoryScenes,
  featuredWork as fallbackFeaturedWork,
  galleryImages as fallbackGalleryImages,
  beforeAfter as fallbackBeforeAfter,
  stats as fallbackStats,
  testimonials as fallbackTestimonials,
  behindScenes as fallbackBehindScenes,
  teamMembers as fallbackTeamMembers,
} from '../data/content';
import {
  DEFAULT_PACKAGE_NAV_LINKS,
  DEFAULT_SERVICE_NAV_LINKS,
  SECTION_PATHS,
  getPublishedPackageNavLinks,
  getPublishedServiceNavLinks,
  normalizePathname,
  normalizeServiceNavLinks,
  type PackageNavLink,
} from '../lib/navigation';

/** Max published photos for the horizontal gallery / landing imagery. */
const GALLERY_PHOTO_LIMIT = 24;

type DataBucket = 'home' | 'media' | 'packages' | 'about';

export interface FeaturedWorkItem {
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
  siteContent: PublicSiteContent;
  heroSlides: PublicHeroSlide[];
  storyScenes: PublicStoryScene[];
  featuredWork: FeaturedWorkItem[];
  galleryImages: GalleryImageItem[];
  beforeAfter: { before: string; after: string };
  services: ServiceItem[];
  packages: PublicPackage[];
  packageCategories: PublicPackageCategory[];
  packageNavLinks: PackageNavLink[];
  stats: PublicStat[];
  testimonials: PublicTestimonial[];
  behindScenes: PublicBehindScene[];
  teamMembers: PublicTeamMember[];
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

const fallbackPackageCategories: PublicPackageCategory[] =
  DEFAULT_PACKAGE_NAV_LINKS.map((link) => ({
    name: link.label,
    slug: link.categorySlug,
    path: link.path,
    description: link.description,
    order: link.order,
  }));

const defaultSiteContent: PublicSiteContent = {
  brandName: 'DOLL PICTURES',
  tagline: 'Cinematic Wedding & Portrait Photography',
  heroHeading: 'We don\u2019t just take photos \u2014 we preserve emotions.',
  heroSubtext:
    'A premium photography studio crafting cinematic visual stories for weddings, portraits, and brands worldwide.',
  about:
    'A premium photography studio crafting cinematic visual stories for weddings, portraits, and brands worldwide.',
  ourStory:
    'What began as a passion for capturing fleeting moments has grown into a studio devoted to cinematic storytelling. ' +
    'From intimate portraits to grand celebrations, we approach every frame with patience, warmth, and an eye for the details that matter most.\n\n' +
    'Rooted in Erode and serving couples and brands across Tamil Nadu and beyond, DOLL PICTURES blends editorial craft with heartfelt connection — ' +
    'so your gallery feels less like documentation and more like a film you can hold.',
  mission:
    'To preserve emotion with elegance — crafting warm, whimsical, and timeless imagery that feels like cinema and lasts a lifetime.',
  aboutHeroSubtext:
    'A warm, inviting studio where craft meets whimsy — dedicated to telling your story through light, emotion, and timeless imagery.',
  contactEmail: 'dollpictures2025@gmail.com',
  whatsapp: '+919994555673',
  phone: '+91 99945 55673',
  socials: {
    instagram: 'https://www.instagram.com/dollpictures_studio/',
  },
  beforeAfter: fallbackBeforeAfter,
  serviceNavLinks: DEFAULT_SERVICE_NAV_LINKS,
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
      ? { src: item, alt: 'Cinematic photography by DOLL PICTURES' }
      : item,
);

const HOME_PATHS = new Set<string>(['/', ...SECTION_PATHS]);

function featuredFromPhotos(photos: PublicPhoto[]): FeaturedWorkItem[] {
  return photos
    .map((p) => {
      const sources = getPhotoSources(p);
      if (!sources) return null;
      const category =
        Array.isArray(p.categoryIds) &&
        p.categoryIds[0] &&
        typeof p.categoryIds[0] === 'object'
          ? (p.categoryIds[0] as { name: string }).name
          : 'Photography';
      return sourcesToFeatured(
        p.title,
        category,
        p.location ?? '',
        p.year ?? '',
        sources,
      );
    })
    .filter((item): item is FeaturedWorkItem => item !== null);
}

function galleryFromPhotos(photos: PublicPhoto[]): GalleryImageItem[] {
  return photos
    .map((p) => getPhotoSources(p))
    .filter((s): s is PhotoSources => s !== null)
    .map((s) => ({
      src: s.src,
      alt: s.alt,
      avifSrcSet: s.avifSrcSet,
      webpSrcSet: s.webpSrcSet,
    }));
}

function bucketsForPath(
  pathname: string,
  packagePaths: Set<string>,
  servicePaths: Set<string>,
): DataBucket[] {
  const path = normalizePathname(pathname);
  const buckets = new Set<DataBucket>();

  if (HOME_PATHS.has(path)) {
    buckets.add('home');
    buckets.add('media');
    buckets.add('packages');
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
  siteContent: defaultSiteContent,
  heroSlides: fallbackHeroSlides,
  storyScenes: fallbackStoryScenes,
  featuredWork: normalizedFallbackFeatured,
  galleryImages: normalizedFallbackGallery,
  beforeAfter: fallbackBeforeAfter,
  services: servicesFromNavLinks(DEFAULT_SERVICE_NAV_LINKS),
  packages: [],
  packageCategories: fallbackPackageCategories,
  packageNavLinks: getPublishedPackageNavLinks(fallbackPackageCategories),
  stats: fallbackStats,
  testimonials: fallbackTestimonials,
  behindScenes: fallbackBehindScenes,
  teamMembers: fallbackTeamMembers,
};

const SiteDataContext = createContext<SiteData>({
  ...fallbackData,
  loading: true,
  fromApi: false,
});

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [data, setData] = useState<SiteData>({
    ...fallbackData,
    loading: true,
    fromApi: false,
  });

  const loadedBuckets = useRef(new Set<DataBucket>());
  const inflightBuckets = useRef(new Set<DataBucket>());
  const packagePathsRef = useRef(
    new Set(DEFAULT_PACKAGE_NAV_LINKS.map((l) => l.path)),
  );
  const servicePathsRef = useRef(
    new Set(DEFAULT_SERVICE_NAV_LINKS.map((l) => l.path)),
  );
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // Critical bootstrap: site content, hero, package categories (routing/nav).
  useEffect(() => {
    let cancelled = false;

    async function loadCritical() {
      try {
        const [siteContent, heroSlides, packageCategories] = await Promise.all([
          publicApi.getSiteContent(),
          publicApi.getHeroSlides(),
          publicApi
            .getPackageCategories()
            .catch(() => [] as PublicPackageCategory[]),
        ]);

        if (cancelled || cancelledRef.current) return;

        const nextHero =
          heroSlides.length > 0 ? heroSlides : fallbackHeroSlides;

        const serviceNavLinks = normalizeServiceNavLinks(
          siteContent.serviceNavLinks,
        );
        const services = servicesFromNavLinks(
          getPublishedServiceNavLinks(serviceNavLinks),
        );

        const categories =
          packageCategories.length > 0
            ? packageCategories
                .map((c, index) => ({
                  name: c.name,
                  slug: c.slug,
                  path: c.path,
                  description: c.description,
                  seoTitle: c.seoTitle,
                  seoDescription: c.seoDescription,
                  heading: c.heading,
                  lead: c.lead,
                  order: typeof c.order === 'number' ? c.order : index,
                }))
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : fallbackPackageCategories;

        const packageNavLinks = getPublishedPackageNavLinks(categories);

        packagePathsRef.current = new Set(packageNavLinks.map((l) => l.path));
        servicePathsRef.current = new Set(
          getPublishedServiceNavLinks(serviceNavLinks).map((l) => l.path),
        );

        setData((prev) => ({
          ...prev,
          siteContent: {
            ...defaultSiteContent,
            ...siteContent,
            ourStory: siteContent.ourStory || defaultSiteContent.ourStory,
            mission: siteContent.mission || defaultSiteContent.mission,
            aboutHeroSubtext:
              siteContent.aboutHeroSubtext || defaultSiteContent.aboutHeroSubtext,
            beforeAfter: siteContent.beforeAfter?.before
              ? siteContent.beforeAfter
              : fallbackBeforeAfter,
            serviceNavLinks,
          },
          services,
          heroSlides: nextHero,
          beforeAfter: siteContent.beforeAfter?.before
            ? siteContent.beforeAfter
            : fallbackBeforeAfter,
          packageCategories: categories,
          packageNavLinks,
          loading: false,
          fromApi: true,
        }));
      } catch {
        if (!cancelled && !cancelledRef.current) {
          setData({ ...fallbackData, loading: false, fromApi: false });
        }
      }
    }

    loadCritical();
    return () => {
      cancelled = true;
    };
  }, []);

  // Route-aware deferred buckets — only fetch what the current page needs.
  useEffect(() => {
    if (data.loading && !data.fromApi) return;

    const needed = bucketsForPath(
      pathname,
      packagePathsRef.current,
      servicePathsRef.current,
    );
    const missing = needed.filter(
      (b) => !loadedBuckets.current.has(b) && !inflightBuckets.current.has(b),
    );
    if (!missing.length) return;

    for (const b of missing) inflightBuckets.current.add(b);

    const defer =
      typeof requestIdleCallback === 'function'
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 2500 })
        : (cb: () => void) => setTimeout(cb, 1);

    let idleId: number | ReturnType<typeof setTimeout> | undefined;
    let started = false;
    let effectCancelled = false;

    const run = () => {
      if (effectCancelled) {
        for (const b of missing) inflightBuckets.current.delete(b);
        return;
      }
      started = true;
      void (async () => {
        try {
          const patch: Partial<SiteData> = {};

          await Promise.all(
            missing.map(async (bucket) => {
              if (cancelledRef.current || effectCancelled) return;

              if (bucket === 'home') {
                const [storyScenes, stats, testimonials, behindScenes] =
                  await Promise.all([
                    publicApi.getStoryScenes(),
                    publicApi.getStats(),
                    publicApi.getTestimonials(),
                    publicApi.getBehindScenes(),
                  ]);
                if (cancelledRef.current || effectCancelled) return;
                patch.storyScenes = storyScenes.length
                  ? storyScenes
                  : fallbackStoryScenes;
                patch.stats = stats.length ? stats : fallbackStats;
                patch.testimonials = testimonials.length
                  ? testimonials
                  : fallbackTestimonials;
                patch.behindScenes = behindScenes.length
                  ? behindScenes
                  : fallbackBehindScenes;
              }

              if (bucket === 'media') {
                const [featuredPhotos, galleryPhotos] = await Promise.all([
                  publicApi.getPhotos({ featured: true }),
                  publicApi.getPhotos({ limit: GALLERY_PHOTO_LIMIT }),
                ]);
                if (cancelledRef.current || effectCancelled) return;

                const featuredWork = featuredFromPhotos(featuredPhotos);
                let galleryImages = galleryFromPhotos(galleryPhotos);
                if (!galleryImages.length && featuredWork.length) {
                  galleryImages = featuredWork.map((w) => ({
                    src: w.image,
                    alt: w.alt,
                    avifSrcSet: w.avifSrcSet,
                    webpSrcSet: w.webpSrcSet,
                  }));
                }

                patch.featuredWork =
                  featuredWork.length > 0
                    ? featuredWork
                    : normalizedFallbackFeatured;
                patch.galleryImages =
                  galleryImages.length > 0
                    ? galleryImages
                    : normalizedFallbackGallery;
              }

              if (bucket === 'packages') {
                const packages = await publicApi.getPackages();
                if (cancelledRef.current || effectCancelled) return;
                patch.packages = packages.map(normalizePublicPackage);
              }

              if (bucket === 'about') {
                const [teamMembers, behindScenes] = await Promise.all([
                  publicApi
                    .getTeamMembers()
                    .catch(() => [] as PublicTeamMember[]),
                  loadedBuckets.current.has('home')
                    ? Promise.resolve(null)
                    : publicApi.getBehindScenes(),
                ]);
                if (cancelledRef.current || effectCancelled) return;
                patch.teamMembers = teamMembers.length
                  ? teamMembers
                  : fallbackTeamMembers;
                if (behindScenes) {
                  patch.behindScenes = behindScenes.length
                    ? behindScenes
                    : fallbackBehindScenes;
                }
              }

              loadedBuckets.current.add(bucket);
              inflightBuckets.current.delete(bucket);
            }),
          );

          if (cancelledRef.current || effectCancelled) return;
          if (Object.keys(patch).length) {
            setData((prev) => ({
              ...prev,
              ...patch,
              loading: false,
              fromApi: true,
            }));
          }
        } catch {
          for (const b of missing) inflightBuckets.current.delete(b);
          if (!cancelledRef.current && !effectCancelled) {
            setData((prev) => ({ ...prev, loading: false }));
          }
        }
      })();
    };

    idleId = defer(run);

    return () => {
      effectCancelled = true;
      if (typeof idleId === 'number' && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      } else if (idleId != null) {
        clearTimeout(idleId as ReturnType<typeof setTimeout>);
      }
      if (!started) {
        for (const b of missing) inflightBuckets.current.delete(b);
      }
    };
  }, [
    pathname,
    data.loading,
    data.fromApi,
    data.packageNavLinks,
    data.siteContent.serviceNavLinks,
  ]);

  return (
    <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
