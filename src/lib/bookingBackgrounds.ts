import type {
  PublicBookingBackground,
  PublicPhoto,
} from '../shared/types';
import { isPublishedPortfolioPhoto } from './publicPhoto';
import type { PhotoSources } from './api';

export type BookingBackgroundImage = PhotoSources & { categoryName: string };

export function isBookingBackgroundResponse(value: unknown): value is PublicBookingBackground[] {
  return Array.isArray(value) && value.every(item => item && typeof item === 'object' && !Array.isArray(item)
    && typeof item.categoryName === 'string' && typeof item.categorySlug === 'string'
    && item.coverPhoto && typeof item.coverPhoto === 'object' && !Array.isArray(item.coverPhoto)
    && typeof item.coverPhoto.title === 'string' && item.coverPhoto.variants
    && typeof item.coverPhoto.variants === 'object' && !Array.isArray(item.coverPhoto.variants)
    && ['id', '_id', 'storageKey'].every(key => item.coverPhoto[key] === undefined || typeof item.coverPhoto[key] === 'string')
    && (item.coverPhoto.isPublished === undefined || typeof item.coverPhoto.isPublished === 'boolean')
    && (item.coverPhoto.variants.original === undefined || typeof item.coverPhoto.variants.original?.url === 'string')
    && ['webp', 'avif'].every(key => {
      const variants = item.coverPhoto.variants[key];
      return variants === undefined || typeof variants === 'string' || (Array.isArray(variants)
        && variants.every(variant => variant && typeof variant.url === 'string' && typeof variant.width === 'number' && variant.width > 0));
    }));
}

/** Same public image mapping for the build snapshot and browser-only CTA placements. */
export function bookingBackgroundImages(items: PublicBookingBackground[], resolveSources: (photo: PublicPhoto) => PhotoSources | null): BookingBackgroundImage[] {
  return usableBookingBackgrounds(items).flatMap(item => {
    const sources = resolveSources(item.coverPhoto);
    return sources ? [{ ...sources, categoryName: item.categoryName }] : [];
  });
}

export type UsableBookingBackground = {
  categoryName: string;
  categorySlug: string;
  coverPhoto: PublicPhoto;
};

function photoKey(photo: PublicPhoto): string {
  return (
    photo.storageKey?.trim() ||
    photo._id ||
    photo.id ||
    photo.variants?.original?.url ||
    ''
  );
}

/** Defensive client filter; the API already excludes seed and missing covers. */
export function usableBookingBackgrounds(
  backgrounds: PublicBookingBackground[],
): UsableBookingBackground[] {
  const seen = new Set<string>();
  return backgrounds.filter((background) => {
    const photo = background.coverPhoto;
    if (!isPublishedPortfolioPhoto(photo)) return false;

    const key = photoKey(photo);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
