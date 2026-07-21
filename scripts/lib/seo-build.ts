/**
 * Build-time SEO — Node loaders + re-exports from shared seo-core.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  absoluteUrl,
  buildCatalogBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
  buildPageCatalog,
  buildServiceOrPackageJsonLd,
  buildWebPageJsonLd,
  type PackageNavLinkLike,
  type SeoPagesData,
  type ServiceNavLinkLike,
} from '../../src/lib/seo-core';
import {
  fetchJson,
  getApiBase,
  getSiteUrl,
  normalizePath,
  root,
  uniquePaths,
} from './env.mjs';

export {
  absoluteUrl,
  buildCatalogBreadcrumbJsonLd as buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd as buildBusinessJsonLd,
  buildPageCatalog,
  buildServiceOrPackageJsonLd,
  buildWebPageJsonLd,
  getApiBase,
  getSiteUrl,
  uniquePaths,
};

export function loadStaticSeoData() {
  const seoPages = JSON.parse(
    readFileSync(join(root, 'src/data/seo-pages.json'), 'utf8'),
  ) as SeoPagesData;
  const servicePages = JSON.parse(
    readFileSync(join(root, 'src/data/service-pages.json'), 'utf8'),
  );
  const packagePages = JSON.parse(
    readFileSync(join(root, 'src/data/package-pages.json'), 'utf8'),
  );
  const sitemapRoutes = JSON.parse(
    readFileSync(join(root, 'src/data/sitemap-routes.json'), 'utf8'),
  ) as string[];
  return { seoPages, servicePages, packagePages, sitemapRoutes };
}

export async function loadCmsOverlays() {
  const apiBase = getApiBase();
  const packagesByPath = new Map<string, PackageNavLinkLike>();
  const servicesByPath = new Map<string, ServiceNavLinkLike>();

  if (!apiBase) {
    return { packagesByPath, servicesByPath, apiBase: '' };
  }

  try {
    const categories = await fetchJson(`${apiBase}/package-categories`);
    if (Array.isArray(categories)) {
      for (const c of categories) {
        const path = normalizePath(c?.path);
        if (!path) continue;
        packagesByPath.set(path, {
          label: c.name || 'Packages',
          path,
          categorySlug: String(c.slug || '').toLowerCase(),
          description: c.description || '',
          seoTitle: c.seoTitle || '',
          seoDescription: c.seoDescription || '',
          heading: c.heading || '',
          lead: c.lead || '',
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('SEO build: package categories unavailable:', message);
  }

  try {
    const siteContent = await fetchJson(`${apiBase}/site-content`);
    const links = Array.isArray(siteContent?.serviceNavLinks)
      ? siteContent.serviceNavLinks
      : [];
    for (const link of links) {
      if (link?.isPublished === false) continue;
      const path = normalizePath(link?.path);
      if (!path || path === '/services') continue;
      servicesByPath.set(path, {
        label: link.label || 'Service',
        path,
        description: link.description || '',
        seoTitle: link.seoTitle || '',
        seoDescription: link.seoDescription || '',
        heading: link.heading || '',
        lead: link.lead || '',
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('SEO build: site-content services unavailable:', message);
  }

  return { packagesByPath, servicesByPath, apiBase };
}
