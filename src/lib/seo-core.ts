/**
 * Pure SEO helpers shared by runtime (src/lib/seo.ts) and build (scripts).
 * No DOM, no import.meta.env — callers pass siteUrl / data.
 */

export type FaqItem = {
  question: string;
  answer: string;
};

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  heading?: string;
  body?: string;
};

export type ServiceNavLinkLike = {
  label: string;
  path: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
};

export type PackageNavLinkLike = {
  label: string;
  path: string;
  categorySlug: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
};

export type ServicePageContent = {
  title: string;
  description: string;
  heading: string;
  body: string;
  serviceName: string;
  label: string;
  lead: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faqs: FaqItem[];
  related: Array<{ label: string; path: string }>;
  imageCategories: string[];
  fallbackImages: Array<{ src: string; alt: string }>;
};

export type PackagePageContent = {
  title: string;
  description: string;
  heading: string;
  body: string;
  serviceName: string;
  label: string;
  lead: string;
  categorySlug: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faqs: FaqItem[];
  related: Array<{ label: string; path: string }>;
  imageCategories: string[];
  fallbackImages: Array<{ src: string; alt: string }>;
};

export type CatalogPage = {
  kind: 'core' | 'service' | 'package';
  path: string;
  title: string;
  description: string;
  heading: string;
  body: string;
  serviceName?: string;
  label?: string;
  lead?: string;
  categorySlug?: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faqs: FaqItem[];
  related: Array<{ label: string; path: string }>;
  fallbackImages: Array<{ src: string; alt: string }>;
  imageCategories?: string[];
  siteName?: string;
};

/** seo-pages.json shape (subset used for JSON-LD). */
export type SeoPagesData = {
  siteName: string;
  tagline?: string;
  brandByline?: string;
  businessName?: string;
  defaultDescription: string;
  telephone?: string;
  address: Record<string, string>;
  geo: Record<string, number | string>;
  serviceAreas?: string[];
  offerCatalog?: Array<{ name: string }>;
  sameAs?: string[];
  pages: Record<
    string,
    { title: string; description: string; heading: string; body: string }
  >;
  faqs?: FaqItem[];
};

export function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function pick(value: unknown, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
}

