/**
 * Writes robots.txt and host proxy rules so /sitemap.xml is served by the CMS API.
 * Live URLs come from GET {VITE_API_URL}/sitemap.xml — no static sitemap.xml at build time.
 */
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getApiBase, getSiteUrl, loadEnvFiles, root } from './lib/env.mjs';

loadEnvFiles();

const siteUrl = getSiteUrl();
const apiBase = getApiBase();

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin/',
  'Disallow: /api/',
  'Disallow: /preview/',
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  '',
].join('\n');

writeFileSync(join(root, 'public/robots.txt'), robots);

const staticSitemap = join(root, 'public/sitemap.xml');
if (existsSync(staticSitemap)) {
  unlinkSync(staticSitemap);
}

if (apiBase) {
  const sitemapApi = `${apiBase.replace(/\/$/, '')}/sitemap.xml`;

  // Netlify: proxy even if a stale file exists (force)
  writeFileSync(
    join(root, 'public/_redirects'),
    [`/sitemap.xml  ${sitemapApi}  200!`, ''].join('\n'),
  );

  // Vercel build hint (committed vercel.json also proxies; this keeps CI in sync)
  writeFileSync(
    join(root, 'public/_sitemap-proxy.json'),
    `${JSON.stringify({ source: '/sitemap.xml', destination: sitemapApi }, null, 2)}\n`,
  );

  console.log(`SEO: robots.txt → Sitemap ${siteUrl}/sitemap.xml`);
  console.log(`SEO: proxy /sitemap.xml → ${sitemapApi}`);
} else {
  console.warn(
    'SEO: VITE_API_URL not set — robots.txt written, but /sitemap.xml proxy was skipped.',
  );
  console.warn(
    'SEO: Set VITE_API_URL so Netlify/Vercel can proxy sitemap to the CMS API.',
  );
}
