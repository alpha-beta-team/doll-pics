const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

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
  variants?: {
    webp?: PhotoVariantList;
    avif?: PhotoVariantList;
    original?: { url: string };
  };
}): PhotoSources | null {
  const src = getPhotoUrl(photo);
  if (!src) return null;

  const webpArr = asWidthVariants(photo.variants?.webp);
  const avifArr = asWidthVariants(photo.variants?.avif);
  const webpSrcSet = webpArr.length > 1 ? buildSrcSet(webpArr) : undefined;
  const avifSrcSet = avifArr.length > 0 ? buildSrcSet(avifArr) : undefined;

  return {
    src,
    alt: photo.altText?.trim() || photo.title?.trim() || 'Photography by DOLL PICTURES',
    avifSrcSet,
    webpSrcSet,
  };
}

export interface PublicServiceNavLink {
  _id?: string;
  id?: string;
  label: string;
  path: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  order?: number;
  isPublished?: boolean;
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
  serviceNavLinks?: PublicServiceNavLink[];
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
  preferredEvent?: string;
  shootDate?: string;
  location?: string;
  reminderDate?: string;
  notes?: string;
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
