import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const siteUrl = (
  process.env.VITE_SITE_URL || 'https://dollpictures.in'
).replace(/\/$/, '');
const studioId = `${siteUrl}/#studio`;

const seoPages = JSON.parse(
  readFileSync(join(root, 'src/data/seo-pages.json'), 'utf8'),
);
const servicePages = JSON.parse(
  readFileSync(join(root, 'src/data/service-pages.json'), 'utf8'),
);
const packagePages = JSON.parse(
  readFileSync(join(root, 'src/data/package-pages.json'), 'utf8'),
);

const ogImage = `${siteUrl}/og-share.jpg`;
const siteLogo = `${siteUrl}/logo-doll.png`;
const {
  address,
  geo,
  siteName,
  businessName,
  brandByline,
  telephone,
  sameAs,
  defaultDescription,
  pages: basePages,
  serviceAreas,
  offerCatalog,
} = seoPages;

const pages = {
  ...basePages,
  ...Object.fromEntries(
    Object.entries(servicePages).map(([path, page]) => [
      path,
      {
        title: page.title,
        description: page.description,
        heading: page.heading,
        body: page.body,
      },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(packagePages).map(([path, page]) => [
      path,
      {
        title: page.title,
        description: page.description,
        heading: page.heading,
        body: page.body,
      },
    ]),
  ),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function absoluteUrl(path) {
  if (!path || path === '/') return siteUrl;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildAreaServed() {
  const cities = serviceAreas ?? [address.addressLocality];
  return [
    ...cities.map((name) => ({ '@type': 'City', name })),
    { '@type': 'State', name: address.addressRegion },
    { '@type': 'Country', name: address.addressCountry },
  ];
}

function buildOfferCatalog() {
  const items = offerCatalog ?? [];
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

function buildBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    '@id': studioId,
    name: businessName || brandByline,
    alternateName: siteName,
    url: siteUrl,
    image: ogImage,
    logo: siteLogo,
    telephone: telephone || undefined,
    description: defaultDescription,
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
    hasOfferCatalog: buildOfferCatalog(),
    sameAs: sameAs?.length ? sameAs : undefined,
  };
}

function buildWebPageJsonLd(page, url) {
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
      name: siteName,
      url: siteUrl,
    },
    about: { '@id': studioId },
  };
}

function buildBreadcrumbJsonLd(page, url, isService) {
  const name = page.heading || page.title.split('|')[0].trim() || page.title;
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
  ];
  if (isService) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Services',
      item: absoluteUrl('/services'),
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

function buildFaqPageJsonLd(faqs) {
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

function buildServiceJsonLd(path, servicePage) {
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: servicePage.serviceName,
    description: servicePage.description,
    provider: { '@id': studioId },
    areaServed: buildAreaServed(),
    url,
  };
}

function injectRouteHtml(template, path, page) {
  const url = absoluteUrl(path);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const heading = escapeHtml(page.heading);
  const body = escapeHtml(page.body);
  const servicePage = servicePages[path] ?? null;
  const isService = Boolean(servicePage);
  const businessJson = JSON.stringify(buildBusinessJsonLd());
  const webpageJson = JSON.stringify(buildWebPageJsonLd(page, url));
  const extraScripts = [];

  if (path !== '/') {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-breadcrumb">${JSON.stringify(buildBreadcrumbJsonLd(page, url, isService))}</script>`,
    );
  }

  if (isService) {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-service">${JSON.stringify(buildServiceJsonLd(path, servicePage))}</script>`,
    );
    const faqLd = buildFaqPageJsonLd(servicePage.faqs);
    if (faqLd) {
      extraScripts.push(
        `<script type="application/ld+json" id="seo-jsonld-faq">${JSON.stringify(faqLd)}</script>`,
      );
    }
  } else if (path === '/booking') {
    const faqLd = buildFaqPageJsonLd(seoPages.faqs);
    if (faqLd) {
      extraScripts.push(
        `<script type="application/ld+json" id="seo-jsonld-faq">${JSON.stringify(faqLd)}</script>`,
      );
    }
  }

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);

  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
  );

  const replacements = [
    ['og:title', title],
    ['og:description', description],
    ['og:url', url],
    ['og:image', ogImage],
    ['twitter:title', title],
    ['twitter:description', description],
    ['twitter:image', ogImage],
  ];

  for (const [key, value] of replacements) {
    const propertyRe = new RegExp(
      `<meta property="${key}" content="[^"]*"\\s*/?>`,
    );
    const nameRe = new RegExp(`<meta name="${key}" content="[^"]*"\\s*/?>`);
    if (propertyRe.test(html)) {
      html = html.replace(
        propertyRe,
        `<meta property="${key}" content="${value}" />`,
      );
    } else if (nameRe.test(html)) {
      html = html.replace(nameRe, `<meta name="${key}" content="${value}" />`);
    }
  }

  // Hero image preload is only useful on the homepage.
  if (path !== '/') {
    html = html.replace(
      /\s*<link\s+rel="preload"\s+as="image"\s+href="[^"]*"\s+fetchpriority="high"\s*\/?>/i,
      '',
    );
  }

  if (/<link rel="canonical" href="[^"]*"\s*\/?>/.test(html)) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${url}" />`,
    );
  } else {
    html = html.replace(
      '</head>',
      `    <link rel="canonical" href="${url}" />\n  </head>`,
    );
  }

  const jsonLdBlock = [
    `<script type="application/ld+json" id="seo-jsonld-business">${businessJson}</script>`,
    `<script type="application/ld+json" id="seo-jsonld-webpage">${webpageJson}</script>`,
    ...extraScripts,
  ].join('\n    ');

  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    jsonLdBlock,
  );

  const faqsForNoscript = isService
    ? servicePage.faqs
    : path === '/booking'
      ? seoPages.faqs ?? []
      : [];

  const faqNoscript = faqsForNoscript.length
    ? [
        '    <section>',
        '      <h2>Frequently asked questions</h2>',
        ...faqsForNoscript.flatMap((faq) => [
          `      <h3>${escapeHtml(faq.question)}</h3>`,
          `      <p>${escapeHtml(faq.answer)}</p>`,
        ]),
        '    </section>',
      ]
    : [];

  const sectionNoscript =
    isService && servicePage.sections
      ? servicePage.sections.flatMap((section) => [
          `    <section>`,
          `      <h2>${escapeHtml(section.heading)}</h2>`,
          ...section.paragraphs.map((p) => `      <p>${escapeHtml(p)}</p>`),
          `    </section>`,
        ])
      : [];

  const imageNoscript =
    isService && servicePage.fallbackImages?.length
      ? [
          '    <section>',
          '      <h2>Selected work</h2>',
          ...servicePage.fallbackImages.slice(0, 6).map(
            (image) =>
              `      <p><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="800" height="1000" loading="lazy" /></p>`,
          ),
          '    </section>',
        ]
      : [];

  const noscript = [
    '<noscript>',
    '  <main style="font-family:Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1.25rem;line-height:1.6;color:#111">',
    `    <h1>${heading}</h1>`,
    `    <p>${body}</p>`,
    ...imageNoscript,
    ...sectionNoscript,
    ...faqNoscript,
    `    <p><a href="${siteUrl}/">${escapeHtml(siteName)}</a> · Erode, Tamil Nadu</p>`,
    '  </main>',
    '</noscript>',
  ].join('\n');

  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"></div>\n    ${noscript}`,
  );

  return html;
}

