import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  publicApi,
  getPhotoUrl,
  type PublicSiteContent,
  type PublicHeroSlide,
  type PublicStoryScene,
  type PublicStat,
  type PublicTestimonial,
  type PublicBehindScene,
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
} from '../data/content';

export interface FeaturedWorkItem {
  title: string;
  category: string;
  image: string;
  location: string;
  year: string;
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
  galleryImages: string[];
  beforeAfter: { before: string; after: string };
  services: ServiceItem[];
  stats: PublicStat[];
  testimonials: PublicTestimonial[];
  behindScenes: PublicBehindScene[];
  loading: boolean;
  fromApi: boolean;
}

const defaultSiteContent: PublicSiteContent = {
  brandName: 'DOLL PICTURES',
  tagline: 'Cinematic Wedding & Portrait Photography',
  heroHeading: 'We don\u2019t just take photos \u2014 we preserve emotions.',
  heroSubtext:
    'A premium photography studio crafting cinematic visual stories for weddings, portraits, and brands worldwide.',
  about:
    'A premium photography studio crafting cinematic visual stories for weddings, portraits, and brands worldwide.',
  contactEmail: 'dollpictures2025@gmail.com',
  whatsapp: '+919597562337',
  phone: '+91 95975 62337',
  socials: {},
  beforeAfter: fallbackBeforeAfter,
};

const fallbackData: Omit<SiteData, 'loading' | 'fromApi'> = {
  siteContent: defaultSiteContent,
  heroSlides: fallbackHeroSlides,
  storyScenes: fallbackStoryScenes,
  featuredWork: fallbackFeaturedWork,
  galleryImages: fallbackGalleryImages,
  beforeAfter: fallbackBeforeAfter,
  services: fallbackServices.map(s => ({
    title: s.title,
    desc: s.desc,
    icon: s.icon,
    image: s.image,
  })),
  stats: fallbackStats,
  testimonials: fallbackTestimonials,
  behindScenes: fallbackBehindScenes,
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
        const [
          siteContent,
          heroSlides,
          storyScenes,
          featuredPhotos,
          allPhotos,
          packages,
          stats,
          testimonials,
          behindScenes,
        ] = await Promise.all([
          publicApi.getSiteContent(),
          publicApi.getHeroSlides(),
          publicApi.getStoryScenes(),
          publicApi.getPhotos({ featured: true }),
          publicApi.getPhotos(),
          publicApi.getPackages(),
          publicApi.getStats(),
          publicApi.getTestimonials(),
          publicApi.getBehindScenes(),
        ]);

        if (cancelled) return;

        const featuredWork: FeaturedWorkItem[] = featuredPhotos.length
          ? featuredPhotos.map(p => ({
              title: p.title,
              category: Array.isArray(p.categoryIds) && p.categoryIds[0] && typeof p.categoryIds[0] === 'object'
                ? (p.categoryIds[0] as { name: string }).name
                : 'Photography',
              image: getPhotoUrl(p),
              location: p.location ?? '',
              year: p.year ?? '',
            }))
          : fallbackFeaturedWork;

        const galleryImages = allPhotos.length
          ? allPhotos.map(getPhotoUrl).filter(Boolean)
          : fallbackGalleryImages;

        const services: ServiceItem[] = packages.length
          ? packages.map(p => ({
              title: p.name,
              desc: p.description,
              icon: p.icon || 'Camera',
              image: p.imageUrl || '',
            }))
          : fallbackData.services;

        setData({
          siteContent: {
            ...defaultSiteContent,
            ...siteContent,
            beforeAfter: siteContent.beforeAfter?.before
              ? siteContent.beforeAfter
              : fallbackBeforeAfter,
          },
          heroSlides: heroSlides.length ? heroSlides : fallbackHeroSlides,
          storyScenes: storyScenes.length ? storyScenes : fallbackStoryScenes,
          featuredWork,
          galleryImages,
          beforeAfter: siteContent.beforeAfter?.before
            ? siteContent.beforeAfter
            : fallbackBeforeAfter,
          services,
          stats: stats.length ? stats : fallbackStats,
          testimonials: testimonials.length ? testimonials : fallbackTestimonials,
          behindScenes: behindScenes.length ? behindScenes : fallbackBehindScenes,
          loading: false,
          fromApi: true,
        });
      } catch {
        if (!cancelled) {
          setData({ ...fallbackData, loading: false, fromApi: false });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <SiteDataContext.Provider value={data}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
