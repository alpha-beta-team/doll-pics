import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCatalogCoverage,
  loadCmsOverlays,
} from './seo-build';
import type { CatalogPage } from '../../src/lib/seo-core';

test('CMS overlays enrich the static catalog when both sources are available', async () => {
  const previousApiUrl = process.env.VITE_API_URL;
  const previousStrict = process.env.SEO_REQUIRE_CMS;
  const previousRetryDelays = process.env.SEO_CMS_RETRY_DELAYS_MS;
  const previousFetch = globalThis.fetch;

  process.env.VITE_API_URL = 'https://cms.example/api';
  process.env.SEO_REQUIRE_CMS = 'true';
  process.env.SEO_CMS_RETRY_DELAYS_MS = '0';

  try {
    globalThis.fetch = (async (input) => {
      const url = String(input);
      if (url.endsWith('/package-categories')) {
        return Response.json([
          {
            name: 'Wedding',
            slug: 'wedding',
            path: '/wedding-packages-erode',
          },
        ]);
      }
      if (url.endsWith('/site-content')) {
        return Response.json({
          serviceNavLinks: [
            {
              label: 'Wedding',
              path: '/wedding-photography-erode',
              isPublished: true,
            },
          ],
        });
      }
      return new Response('', { status: 404 });
    }) as typeof fetch;

    const overlays = await loadCmsOverlays();
    assert.equal(overlays.packagesByPath.size, 1);
    assert.equal(overlays.servicesByPath.size, 1);

    globalThis.fetch = (async () =>
      new Response('', { status: 503 })) as typeof fetch;

    const fallbackOverlays = await loadCmsOverlays();
    assert.equal(fallbackOverlays.packagesByPath.size, 0);
    assert.equal(fallbackOverlays.servicesByPath.size, 0);
    assert.equal(fallbackOverlays.servicesLoaded, false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = previousApiUrl;
    if (previousStrict === undefined) delete process.env.SEO_REQUIRE_CMS;
    else process.env.SEO_REQUIRE_CMS = previousStrict;
    if (previousRetryDelays === undefined) delete process.env.SEO_CMS_RETRY_DELAYS_MS;
    else process.env.SEO_CMS_RETRY_DELAYS_MS = previousRetryDelays;
  }
});

test('CMS overlays use the static fallback when the API URL is missing', async () => {
  const previousApiUrl = process.env.VITE_API_URL;
  const previousApiFallback = process.env.API_URL;
  const previousStrict = process.env.SEO_REQUIRE_CMS;

  delete process.env.VITE_API_URL;
  delete process.env.API_URL;
  process.env.SEO_REQUIRE_CMS = 'true';

  try {
    const overlays = await loadCmsOverlays();
    assert.equal(overlays.apiBase, '');
    assert.equal(overlays.packagesByPath.size, 0);
    assert.equal(overlays.servicesByPath.size, 0);
  } finally {
    if (previousApiUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = previousApiUrl;
    if (previousApiFallback === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousApiFallback;
    if (previousStrict === undefined) delete process.env.SEO_REQUIRE_CMS;
    else process.env.SEO_REQUIRE_CMS = previousStrict;
  }
});

test('required sitemap routes must exist in the prerender catalog', () => {
  const page = { path: '/' } as CatalogPage;

  assert.doesNotThrow(() => assertCatalogCoverage({ '/': page }, ['/']));
  assert.throws(
    () => assertCatalogCoverage({ '/': page }, ['/', '/missing-route']),
    /required sitemap routes.*\/missing-route/,
  );
});
