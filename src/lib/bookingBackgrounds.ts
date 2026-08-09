import type {
  PublicBookingBackground,
  PublicPhoto,
} from '../shared/types';

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
    const originalUrl = photo.variants?.original?.url ?? '';
    if (
      photo.storageKey?.startsWith('seed/') ||
      originalUrl.includes('picsum.photos')
    ) {
      return false;
    }

    const key = photoKey(photo);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
