import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { validateReleaseCatalog } from './check-public-html-deployment';
import { isExcludedPhotoUrl, isPublishedPortfolioPhoto, publicImageIdentity, publicPhotoReferences } from '../src/lib/publicPhoto';
import { PORTFOLIO_PHOTO_LIMIT } from '../src/lib/publicHtmlRoutes';
import type { PublicPhoto } from '../src/shared/types';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function photoList(value: unknown): PublicPhoto[] {
  if (!Array.isArray(value) || !value.every(photo => record(photo) && typeof photo.title === 'string'
    && ['id', '_id', 'storageKey'].every(key => photo[key] === undefined || typeof photo[key] === 'string')
    && (photo.isPublished === undefined || typeof photo.isPublished === 'boolean')
    && record(photo.variants)
    && (photo.variants.original === undefined || (record(photo.variants.original) && typeof photo.variants.original.url === 'string'))
    && ['webp', 'avif'].every(key => {
      const variant = (photo.variants as Record<string, unknown>)[key];
      return variant === undefined || typeof variant === 'string'
        || (Array.isArray(variant) && variant.every(item => record(item) && typeof item.url === 'string'));
    }))) throw new Error('Public photo inventory is unavailable or malformed');
  return value as PublicPhoto[];
}

/** Crawl real anchors and initial img src attributes; never execute page JavaScript. */
export async function checkImageDiscovery({ baseUrl, apiUrl, imageSample = 6, fetchImpl = fetch }: {
  baseUrl: string; apiUrl: string; imageSample?: number; fetchImpl?: typeof fetch;
}) {
  const get = async (url: string | URL, method = 'GET') => {
    try {
      return await fetchImpl(url, {
        method, signal: AbortSignal.timeout(20_000), headers: { Accept: method === 'HEAD' ? 'image/*' : '*/*' },
      });
    } catch (error) {
      throw new Error(`${url}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  };
  const json = async (url: URL) => {
    const response = await get(url);
    if (!response.ok) throw new Error(`${url.pathname}: HTTP ${response.status}`);
    return response.json() as Promise<unknown>;
  };
  const [catalog, allPhotos] = await Promise.all([
    json(new URL('/public-catalog.json', baseUrl)),
    json(new URL(apiUrl.replace(/\/$/, '') + '/photos')),
  ]);
  validateReleaseCatalog(catalog, true);
  const photos = photoList(allPhotos);
  const publicOrigin = catalog.build!.publicOrigin;
  const apiOrigin = new URL(apiUrl).origin;
  const baseOrigin = new URL(baseUrl).origin;
  const allowedImageOrigins = new Set([publicOrigin, baseOrigin, apiOrigin, 'https://ik.imagekit.io']);
  const intended = photos.filter(isPublishedPortfolioPhoto).map((photo, index) => ({
    id: photo.id || photo._id || photo.storageKey || `photo-${index}`,
    references: publicPhotoReferences(photo, apiOrigin),
  }));
  const failures: string[] = [];
  const knownImages = new Set(intended.flatMap(photo => photo.references));
  for (const photo of intended) if (!photo.references.length) failures.push(`${photo.id}: no usable public image URL`);
  if (intended.length > PORTFOLIO_PHOTO_LIMIT) failures.push(`Published collection exceeds ${PORTFOLIO_PHOTO_LIMIT}; implement stable pagination before claiming complete discovery`);
  const published = new Set(catalog.paths);
  const queue = ['/'];
  const visited = new Set<string>();
  const galleryImages = new Set<string>();
  const galleryLinks = new Set<string>();
  const observedImages = new Map<string, string>();
  const pages: Array<{ path: string; imageCount: number; internalLinks: number }> = [];

  while (queue.length) {
    const batch = queue.splice(0, 4).filter(path => !visited.has(path));
    batch.forEach(path => visited.add(path));
    await Promise.all(batch.map(async path => {
      const response = await get(new URL(path, baseUrl));
      const html = await response.text();
      if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) {
        failures.push(`${path}: expected HTTP 200 HTML`); return;
      }
      const dom = new JSDOM(html);
      try {
        const document = dom.window.document;
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
        const expectedCanonical = path === '/' ? publicOrigin : new URL(path, publicOrigin).href;
        if (canonical !== expectedCanonical) failures.push(`${path}: incorrect canonical destination`);
        const root = document.querySelector('#root');
        root?.querySelectorAll('noscript, script, template').forEach(node => node.remove());
        const images = [...root?.querySelectorAll('main img[src]') ?? []];
        for (const image of images) {
          const src = image.getAttribute('src')!;
          if (isExcludedPhotoUrl(src)) failures.push(`${path}: excluded image in initial HTML`);
          const identity = publicImageIdentity(src, baseUrl);
          if (identity && knownImages.has(identity)) observedImages.set(identity, new URL(src, baseUrl).href);
          if (image.closest('#service-gallery, [data-package-work]') && (!identity || !knownImages.has(identity))) failures.push(`${path}: category photograph is outside the published inventory`);
          if (image.closest('#gallery figure')) {
            if (!identity || !knownImages.has(identity)) failures.push(`${path}: gallery contains an image outside the published inventory`);
            else galleryImages.add(identity);
            const href = image.closest('a[href]')?.getAttribute('href');
            const linkedIdentity = href && publicImageIdentity(href, baseUrl);
            if (!linkedIdentity || !intended.some(photo => identity && photo.references.includes(identity) && photo.references.includes(linkedIdentity))) failures.push(`${path}: gallery photograph lacks a matching image anchor`);
            else galleryLinks.add(linkedIdentity);
          }
        }
        let internalLinks = 0;
        for (const link of root?.querySelectorAll('a[href]') ?? []) {
          if (link.getAttribute('rel')?.split(/\s+/).includes('nofollow')) continue;
          const url = new URL(link.getAttribute('href')!, baseUrl);
          if (![baseOrigin, publicOrigin].includes(url.origin) || !published.has(url.pathname)) continue;
          internalLinks++;
          if (!visited.has(url.pathname) && !queue.includes(url.pathname)) queue.push(url.pathname);
        }
        const snapshotNode = document.querySelector('#public-page-snapshot');
        const snapshot = snapshotNode && JSON.parse(snapshotNode.textContent || '{}');
        if (snapshot?.data?.serviceMedia?.photos?.length && !root?.querySelector('main a[href="/gallery"]')) {
          failures.push(`${path}: category photographs lack a broader gallery link`);
        }
        pages.push({ path, imageCount: images.length, internalLinks });
      } finally { dom.window.close(); }
    }));
  }

  if (!visited.has('/gallery')) failures.push('/gallery is not reachable through public HTML links');
  const missing = intended.filter(photo => !photo.references.some(reference => galleryImages.has(reference)));
  for (const photo of missing) failures.push(`${photo.id}: missing from Gallery initial HTML`);
  const samples = [...observedImages.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url).filter((_, index, values) =>
    index % Math.max(1, Math.floor(values.length / Math.max(1, imageSample))) === 0).slice(0, imageSample);
  const responses: Array<{ url: string; status: number; contentType: string }> = [];
  for (let index = 0; index < samples.length; index += 4) {
    await Promise.all(samples.slice(index, index + 4).map(async url => {
      if (!allowedImageOrigins.has(new URL(url).origin) || isExcludedPhotoUrl(url)) {
        failures.push('Image response probe refused an unrecognized/private origin'); return;
      }
      try {
        let response = await get(url, 'HEAD');
        if (response.status === 405) {
          await response.body?.cancel();
          response = await fetchImpl(url, { headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(20_000) });
        }
        const contentType = response.headers.get('content-type') ?? '';
        responses.push({ url, status: response.status, contentType });
        if (!response.ok || !contentType.startsWith('image/') || /\b(noindex|none)\b/i.test(response.headers.get('x-robots-tag') ?? '')) failures.push(`${url}: unavailable or non-indexable image response`);
        await response.body?.cancel();
      } catch { failures.push(`${url}: image response probe failed`); }
    }));
  }
  return {
    checkedAt: new Date().toISOString(), baseUrl, apiUrl, build: catalog.build,
    inventory: { publishedRecords: photos.length, excludedRecords: photos.length - intended.length,
      intendedPhotos: intended.length, galleryImages: galleryImages.size, galleryImageLinks: galleryLinks.size,
      cap: PORTFOLIO_PHOTO_LIMIT, missingIds: missing.map(photo => photo.id) },
    pages: pages.sort((a, b) => a.path.localeCompare(b.path)), imageResponses: responses,
    failures: [...new Set(failures)],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void (async () => {
    const options = { baseUrl: 'https://dollpictures.in', apiUrl: '', imageSample: 6, report: '' };
    const args = process.argv.slice(2);
    for (let index = 0; index < args.length; index += 2) {
      const flag = args[index], value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      if (flag === '--base-url') options.baseUrl = value;
      else if (flag === '--api-url') options.apiUrl = value;
      else if (flag === '--report') options.report = value;
      else if (flag === '--image-sample') options.imageSample = Number(value);
      else throw new Error(`Unknown argument: ${flag}`);
    }
    if (!options.apiUrl) throw new Error('--api-url must identify the deployed public CMS API');
    for (const value of [options.baseUrl, options.apiUrl]) {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Use plain public HTTP(S) URLs without credentials, query or fragment');
    }
    if (!Number.isInteger(options.imageSample) || options.imageSample < 1 || options.imageSample > 100) throw new Error('--image-sample must be an integer from 1 to 100');
    const report = await checkImageDiscovery(options);
    if (options.report) writeFileSync(options.report, JSON.stringify(report, null, 2) + '\n');
    if (report.failures.length) throw new Error(`Public image discovery failed:\n- ${report.failures.join('\n- ')}`);
    console.log(`Public image discovery passed: ${report.inventory.intendedPhotos} published photographs in initial HTML, ${report.imageResponses.length} image responses checked.`);
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
