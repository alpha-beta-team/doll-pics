import seoPages from '../data/seo-pages.json';
import servicePages from '../data/service-pages.json';
import packagePages from '../data/package-pages.json';

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL as string | undefined
)?.replace(/\/$/, '') || 'https://dollpictures.in';

export const SITE_NAME = seoPages.siteName;
export const SITE_TAGLINE = seoPages.tagline;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-share.jpg`;
export const SITE_LOGO = `${SITE_URL}/logo-doll.png`;
export const STUDIO_ID = `${SITE_URL}/#studio`;

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

export type FaqItem = {
  question: string;
  answer: string;
};

const servicePageEntries = Object.fromEntries(
  Object.entries(servicePages).map(([path, page]) => [
    path,
    {
      path,
      title: page.title,
      description: page.description,
      heading: page.heading,
      body: page.body,
    },
  ]),
);

const packagePageEntries = Object.fromEntries(
  Object.entries(packagePages).map(([path, page]) => [
    path,
    {
      path,
      title: page.title,
      description: page.description,
      heading: page.heading,
      body: page.body,
    },
  ]),
);

export const PAGE_SEO: Record<string, PageSeo> = {
  ...Object.fromEntries(
    Object.entries(seoPages.pages).map(([path, page]) => [
      path,
      {
        path,
        title: page.title,
        description: page.description,
        heading: page.heading,
        body: page.body,
      },
    ]),
  ),
  ...servicePageEntries,
  ...packagePageEntries,
};

export const SITE_FAQS: FaqItem[] = (seoPages.faqs ?? []).map((faq) => ({
  question: faq.question,
  answer: faq.answer,
}));

export function getPageSeo(pathname: string): PageSeo {
  const normalized =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;
  return (
    PAGE_SEO[normalized] ?? {
      path: normalized || '/',
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: seoPages.defaultDescription,
    }
  );
}

export function getServicePage(pathname: string) {
  const normalized =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;
  return servicePages[normalized as keyof typeof servicePages] ?? null;
}

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

type ServiceNavLinkLike = {
  label: string;
  path: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
};

/** JSON landing when present; CMS SEO fields overlay when set. */
export function resolveServicePage(
  pathname: string,
  nav?: ServiceNavLinkLike | null,
): ServicePageContent | null {
  const json = getServicePage(pathname);
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

  const seoTitle = nav?.seoTitle?.trim();
  const seoDescription = nav?.seoDescription?.trim();
  const heading = nav?.heading?.trim();
  const lead = nav?.lead?.trim();

  return {
    ...base,
    title: seoTitle || base.title,
    description: seoDescription || base.description,
    heading: heading || base.heading,
    lead: lead || base.lead,
    body: seoDescription || base.body,
    serviceName: heading || base.serviceName,
    label: nav?.label?.trim() || base.label,
  };
}

export function getPackagePage(pathname: string) {
  const normalized =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;
  return packagePages[normalized as keyof typeof packagePages] ?? null;
}

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

/** JSON landing when present; CMS SEO fields overlay when set. */
export function resolvePackagePage(
  pathname: string,
  nav?: PackageNavLinkLike | null,
): PackagePageContent | null {
  const json = getPackagePage(pathname);
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
          categorySlug: nav.categorySlug,
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

  const seoTitle = nav?.seoTitle?.trim();
  const seoDescription = nav?.seoDescription?.trim();
  const heading = nav?.heading?.trim();
  const lead = nav?.lead?.trim();

  return {
    ...base,
    title: seoTitle || base.title,
    description: seoDescription || base.description,
    heading: heading || base.heading,
    lead: lead || base.lead,
    body: seoDescription || base.body,
    serviceName: heading || base.serviceName,
    label: nav?.label?.trim() || base.label,
    categorySlug: nav?.categorySlug || base.categorySlug,
  };
}

type PackageNavLinkLike = {
  label: string;
  path: string;
  categorySlug: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
};

export function absoluteUrl(path: string): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

function buildAreaServed() {
  const cities = seoPages.serviceAreas ?? [seoPages.address.addressLocality];
  return [
    ...cities.map((name) => ({ '@type': 'City', name })),
    { '@type': 'State', name: seoPages.address.addressRegion },
    { '@type': 'Country', name: seoPages.address.addressCountry },
  ];
}

