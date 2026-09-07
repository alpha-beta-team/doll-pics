import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { PUBLIC_HTML_ROUTES, type PublicHtmlPath } from '../src/lib/publicHtmlRoutes';
import { parsePublicSnapshot } from '../src/lib/publicSnapshot';
import { resolveServicePage, type ServiceNavLinkLike } from '../src/lib/seo-core';

const servicePages = JSON.parse(readFileSync(new URL('../src/data/service-pages.json', import.meta.url), 'utf8')) as
  Record<PublicHtmlPath, NonNullable<Parameters<typeof resolveServicePage>[1]>>;

const defaultOrigin = 'https://dollpictures.in';
const text = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function schemaNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!record(value)) return [];
  return [value, ...schemaNodes(value['@graph'])];
}

/** Inspect the HTTP response, never a JavaScript-rendered DOM or noscript fallback. */
export function validatePublicHtml(html: string, path: PublicHtmlPath, publicOrigin = defaultOrigin): string[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const failures: string[] = [];
  const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
  const canonical = new URL(path, publicOrigin).href;
  try {
    const root = document.querySelector('#root');
    expect(document.querySelectorAll('#root').length === 1, 'expected exactly one #root');
    expect(root?.getAttribute('data-public-html') === path, 'missing or wrong rendered route marker');
    // JSDOM parses noscript when scripting is disabled; explicitly exclude fallback content.
    root?.querySelectorAll('noscript, script, template').forEach(node => node.remove());
    const heading = text(root?.querySelector('h1')?.textContent);
    expect(heading, 'missing service heading inside #root');
    expect(text(root?.querySelector('#overview p')?.textContent), 'missing service content inside #root');
    expect(root?.querySelector('a[href^="tel:"]'), 'missing telephone link inside #root');
    expect(root?.querySelector('a[href*="wa.me/"]'), 'missing WhatsApp link inside #root');
    expect(root?.querySelectorAll('a[href^="/"]').length, 'missing internal navigation inside #root');

    const snapshots = document.querySelectorAll('script#public-page-snapshot[type="application/json"]');
    expect(snapshots.length === 1, 'expected exactly one public snapshot');
    const snapshot = parsePublicSnapshot(snapshots[0]?.textContent ?? '', path);
    expect(snapshot, 'invalid or cross-route public snapshot');

    const title = text(document.title);
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    expect(title, 'missing title');
    expect(text(description), 'missing description');
    expect(document.querySelectorAll('link[rel="canonical"]').length === 1
      && document.querySelector('link[rel="canonical"]')?.getAttribute('href') === canonical, 'canonical does not match the public site URL');
    const robots = [...document.querySelectorAll('meta[name="robots"]')].map(node => node.getAttribute('content') ?? '').join(',').toLowerCase();
    expect(robots && !/\b(noindex|none)\b/.test(robots), 'missing or non-indexable robots metadata');

    const nodes: Record<string, unknown>[] = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { nodes.push(...schemaNodes(JSON.parse(script.textContent ?? ''))); }
      catch { failures.push('invalid structured-data JSON'); }
    }
    const schema = (type: string) => nodes.find(node => node['@type'] === type);
    const webpage = schema('WebPage');
    const service = schema('Service');
    const business = schema('LocalBusiness');
    const breadcrumbs = schema('BreadcrumbList');
    expect(webpage?.url === canonical && webpage?.['@id'] === `${canonical}#webpage`
      && webpage?.name === title && webpage?.description === description, 'WebPage schema differs from page metadata');
    expect(service?.url === canonical && service?.['@id'] === `${canonical}#service`
      && service?.description === description, 'Service schema differs from page metadata');
    const studioId = `${new URL(publicOrigin).origin}/#studio`;
    expect(business?.['@id'] === studioId && record(service?.provider)
      && service.provider['@id'] === studioId, 'missing or inconsistent business/provider schema');
    const items = breadcrumbs?.itemListElement;
    const last = Array.isArray(items) ? items.at(-1) : undefined;
    expect(record(last) && last.item === canonical && text(String(last.name ?? '')) === heading,
      'breadcrumb does not match rendered service');

    if (snapshot) {
      const nav = snapshot.data.siteContent.serviceNavLinks?.find(link => link.path === path);
      expect(!nav || nav.isPublished, 'snapshot contains an unpublished target service');
      // The shared snapshot parser checked the normalized label/description/section fields.
      const page = resolveServicePage(path, servicePages[path], nav as ServiceNavLinkLike | undefined);
      expect(page && heading === text(page.heading), 'heading differs from snapshot service content');
      expect(page && title === page.title && description === page.description, 'metadata differs from snapshot service content');
      expect(service?.name === page?.serviceName, 'Service schema name differs from snapshot service content');
      const overview = text(root?.querySelector('#overview')?.textContent);
      expect(page && overview.includes(text(page.lead)), 'service lead missing from rendered content');
      const experience = text(root?.querySelector('#experience')?.textContent);
      for (const section of page?.sections ?? []) {
        expect(experience.includes(text(section.heading)) && section.paragraphs.every(paragraph => experience.includes(text(paragraph))),
          `service section missing from rendered content: ${section.heading}`);
      }
      const media = snapshot.data.serviceMedia;
      const available = [...(media?.cover ?? []), ...(media?.photos ?? [])].filter(image => image.src.trim());
      if (available.length) {
        const imagePaths = [...root?.querySelectorAll('#overview img[src], #service-gallery img[src]') ?? []]
          .map(image => image.getAttribute('src')?.split('?')[0]);
        expect(available.some(image => imagePaths.includes(image.src.split('?')[0])), 'snapshot imagery missing from rendered service');
      }
    }
    return failures;
  } finally { dom.window.close(); }
}

