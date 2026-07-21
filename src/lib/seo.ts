/**
 * Runtime SEO — DOM apply + thin wrappers over shared seo-core.
 */
import seoPages from '../data/seo-pages.json';
import servicePages from '../data/service-pages.json';
import packagePages from '../data/package-pages.json';
import {
  absoluteUrl as absoluteUrlCore,
  buildBreadcrumbJsonLd as buildBreadcrumbJsonLdCore,
  buildFaqPageJsonLd as buildFaqPageJsonLdCore,
  buildLocalBusinessJsonLd as buildLocalBusinessJsonLdCore,
  buildPackageCategoryJsonLd as buildPackageCategoryJsonLdCore,
  buildServiceJsonLd as buildServiceJsonLdCore,
  normalizePathname,
  resolvePackagePage as resolvePackagePageCore,
  resolveServicePage as resolveServicePageCore,
  type FaqItem,
  type PackageNavLinkLike,
  type PackagePageContent,
  type PageSeo,
  type SeoPagesData,
  type ServiceNavLinkLike,
  type ServicePageContent,
} from './seo-core';

export type {
  FaqItem,
  PackagePageContent,
  PageSeo,
  ServicePageContent,
} from './seo-core';

const seoData = seoPages as SeoPagesData;

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL as string | undefined
)?.replace(/\/$/, '') || 'https://dollpictures.in';

export const SITE_NAME = seoData.siteName;
export const SITE_TAGLINE = seoPages.tagline;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-share.jpg`;
export const SITE_LOGO = `${SITE_URL}/logo-doll.png`;
export const STUDIO_ID = `${SITE_URL}/#studio`;

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
  const normalized = normalizePathname(pathname);
  return (
    PAGE_SEO[normalized] ?? {
      path: normalized || '/',
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: seoPages.defaultDescription,
    }
  );
}

export function getServicePage(pathname: string) {
  const normalized = normalizePathname(pathname);
  return servicePages[normalized as keyof typeof servicePages] ?? null;
}

export function getPackagePage(pathname: string) {
  const normalized = normalizePathname(pathname);
  return packagePages[normalized as keyof typeof packagePages] ?? null;
}

export function resolveServicePage(
  pathname: string,
  nav?: ServiceNavLinkLike | null,
): ServicePageContent | null {
  return resolveServicePageCore(pathname, getServicePage(pathname), nav);
}

export function resolvePackagePage(
  pathname: string,
  nav?: PackageNavLinkLike | null,
): PackagePageContent | null {
  return resolvePackagePageCore(pathname, getPackagePage(pathname), nav);
}

export function absoluteUrl(path: string): string {
  return absoluteUrlCore(SITE_URL, path);
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

export function buildLocalBusinessJsonLd(contact?: {
  phone?: string;
  email?: string;
  socials?: Record<string, string>;
}) {
  return buildLocalBusinessJsonLdCore(SITE_URL, seoData, contact);
}

export function buildServiceJsonLd(
  path: string,
  pageOverride?: ServicePageContent | null,
) {
  const page = pageOverride ?? getServicePage(path);
  if (!page) return null;
  return buildServiceJsonLdCore(SITE_URL, seoData, path, {
    serviceName: page.serviceName,
    description: page.description,
  });
}

export function buildPackageCategoryJsonLd(
  path: string,
  pageOverride?: PackagePageContent | null,
) {
  const page = pageOverride ?? getPackagePage(path);
  if (!page) return null;
  return buildPackageCategoryJsonLdCore(SITE_URL, seoData, path, {
    serviceName: page.serviceName,
    description: page.description,
  });
}

export function buildBreadcrumbJsonLd(
  seo: PageSeo,
  extras?: Array<{ name: string; path: string }>,
) {
  return buildBreadcrumbJsonLdCore(SITE_URL, seo, extras);
}

export function buildFaqPageJsonLd(faqs: FaqItem[] = SITE_FAQS) {
  return buildFaqPageJsonLdCore(faqs);
}

export function applyPageSeo(
  seo: PageSeo,
  options?: {
    contact?: {
      phone?: string;
      email?: string;
      socials?: Record<string, string>;
    };
    faqs?: FaqItem[];
    packagePage?: PackagePageContent | null;
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

  upsertJsonLd(
    'seo-jsonld-business',
    buildLocalBusinessJsonLd(options?.contact),
  );

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
