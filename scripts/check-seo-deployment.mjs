import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const canonicalHost = 'dollpictures.in';
const canonicalOrigin = `https://${canonicalHost}`;
const defaultPublicUrl = canonicalOrigin;
const defaultUpstreamUrl =
  'https://photography-cms-backend.onrender.com/api/sitemap.xml';

export function extractLocations(xml) {
  return [...String(xml).matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) =>
    match[1]
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&apos;', "'")
      .trim(),
  );
}

export function validateLocations(locations, requiredPaths) {
  const failures = [];
  const seen = new Set();

  for (const location of locations) {
    let parsed;
    try {
      parsed = new URL(location);
    } catch {
      failures.push(`Malformed <loc>: ${location}`);
      continue;
    }

    if (parsed.protocol !== 'https:') {
      failures.push(`Non-HTTPS <loc>: ${location}`);
    }
    if (parsed.hostname !== canonicalHost) {
      failures.push(`Non-canonical host in <loc>: ${location}`);
    }
    if (parsed.search || parsed.hash) {
      failures.push(`Parameters or fragment in <loc>: ${location}`);
    }
    if (
      parsed.pathname === '/admin' ||
      parsed.pathname.startsWith('/admin/') ||
      parsed.pathname === '/api' ||
      parsed.pathname.startsWith('/api/') ||
      parsed.pathname.startsWith('/preview')
    ) {
      failures.push(`Private route in <loc>: ${location}`);
    }
    if (seen.has(location)) {
      failures.push(`Duplicate <loc>: ${location}`);
    }
    seen.add(location);
  }

  for (const path of requiredPaths) {
    const expected = path === '/' ? canonicalOrigin : `${canonicalOrigin}${path}`;
    if (!seen.has(expected)) {
      failures.push(`Required URL missing: ${expected}`);
    }
  }

  return failures;
}

function parseArguments(argv) {
  const values = {
    publicUrl: process.env.SEO_CHECK_BASE_URL || defaultPublicUrl,
    upstreamUrl:
      process.env.SEO_SITEMAP_UPSTREAM_URL || defaultUpstreamUrl,
  };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--base-url' && argv[index + 1]) {
      values.publicUrl = argv[index + 1];
      index += 1;
    } else if (argv[index] === '--upstream-url' && argv[index + 1]) {
      values.upstreamUrl = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
    }
  }

  values.publicUrl = values.publicUrl.replace(/\/$/, '');
  return values;
}

async function fetchText(url, expectedStatus = 200) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/xml,text/plain,text/html;q=0.8',
      'User-Agent': 'DollPictures-SEO-Smoke/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(
      `${url} returned HTTP ${response.status}, expected ${expectedStatus}`,
    );
  }
  return { response, text };
}

async function main() {
  const { publicUrl, upstreamUrl } = parseArguments(process.argv.slice(2));
  const requiredPaths = JSON.parse(
    readFileSync(join(root, 'src/data/sitemap-routes.json'), 'utf8'),
  );
  const publicSitemapUrl = `${publicUrl}/sitemap.xml`;

  const [publicSitemap, upstreamSitemap, robots, notFound] = await Promise.all([
    fetchText(publicSitemapUrl),
    fetchText(upstreamUrl),
    fetchText(`${publicUrl}/robots.txt`),
    fetchText(`${publicUrl}/__seo-smoke-not-found-${Date.now()}`, 404),
  ]);

  const failures = [];
  const contentType =
    publicSitemap.response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('xml')) {
    failures.push(
      `Sitemap content type is not XML: ${contentType || '(missing)'}`,
    );
  }
  if (!/<urlset(?:\s|>)/.test(publicSitemap.text)) {
    failures.push('Public sitemap does not contain <urlset>');
  }

  const publicLocations = extractLocations(publicSitemap.text);
  const upstreamLocations = extractLocations(upstreamSitemap.text);
  failures.push(...validateLocations(publicLocations, requiredPaths));

  const routeChecks = await Promise.all(
    publicLocations.map(async (location) => {
      try {
        const path = new URL(location).pathname;
        await fetchText(`${publicUrl}${path}`);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    }),
  );
  for (const routeFailure of routeChecks) {
    if (routeFailure) failures.push(`Sitemap route failed: ${routeFailure}`);
  }

  const publicSet = [...new Set(publicLocations)].sort();
  const upstreamSet = [...new Set(upstreamLocations)].sort();
  if (JSON.stringify(publicSet) !== JSON.stringify(upstreamSet)) {
    failures.push('Public and upstream sitemap URL sets do not match');
  }

  if (!robots.text.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`)) {
    failures.push(
      `robots.txt does not reference ${canonicalOrigin}/sitemap.xml`,
    );
  }
  if (
    !/<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(
      notFound.text,
    )
  ) {
    failures.push('The HTTP 404 page does not contain a noindex robots directive');
  }

  if (failures.length) {
    throw new Error(
      `SEO deployment smoke check failed:\n- ${failures.join('\n- ')}`,
    );
  }

  console.log(
    `SEO smoke passed: ${publicLocations.length} canonical URLs, XML sitemap, robots reference, and true 404.`,
  );
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
