/** Writes the static sitemap baseline and robots.txt before Vite builds. */
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSiteUrl, loadEnvFiles, root } from './lib/env.mjs';
import { buildSitemapXml } from './lib/sitemap.mjs';

loadEnvFiles();

const siteUrl = getSiteUrl();
const sitemapRoutes = JSON.parse(
  readFileSync(join(root, 'src/data/sitemap-routes.json'), 'utf8'),
);

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin/',
  'Disallow: /employee/',
  'Disallow: /kiosk/',
  'Disallow: /api/',
  'Disallow: /preview/',
  'Disallow: /quotation/',
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  '',
].join('\n');

writeFileSync(join(root, 'public/robots.txt'), robots);

const staticSitemap = join(root, 'public/sitemap.xml');
writeFileSync(staticSitemap, buildSitemapXml(siteUrl, sitemapRoutes));

for (const legacyFile of ['_redirects', '_sitemap-proxy.json']) {
  const legacyPath = join(root, 'public', legacyFile);
  if (existsSync(legacyPath)) {
    unlinkSync(legacyPath);
  }
}

console.log(`SEO: robots.txt → Sitemap ${siteUrl}/sitemap.xml`);
console.log(`SEO: static sitemap baseline → ${sitemapRoutes.length} URLs`);
