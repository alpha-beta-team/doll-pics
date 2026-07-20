import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvFiles, root } from './lib/env.mjs';
import {
  collectSitemapRoutes,
  getApiBase,
  getSiteUrl,
  loadCmsOverlays,
  loadStaticSeoData,
} from './lib/seo-shared.mjs';

loadEnvFiles();

const siteUrl = getSiteUrl();
const apiBase = getApiBase();
const { sitemapRoutes } = loadStaticSeoData();
const { packagesByPath, servicesByPath } = await loadCmsOverlays();

const routeConfig = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/packages': { changefreq: 'monthly', priority: '0.8' },
  '/about': { changefreq: 'monthly', priority: '0.8' },
  '/booking': { changefreq: 'monthly', priority: '0.8' },
  '/privacy': { changefreq: 'yearly', priority: '0.3' },
  '/terms': { changefreq: 'yearly', priority: '0.3' },
};

const servicePathRe = /-photography-erode$/;
const packagePathRe = /-packages-erode$/;
const lastmod = new Date().toISOString().split('T')[0];

const routes = collectSitemapRoutes(
  sitemapRoutes,
  packagesByPath,
  servicesByPath,
);

if (!apiBase) {
  console.warn(
    'Sitemap: VITE_API_URL not set — using sitemap-routes.json defaults only.',
  );
}

const urlEntries = routes
  .map((path) => {
    const isService = servicePathRe.test(path);
    const isPackage = packagePathRe.test(path);
    const config =
      routeConfig[path] ??
      (isService || isPackage
        ? { changefreq: 'monthly', priority: '0.9' }
        : { changefreq: 'monthly', priority: '0.7' });
    const loc = path === '/' ? siteUrl : `${siteUrl}${path}`;

    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${config.changefreq}</changefreq>`,
      `    <priority>${config.priority}</priority>`,
      '  </url>',
    ].join('\n');
  })
  .join('\n');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urlEntries,
  '</urlset>',
  '',
].join('\n');

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

writeFileSync(join(root, 'public/sitemap.xml'), sitemap);
writeFileSync(join(root, 'public/robots.txt'), robots);

const apiNote = apiBase
  ? ` (API: +${packagesByPath.size} packages, +${servicesByPath.size} services)`
  : ' (defaults only)';

console.log(
  `Generated sitemap with ${routes.length} URLs for ${siteUrl}${apiNote}`,
);
