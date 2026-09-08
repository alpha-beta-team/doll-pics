import { parseBuildPublicCatalog } from './publicCatalog';
import type { SiteData, CmsResource } from '../contexts/SiteDataContext';
import { publicHtmlKind, type PublicHtmlPath } from './publicHtmlRoutes';

export interface PublicSnapshot {
  version: 1;
  path: PublicHtmlPath;
  data: SiteData;
  loaded: CmsResource[];
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const strings = (value: Record<string, unknown>, keys: string[]) =>
  keys.every(key => typeof value[key] === 'string');
const arrayOf = (value: unknown, check: (item: unknown) => boolean) =>
  Array.isArray(value) && value.every(check);
const image = (value: unknown) => record(value) && strings(value, ['src', 'alt']);

/** Reject malformed or cross-route HTML before it can seed a public provider. */
export function parsePublicSnapshot(text: string, pathname: string): PublicSnapshot | undefined {
  const path = pathname.replace(/\/$/, '') || '/';
  try {
    const value: unknown = JSON.parse(text);
    if (!record(value) || value.version !== 1 || value.path !== path || !record(value.data)) return;
    const data = value.data;
    const catalog = data.publicCatalog;
    if (!record(catalog) || !record(catalog.sources)
      || !['services', 'packages'].every(key => {
        const source = (catalog.sources as Record<string, unknown>)[key];
        return record(source) && ['cms', 'fallback'].includes(String(source.status)) && arrayOf(source.records, record)
          && (source.reason === undefined || ['unavailable', 'invalid-response'].includes(String(source.reason)))
          && (source.rejectedRecords === undefined || (Number.isInteger(source.rejectedRecords) && Number(source.rejectedRecords) >= 0));
      })
      || !arrayOf(catalog.serviceLinks, link => record(link) && strings(link, ['label', 'path']))
      || !arrayOf(catalog.packageLinks, link => record(link) && strings(link, ['label', 'path', 'categorySlug']))
      || !arrayOf(catalog.paths, path => typeof path === 'string')) return;
    const verifiedCatalog = parseBuildPublicCatalog(JSON.stringify(catalog));
    if (!verifiedCatalog || JSON.stringify(verifiedCatalog.paths) !== JSON.stringify(catalog.paths)
      || JSON.stringify(verifiedCatalog.serviceLinks) !== JSON.stringify(catalog.serviceLinks)
      || JSON.stringify(verifiedCatalog.packageLinks) !== JSON.stringify(catalog.packageLinks)) return;
    const kind = publicHtmlKind(path, verifiedCatalog);
    if (!kind) return;
    const packagePage = kind === 'package';
    const content = data.siteContent;
    if (!record(content) || !strings(content, ['brandName', 'phone', 'whatsapp', 'contactEmail'])
      || !record(content.socials)
      || !arrayOf(content.serviceNavLinks, link => record(link) && strings(link, ['label', 'path', 'description'])
        && typeof link.isPublished === 'boolean'
        && arrayOf(link.sections, section => record(section) && strings(section, ['heading', 'body'])))) return;
    const arrays = ['heroSlides', 'storyScenes', 'featuredWork', 'galleryImages', 'services', 'packages',
      'packageCategories', 'packageNavLinks', 'stats', 'testimonials', 'behindScenes', 'staffProfiles'];
    if (!arrays.every(key => arrayOf(data[key], record))
      || typeof data.loading !== 'boolean' || typeof data.fromApi !== 'boolean') return;
    // Build snapshots seed only these shared resources; others remain browser-loaded.
    if (!arrayOf(value.loaded, key => key === 'siteContent' || key === 'categories' || (packagePage && key === 'packages') || (path === '/' && ['hero', 'featuredPhotos', 'galleryPhotos'].includes(String(key))))) return;
    for (const [sourceName, resource] of [['services', 'siteContent'], ['packages', 'categories']]) {
      const source = (catalog.sources as Record<string, Record<string, unknown>>)[sourceName];
      if ((source.status === 'cms') !== (value.loaded as string[]).includes(resource)
        || (source.status === 'cms' && source.reason !== undefined)) return;
    }
    if (path === '/services' && !arrayOf(data.services, item => record(item)
      && strings(item, ['title', 'desc', 'icon', 'image', 'path']))) return;
    if (path === '/packages' && !arrayOf(data.packageNavLinks, item => record(item)
      && strings(item, ['label', 'path', 'categorySlug', 'description']) && item.isPublished === true)) return;
    if (packagePage && !(catalog.packageLinks as Record<string, unknown>[]).some(link => link.path === path)) return;
    if (packagePage && !arrayOf(data.packages, item => record(item) && strings(item, ['name', 'description', 'pricingMode'])
      && arrayOf(item.inclusions, entry => typeof entry === 'string')
      && ['notes', 'slotTimings'].every(key => item[key] === undefined || arrayOf(item[key], entry => typeof entry === 'string'))
      && ['price', 'advanceAmount'].every(key => item[key] === undefined || item[key] === null || (typeof item[key] === 'number' && Number.isFinite(item[key])))
      && ['categorySlug', 'categoryName', 'shootType', 'durationLabel', 'themeGuideUrl', 'locationType'].every(key => item[key] === undefined || typeof item[key] === 'string'))) return;
    const portfolio = data.galleryPortfolio;
    if (path === '/gallery') {
      if (!record(portfolio) || typeof portfolio.loaded !== 'boolean'
        || !arrayOf(portfolio.photos, photo => record(photo) && strings(photo, ['id', 'title', 'location', 'year', 'lightboxSrc'])
          && ['width', 'height'].every(key => typeof photo[key] === 'number' && Number.isFinite(photo[key]) && Number(photo[key]) > 0)
          && record(photo.sources) && strings(photo.sources, ['src', 'alt'])
          && ['avifSrcSet', 'webpSrcSet'].every(key => photo.sources && record(photo.sources) && (photo.sources[key] === undefined || typeof photo.sources[key] === 'string'))
          && (photo.blurPlaceholder === undefined || typeof photo.blurPlaceholder === 'string'))
        || (!portfolio.loaded && (portfolio.photos as unknown[]).length > 0)) return;
    } else if (portfolio !== undefined) return;
    const media = data.serviceMedia;
    if (['/', '/gallery', '/services', '/packages'].includes(path)) {
      if (media !== undefined || !arrayOf(data.heroSlides, item => record(item) && strings(item, ['image', 'label']))
        || !arrayOf(data.featuredWork, item => record(item) && strings(item, ['image', 'alt', 'title', 'category', 'location', 'year']) && (item.categorySlugs === undefined || arrayOf(item.categorySlugs, slug => typeof slug === 'string')))
        || !arrayOf(data.galleryImages, item => image(item) && record(item) && (item.categorySlugs === undefined || arrayOf(item.categorySlugs, slug => typeof slug === 'string')))) return;
    } else if (!record(media) || media.path !== path || !arrayOf(media.cover, image) || !arrayOf(media.photos, image)
      || !arrayOf(media.loaded, key => key === 'cover' || key === 'photos')) return;
    return value as unknown as PublicSnapshot;
  } catch { /* Invalid or stale HTML uses the normal client entry. */ }
}

export function readPublicSnapshot(): PublicSnapshot | undefined {
  const element = document.getElementById('public-page-snapshot');
  if (element) return parsePublicSnapshot(element.textContent || '', window.location.pathname);
}
