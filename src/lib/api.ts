const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

export function getPhotoUrl(photo: {
  variants?: {
    webp?: string | { url: string; width: number }[];
    avif?: string | { url: string; width: number }[];
    original?: { url: string };
  };
}): string {
  const variants = photo.variants;
  if (!variants) return '';
  if (typeof variants.webp === 'string' && variants.webp) {
    return resolveMediaUrl(variants.webp);
  }
  const webpArr = variants.webp;
  if (Array.isArray(webpArr) && webpArr.length > 0) {
    return resolveMediaUrl(webpArr[webpArr.length - 1].url);
  }
  if (variants.original?.url) {
    return resolveMediaUrl(variants.original.url);
  }
  return '';
}

export interface PublicSiteContent {
  brandName: string;
  tagline: string;
  heroHeading: string;
  heroSubtext: string;
  about: string;
  ourStory?: string;
  mission?: string;
  aboutHeroSubtext?: string;
  contactEmail: string;
  whatsapp: string;
  phone: string;
  socials: Record<string, string>;
  beforeAfter: { before: string; after: string };
}

export interface PublicPhoto {
  _id?: string;
  id?: string;
  title: string;
  altText?: string;
  location?: string;
  year?: string;
  isFeatured?: boolean;
  variants?: {
    webp?: string | { url: string; width: number }[];
    avif?: string | { url: string; width: number }[];
    original?: { url: string };
  };
  categoryIds?: Array<{ name: string; slug: string } | string>;
}

export interface PublicPackage {
  name: string;
  shootType: string;
  description: string;
  inclusions: string[];
  icon?: string;
  imageUrl?: string;
  pricingMode: string;
  price?: number;
}

export interface PublicHeroSlide {
  image: string;
  label: string;
}

export interface PublicStoryScene {
  text: string;
  image: string;
}

export interface PublicStat {
  value: number;
  suffix: string;
  label: string;
}

export interface PublicTestimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  likes: number;
  reply: string;
}

export interface PublicBehindScene {
  title: string;
  image: string;
}

export interface PublicTeamMember {
  name: string;
  role: string;
  bio: string;
  photo: string;
}

export interface CreateEnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  shootType: string;
  message: string;
}

export const publicApi = {
  getSiteContent: () => publicFetch<PublicSiteContent>('/site-content'),
  getPhotos: (params?: { featured?: boolean }) => {
    const qs = params?.featured ? '?featured=true' : '';
    return publicFetch<PublicPhoto[]>(`/photos${qs}`);
  },
  getPackages: () => publicFetch<PublicPackage[]>('/packages'),
  getHeroSlides: () => publicFetch<PublicHeroSlide[]>('/hero-slides'),
  getStoryScenes: () => publicFetch<PublicStoryScene[]>('/story-scenes'),
  getStats: () => publicFetch<PublicStat[]>('/stats'),
  getTestimonials: () => publicFetch<PublicTestimonial[]>('/testimonials'),
  getBehindScenes: () => publicFetch<PublicBehindScene[]>('/behind-scenes'),
  getTeamMembers: () => publicFetch<PublicTeamMember[]>('/team-members'),
  createEnquiry: (data: CreateEnquiryPayload) =>
    publicFetch('/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
