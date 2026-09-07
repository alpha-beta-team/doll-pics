import { packageCatalogSource, resolvePublicCatalog, serviceCatalogSource, type PublicRouteCatalog } from '../../src/lib/publicCatalog';
import { getPublishedPackageNavLinks, getPublishedServiceNavLinks } from '../../src/lib/navigation';
import type { PublicSiteContent, PublicPackageCategory } from '../../src/shared/types';
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
  type CatalogPage,
  type PackageNavLinkLike,
  type SeoPagesData,
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
  publicCatalog: PublicRouteCatalog;
  packagesLoaded: boolean;
  siteContent?: PublicSiteContent;
  packageCategories?: PublicPackageCategory[];
  packagesByPath: Map<string, PackageNavLinkLike>;
  servicesByPath: Map<string, ServiceNavLinkLike>;
  servicesLoaded: boolean;
  lastmodByPath: Record<string, string>;
  apiBase: string;
}

export async function loadCmsOverlays(): Promise<CmsOverlays> {
  const apiBase = getApiBase();
  const read = async (path: string): Promise<unknown> => {
    if (!apiBase) return undefined;
    try { return await fetchJson(`${apiBase}${path}`); }
    catch { console.warn(`SEO build: ${path} unavailable; using static fallback`); return undefined; }
  };
  const [rawCategories, rawContent] = await Promise.all([read('/package-categories'), read('/site-content')]);
  const publicCatalog = resolvePublicCatalog({
    services: serviceCatalogSource(rawContent), packages: packageCatalogSource(rawCategories),
  });
  const servicesLoaded = publicCatalog.sources.services.status === 'cms';
  const packagesLoaded = publicCatalog.sources.packages.status === 'cms';
  const siteContent = servicesLoaded ? rawContent as PublicSiteContent : undefined;
  const packageCategories = packagesLoaded ? rawCategories as PublicPackageCategory[] : undefined;
  const servicesByPath = new Map(publicCatalog.serviceLinks.map(link => [link.path, link]));
  const packagesByPath = new Map(publicCatalog.packageLinks.map(link => [link.path, link]));
  const lastmodByPath: Record<string, string> = {};
  for (const raw of packageCategories ?? []) {
    const link = getPublishedPackageNavLinks([raw])[0];
    if (link && packagesByPath.has(link.path) && typeof raw.contentUpdatedAt === 'string') lastmodByPath[link.path] = raw.contentUpdatedAt;
  }
  for (const raw of siteContent?.serviceNavLinks ?? []) {
    const link = getPublishedServiceNavLinks([raw])[0];
    if (link && servicesByPath.has(link.path) && typeof raw.contentUpdatedAt === 'string') lastmodByPath[link.path] = raw.contentUpdatedAt;
  }
  return { publicCatalog, packagesByPath, servicesByPath, servicesLoaded, packagesLoaded, lastmodByPath, apiBase, siteContent, packageCategories };
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
