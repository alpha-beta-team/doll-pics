import { createPublicFetch } from './publicRequest';
export { ApiError } from './publicRequest';
import { captureAttribution } from './attribution';
import type {
  CreateEnquiryPayload,
  PublicBookingBackground,
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

export type {
  CreateEnquiryPayload,
  PublicBookingBackground,
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
  ServiceNavLinkInput as PublicServiceNavLink,
} from '../shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/dollpictures';
// Include candidates near the actual mobile card widths. Without these, a
// 260-650 px rendered image is rounded up to an 800 px download.
const IMAGEKIT_WIDTHS = [320, 480, 640, 720, 960, 1200, 1600] as const;

function imageKitPhotoUrl(storageKey: string, width: number, quality = 78): string {
  const path = storageKey.split('/').map(encodeURIComponent).join('/');
  return `${IMAGEKIT_ENDPOINT}/tr:w-${width},q-${quality},f-auto/${path}`;
}

/** Map NestJS/class-validator messages ("email must be an email") to field keys. */
export function parseApiFieldErrors(
  messages: string[],
  fields: readonly string[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const msg of messages) {
    const field = fields.find((f) => msg === f || msg.startsWith(`${f} `));
    if (!field || errors[field]) continue;
    const stripped = msg.startsWith(`${field} `) ? msg.slice(field.length + 1) : msg;
    errors[field] = stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }
  return errors;
}

export const publicFetch = createPublicFetch(API_BASE);

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

type PhotoVariantList = string | { url: string; width: number }[] | undefined;

function asWidthVariants(
  value: PhotoVariantList,
): { url: string; width: number }[] {
  if (!value) return [];
  if (typeof value === 'string') return [];
  return [...value].sort((a, b) => a.width - b.width);
}

function buildSrcSet(variants: { url: string; width: number }[]): string {
  return variants
    .map((v) => `${resolveMediaUrl(v.url)} ${v.width}w`)
    .join(', ');
}

export function getPhotoUrl(photo: {
  variants?: {
    webp?: PhotoVariantList;
    avif?: PhotoVariantList;
    original?: { url: string };
  };
}): string {
  const variants = photo.variants;
  if (!variants) return '';
  if (typeof variants.webp === 'string' && variants.webp) {
    return resolveMediaUrl(variants.webp);
  }
  const webpArr = asWidthVariants(variants.webp);
  if (webpArr.length > 0) {
    return resolveMediaUrl(webpArr[webpArr.length - 1].url);
  }
  if (variants.original?.url) {
    return resolveMediaUrl(variants.original.url);
  }
  return '';
}

export type PhotoSources = {
  src: string;
  alt: string;
  avifSrcSet?: string;
  webpSrcSet?: string;
};

/** Build responsive sources (AVIF/WebP srcsets) from CMS photo variants. */
export function getPhotoSources(photo: {
  title?: string;
  altText?: string;
  storageKey?: string;
  variants?: {
    webp?: PhotoVariantList;
    avif?: PhotoVariantList;
    original?: { url: string };
  };
}): PhotoSources | null {
  // Seed keys are database placeholders, not real R2 objects. Sending them to
  // ImageKit produces a 404 and hides the usable original/fallback URL.
  const storageKey = photo.storageKey?.trim();
  const hasRealStorageKey = storageKey && !storageKey.startsWith('seed/');
  if (hasRealStorageKey) {
    const transformed = (width: number) =>
      imageKitPhotoUrl(storageKey, width);
    return {
      src: transformed(1200),
      alt: photo.altText?.trim() || photo.title?.trim() || 'Photography by Doll Pictures',
      webpSrcSet: IMAGEKIT_WIDTHS.map(width => `${transformed(width)} ${width}w`).join(', '),
    };
  }
  const src = getPhotoUrl(photo);
  if (!src) return null;

  const webpArr = asWidthVariants(photo.variants?.webp);
  const avifArr = asWidthVariants(photo.variants?.avif);
  const webpSrcSet = webpArr.length > 1 ? buildSrcSet(webpArr) : undefined;
  const avifSrcSet = avifArr.length > 0 ? buildSrcSet(avifArr) : undefined;

  return {
    src,
    alt: photo.altText?.trim() || photo.title?.trim() || 'Photography by Doll Pictures',
    avifSrcSet,
    webpSrcSet,
  };
}

/** Prefer a high-quality, bounded lightbox asset over the original upload. */
export function getPhotoLightboxUrl(photo: PublicPhoto): string {
  const storageKey = photo.storageKey?.trim();
  if (storageKey && !storageKey.startsWith('seed/')) {
    return imageKitPhotoUrl(storageKey, 1600, 86);
  }
  if (photo.variants?.original?.url) {
    return resolveMediaUrl(photo.variants.original.url);
  }
  return getPhotoUrl(photo);
}

export type PhotosQuery = {
  featured?: boolean;
  /** Cap results (public gallery). Backend clamps to a safe max. */
  limit?: number;
  category?: string;
};

export const publicApi = {
  getSiteContent: (init?: RequestInit) => publicFetch<PublicSiteContent>('/site-content', init),
  getBookingBackgrounds: (init?: RequestInit) =>
    publicFetch<PublicBookingBackground[]>('/booking-backgrounds', init),
  getPhotos: (params?: PhotosQuery, init?: RequestInit) => {
    const qs = new URLSearchParams();
    if (params?.featured) qs.set('featured', 'true');
    if (params?.category) qs.set('category', params.category);
    if (params?.limit != null && params.limit > 0) {
      qs.set('limit', String(params.limit));
    }
    const query = qs.toString();
    return publicFetch<PublicPhoto[]>(
      `/photos${query ? `?${query}` : ''}`,
      init,
    );
  },
  getCategory: (slug: string, init?: RequestInit) =>
    publicFetch<import('../shared/types').PublicCategory>(
      `/categories/${encodeURIComponent(slug)}`,
      init,
    ),
  getPackages: (init?: RequestInit) => publicFetch<PublicPackage[]>('/packages', init),
  getPackageCategories: (init?: RequestInit) =>
    publicFetch<PublicPackageCategory[]>('/package-categories', init),
  getHeroSlides: (init?: RequestInit) => publicFetch<PublicHeroSlide[]>('/hero-slides', init),
  getStoryScenes: (init?: RequestInit) => publicFetch<PublicStoryScene[]>('/story-scenes', init),
  getStats: (init?: RequestInit) => publicFetch<PublicStat[]>('/stats', init),
  getTestimonials: (init?: RequestInit) => publicFetch<PublicTestimonial[]>('/testimonials', init),
  getBehindScenes: (init?: RequestInit) => publicFetch<PublicBehindScene[]>('/behind-scenes', init),
  getStaffProfiles: (init?: RequestInit) => publicFetch<PublicStaffProfile[]>('/staff-profiles', init),
  createEnquiry: (data: CreateEnquiryPayload) =>
    publicFetch('/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, attribution: captureAttribution() }),
    }),
};
