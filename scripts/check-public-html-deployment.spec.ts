import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { checkPublicHtmlDeployment, parseArguments, validateExcludedHtml, validatePublicHtml } from './check-public-html-deployment';
import { PUBLIC_HTML_ROUTES, type PublicHtmlPath } from '../src/lib/publicHtmlRoutes';
import servicePages from '../src/data/service-pages.json';
import { serializeInlineJson } from './lib/public-html';

const origin = 'https://dollpictures.in';
const path: PublicHtmlPath = '/newborn-baby-photography-erode';

function fixture(route: PublicHtmlPath = path, image = true) {
  const page = servicePages[route];
  const canonical = origin + route;
  const snapshot = {
    version: 1, path: route, loaded: ['siteContent', 'categories'],
    data: {
      siteContent: { brandName: 'Doll Pictures', phone: '+919999999999', whatsapp: '+919999999999',
        contactEmail: 'fixture@example.test', socials: {}, serviceNavLinks: [] },
      ...Object.fromEntries(['heroSlides', 'storyScenes', 'featuredWork', 'galleryImages', 'services', 'packages',
        'packageCategories', 'packageNavLinks', 'stats', 'testimonials', 'behindScenes', 'staffProfiles'].map(key => [key, []])),
      loading: false, fromApi: true,
      serviceMedia: { path: route, cover: [], photos: image ? [{ src: '/fixture.jpg', alt: 'Actual service photograph' }] : [], loaded: ['cover', 'photos'] },
    },
  };
  const schemas = [
    { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: page.title, description: page.description },
    { '@type': 'LocalBusiness', '@id': `${origin}/#studio` },
    { '@type': 'Service', '@id': `${canonical}#service`, url: canonical, name: page.serviceName,
      description: page.description, provider: { '@id': `${origin}/#studio` } },
    { '@type': 'BreadcrumbList', itemListElement: [{ name: page.heading, item: canonical }] },
  ];
  return `<html><head><title>${page.title}</title><meta name="description" content="${page.description}">
    <meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">
    <script type="application/ld+json">${serializeInlineJson({ '@graph': schemas })}</script></head><body>
    <div id="root" data-public-html="${route}"><main><section id="overview"><h1>${page.heading}</h1><p>${page.lead}</p>
    ${image ? '<img src="/fixture.jpg?width=800" alt="Actual service photograph">' : ''}</section>
    <a href="tel:+919999999999">Call</a><a href="https://wa.me/919999999999">WhatsApp</a><a href="/contact">Contact</a></main></div>
    <script id="public-page-snapshot" type="application/json">${serializeInlineJson(snapshot)}</script></body></html>`;
}

function change(html: string, edit: (document: Document) => void) {
  const dom = new JSDOM(html);
  try { edit(dom.window.document); return dom.serialize(); }
  finally { dom.window.close(); }
}

test('all registered service responses validate, including legitimately empty media', () => {
  for (const route of Object.keys(PUBLIC_HTML_ROUTES) as PublicHtmlPath[]) {
    for (const image of [true, false]) assert.deepEqual(validatePublicHtml(fixture(route, image), route), []);
  }
});

test('old shell and noscript-only headings cannot masquerade as rendered HTML', () => {
  for (const inside of [true, false]) {
    const html = change(fixture(), document => {
      const root = document.querySelector('#root')!;
      const fallback = document.createElement('noscript');
      fallback.innerHTML = root.innerHTML;
      root.replaceChildren();
      (inside ? root : document.body).append(fallback);
    });
    assert.ok(validatePublicHtml(html, path).includes('missing service heading inside #root'));
  }
});

test('rejects absent, duplicate, malformed and cross-route snapshots', () => {
  const edits: Array<(document: Document) => void> = [
    document => document.querySelector('#public-page-snapshot')!.remove(),
    document => document.body.append(document.querySelector('#public-page-snapshot')!.cloneNode(true)),
    document => { document.querySelector('#public-page-snapshot')!.textContent = '{invalid'; },
    document => { const element = document.querySelector('#public-page-snapshot')!; const value = JSON.parse(element.textContent!);
      value.path = '/wedding-photography-erode'; element.textContent = JSON.stringify(value); },
  ];
  for (const edit of edits) assert.ok(validatePublicHtml(change(fixture(), edit), path).some(failure => /snapshot/.test(failure)));
});

