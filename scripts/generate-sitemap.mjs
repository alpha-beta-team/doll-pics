/**
 * Writes robots.txt. Host routing is versioned in vercel.json and netlify.toml.
 * Live URLs come from the CMS sitemap endpoint — no static sitemap.xml is built.
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

for (const legacyFile of ['_redirects', '_sitemap-proxy.json']) {
  const legacyPath = join(root, 'public', legacyFile);
  if (existsSync(legacyPath)) {
    unlinkSync(legacyPath);
  }
}

console.log(`SEO: robots.txt → Sitemap ${siteUrl}/sitemap.xml`);
console.log(
  apiBase
    ? `SEO: CMS sitemap source ${apiBase}/sitemap.xml`
    : 'SEO: VITE_API_URL not set; host routing still serves the configured production sitemap.',
);
