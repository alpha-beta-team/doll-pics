import type { PublicPhoto } from '../shared/types';

export const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/dollpictures';

/** Known demo assets and private destinations must not become portfolio links. */
export function isExcludedPhotoUrl(value: string): boolean {
  try {
    const url = new URL(value, 'https://portfolio.invalid');
    const path = decodeURIComponent(url.pathname).toLowerCase();
    return !['https:', 'http:'].includes(url.protocol) || Boolean(url.username || url.password)
      || /(^|\.)(picsum\.photos|pexels\.com|unsplash\.com)$/.test(url.hostname)
      || /(^|\/)(seed|admin|employee|kiosk|quotation|private)(\/|$)/.test(path);
  } catch { return true; }
}

export function isPublishedPortfolioPhoto(photo: PublicPhoto): boolean {
  if (photo.isPublished === false || (photo.storageKey && isExcludedPhotoUrl('/' + photo.storageKey))) return false;
  const urls = [photo.variants?.original?.url, ...[photo.variants?.webp, photo.variants?.avif]
    .flatMap(variants => typeof variants === 'string' ? [variants] : (variants ?? []).map(variant => variant.url))];
  return !urls.some(url => url !== undefined && isExcludedPhotoUrl(url));
}

/** ImageKit widths/quality are renditions of one photo, not separate inventory items. */
export function publicImageIdentity(value: string, origin: string): string | undefined {
  if (!value.trim() || isExcludedPhotoUrl(value)) return;
  try {
    const url = new URL(value, origin);
    url.hash = '';
    if (url.origin === 'https://ik.imagekit.io' && url.pathname.startsWith('/dollpictures/')) {
      url.pathname = url.pathname.replace(/^\/dollpictures\/tr:[^/]+\//, '/dollpictures/');
      url.searchParams.delete('tr');
    }
    return url.href;
  } catch { return; }
}

export function publicPhotoReferences(photo: PublicPhoto, origin: string): string[] {
  if (!isPublishedPortfolioPhoto(photo)) return [];
  const key = photo.storageKey?.trim();
  const urls = [
    ...(key ? [`${IMAGEKIT_ENDPOINT}/${key.split('/').map(encodeURIComponent).join('/')}`] : []),
    photo.variants?.original?.url,
    ...[photo.variants?.webp, photo.variants?.avif].flatMap(variants =>
      typeof variants === 'string' ? [variants] : (variants ?? []).map(variant => variant.url)),
  ];
  return [...new Set(urls.flatMap(url => {
    const identity = url && publicImageIdentity(url, origin);
    return identity ? [identity] : [];
  }))];
}