export function absoluteUrl(siteUrl: string, path: string): string {
  if (!path || path === '/') return siteUrl;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

type ServiceJson = Partial<ServicePageContent> & {
  title: string;
  description: string;
  heading: string;
  body: string;
  serviceName: string;
  label: string;
  lead: string;
};

type PackageJson = Partial<PackagePageContent> & {
  title: string;
  description: string;
  heading: string;
  body: string;
  serviceName: string;
  label: string;
  lead: string;
  categorySlug: string;
};

/** JSON landing when present; CMS SEO fields overlay when set. */
export function resolveServicePage(
  _pathname: string,
  json: ServiceJson | null | undefined,
  nav?: ServiceNavLinkLike | null,
): ServicePageContent | null {
  const base: ServicePageContent | null = json
    ? {
        title: json.title,
        description: json.description,
        heading: json.heading,
        body: json.body,
        serviceName: json.serviceName,
        label: json.label,
        lead: json.lead,
        sections: json.sections ?? [],
        faqs: json.faqs ?? [],
        related: json.related ?? [],
        imageCategories: json.imageCategories ?? [],
        fallbackImages: json.fallbackImages ?? [],
      }
    : nav
      ? {
          title: `${nav.label} Photography in Erode | Doll Pictures`,
          description:
            nav.description ||
            `${nav.label} photography in Erode from DOLL PICTURES.`,
          heading: `${nav.label} photography in Erode`,
          body:
            nav.description ||
            `Explore our ${nav.label.toLowerCase()} photography.`,
          serviceName: `${nav.label} photography in Erode`,
          label: nav.label,
          lead:
            nav.description ||
            `Book a ${nav.label.toLowerCase()} session with DOLL PICTURES in Erode.`,
          sections: [],
          faqs: [],
          related: [
            { label: 'Packages', path: '/packages' },
            { label: 'Book a session', path: '/booking' },
          ],
          imageCategories: [nav.label],
          fallbackImages: [],
        }
      : null;

  if (!base) return null;

  return {
    ...base,
    title: pick(nav?.seoTitle, base.title),
    description: pick(nav?.seoDescription, base.description),
    heading: pick(nav?.heading, base.heading),
    lead: pick(nav?.lead, base.lead),
    body: pick(nav?.seoDescription, base.body),
    serviceName: pick(nav?.heading, base.serviceName),
    label: pick(nav?.label, base.label),
  };
}

/** JSON landing when present; CMS SEO fields overlay when set. */
export function resolvePackagePage(
  _pathname: string,
  json: PackageJson | null | undefined,
  nav?: PackageNavLinkLike | null,
): PackagePageContent | null {
  const base: PackagePageContent | null = json
    ? {
        title: json.title,
        description: json.description,
        heading: json.heading,
        body: json.body,
        serviceName: json.serviceName,
        label: json.label,
        lead: json.lead,
        categorySlug: json.categorySlug,
        sections: json.sections ?? [],
        faqs: json.faqs ?? [],
        related: json.related ?? [],
        imageCategories: json.imageCategories ?? [],
        fallbackImages: json.fallbackImages ?? [],
      }
    : nav
      ? {
          title: `${nav.label} Photography Packages | Doll Pictures`,
          description:
            nav.description ||
            `${nav.label} photography packages in Erode from DOLL PICTURES.`,
          heading: `${nav.label} packages`,
          body:
            nav.description ||
            `Explore our ${nav.label.toLowerCase()} packages.`,
          serviceName: `${nav.label} photography packages`,
          label: nav.label,
          lead:
            nav.description ||
            `Compare ${nav.label.toLowerCase()} packages and enquire with the option that fits.`,
          categorySlug: nav.categorySlug || '',
          sections: [],
          faqs: [],
          related: [
            { label: 'All packages', path: '/packages' },
            { label: 'Book a session', path: '/booking' },
          ],
          imageCategories: [nav.label],
          fallbackImages: [],
        }
      : null;

  if (!base) return null;

  return {
    ...base,
    title: pick(nav?.seoTitle, base.title),
    description: pick(nav?.seoDescription, base.description),
    heading: pick(nav?.heading, base.heading),
    lead: pick(nav?.lead, base.lead),
    body: pick(nav?.seoDescription, base.body),
    serviceName: pick(nav?.heading, base.serviceName),
    label: pick(nav?.label, base.label),
    categorySlug: nav?.categorySlug || base.categorySlug,
  };
}

export function buildPageCatalog(input: {
  seoPages: SeoPagesData;
  servicePages: Record<string, ServiceJson>;
  packagePages: Record<string, PackageJson>;
  packagesByPath: Map<string, PackageNavLinkLike>;
  servicesByPath: Map<string, ServiceNavLinkLike>;
}): Record<string, CatalogPage> {
  const {
    seoPages,
    servicePages,
    packagePages,
    packagesByPath,
    servicesByPath,
  } = input;
  const pages: Record<string, CatalogPage> = {};

  for (const [path, page] of Object.entries(seoPages.pages ?? {})) {
    pages[path] = {
      kind: 'core',
      path,
      title: page.title,
      description: page.description,
      heading: page.heading,
      body: page.body,
      sections: [],
      faqs: path === '/booking' ? (seoPages.faqs ?? []) : [],
      related: [],
      fallbackImages: [],
      siteName: seoPages.siteName,
    };
  }

  for (const [path, json] of Object.entries(servicePages)) {
    const nav = servicesByPath.get(path) ?? null;
    const resolved = resolveServicePage(path, json, nav);
    if (resolved) {
      pages[path] = { ...resolved, kind: 'service', path };
    }
  }

  for (const [path, json] of Object.entries(packagePages)) {
    const nav = packagesByPath.get(path) ?? null;
    const resolved = resolvePackagePage(path, json, nav);
    if (resolved) {
      pages[path] = { ...resolved, kind: 'package', path };
    }
  }

  for (const [path, nav] of servicesByPath) {
    if (pages[path]) continue;
    const resolved = resolveServicePage(path, null, nav);
    if (resolved) pages[path] = { ...resolved, kind: 'service', path };
  }

  for (const [path, nav] of packagesByPath) {
    if (pages[path]) continue;
    const resolved = resolvePackagePage(path, null, nav);
    if (resolved) pages[path] = { ...resolved, kind: 'package', path };
  }

  return pages;
}

function buildAreaServed(seoPages: SeoPagesData) {
  const cities = seoPages.serviceAreas ?? [seoPages.address.addressLocality];
  return [
    ...cities.map((name) => ({ '@type': 'City', name })),
    { '@type': 'State', name: seoPages.address.addressRegion },
    { '@type': 'Country', name: seoPages.address.addressCountry },
  ];
}

function buildOfferCatalog(seoPages: SeoPagesData) {
  const items = seoPages.offerCatalog ?? [];
  if (!items.length) return undefined;
  return {
    '@type': 'OfferCatalog',
    name: 'Photography services',
    itemListElement: items.map((item) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: item.name,
      },
    })),
  };
}

