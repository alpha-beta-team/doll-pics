/** Build responsive Pexels (or passthrough) image URLs for lighter payloads. */

const PEXELS_HOST = 'images.pexels.com';

export function isPexelsUrl(url: string): boolean {
  return url.includes(PEXELS_HOST);
}

/** Rewrite width (and optional format) on a Pexels CDN URL; passthrough otherwise. */
export function mediaUrl(
  url: string,
  width: number,
  format?: 'webp' | 'jpeg',
): string {
  if (!url || !isPexelsUrl(url)) return url;
  try {
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
  if (!url || !isPexelsUrl(url)) return undefined;
  return widths.map((w) => `${mediaUrl(url, w, format)} ${w}w`).join(', ');
}

/** Hero / full-bleed: mobile-first widths (PSI mobile ≈ 2×375 → ~750). */
export const HERO_WIDTHS = [480, 750, 1100] as const;
export const HERO_DEFAULT_WIDTH = 750;
export const HERO_SIZES = '100vw';

/** Below-fold full-bleed sections. */
export const SECTION_WIDTHS = [480, 800] as const;
export const SECTION_DEFAULT_WIDTH = 800;

/** Cards / gallery tiles. */
export const CARD_WIDTHS = [320, 480, 640] as const;
export const CARD_DEFAULT_WIDTH = 480;
