import { packageMatchesCategory } from '../src/lib/packageCategory';
import { formatPackagePrice } from '../src/lib/pricing';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { CORE_PUBLIC_PATHS, normalizePublicLandingPath } from '../src/lib/publicRoutePath';
import { readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { PUBLIC_HTML_ROUTES, publicHtmlKind, type PublicHtmlPath } from '../src/lib/publicHtmlRoutes';
import { parsePublicSnapshot } from '../src/lib/publicSnapshot';
import { resolveServicePage, resolvePackagePage, type ServiceNavLinkLike } from '../src/lib/seo-core';

const servicePages = JSON.parse(readFileSync(new URL('../src/data/service-pages.json', import.meta.url), 'utf8')) as
  Record<PublicHtmlPath, NonNullable<Parameters<typeof resolveServicePage>[1]>>;

const packagePages = JSON.parse(readFileSync(new URL('../src/data/package-pages.json', import.meta.url), 'utf8'));

const defaultOrigin = 'https://dollpictures.in';
const canonicalUrl = (path: string, origin: string) => path === '/' ? origin : new URL(path, origin).href;
const text = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function schemaNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!record(value)) return [];
  return [value, ...schemaNodes(value['@graph'])];
}

/** Inspect the HTTP response, never a JavaScript-rendered DOM or noscript fallback. */
export function validatePublicHtml(html: string, path: PublicHtmlPath, publicOrigin = defaultOrigin, requireCms = false): string[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const failures: string[] = [];
  const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
  const canonical = canonicalUrl(path, publicOrigin);
  const snapshotElements = document.querySelectorAll('script#public-page-snapshot[type="application/json"]');
  const snapshot = parsePublicSnapshot(snapshotElements[0]?.textContent ?? '', path);
  const packagePage = snapshot && publicHtmlKind(path, snapshot.data.publicCatalog) === 'package';
  const home = path === '/';
  const gallery = path === '/gallery';
  const hub = path === '/services' || path === '/packages';
  try {
    const root = document.querySelector('#root');
    expect(document.querySelectorAll('#root').length === 1, 'expected exactly one #root');
    expect(root?.getAttribute('data-public-html') === path, 'missing or wrong rendered route marker');
    // JSDOM parses noscript when scripting is disabled; explicitly exclude fallback content.
    root?.querySelectorAll('noscript, script, template').forEach(node => node.remove());
    const heading = text(root?.querySelector('h1')?.textContent);
    expect(heading, 'missing service heading inside #root');
    expect(text(root?.querySelector(home || hub || gallery || packagePage ? 'main p' : '#overview p')?.textContent), 'missing service content inside #root');
    expect(root?.querySelector('a[href^="tel:"]'), 'missing telephone link inside #root');
    expect(root?.querySelector('a[href*="wa.me/"]'), 'missing WhatsApp link inside #root');
    expect(root?.querySelectorAll('a[href^="/"]').length, 'missing internal navigation inside #root');

    const snapshots = document.querySelectorAll('script#public-page-snapshot[type="application/json"]');
    expect(snapshots.length === 1, 'expected exactly one public snapshot');
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
    if (!home && !hub && !gallery && !packagePage) expect(service?.url === canonical && service?.['@id'] === `${canonical}#service`
      && service?.description === description, 'Service schema differs from page metadata');
    const studioId = `${new URL(publicOrigin).origin}/#studio`;
    expect(business?.['@id'] === studioId && (home || hub || gallery || packagePage || (record(service?.provider)
      && service.provider['@id'] === studioId)), 'missing or inconsistent business/provider schema');
    const items = breadcrumbs?.itemListElement;
    const last = Array.isArray(items) ? items.at(-1) : undefined;
    if (!home && !hub && !gallery && !packagePage) expect(record(last) && last.item === canonical && text(String(last.name ?? '')) === heading,
      'breadcrumb does not match rendered service');

    if (snapshot) {
      const nav = snapshot.data.siteContent.serviceNavLinks?.find(link => link.path === path);
      if (requireCms) {
        expect(snapshot.loaded.includes('siteContent') && snapshot.loaded.includes('categories') && (home || hub || gallery || (packagePage ? snapshot.data.publicCatalog.packageLinks.some(link => link.path === path) : nav?.isPublished)),
          'release requires both loaded CMS sources and a published target service');
        for (const source of Object.values(snapshot.data.publicCatalog.sources)) {
          expect(source.status === 'cms' && !source.reason && !source.rejectedRecords,
            'release snapshot contains fallback or rejected CMS records');
        }
      }
      if (gallery) {
        const portfolio = snapshot.data.galleryPortfolio;
        const images = [...document.querySelectorAll('#gallery figure img')];
        expect(portfolio && images.length === portfolio.photos.length, 'gallery image count differs from snapshot');
        for (const photo of portfolio?.photos ?? []) {
          expect(images.some(image => image.getAttribute('src') === photo.sources.src && image.getAttribute('alt') === photo.sources.alt), 'gallery image/source alt differs from snapshot');
          expect(text(root?.querySelector('#gallery')?.textContent).includes(text(photo.title)), 'gallery caption missing');
        }
        if (portfolio && !portfolio.photos.length) expect(text(root?.querySelector('#gallery')?.textContent).includes(portfolio.loaded ? 'There are no published photographs in the gallery yet.' : 'We could not load the gallery right now.'), 'missing gallery empty/unavailable state');
        if (requireCms) expect(portfolio?.loaded, 'release requires loaded gallery photos');
        expect(root?.querySelectorAll('h1').length === 1, 'gallery must contain one heading');
        return failures;
      }
      if (packagePage) {
        const link = snapshot.data.publicCatalog.packageLinks.find(link => link.path === path);
        const page = link && resolvePackagePage(path, packagePages[path], link);
        expect(page && heading === text(page.heading), 'package heading differs from catalog');
        expect(page && title === page.title && description === page.description, 'package metadata differs from catalog');
        if (requireCms) expect(snapshot.loaded.includes('packages'), 'release requires loaded public packages');
        const content = text(root?.querySelector('main')?.textContent);
        const offers = page ? snapshot.data.packages.filter(pkg => packageMatchesCategory(pkg, page.categorySlug, page.label)) : [];
        for (const offer of offers) {
          expect(content.includes(text(offer.name)) && content.includes(text(formatPackagePrice(offer.pricingMode, offer.price))), `package price/name missing: ${offer.name}`);
          for (const inclusion of offer.inclusions) expect(content.includes(text(inclusion)), `package inclusion missing: ${offer.name}`);
        }
        if (!offers.length) expect(content.includes('Packages will be available soon.'), 'missing empty package state');
        return failures;
      }
      if (hub) {
        const catalogLinks = path === '/services' ? snapshot.data.publicCatalog.serviceLinks : snapshot.data.publicCatalog.packageLinks;
        const cards = [...root?.querySelectorAll('main a[href]') ?? []].filter(link => link.querySelector('h2,h3'));
        const cardPaths = cards.map(link => link.getAttribute('href'));
        expect(cards.length === catalogLinks.length, 'hub card count differs from published catalog');
        for (const link of catalogLinks) {
          const card = cards.find(card => card.getAttribute('href') === link.path);
          expect(cardPaths.includes(link.path), `missing published hub card: ${link.path}`);
          expect(text(card?.textContent).includes(text(link.label)) && text(card?.textContent).includes(text(link.description)), `hub copy differs from catalog: ${link.path}`);
        }
        expect(root?.querySelectorAll('main h1').length === 1, 'hub must contain one main heading');
        return failures;
      }
      if (home) {
        expect(heading === text(snapshot.data.siteContent.heroHeading || 'Cinematic photographs for the stories you never want to forget.'), 'home heading differs from snapshot');
        expect(text(root?.textContent).includes(text(snapshot.data.siteContent.heroSubtext || 'Honest emotion, beautiful light, and a calm experience from first hello to final frame.')), 'home introduction differs from snapshot');
        const links = [...root?.querySelectorAll('a[href]') ?? []].map(link => link.getAttribute('href'));
        for (const link of snapshot.data.publicCatalog.serviceLinks) expect(links.includes(link.path), `missing home service discovery link: ${link.path}`);
        return failures;
      }
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
    if (missing && document.querySelector('link[rel="canonical"], script[type="application/ld+json"], meta[property^="og:"], meta[name^="twitter:"]')) {
      failures.push('404 retains public canonical, structured data or social metadata');
    }
    if (missing && !/\bnoindex\b/i.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')) {
      failures.push('404 page lacks noindex metadata');
    }
    return failures;
  } finally { dom.window.close(); }
}

type ReleaseCatalog = {
  version: 1;
  paths: string[];
  sources: Record<string, { status: string; reason?: string; rejectedRecords?: number; excludedConflicts?: number }>;
  build?: { commit: string | null; createdAt: string; publicOrigin: string };
  htmlSha256?: Record<string, string>;
};

export function validateReleaseCatalog(value: unknown, requireCms = false): asserts value is ReleaseCatalog {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.paths)
    || !value.paths.every(path => typeof path === 'string' && (CORE_PUBLIC_PATHS.includes(path) || normalizePublicLandingPath(path) === path))
    || new Set(value.paths).size !== value.paths.length || CORE_PUBLIC_PATHS.some(path => !(value.paths as unknown[]).includes(path))
    || !record(value.sources)) throw new Error('missing or malformed public catalog');
  for (const name of ['services', 'packages']) {
    const source = value.sources[name];
    if (!record(source) || !['cms', 'fallback'].includes(String(source.status))) throw new Error(`invalid ${name} provenance`);
    if (requireCms && (source.status !== 'cms' || source.reason || source.rejectedRecords !== 0 || source.excludedConflicts !== 0)) {
      throw new Error(`release requires successful ${name} CMS provenance without rejected or conflicting records`);
    }
  }
  if (requireCms && (!record(value.build) || typeof value.build.createdAt !== 'string'
    || !Number.isFinite(Date.parse(value.build.createdAt)) || typeof value.build.publicOrigin !== 'string'
    || !record(value.htmlSha256) || Object.keys(value.htmlSha256).length !== value.paths.length
    || value.paths.some(path => !/^[a-f0-9]{64}$/.test(String((value.htmlSha256 as Record<string, unknown>)[path]))))) {
    throw new Error('release requires build provenance and an HTML fingerprint for every published route');
  }
}

