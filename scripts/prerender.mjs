import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const siteUrl = (
  process.env.VITE_SITE_URL || 'https://dollpictures.in'
).replace(/\/$/, '');

const seoPages = JSON.parse(
  readFileSync(join(root, 'src/data/seo-pages.json'), 'utf8'),
);

const ogImage = `${siteUrl}/og-share.jpg`;
const siteLogo = `${siteUrl}/logo-doll.png`;
const { address, geo, siteName, brandByline, defaultDescription, pages } =
  seoPages;

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

function buildBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    '@id': `${siteUrl}/#business`,
    name: siteName,
    alternateName: brandByline,
    url: siteUrl,
    image: ogImage,
    logo: siteLogo,
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
    areaServed: [
      { '@type': 'City', name: address.addressLocality },
      { '@type': 'State', name: address.addressRegion },
      { '@type': 'Country', name: address.addressCountry },
    ],
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
    about: { '@id': `${siteUrl}/#business` },
  };
}

function injectRouteHtml(template, path, page) {
  const url = absoluteUrl(path);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const heading = escapeHtml(page.heading);
  const body = escapeHtml(page.body);
  const businessJson = JSON.stringify(buildBusinessJsonLd());
  const webpageJson = JSON.stringify(buildWebPageJsonLd(page, url));

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

  // Replace the static business JSON-LD block from index.html
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="seo-jsonld-business">${businessJson}</script>\n    <script type="application/ld+json" id="seo-jsonld-webpage">${webpageJson}</script>`,
  );

  const noscript = [
    '<noscript>',
    '  <main style="font-family:Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1.25rem;line-height:1.6;color:#111">',
    `    <h1>${heading}</h1>`,
    `    <p>${body}</p>`,
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

const template = readFileSync(join(distDir, 'index.html'), 'utf8');
const written = [];

for (const [path, page] of Object.entries(pages)) {
  const html = injectRouteHtml(template, path, page);
  written.push(writeRoute(path, html));
}

console.log(`Prerendered ${written.length} routes for ${siteUrl}`);
for (const file of written) {
  console.log(`  ${file.replace(root + '/', '')}`);
}
