import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = (
  process.env.VITE_SITE_URL || 'https://dollpictures.in'
).replace(/\/$/, '');

const apiBase = (
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  ''
).replace(/\/$/, '');

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

/** Parse `export const SITEMAP_ROUTES = [...]` from navigation.ts (no TS runtime needed). */
function loadSitemapRoutesFromNav() {
  const navSource = readFileSync(join(root, 'src/lib/navigation.ts'), 'utf8');
  const block = navSource.match(
    /export const SITEMAP_ROUTES = \[([\s\S]*?)\];/,
  );
  if (!block) {
    throw new Error('Could not find SITEMAP_ROUTES in navigation.ts');
  }
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

async function loadApiPackagePaths() {
  if (!apiBase) return [];
  try {
    const res = await fetch(`${apiBase}/package-categories`);
    if (!res.ok) return [];
    const categories = await res.json();
    if (!Array.isArray(categories)) return [];
    return categories
      .map((c) => (typeof c?.path === 'string' ? c.path.trim() : ''))
      .filter(Boolean);
  } catch (err) {
    console.warn('Sitemap: could not fetch package categories from API:', err);
    return [];
  }
}

function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

const fallbackRoutes = loadSitemapRoutesFromNav();
const apiPackagePaths = await loadApiPackagePaths();
const routes = uniquePaths([...fallbackRoutes, ...apiPackagePaths]);

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

console.log(
  `Generated sitemap with ${routes.length} URLs for ${siteUrl}` +
    (apiPackagePaths.length
      ? ` (+${apiPackagePaths.length} from API)`
      : ' (defaults only)'),
);