function validateCatalogHtml(html: string, path: string, origin: string): string[] {
  const dom = new JSDOM(html);
  try {
    const document = dom.window.document;
    const failures: string[] = [];
    if (!text(document.title) || !text(document.querySelector('meta[name="description"]')?.getAttribute('content'))) failures.push('missing title or description');
    if (document.querySelectorAll('link[rel="canonical"]').length !== 1
      || document.querySelector('link[rel="canonical"]')?.getAttribute('href') !== canonicalUrl(path, origin)) failures.push('canonical does not match the public site URL');
    const robots = [...document.querySelectorAll('meta[name="robots"]')].map(node => node.getAttribute('content') ?? '').join(',');
    if (!robots || /\b(noindex|none)\b/i.test(robots)) failures.push('missing or non-indexable robots metadata');
    if (!text(document.querySelector('#root h1, noscript h1')?.textContent)) failures.push('missing initial heading (rendered or noscript)');
    return failures;
  } finally { dom.window.close(); }
}

export async function checkPublicHtmlDeployment({
  baseUrl = defaultOrigin, publicOrigin = defaultOrigin, fetchImpl = fetch, requireCms = false,
  expectedCatalog, expectedCommit, deploymentId, report,
}: { baseUrl?: string; publicOrigin?: string; fetchImpl?: typeof fetch; requireCms?: boolean;
  expectedCatalog?: unknown; expectedCommit?: string; deploymentId?: string; report?: string } = {}) {
  let published: Set<string>;
  let catalog: ReleaseCatalog | undefined;
  const finish = (results: Array<{ path: string; failures: string[] }>) => {
    if (report) writeFileSync(report, JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, publicOrigin,
      deploymentId: deploymentId ?? null, deploymentIdSource: 'operator-supplied; verify in hosting dashboard',
      expectedCommit: expectedCommit ?? null, build: catalog?.build, requireCms,
      comparedExpectedArtifact: expectedCatalog !== undefined, results,
      passed: results.every(result => !result.failures.length) }, null, 2));
    return results;
  };
  try {
    const response = await fetchImpl(new URL('/public-catalog.json', baseUrl), { signal: AbortSignal.timeout(20_000) });
    const value: unknown = await response.json();
    if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
    validateReleaseCatalog(value, requireCms);
    catalog = value;
    if (requireCms && catalog.build?.publicOrigin !== publicOrigin) throw new Error('catalog public origin differs from expected origin');
    if (expectedCommit && catalog.build?.commit !== expectedCommit) throw new Error('candidate commit differs from expected commit');
    if (expectedCatalog !== undefined) {
      validateReleaseCatalog(expectedCatalog, true);
      if (expectedCommit && expectedCatalog.build?.commit !== expectedCommit) throw new Error('expected artifact commit differs from expected commit');
      if (!isDeepStrictEqual(catalog.paths, expectedCatalog.paths) || !isDeepStrictEqual(catalog.sources, expectedCatalog.sources)
        || !isDeepStrictEqual(catalog.htmlSha256, expectedCatalog.htmlSha256)
        || !isDeepStrictEqual(catalog.build, expectedCatalog.build)) throw new Error('candidate differs from the saved expected build artifact (routes, provenance or content)');
    }
    published = new Set(catalog.paths);
  } catch (error) {
    return finish([{ path: '/public-catalog.json', failures: [error instanceof Error ? error.message : String(error)] }]);
  }
  const excluded = ['/', '/services', '/admin', '/admin/bookings', '/employee', '/employee/dashboard',
    '/kiosk', '/kiosk/check-in', '/quotation', '/quotation/html-smoke'];
  const missing = '/__public-html-smoke-not-found';
  const paths = [...new Set([...published, ...Object.keys(PUBLIC_HTML_ROUTES), ...excluded, missing])];
  const results = await Promise.all(paths.map(async path => {
    try {
      const response = await fetchImpl(new URL(path, baseUrl), { signal: AbortSignal.timeout(20_000) });
      const failures: string[] = [];
      const retired = Object.hasOwn(PUBLIC_HTML_ROUTES, path) && !published.has(path);
      const expectedStatus = path === missing || retired ? 404 : 200;
      if (response.status !== expectedStatus) failures.push(`HTTP ${response.status}, expected ${expectedStatus}`);
      if (!response.headers.get('content-type')?.includes('text/html')) failures.push('response is not HTML');
      const html = await response.text();
      if (/^\/(admin|employee|kiosk|quotation)(\/|$)/.test(path)
        && !/\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? '')) failures.push('private response lacks HTTP noindex before JavaScript');
      if (published.has(path)) {
        failures.push(...validateCatalogHtml(html, path, publicOrigin));
        if (requireCms && createHash('sha256').update(html).digest('hex') !== catalog?.htmlSha256?.[path]) failures.push('initial HTML differs from build content fingerprint');
        if (new URL(baseUrl).origin === new URL(publicOrigin).origin
          && /\b(noindex|none)\b/i.test(response.headers.get('x-robots-tag') ?? '')) failures.push('HTTP robots header blocks indexing');
        const returnedPath = new URL(response.url || new URL(path, baseUrl)).pathname.replace(/\/$/, '') || '/';
        if (returnedPath !== path) failures.push('redirected to a different route');
      }
      if (published.has(path) && (['/', '/gallery', '/services', '/packages'].includes(path) || !CORE_PUBLIC_PATHS.includes(path))) {
        failures.push(...validatePublicHtml(html, path as PublicHtmlPath, publicOrigin, requireCms));
      } else failures.push(...validateExcludedHtml(html, path === missing || retired));
      return { path, failures };
    } catch (error) {
      return { path, failures: [error instanceof Error ? error.message : String(error)] };
    }
  }));
  try {
    const response = await fetchImpl(new URL('/sitemap.xml', baseUrl), { signal: AbortSignal.timeout(20_000) });
    const dom = new JSDOM(await response.text(), { contentType: 'application/xml' });
    try {
      const locations = [...dom.window.document.querySelectorAll('url > loc')].map(node => node.textContent);
      const expected = [...published].map(path => canonicalUrl(path, publicOrigin));
      results.push({ path: '/sitemap.xml', failures: response.ok && locations.length === expected.length
        && new Set(locations).size === locations.length && expected.every(url => locations.includes(url)) ? [] : ['sitemap differs from public catalog or canonical origin'] });
    } finally { dom.window.close(); }
  } catch { results.push({ path: '/sitemap.xml', failures: ['sitemap unavailable or malformed'] }); }
  return finish(results);
}

