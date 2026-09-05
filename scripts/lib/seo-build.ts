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
  serviceCatalogFromLinks,
  serviceCatalogFromPages,
  type CatalogPage,
  type PackageNavLinkLike,
  type SeoPagesData,
  type ServiceCatalogItem,
  type ServiceNavLinkLike,
} from '../../src/lib/seo-core';
import { withCanonicalBusinessIdentity } from '../../src/lib/businessIdentity';
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
  const seoPages = withCanonicalBusinessIdentity(
    JSON.parse(
      readFileSync(join(root, 'src/data/seo-pages.json'), 'utf8'),
    ) as Omit<
      SeoPagesData,
      | 'siteName'
      | 'brandByline'
      | 'businessName'
      | 'telephone'
      | 'email'
      | 'address'
      | 'geo'
      | 'openingHoursSpecification'
      | 'sameAs'
    >,
  );
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

export function resolveServiceCatalog(
  servicePages: Record<
    string,
    { label?: string; serviceName?: string; heading?: string }
  >,
  servicesByPath: Map<string, ServiceNavLinkLike>,
  servicesLoaded: boolean,
): ServiceCatalogItem[] {
  return servicesLoaded
    ? serviceCatalogFromLinks([...servicesByPath.values()])
    : serviceCatalogFromPages(servicePages);
}

export function assertCatalogCoverage(
  pages: Record<string, CatalogPage>,
  requiredPaths: string[],
) {
  const missingPaths = uniquePaths(requiredPaths.map(normalizePath)).filter(
    (path) => path && !pages[path],
  );

  if (missingPaths.length) {
    throw new Error(
      `SEO build: required sitemap routes are missing from the prerender catalog: ${missingPaths.join(', ')}`,
    );
  }
}

export interface CmsOverlays {
  packagesByPath: Map<string, PackageNavLinkLike>;
  servicesByPath: Map<string, ServiceNavLinkLike>;
  servicesLoaded: boolean;
  lastmodByPath: Record<string, string>;
  apiBase: string;
}

export async function loadCmsOverlays(): Promise<CmsOverlays> {
  const apiBase = getApiBase();
  const lastmodByPath: Record<string, string> = {};
  const packagesByPath = new Map<string, PackageNavLinkLike>();
  const servicesByPath = new Map<string, ServiceNavLinkLike>();
  let servicesLoaded = false;

  if (!apiBase) {
    return { packagesByPath, servicesByPath, servicesLoaded, lastmodByPath, apiBase: '' };
  }

  try {
    const categories = await fetchJson(`${apiBase}/package-categories`);
    if (Array.isArray(categories)) {
      for (const c of categories) {
        const path = normalizePath(c?.path);
        if (!path) continue;
        if (c.contentUpdatedAt) lastmodByPath[path] = c.contentUpdatedAt;
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
    servicesLoaded = true;
    const orderedLinks = links
      .map((link, index) => ({
        link,
        index,
        order:
          typeof link?.order === 'number' && Number.isFinite(link.order)
            ? link.order
            : index,
      }))
      .sort((a, b) => a.order - b.order || a.index - b.index);

    for (const { link, order } of orderedLinks) {
      if (link?.isPublished === false) continue;
      const path = normalizePath(link?.path);
      if (!path || path === '/services' || servicesByPath.has(path)) continue;
      if (link.contentUpdatedAt) lastmodByPath[path] = link.contentUpdatedAt;
      servicesByPath.set(path, {
        label: String(link.label ?? '').trim() || 'Service',
        path,
        description: link.description || '',
        order,
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

  return { packagesByPath, servicesByPath, servicesLoaded, lastmodByPath, apiBase };
}

/** Validate the resolved catalog, including CMS-only routes, before emitting HTML. */
export function assertCatalogMetadata(pages: Record<string, CatalogPage>) {
  for (const field of ['title', 'description'] as const) {
    const seen = new Map<string, string>();
    for (const [path, page] of Object.entries(pages)) {
      const value = page[field].trim();
      if (!value) throw new Error(`SEO build: empty ${field} on ${path}`);
      const key = value.toLowerCase().replace(/\s+/g, ' ');
      const previous = seen.get(key);
      if (previous) throw new Error(`SEO build: duplicate ${field} on ${previous} and ${path}`);
      seen.set(key, path);
      if (field === 'title' && value.length > 70) {
        console.warn(`SEO build: review long title (${value.length}) on ${path}: ${value}`);
      }
    }
  }
}
