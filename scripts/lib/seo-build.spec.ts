import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCmsOverlays } from './seo-build';

test('strict CMS SEO build succeeds only when both CMS sources are available', async () => {
  const previousApiUrl = process.env.VITE_API_URL;
  const previousStrict = process.env.SEO_REQUIRE_CMS;
  const previousFetch = globalThis.fetch;

  process.env.VITE_API_URL = 'https://cms.example/api';
  process.env.SEO_REQUIRE_CMS = 'true';

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

    await assert.rejects(
      loadCmsOverlays(),
      /package categories unavailable.*HTTP 503/,
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = previousApiUrl;
    if (previousStrict === undefined) delete process.env.SEO_REQUIRE_CMS;
    else process.env.SEO_REQUIRE_CMS = previousStrict;
  }
});

test('strict CMS SEO build rejects a missing API URL', async () => {
  const previousApiUrl = process.env.VITE_API_URL;
  const previousApiFallback = process.env.API_URL;
  const previousStrict = process.env.SEO_REQUIRE_CMS;

  delete process.env.VITE_API_URL;
  delete process.env.API_URL;
  process.env.SEO_REQUIRE_CMS = 'true';

  try {
    await assert.rejects(loadCmsOverlays(), /VITE_API_URL\/API_URL/);
  } finally {
    if (previousApiUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = previousApiUrl;
    if (previousApiFallback === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousApiFallback;
    if (previousStrict === undefined) delete process.env.SEO_REQUIRE_CMS;
    else process.env.SEO_REQUIRE_CMS = previousStrict;
  }
});
