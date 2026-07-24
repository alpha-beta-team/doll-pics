import type {
  CreateEnquiryPayload,
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

export type {
  CreateEnquiryPayload,
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
  ServiceNavLinkInput as PublicServiceNavLink,
} from '../shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/dollpictures';
const IMAGEKIT_WIDTHS = [400, 800, 1200, 1600] as const;

export class ApiError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(', ') || `API error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }
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

export async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string | string[] } | null;
    const raw = body?.message;
    const messages = Array.isArray(raw)
      ? raw.map(String)
      : raw
        ? [String(raw)]
        : [`API error ${res.status}`];
    throw new ApiError(res.status, messages);
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
  if (photo.storageKey) {
    const path = photo.storageKey.split('/').map(encodeURIComponent).join('/');
    const transformed = (width: number) =>
      `${IMAGEKIT_ENDPOINT}/tr:w-${width},q-78,f-auto/${path}`;
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

export type PhotosQuery = {
  featured?: boolean;
  /** Cap results (public gallery). Backend clamps to a safe max. */
  limit?: number;
  category?: string;
};

export const publicApi = {
  getSiteContent: () => publicFetch<PublicSiteContent>('/site-content'),
  getPhotos: (params?: PhotosQuery) => {
    const qs = new URLSearchParams();
    if (params?.featured) qs.set('featured', 'true');
    if (params?.category) qs.set('category', params.category);
    if (params?.limit != null && params.limit > 0) {
      qs.set('limit', String(params.limit));
    }
    const query = qs.toString();
    return publicFetch<PublicPhoto[]>(`/photos${query ? `?${query}` : ''}`);
  },
  getPackages: () => publicFetch<PublicPackage[]>('/packages'),
  getPackageCategories: () =>
    publicFetch<PublicPackageCategory[]>('/package-categories'),
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
