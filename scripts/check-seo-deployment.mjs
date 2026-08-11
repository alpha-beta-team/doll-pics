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

export function validateIndexableHtml(html, expectedUrl) {
  const failures = [];
  const source = String(html);
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = source.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  )?.[1]?.trim();
  const robots = source.match(
    /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i,
  )?.[1]?.toLowerCase();
  const canonical = source.match(
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
  )?.[1];
  const internalLinks = [
    ...source.matchAll(/<a\s+[^>]*href=["'](\/[A-Za-z0-9#/_-]*)["']/gi),
  ].map((match) => match[1]);

  if (!title) failures.push('missing a non-empty <title>');
  if (!description) failures.push('missing a meta description');
  if (!/<h1(?:\s|>)/i.test(source)) failures.push('missing a prerendered <h1>');
  if (!robots) {
    failures.push('missing a robots meta directive');
  } else if (robots.includes('noindex')) {
    failures.push(`contains a noindex directive: ${robots}`);
  }

  if (!canonical) {
    failures.push('missing a canonical link');
  } else {
    try {
      if (new URL(canonical).href !== new URL(expectedUrl).href) {
        failures.push(`canonical mismatch: ${canonical}`);
      }
    } catch {
      failures.push(`invalid canonical URL: ${canonical}`);
    }
  }

  if (internalLinks.length < 2) {
    failures.push('has fewer than two prerendered internal links');
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

const transientStatuses = new Set([502, 503, 504]);
const defaultRetryDelaysMs = [2_000, 4_000, 8_000, 15_000, 20_000, 20_000];

export async function fetchText(
  url,
  expectedStatus = 200,
  {
    retryDelaysMs = defaultRetryDelaysMs,
    fetchImpl = globalThis.fetch,
    sleepImpl = (delayMs) =>
      new Promise((resolve) => setTimeout(resolve, delayMs)),
    onRetry = (message) => console.warn(message),
  } = {},
) {
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: {
          Accept: 'application/xml,text/plain,text/html;q=0.8',
          'User-Agent': 'DollPictures-SEO-Smoke/1.0',
        },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      if (attempt >= retryDelaysMs.length) throw error;

      const delayMs = retryDelaysMs[attempt];
      onRetry(
        `${url} request failed; retrying in ${delayMs / 1_000}s ` +
          `(${attempt + 1}/${retryDelaysMs.length})`,
      );
      await sleepImpl(delayMs);
      continue;
    }

    const text = await response.text();
    if (response.status === expectedStatus) {
      return { response, text };
    }

    if (
      transientStatuses.has(response.status) &&
      attempt < retryDelaysMs.length
    ) {
      const delayMs = retryDelaysMs[attempt];
      onRetry(
        `${url} returned HTTP ${response.status}; retrying in ` +
          `${delayMs / 1_000}s (${attempt + 1}/${retryDelaysMs.length})`,
      );
      await sleepImpl(delayMs);
      continue;
    }

    const responsePreview = text.replace(/\s+/g, ' ').trim().slice(0, 200);
    throw new Error(
      `${url} returned HTTP ${response.status}, expected ${expectedStatus}` +
        (responsePreview ? `: ${responsePreview}` : ''),
    );
  }

  throw new Error(`${url} failed after all retry attempts`);
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
        const route = await fetchText(`${publicUrl}${path}`);
        const htmlFailures = validateIndexableHtml(
          route.text,
          `${publicUrl}${path}`,
        );
        return htmlFailures.map((failure) => `${location} ${failure}`);
      } catch (error) {
        return [error instanceof Error ? error.message : String(error)];
      }
    }),
  );
  for (const routeFailures of routeChecks) {
    for (const routeFailure of routeFailures) {
      failures.push(`Sitemap route failed: ${routeFailure}`);
    }
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
