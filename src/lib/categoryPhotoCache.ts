import type { PublicPhoto } from '../shared/types';

const CACHE_PREFIX = 'doll-pictures:category-photos:v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CategoryPhotoCacheEntry = {
  expiresAt: number;
  photos: PublicPhoto[];
};

const inflight = new Map<string, Promise<PublicPhoto[]>>();

function cacheKey(category: string): string {
  return `${CACHE_PREFIX}${encodeURIComponent(category.trim().toLowerCase())}`;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(category: string): PublicPhoto[] | null {
  const target = storage();
  if (!target) return null;

  const key = cacheKey(category);
  try {
    const raw = target.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<CategoryPhotoCacheEntry>;
    if (
      typeof entry.expiresAt !== 'number' ||
      entry.expiresAt <= Date.now() ||
      !Array.isArray(entry.photos)
    ) {
      target.removeItem(key);
      return null;
    }
    return entry.photos;
  } catch {
    target.removeItem(key);
    return null;
  }
}

function write(category: string, photos: PublicPhoto[]): void {
  const target = storage();
  if (!target) return;

  try {
    const entry: CategoryPhotoCacheEntry = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      photos,
    };
    target.setItem(cacheKey(category), JSON.stringify(entry));
  } catch {
    // Storage can be disabled or full. The API result remains usable.
  }
}

export function getCategoryPhotosCached(
  category: string,
  load: () => Promise<PublicPhoto[]>,
): Promise<PublicPhoto[]> {
  const cached = read(category);
  if (cached) return Promise.resolve(cached);

  const key = cacheKey(category);
  const existing = inflight.get(key);
  if (existing) return existing;

  const request = load()
    .then((photos) => {
      write(category, photos);
      return photos;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

export function clearCategoryPhotoCache(category?: string): void {
  const target = storage();
  if (!target) return;

  if (category) {
    target.removeItem(cacheKey(category));
    return;
  }

  for (let index = target.length - 1; index >= 0; index -= 1) {
    const key = target.key(index);
    if (key?.startsWith(CACHE_PREFIX)) target.removeItem(key);
  }
}
