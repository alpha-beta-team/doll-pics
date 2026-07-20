/**
 * Shared SEO helpers for build scripts (sitemap + prerender).
 * Mirrors runtime logic in src/lib/seo.ts as closely as possible.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fetchJson,
  getApiBase,
  getSiteUrl,
  normalizePath,
  root,
  uniquePaths,
} from './env.mjs';

export function loadStaticSeoData() {
  const seoPages = JSON.parse(
    readFileSync(join(root, 'src/data/seo-pages.json'), 'utf8'),
  );
  const servicePages = JSON.parse(
    readFileSync(join(root, 'src/data/service-pages.json'), 'utf8'),
  );
  const packagePages = JSON.parse(
    readFileSync(join(root, 'src/data/package-pages.json'), 'utf8'),
  );
  const sitemapRoutes = JSON.parse(
    readFileSync(join(root, 'src/data/sitemap-routes.json'), 'utf8'),
  );
  return { seoPages, servicePages, packagePages, sitemapRoutes };
}

export async function loadCmsOverlays() {
  const apiBase = getApiBase();
  const packagesByPath = new Map();
  const servicesByPath = new Map();

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
    console.warn('SEO build: package categories unavailable:', err.message || err);
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
    console.warn('SEO build: site-content services unavailable:', err.message || err);
  }

  return { packagesByPath, servicesByPath, apiBase };
}

function pick(value, fallback) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
}

/** Same merge rules as resolveServicePage in src/lib/seo.ts */
export function resolveServiceLanding(path, json, nav) {
  const base = json
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
          fallbackImages: [],
        }
      : null;

  if (!base) return null;

  return {
    ...base,
    kind: 'service',
    path,
    title: pick(nav?.seoTitle, base.title),
    description: pick(nav?.seoDescription, base.description),
    heading: pick(nav?.heading, base.heading),
    lead: pick(nav?.lead, base.lead),
    body: pick(nav?.seoDescription, base.body),
    serviceName: pick(nav?.heading, base.serviceName),
    label: pick(nav?.label, base.label),
  };
}

/** Same merge rules as resolvePackagePage in src/lib/seo.ts */
export function resolvePackageLanding(path, json, nav) {
  const base = json
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
          fallbackImages: [],
        }
      : null;

  if (!base) return null;

  return {
    ...base,
    kind: 'package',
    path,
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

export function buildPageCatalog({
  seoPages,
  servicePages,
  packagePages,
  packagesByPath,
  servicesByPath,
}) {
  const pages = {};

  for (const [path, page] of Object.entries(seoPages.pages ?? {})) {
    pages[path] = {
      kind: 'core',
      path,
      title: page.title,
      description: page.description,
      heading: page.heading,
      body: page.body,
      sections: [],
      faqs: path === '/booking' ? seoPages.faqs ?? [] : [],
      related: [],
      fallbackImages: [],
    };
  }

  for (const [path, json] of Object.entries(servicePages)) {
    const nav = servicesByPath.get(path) ?? null;
    pages[path] = resolveServiceLanding(path, json, nav);
  }

  for (const [path, json] of Object.entries(packagePages)) {
    const nav = packagesByPath.get(path) ?? null;
    pages[path] = resolvePackageLanding(path, json, nav);
  }

  // CMS-only landings not present in static JSON
  for (const [path, nav] of servicesByPath) {
    if (!pages[path]) {
      pages[path] = resolveServiceLanding(path, null, nav);
    }
  }
  for (const [path, nav] of packagesByPath) {
    if (!pages[path]) {
      pages[path] = resolvePackageLanding(path, null, nav);
    }
  }

  return pages;
}

export function absoluteUrl(siteUrl, path) {
  if (!path || path === '/') return siteUrl;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildAreaServed(seoPages) {
  const { address, serviceAreas } = seoPages;
  const cities = serviceAreas ?? [address.addressLocality];
  return [
    ...cities.map((name) => ({ '@type': 'City', name })),
    { '@type': 'State', name: address.addressRegion },
    { '@type': 'Country', name: address.addressCountry },
  ];
}

function buildOfferCatalog(seoPages) {
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

/** Mirrors buildLocalBusinessJsonLd in src/lib/seo.ts */
export function buildBusinessJsonLd(siteUrl, seoPages) {
  const studioId = `${siteUrl}/#studio`;
  const ogImage = `${siteUrl}/og-share.jpg`;
  const siteLogo = `${siteUrl}/logo-doll.png`;
  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    '@id': studioId,
    name: seoPages.businessName || seoPages.brandByline,
    alternateName: seoPages.siteName,
    description: seoPages.defaultDescription,
    url: siteUrl,
    image: ogImage,
    logo: siteLogo,
    telephone: seoPages.telephone || undefined,
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
    sameAs: seoPages.sameAs?.length ? seoPages.sameAs : undefined,
  };
}

export function buildWebPageJsonLd(siteUrl, page, url) {
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

/** Mirrors buildBreadcrumbJsonLd extras for service/package */
export function buildBreadcrumbJsonLd(siteUrl, page, url) {
  const name = page.heading || page.title.split('|')[0].trim() || page.title;
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
  ];

  if (page.kind === 'service') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Services',
      item: absoluteUrl(siteUrl, '/services'),
    });
    items.push({
      '@type': 'ListItem',
      position: 3,
      name,
      item: url,
    });
  } else if (page.kind === 'package') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Packages',
      item: absoluteUrl(siteUrl, '/packages'),
    });
    items.push({
      '@type': 'ListItem',
      position: 3,
      name,
      item: url,
    });
  } else {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name,
      item: url,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export function buildFaqPageJsonLd(faqs) {
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

export function buildServiceOrPackageJsonLd(siteUrl, page, seoPages) {
  if (page.kind !== 'service' && page.kind !== 'package') return null;
  const url = absoluteUrl(siteUrl, page.path);
  const idSuffix = page.kind === 'package' ? 'package-category' : 'service';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#${idSuffix}`,
    name: page.serviceName,
    description: page.description,
    provider: { '@id': `${siteUrl}/#studio` },
    areaServed: buildAreaServed(seoPages),
    url,
  };
}

export function collectSitemapRoutes(staticRoutes, packagesByPath, servicesByPath) {
  return uniquePaths([
    ...staticRoutes,
    ...packagesByPath.keys(),
    ...servicesByPath.keys(),
  ]);
}

export { getSiteUrl, getApiBase, uniquePaths };