export function buildLocalBusinessJsonLd(
  siteUrl: string,
  seoPages: SeoPagesData,
  contact?: {
    phone?: string;
    email?: string;
    socials?: Record<string, string>;
  },
) {
  const studioId = `${siteUrl}/#studio`;
  const fromContact = Object.values(contact?.socials ?? {}).filter(Boolean);
  const sameAs = [...new Set([...(seoPages.sameAs ?? []), ...fromContact])];
  const telephone = contact?.phone || seoPages.telephone || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    '@id': studioId,
    name: seoPages.businessName || seoPages.brandByline,
    alternateName: seoPages.siteName,
    description: seoPages.defaultDescription,
    url: siteUrl,
    image: `${siteUrl}/og-share.jpg`,
    logo: `${siteUrl}/logo-doll.png`,
    telephone,
    email: contact?.email || undefined,
    priceRange: '₹₹₹',
    address: {
      '@type': 'PostalAddress',
      ...seoPages.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      ...seoPages.geo,
    },
    areaServed: buildAreaServed(seoPages),
    hasOfferCatalog: buildOfferCatalog(seoPages),
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function buildWebPageJsonLd(
  siteUrl: string,
  page: { title: string; description: string; siteName?: string },
  url: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: page.siteName || 'DOLL PICTURES',
      url: siteUrl,
    },
    about: { '@id': `${siteUrl}/#studio` },
  };
}

export function buildBreadcrumbJsonLd(
  siteUrl: string,
  seo: Pick<PageSeo, 'path' | 'title' | 'heading'>,
  extras?: Array<{ name: string; path: string }>,
) {
  const url = absoluteUrl(siteUrl, seo.path);
  const name = seo.heading || seo.title.split('|')[0].trim() || seo.title;
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    ...(extras ?? []).map((extra, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: extra.name,
      item: absoluteUrl(siteUrl, extra.path),
    })),
    {
      '@type': 'ListItem',
      position: (extras?.length ?? 0) + 2,
      name,
      item: url,
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/** Prerender helper — breadcrumb extras from catalog page kind. */
export function buildCatalogBreadcrumbJsonLd(
  siteUrl: string,
  page: CatalogPage,
) {
  const extras =
    page.kind === 'service'
      ? [{ name: 'Services', path: '/services' }]
      : page.kind === 'package'
        ? [{ name: 'Packages', path: '/packages' }]
        : undefined;
  return buildBreadcrumbJsonLd(
    siteUrl,
    { path: page.path, title: page.title, heading: page.heading },
    extras,
  );
}

export function buildFaqPageJsonLd(faqs: FaqItem[]) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildServiceJsonLd(
  siteUrl: string,
  seoPages: SeoPagesData,
  path: string,
  page: Pick<ServicePageContent, 'serviceName' | 'description'> | null,
) {
  if (!page) return null;
  const url = absoluteUrl(siteUrl, path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: page.serviceName,
    description: page.description,
    provider: { '@id': `${siteUrl}/#studio` },
    areaServed: buildAreaServed(seoPages),
    url,
  };
}

export function buildPackageCategoryJsonLd(
  siteUrl: string,
  seoPages: SeoPagesData,
  path: string,
  page: Pick<PackagePageContent, 'serviceName' | 'description'> | null,
) {
  if (!page) return null;
  const url = absoluteUrl(siteUrl, path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#package-category`,
    name: page.serviceName,
    description: page.description,
    provider: { '@id': `${siteUrl}/#studio` },
    areaServed: buildAreaServed(seoPages),
    url,
  };
}

export function buildServiceOrPackageJsonLd(
  siteUrl: string,
  page: CatalogPage,
  seoPages: SeoPagesData,
) {
  if (page.kind !== 'service' && page.kind !== 'package') return null;
  if (!page.serviceName) return null;
  return page.kind === 'package'
    ? buildPackageCategoryJsonLd(siteUrl, seoPages, page.path, {
        serviceName: page.serviceName,
        description: page.description,
      })
    : buildServiceJsonLd(siteUrl, seoPages, page.path, {
        serviceName: page.serviceName,
        description: page.description,
      });
}
