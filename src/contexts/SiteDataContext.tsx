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
  type PublicTeamMember,
  type PublicPackage,
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
  packages: PublicPackage[];
  stats: PublicStat[];
  testimonials: PublicTestimonial[];
  behindScenes: PublicBehindScene[];
  teamMembers: PublicTeamMember[];
  loading: boolean;
  fromApi: boolean;
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
          teamMembers,
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
          publicApi.getTeamMembers().catch(() => [] as PublicTeamMember[]),
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

        const normalizedPackages: PublicPackage[] = packages.length
          ? packages.map(p => ({
              ...p,
              inclusions: Array.isArray(p.inclusions) ? p.inclusions : [],
            }))
          : fallbackPackages;

        setData({
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
          heroSlides: heroSlides.length ? heroSlides : fallbackHeroSlides,
          storyScenes: storyScenes.length ? storyScenes : fallbackStoryScenes,
          featuredWork,
          galleryImages,
          beforeAfter: siteContent.beforeAfter?.before
            ? siteContent.beforeAfter
            : fallbackBeforeAfter,
          services,
          packages: normalizedPackages,
          stats: stats.length ? stats : fallbackStats,
          testimonials: testimonials.length ? testimonials : fallbackTestimonials,
          behindScenes: behindScenes.length ? behindScenes : fallbackBehindScenes,
          teamMembers: teamMembers.length ? teamMembers : fallbackTeamMembers,
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
