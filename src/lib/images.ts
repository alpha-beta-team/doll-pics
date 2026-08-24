/** Build responsive CDN image URLs for lighter payloads. */

const PEXELS_HOST = 'images.pexels.com';
const IMAGEKIT_HOST = 'ik.imagekit.io';
const IMAGEKIT_ACCOUNT_PATH = '/dollpictures/';

export function isPexelsUrl(url: string): boolean {
  return url.includes(PEXELS_HOST);
}

export function isImageKitUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === IMAGEKIT_HOST &&
      parsed.pathname.startsWith(IMAGEKIT_ACCOUNT_PATH)
    );
  } catch {
    return false;
  }
}

export function isTransformableMediaUrl(url: string): boolean {
  return isPexelsUrl(url) || isImageKitUrl(url);
}

function imageKitUrl(
  url: string,
  width: number,
  format?: 'webp' | 'jpeg',
): string {
  const parsed = new URL(url);
  const path = parsed.pathname.slice(IMAGEKIT_ACCOUNT_PATH.length);
  const sourcePath = path.replace(/^tr:[^/]+\//, '');
  const imageKitFormat = format === 'jpeg' ? 'jpg' : format || 'auto';
  parsed.searchParams.delete('tr');
  parsed.pathname = `${IMAGEKIT_ACCOUNT_PATH}tr:w-${width},q-78,f-${imageKitFormat}/${sourcePath}`;
  return parsed.toString();
}

/** Rewrite width/format on a supported CDN URL; passthrough otherwise. */
export function mediaUrl(
  url: string,
  width: number,
  format?: 'webp' | 'jpeg',
): string {
  if (!url || !isTransformableMediaUrl(url)) return url;
  try {
    if (isImageKitUrl(url)) return imageKitUrl(url, width, format);
    const u = new URL(url);
    u.searchParams.set('auto', 'compress');
    u.searchParams.set('cs', 'tinysrgb');
    u.searchParams.set('w', String(width));
    if (format === 'webp') u.searchParams.set('fm', 'webp');
    else u.searchParams.delete('fm');
    return u.toString();
  } catch {
    return url;
  }
}

export function mediaSrcSet(
  url: string,
  widths: number[],
  format?: 'webp' | 'jpeg',
): string | undefined {
  if (!url || !isTransformableMediaUrl(url)) return undefined;
  return widths.map((w) => `${mediaUrl(url, w, format)} ${w}w`).join(', ');
}

/** Hero / full-bleed: mobile-first widths (PSI mobile ≈ 2×375 → ~750). */
export const HERO_WIDTHS = [480, 750, 1100, 1600] as const;
export const HERO_DEFAULT_WIDTH = 750;
export const HERO_SIZES = '100vw';

/** Below-fold full-bleed sections. */
export const SECTION_WIDTHS = [480, 800] as const;
export const SECTION_DEFAULT_WIDTH = 800;

/** Cards / gallery tiles. */
export const CARD_WIDTHS = [320, 480, 640] as const;
export const CARD_DEFAULT_WIDTH = 480;
