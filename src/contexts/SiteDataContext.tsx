import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  publicApi,
  getPhotoSources,
  type PublicSiteContent,
  type PublicHeroSlide,
  type PublicStoryScene,
  type PublicStat,
  type PublicTestimonial,
  type PublicBehindScene,
  type PublicTeamMember,
  type PublicPackage,
  type PhotoSources,
} from '../lib/api';
import {
  heroSlides as fallbackHeroSlides,
  storyScenes as fallbackStoryScenes,
  featuredWork as fallbackFeaturedWork,
  galleryImages as fallbackGalleryImages,
  beforeAfter as fallbackBeforeAfter,
  services as fallbackServices,
  stats as fallbackStats,
  testimonials as fallbackTestimonials,
  behindScenes as fallbackBehindScenes,
  teamMembers as fallbackTeamMembers,
} from '../data/content';

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

const fallbackPackages: PublicPackage[] = [
  {
    name: 'Package 1',
    shootType: 'Wedding',
    description: 'Essential wedding coverage',
    inclusions: [
      '1 Traditional Photo',
      '1 Traditional Video',
      '1 Premium Album',
      'Family Wedding Shoot (5 mins)',
    ],
    pricingMode: 'price',
    price: 45000,
    icon: 'Heart',
  },
  {
    name: 'Package 2',
    shootType: 'Wedding',
    description: 'Popular wedding coverage',
    inclusions: [
      '1 Traditional Photo',
      '1 Traditional Video',
      '1 Candid Photo',
      '1 Premium Album',
    ],
    pricingMode: 'price',
    price: 65000,
    icon: 'Camera',
  },
  {
    name: 'Package 3',
    shootType: 'Wedding',
    description: 'Complete wedding coverage',
    inclusions: [
      '1 Traditional Photo',
      '1 Traditional Video',
      '1 Candid Photo',
      '1 Candid Video',
      'Post Wedding Outdoor',
      '1 Premium Album',
    ],
    pricingMode: 'price',
    price: 100000,
    icon: 'Sparkles',
  },
];

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
};

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

const fallbackData: Omit<SiteData, 'loading' | 'fromApi'> = {
  siteContent: defaultSiteContent,
  heroSlides: fallbackHeroSlides,
  storyScenes: fallbackStoryScenes,
  featuredWork: normalizedFallbackFeatured,
  galleryImages: normalizedFallbackGallery,
  beforeAfter: fallbackBeforeAfter,
  services: fallbackServices.map((s) => ({
    title: s.title,
    desc: s.desc,
    icon: s.icon,
    image: s.image,
  })),
  packages: fallbackPackages,
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
  const [data, setData] = useState<SiteData>({
    ...fallbackData,
    loading: true,
    fromApi: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Critical path first: site content + hero (above-the-fold).
        const [siteContent, heroSlides] = await Promise.all([
          publicApi.getSiteContent(),
          publicApi.getHeroSlides(),
        ]);

        if (cancelled) return;

        const nextHero =
          heroSlides.length > 0 ? heroSlides : fallbackHeroSlides;

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
          },
          // Preserve first-slide image briefly via Hero; apply API slides as returned.
          heroSlides: nextHero,
          beforeAfter: siteContent.beforeAfter?.before
            ? siteContent.beforeAfter
            : fallbackBeforeAfter,
          loading: false,
          fromApi: true,
        }));

        // Defer the rest so it does not contend with LCP / first paint.
        const defer =
          typeof requestIdleCallback === 'function'
            ? (cb: () => void) => requestIdleCallback(cb, { timeout: 2500 })
            : (cb: () => void) => setTimeout(cb, 1);

        defer(async () => {
          if (cancelled) return;
          try {
            const [
              storyScenes,
              featuredPhotos,
              allPhotos,
              packages,
              stats,
              testimonials,
              behindScenes,
              teamMembers,
            ] = await Promise.all([
              publicApi.getStoryScenes(),
              publicApi.getPhotos({ featured: true }),
              publicApi.getPhotos(),
              publicApi.getPackages(),
              publicApi.getStats(),
              publicApi.getTestimonials(),
              publicApi.getBehindScenes(),
              publicApi.getTeamMembers().catch(() => [] as PublicTeamMember[]),
            ]);

            if (cancelled) return;

            const featuredWork: FeaturedWorkItem[] = featuredPhotos.length
              ? featuredPhotos
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
                  .filter((item): item is FeaturedWorkItem => item !== null)
              : normalizedFallbackFeatured;

            const galleryImages: GalleryImageItem[] = allPhotos.length
              ? allPhotos
                  .map((p) => getPhotoSources(p))
                  .filter((s): s is PhotoSources => s !== null)
                  .map((s) => ({
                    src: s.src,
                    alt: s.alt,
                    avifSrcSet: s.avifSrcSet,
                    webpSrcSet: s.webpSrcSet,
                  }))
              : normalizedFallbackGallery;

            const services: ServiceItem[] = packages.length
              ? packages.map((p) => ({
                  title: p.name,
                  desc: p.description,
                  icon: p.icon || 'Camera',
                  image: p.imageUrl || '',
                }))
              : fallbackData.services;

            const normalizedPackages: PublicPackage[] = packages.length
              ? packages.map((p) => ({
                  ...p,
                  inclusions: Array.isArray(p.inclusions) ? p.inclusions : [],
                }))
              : fallbackPackages;

            setData((prev) => ({
              ...prev,
              storyScenes: storyScenes.length
                ? storyScenes
                : fallbackStoryScenes,
              featuredWork:
                featuredWork.length > 0
                  ? featuredWork
                  : normalizedFallbackFeatured,
              galleryImages:
                galleryImages.length > 0
                  ? galleryImages
                  : normalizedFallbackGallery,
              services,
              packages: normalizedPackages,
              stats: stats.length ? stats : fallbackStats,
              testimonials: testimonials.length
                ? testimonials
                : fallbackTestimonials,
              behindScenes: behindScenes.length
                ? behindScenes
                : fallbackBehindScenes,
              teamMembers: teamMembers.length
                ? teamMembers
                : fallbackTeamMembers,
              loading: false,
              fromApi: true,
            }));
          } catch {
            if (!cancelled) {
              setData((prev) => ({ ...prev, loading: false }));
            }
          }
        });
      } catch {
        if (!cancelled) {
          setData({ ...fallbackData, loading: false, fromApi: false });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteDataContext.Provider value={data}>{children}</SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