function writeRoute(path, html) {
  if (path === '/') {
    writeFileSync(join(distDir, 'index.html'), html);
    return join(distDir, 'index.html');
  }

  const dir = join(distDir, path.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'index.html');
  writeFileSync(file, html);
  return file;
}

function inject404Html(template) {
  const title = escapeHtml('Page Not Found — DOLL PICTURES');
  const description = escapeHtml(
    'This page could not be found. Return to DOLL PICTURES for cinematic wedding and portrait photography in Erode.',
  );
  const heading = escapeHtml('Page not found');
  const body = escapeHtml(
    'The page you are looking for does not exist or has been moved.',
  );

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
  );
  html = html.replace(
    /<meta name="robots" content="[^"]*"\s*\/?>/,
    '<meta name="robots" content="noindex, nofollow" />',
  );

  if (!/<meta name="robots"/.test(html)) {
    html = html.replace(
      '</head>',
      '    <meta name="robots" content="noindex, nofollow" />\n  </head>',
    );
  }

  const noscript = [
    '<noscript>',
    '  <main style="font-family:Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1.25rem;line-height:1.6;color:#111">',
    `    <h1>${heading}</h1>`,
    `    <p>${body}</p>`,
    `    <p><a href="${siteUrl}/">${escapeHtml(siteName)}</a></p>`,
    '  </main>',
    '</noscript>',
  ].join('\n');

  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"></div>\n    ${noscript}`,
  );

  return html;
}

const template = readFileSync(join(distDir, 'index.html'), 'utf8');
const written = [];

for (const [path, page] of Object.entries(pages)) {
  const html = injectRouteHtml(template, path, page);
  written.push(writeRoute(path, html));
}

const notFoundHtml = inject404Html(template);
const notFoundFile = join(distDir, '404.html');
writeFileSync(notFoundFile, notFoundHtml);
written.push(notFoundFile);

console.log(`Prerendered ${written.length} files for ${siteUrl}`);
for (const file of written) {
  console.log(`  ${file.replace(root + '/', '')}`);
}
