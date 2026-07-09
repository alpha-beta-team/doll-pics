import seoPages from '../data/seo-pages.json';

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL as string | undefined
)?.replace(/\/$/, '') || 'https://dollpictures.in';

export const SITE_NAME = seoPages.siteName;
export const SITE_TAGLINE = seoPages.tagline;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-share.jpg`;
export const SITE_LOGO = `${SITE_URL}/logo-doll.png`;

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

export const PAGE_SEO: Record<string, PageSeo> = Object.fromEntries(
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
);

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

export function buildLocalBusinessJsonLd(contact?: {
  phone?: string;
  email?: string;
  socials?: Record<string, string>;
}) {
  const sameAs = Object.values(contact?.socials ?? {}).filter(Boolean);
  const { address, geo } = seoPages;

  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    alternateName: seoPages.brandByline,
    description: seoPages.defaultDescription,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    logo: SITE_LOGO,
    telephone: contact?.phone || undefined,
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
    areaServed: [
      { '@type': 'City', name: address.addressLocality },
      { '@type': 'State', name: address.addressRegion },
      { '@type': 'Country', name: address.addressCountry },
    ],
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function applyPageSeo(
  seo: PageSeo,
  options?: {
    contact?: { phone?: string; email?: string; socials?: Record<string, string> };
  },
) {
  const url = absoluteUrl(seo.path);
  const image = seo.image || DEFAULT_OG_IMAGE;
  const type = seo.type || 'website';

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
    about: { '@id': `${SITE_URL}/#business` },
  });
}