export function validateExcludedHtml(html: string, missing = false): string[] {
  const dom = new JSDOM(html);
  try {
    const document = dom.window.document;
    const failures: string[] = [];
    if (document.querySelector('#public-page-snapshot, [data-public-html]')) failures.push('service snapshot or rendered marker leaked onto an excluded route');
    if (missing && !/\bnoindex\b/i.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')) {
      failures.push('404 page lacks noindex metadata');
    }
    return failures;
  } finally { dom.window.close(); }
}

export async function checkPublicHtmlDeployment({
  baseUrl = defaultOrigin, publicOrigin = defaultOrigin, fetchImpl = fetch,
}: { baseUrl?: string; publicOrigin?: string; fetchImpl?: typeof fetch } = {}) {
  const excluded = ['/', '/family-photography-erode', '/admin', '/admin/bookings', '/employee', '/employee/dashboard',
    '/kiosk', '/kiosk/check-in', '/quotation/html-smoke'];
  const missing = '/__public-html-smoke-not-found';
  const paths = [...Object.keys(PUBLIC_HTML_ROUTES), ...excluded, missing];
  const results = await Promise.all(paths.map(async path => {
    try {
      const response = await fetchImpl(new URL(path, baseUrl), { signal: AbortSignal.timeout(20_000) });
      const failures: string[] = [];
      const expectedStatus = path === missing ? 404 : 200;
      if (response.status !== expectedStatus) failures.push(`HTTP ${response.status}, expected ${expectedStatus}`);
      if (!response.headers.get('content-type')?.includes('text/html')) failures.push('response is not HTML');
      const html = await response.text();
      if (Object.hasOwn(PUBLIC_HTML_ROUTES, path)) {
        if (/\b(noindex|none)\b/i.test(response.headers.get('x-robots-tag') ?? '')) failures.push('HTTP robots header blocks indexing');
        if (new URL(response.url || new URL(path, baseUrl)).pathname.replace(/\/$/, '') !== path) failures.push('redirected to a different route');
        failures.push(...validatePublicHtml(html, path as PublicHtmlPath, publicOrigin));
      } else failures.push(...validateExcludedHtml(html, path === missing));
      return { path, failures };
    } catch (error) {
      return { path, failures: [error instanceof Error ? error.message : String(error)] };
    }
  }));
  return results;
}

export function parseArguments(argv: string[]) {
  let baseUrl = process.env.SEO_CHECK_BASE_URL || defaultOrigin;
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] !== '--base-url' || !argv[index + 1]) throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
    baseUrl = argv[++index];
  }
  const publicOrigin = process.env.VITE_SITE_URL || defaultOrigin;
  for (const url of [baseUrl, publicOrigin]) {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password
      || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('Expected an HTTP(S) origin without credentials, path, query or fragment');
  }
  return { baseUrl: new URL(baseUrl).origin, publicOrigin: new URL(publicOrigin).origin };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void (async () => {
    const results = await checkPublicHtmlDeployment(parseArguments(process.argv.slice(2)));
    const failures = results.flatMap(result => result.failures.map(failure => `${result.path}: ${failure}`));
    if (failures.length) throw new Error(`Public HTML smoke failed:\n- ${failures.join('\n- ')}`);
    console.log(`Public HTML smoke passed: ${Object.keys(PUBLIC_HTML_ROUTES).length} rendered services, route snapshots, metadata, exclusions and true 404.`);
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