test('rejects mismatched marker, heading, lead, canonical, metadata and schema', () => {
  const cases: Array<[string, (document: Document) => void]> = [
    ['route marker', document => document.querySelector('#root')!.setAttribute('data-public-html', '/wrong')],
    ['heading differs', document => { document.querySelector('h1')!.textContent = 'Wedding photography'; }],
    ['lead missing', document => { document.querySelector('#overview p')!.textContent = 'Unrelated content'; }],
    ['canonical', document => document.querySelector('link[rel=canonical]')!.setAttribute('href', 'https://preview.example.test' + path)],
    ['metadata differs', document => { document.title = 'Wrong service title'; }],
    ['structured-data', document => { document.querySelector('script[type="application/ld+json"]')!.textContent = '{invalid'; }],
    ['Service schema', document => { const element = document.querySelector('script[type="application/ld+json"]')!;
      const value = JSON.parse(element.textContent!); value['@graph'][2].url = origin + '/wedding-photography-erode'; element.textContent = JSON.stringify(value); }],
  ];
  for (const [message, edit] of cases) assert.ok(validatePublicHtml(change(fixture(), edit), path).some(failure => failure.includes(message)), message);
});

test('requires snapshot images in the service itself, not only unrelated cards', () => {
  const html = change(fixture(), document => {
    const image = document.querySelector('img')!;
    document.querySelector('main')!.append(image);
  });
  assert.ok(validatePublicHtml(html, path).some(failure => failure.includes('imagery missing')));
});

test('requires phone, WhatsApp, navigation and indexable metadata', () => {
  const html = change(fixture(), document => {
    document.querySelectorAll('a').forEach(node => node.remove());
    document.querySelector('meta[name=robots]')!.setAttribute('content', 'noindex');
  });
  const failures = validatePublicHtml(html, path);
  for (const match of ['telephone', 'WhatsApp', 'navigation', 'robots']) assert.ok(failures.some(failure => failure.includes(match)));
});

test('excluded routes cannot contain service state and 404s must be noindex', () => {
  assert.ok(validateExcludedHtml(fixture()).length);
  assert.deepEqual(validateExcludedHtml('<div id="root"></div>'), []);
  assert.ok(validateExcludedHtml('<div id="root"></div>', true).length);
  assert.deepEqual(validateExcludedHtml('<meta name="robots" content="noindex, nofollow">', true), []);
});

test('preview requests retain production canonicals, allow platform noindex and check exclusions plus a true 404', async () => {
  const urls: string[] = [];
  const fetchImpl: typeof fetch = async input => {
    const url = new URL(String(input)); urls.push(url.href);
    const missing = url.pathname.includes('not-found');
    const body = Object.hasOwn(PUBLIC_HTML_ROUTES, url.pathname) ? fixture(url.pathname as PublicHtmlPath)
      : missing ? '<meta name="robots" content="noindex">' : '<div id="root"></div>';
    return new Response(body, { status: missing ? 404 : 200, headers: { 'content-type': 'text/html', 'x-robots-tag': 'noindex' } });
  };
  const results = await checkPublicHtmlDeployment({ baseUrl: 'https://preview.example.test', fetchImpl });
  assert.ok(urls.every(url => url.startsWith('https://preview.example.test/')));
  assert.ok(urls.some(url => url.endsWith('/admin')) && urls.some(url => url.endsWith('/admin/bookings')));
  assert.deepEqual(results.filter(result => result.failures.length), []);
});

test('HTTP errors and indexing headers fail with the affected route', async () => {
  const results = await checkPublicHtmlDeployment({ fetchImpl: async () => new Response(fixture(), {
    status: 200, headers: { 'content-type': 'text/html', 'x-robots-tag': 'noindex' },
  }) });
  assert.ok(results.find(result => result.path === path)?.failures.some(failure => failure.includes('HTTP robots')));
  assert.ok(results.find(result => result.path.includes('not-found'))?.failures.some(failure => failure.includes('expected 404')));
});

test('CLI accepts only a base origin and rejects ambiguous or credential-bearing inputs', () => {
  assert.equal(parseArguments(['--base-url', 'http://localhost:4180/']).baseUrl, 'http://localhost:4180');
  for (const args of [['--base-url'], ['--unknown'], ['--base-url', 'https://host/path'], ['--base-url', 'https://user:password@host']]) {
    assert.throws(() => parseArguments(args));
  }
});