export function parseArguments(argv: string[]) {
  let baseUrl = process.env.SEO_CHECK_BASE_URL || defaultOrigin;
  let requireCms = false;
  let release = false;
  let expectedCatalog: unknown;
  let expectedCommit: string | undefined;
  let deploymentId: string | undefined;
  let report: string | undefined;
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--require-cms') { requireCms = true; continue; }
    if (argv[index] === '--release') { release = true; requireCms = true; continue; }
    const option = argv[index];
    if (!['--base-url', '--expected-catalog', '--expected-commit', '--deployment-id', '--report'].includes(option)
      || !argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`Unknown or incomplete argument: ${option}`);
    const value = argv[++index];
    if (option === '--base-url') baseUrl = value;
    if (option === '--expected-catalog') expectedCatalog = JSON.parse(readFileSync(value, 'utf8'));
    if (option === '--expected-commit') expectedCommit = value;
    if (option === '--deployment-id') deploymentId = value;
    if (option === '--report') report = value;
  }
  if (expectedCommit && !/^[a-f0-9]{40}$/i.test(expectedCommit)) throw new Error('Expected the full candidate Git commit SHA');
  if (release && (expectedCatalog === undefined || !expectedCommit || !deploymentId || !report)) {
    throw new Error('CMS release acceptance requires --expected-catalog from the build being deployed, --expected-commit, --deployment-id and --report');
  }
  const publicOrigin = process.env.VITE_SITE_URL || defaultOrigin;
  for (const url of [baseUrl, publicOrigin]) {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password
      || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('Expected an HTTP(S) origin without credentials, path, query or fragment');
  }
  return { baseUrl: new URL(baseUrl).origin, publicOrigin: new URL(publicOrigin).origin, requireCms, expectedCatalog, expectedCommit, deploymentId, report };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void (async () => {
    const options = parseArguments(process.argv.slice(2));
    const results = await checkPublicHtmlDeployment(options);
    const failures = results.flatMap(result => result.failures.map(failure => `${result.path}: ${failure}`));
    if (failures.length) throw new Error(`Public HTML smoke failed:\n- ${failures.join('\n- ')}`);
    console.log(`${options.expectedCatalog !== undefined && options.requireCms ? 'CMS artifact comparison' : 'Public HTML smoke'} passed: published HTML, active service snapshots, metadata, sitemap, exclusions and true 404.`);
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
