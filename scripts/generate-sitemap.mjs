import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = (
  process.env.VITE_SITE_URL || 'https://dollpictures.in'
).replace(/\/$/, '');

const navSource = readFileSync(join(root, 'src/lib/navigation.ts'), 'utf8');
const paths = [...navSource.matchAll(/path: '([^']+)'/g)].map((match) => match[1]);
const routes = ['/', ...paths.filter((path, index, all) => all.indexOf(path) === index)];

const routeConfig = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/packages': { changefreq: 'monthly', priority: '0.8' },
  '/about': { changefreq: 'monthly', priority: '0.8' },
  '/booking': { changefreq: 'monthly', priority: '0.8' },
  '/privacy': { changefreq: 'yearly', priority: '0.3' },
  '/terms': { changefreq: 'yearly', priority: '0.3' },
};

const servicePathRe = /-photography-erode$/;
const lastmod = new Date().toISOString().split('T')[0];

const urlEntries = routes
  .map((path) => {
    const isService = servicePathRe.test(path);
    const config =
      routeConfig[path] ??
      (isService
        ? { changefreq: 'monthly', priority: '0.9' }
        : { changefreq: 'monthly', priority: '0.7' });
    // No trailing slash — matches vercel.json trailingSlash:false and seo.ts absoluteUrl
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

console.log(`Generated sitemap with ${routes.length} URLs for ${siteUrl}`);
