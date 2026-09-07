import servicePages from '../data/service-pages.json';
import {
  getPublishedPackageNavLinks, getPublishedServiceNavLinks,
  type PackageNavLink, type ServiceNavLink, type ServiceNavLinkInput,
  type PackageCategoryInput,
} from './navigation';
import { CORE_PUBLIC_PATHS, isRecord } from './publicRoutePath';

export type CatalogSource<T> = {
  status: 'cms' | 'fallback';
  reason?: 'unavailable' | 'invalid-response';
  records: T[];
};
export type PublicCatalogSources = {
  services: CatalogSource<ServiceNavLink>;
  packages: CatalogSource<PackageNavLink>;
};
export type PublicRouteCatalog = {
  sources: PublicCatalogSources;
  serviceLinks: ServiceNavLink[];
  packageLinks: PackageNavLink[];
  paths: string[];
};

const fallbackServices = () => getPublishedServiceNavLinks(
  Object.entries(servicePages).map(([path, page], order) => ({
    path, label: page.label, description: page.description, order, isPublished: true,
  })),
);

export function serviceCatalogSource(content?: unknown): CatalogSource<ServiceNavLink> {
  // The singleton endpoint can omit the optional array in legacy/default content.
  if (isRecord(content) && (content.serviceNavLinks === undefined || Array.isArray(content.serviceNavLinks))) {
    return { status: 'cms', records: getPublishedServiceNavLinks((content.serviceNavLinks ?? []) as ServiceNavLinkInput[]) };
  }
  return { status: 'fallback', reason: content === undefined ? 'unavailable' : 'invalid-response', records: fallbackServices() };
}

export function packageCatalogSource(categories?: unknown): CatalogSource<PackageNavLink> {
  if (Array.isArray(categories)) {
    return { status: 'cms', records: getPublishedPackageNavLinks(categories as PackageCategoryInput[]) };
  }
  return { status: 'fallback', reason: categories === undefined ? 'unavailable' : 'invalid-response', records: getPublishedPackageNavLinks() };
}

/** One destination set for navigation, routing, schema, sitemap and emitted HTML. */
export function resolvePublicCatalog(sources: PublicCatalogSources = {
  services: serviceCatalogSource(), packages: packageCatalogSource(),
}): PublicRouteCatalog {
  const counts = new Map<string, number>();
  for (const link of [...sources.services.records, ...sources.packages.records]) {
    counts.set(link.path, (counts.get(link.path) ?? 0) + 1);
  }
  const slugCounts = new Map<string, number>();
  for (const link of sources.packages.records) {
    slugCounts.set(link.categorySlug, (slugCounts.get(link.categorySlug) ?? 0) + 1);
  }
  // Reject every ambiguous destination instead of choosing a winner by fetch order.
  const serviceLinks = sources.services.records.filter(link => counts.get(link.path) === 1);
  const packageLinks = sources.packages.records.filter(link => counts.get(link.path) === 1 && slugCounts.get(link.categorySlug) === 1);
  return { sources, serviceLinks, packageLinks, paths: [...CORE_PUBLIC_PATHS, ...serviceLinks.map(link => link.path), ...packageLinks.map(link => link.path)] };
}

export function publicPackageCategories(catalog: PublicRouteCatalog) {
  return catalog.packageLinks.map(link => ({
    name: link.label, slug: link.categorySlug, path: link.path, description: link.description,
    seoTitle: link.seoTitle, seoDescription: link.seoDescription, heading: link.heading, lead: link.lead,
    order: link.order, isPublished: link.isPublished,
  }));
}

/** Seed last-known publication on client-only pages, including the generated 404. */
export function parseBuildPublicCatalog(text: string): PublicRouteCatalog | undefined {
  try {
    const input: unknown = JSON.parse(text);
    if (!isRecord(input) || !isRecord(input.sources)) return;
    const { services, packages } = input.sources;
    if (!isRecord(services) || !isRecord(packages)) return;
    for (const source of [services, packages]) {
      if (!['cms', 'fallback'].includes(String(source.status)) || !Array.isArray(source.records)) return;
      if (source.reason !== undefined && !['unavailable', 'invalid-response'].includes(String(source.reason))) return;
    }
    const serviceRecords = getPublishedServiceNavLinks(services.records as ServiceNavLink[]);
    const packageRecords = getPublishedPackageNavLinks((packages.records as unknown[]).flatMap(link => isRecord(link) ? [{
      ...link, name: link.label, slug: link.categorySlug,
    } as PackageCategoryInput] : []));
    if (serviceRecords.length !== (services.records as unknown[]).length || packageRecords.length !== (packages.records as unknown[]).length) return;
    return resolvePublicCatalog({
      services: { status: services.status as CatalogSource<ServiceNavLink>['status'], reason: services.reason as CatalogSource<ServiceNavLink>['reason'], records: serviceRecords },
      packages: { status: packages.status as CatalogSource<PackageNavLink>['status'], reason: packages.reason as CatalogSource<PackageNavLink>['reason'], records: packageRecords },
    });
  } catch { return; }
}

export function readBuildPublicCatalog(): PublicRouteCatalog | undefined {
  if (typeof document === 'undefined') return;
  const text = document.getElementById('public-route-catalog')?.textContent;
  return text ? parseBuildPublicCatalog(text) : undefined;
}