function buildOfferCatalog() {
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

export function buildLocalBusinessJsonLd(contact?: {
  phone?: string;
  email?: string;
  socials?: Record<string, string>;
}) {
  const fromContact = Object.values(contact?.socials ?? {}).filter(Boolean);
  const sameAs = [...new Set([...(seoPages.sameAs ?? []), ...fromContact])];
  const { address, geo } = seoPages;
  const telephone = contact?.phone || seoPages.telephone || undefined;
  const hasOfferCatalog = buildOfferCatalog();

  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    '@id': STUDIO_ID,
    name: seoPages.businessName || seoPages.brandByline,
    alternateName: SITE_NAME,
    description: seoPages.defaultDescription,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    logo: SITE_LOGO,
    telephone,
    email: contact?.email || undefined,
    priceRange: '₹₹₹',
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      ...geo,
    },
    areaServed: buildAreaServed(),
    hasOfferCatalog,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function buildServiceJsonLd(
  path: string,
  pageOverride?: ServicePageContent | null,
) {
  const page = pageOverride ?? getServicePage(path);
  if (!page) return null;
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: page.serviceName,
    description: page.description,
    provider: { '@id': STUDIO_ID },
    areaServed: buildAreaServed(),
    url,
  };
}

export function buildPackageCategoryJsonLd(
  path: string,
  pageOverride?: PackagePageContent | null,
) {
  const page = pageOverride ?? getPackagePage(path);
  if (!page) return null;
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#package-category`,
    name: page.serviceName,
    description: page.description,
    provider: { '@id': STUDIO_ID },
    areaServed: buildAreaServed(),
    url,
  };
}

export function buildBreadcrumbJsonLd(
  seo: PageSeo,
  extras?: Array<{ name: string; path: string }>,
) {
  const url = absoluteUrl(seo.path);
  const name = seo.heading || seo.title.split('|')[0].trim() || seo.title;
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    ...(extras ?? []).map((extra, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: extra.name,
      item: absoluteUrl(extra.path),
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

export function buildFaqPageJsonLd(faqs: FaqItem[] = SITE_FAQS) {
  if (!faqs.length) return null;
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

export function applyPageSeo(
  seo: PageSeo,
  options?: {
    contact?: { phone?: string; email?: string; socials?: Record<string, string> };
    faqs?: FaqItem[];
    /** CMS-resolved package landing when JSON has no entry. */
    packagePage?: PackagePageContent | null;
    /** CMS-resolved service landing when JSON has no entry / SEO overlay. */
    servicePage?: ServicePageContent | null;
  },
) {
  const url = absoluteUrl(seo.path);
  const image = seo.image || DEFAULT_OG_IMAGE;
  const type = seo.type || 'website';
  const isHome = !seo.path || seo.path === '/';
  const isBooking = seo.path === '/booking';
  const servicePage = options?.servicePage ?? getServicePage(seo.path);
  const packagePage = options?.packagePage ?? getPackagePage(seo.path);
  const isService = Boolean(servicePage);
  const isPackageCategory = Boolean(packagePage);

  document.title = seo.title;

  upsertMeta('name', 'description', seo.description);
  upsertMeta(
    'name',
    'robots',
    seo.noindex ? 'noindex, nofollow' : 'index, follow',
  );

  upsertMeta('property', 'og:title', seo.title);
  upsertMeta('property', 'og:description', seo.description);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:locale', 'en_IN');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', seo.title);
  upsertMeta('name', 'twitter:description', seo.description);
  upsertMeta('name', 'twitter:image', image);

  upsertLink('canonical', url);

  upsertJsonLd('seo-jsonld-business', buildLocalBusinessJsonLd(options?.contact));

  upsertJsonLd('seo-jsonld-webpage', {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: seo.title,
    description: seo.description,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: { '@id': STUDIO_ID },
  });

  if (!isHome && !seo.noindex) {
    const breadcrumbExtras = isService
      ? [{ name: 'Services', path: '/services' }]
      : isPackageCategory
        ? [{ name: 'Packages', path: '/packages' }]
        : undefined;
    upsertJsonLd(
      'seo-jsonld-breadcrumb',
      buildBreadcrumbJsonLd(seo, breadcrumbExtras),
    );
  } else {
    removeJsonLd('seo-jsonld-breadcrumb');
  }

  const serviceLd = buildServiceJsonLd(seo.path, options?.servicePage ?? null);
  const packageLd = buildPackageCategoryJsonLd(
    seo.path,
    options?.packagePage ?? null,
  );
  if (serviceLd && !seo.noindex) {
    upsertJsonLd('seo-jsonld-service', serviceLd);
  } else if (packageLd && !seo.noindex) {
    upsertJsonLd('seo-jsonld-service', packageLd);
  } else {
    removeJsonLd('seo-jsonld-service');
  }

  const faqs =
    options?.faqs ??
    (isService && servicePage
      ? servicePage.faqs
      : isPackageCategory && packagePage
        ? packagePage.faqs
        : isBooking
          ? SITE_FAQS
          : null);
  if (faqs?.length && !seo.noindex) {
    const faqLd = buildFaqPageJsonLd(faqs);
    if (faqLd) upsertJsonLd('seo-jsonld-faq', faqLd);
    else removeJsonLd('seo-jsonld-faq');
  } else {
    removeJsonLd('seo-jsonld-faq');
  }
}
