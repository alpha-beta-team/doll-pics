import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import postcss, { type Container } from 'postcss';
import { fetchJson, loadEnvFiles, root } from './lib/env.mjs';
import {
  absoluteUrl,
  assertCatalogCoverage,
  buildBreadcrumbJsonLd,
  buildBusinessJsonLd,
  buildFaqPageJsonLd,
  buildPageCatalog,
  buildServiceOrPackageJsonLd,
  buildWebPageJsonLd,
  getSiteUrl,
  loadCmsOverlays,
  loadStaticSeoData,
  resolveServiceCatalog,
} from './lib/seo-build';
import type { CatalogPage } from '../src/lib/seo-core';
import {
  HERO_DEFAULT_WIDTH,
  HERO_SIZES,
  HERO_WIDTHS,
  mediaSrcSet,
  mediaUrl,
} from '../src/lib/images';
import { buildSitemapXml } from './lib/sitemap.mjs';

loadEnvFiles();

const distDir = join(root, 'dist');
const siteUrl = getSiteUrl();
const ogImage = `${siteUrl}/og-share.jpg`;

const { seoPages, servicePages, packagePages, sitemapRoutes } =
  loadStaticSeoData();
const { packagesByPath, servicesByPath, servicesLoaded, apiBase } =
  await loadCmsOverlays();

async function loadFirstHeroImage() {
  if (!apiBase) return '';
  try {
    const slides = await fetchJson(`${apiBase}/hero-slides`);
    if (!Array.isArray(slides)) return '';
    const first = slides.find(
      (slide) =>
        typeof slide?.image === 'string' &&
        slide.image.length > 0 &&
        !['/photos/265722/', '/photos/1024993/', '/photos/1779415/'].some(
          (legacyPath) => slide.image.includes(legacyPath),
        ),
    );
    return typeof first?.image === 'string' ? first.image : '';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('SEO build: hero preload unavailable:', message);
    return '';
  }
}

const firstHeroImage = await loadFirstHeroImage();
const serviceCatalog = resolveServiceCatalog(
  servicePages,
  servicesByPath,
  servicesLoaded,
);
const pages = buildPageCatalog({
  seoPages,
  servicePages,
  packagePages,
  packagesByPath,
  servicesByPath,
});

if (String(process.env.SEO_REQUIRE_CMS ?? '').toLowerCase() === 'true') {
  assertCatalogCoverage(pages, sitemapRoutes);
}

const siteName = seoPages.siteName;

type FallbackLink = { label: string; path: string };

const coreFallbackLinks: FallbackLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Photography services', path: '/services' },
  { label: 'Photography packages', path: '/packages' },
  { label: 'Featured work', path: '/work' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Client stories', path: '/stories' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Book a session', path: '/booking' },
  { label: 'Privacy policy', path: '/privacy' },
  { label: 'Terms of service', path: '/terms' },
];

const serviceFallbackLinks: FallbackLink[] = Object.values(pages)
  .filter((page) => page.kind === 'service')
  .map((page) => ({
    label: page.label || page.heading,
    path: page.path,
  }));

const packageFallbackLinks: FallbackLink[] = Object.values(pages)
  .filter((page) => page.kind === 'package')
  .map((page) => ({
    label: `${page.label || page.heading} packages`,
    path: page.path,
  }));

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function isAdminOnlySelector(selector: string): boolean {
  return (
    selector.includes('.admin-theme') ||
    selector.includes('[data-admin-theme') ||
    selector.includes('admin-') ||
    selector.includes('.ReactCrop') ||
    selector.includes('.reactEasyCrop_')
  );
}

function extractAdminCss(source: string) {
  const publicRoot = postcss.parse(source);
  const adminRoot = postcss.root();

  const extract = (sourceContainer: Container, targetContainer: Container) => {
    for (const node of [...sourceContainer.nodes]) {
      const adminCropVariables =
        node.type === 'rule' &&
        node.selector === ':root' &&
        node.nodes.some(
          (child) => child.type === 'decl' && child.prop.startsWith('--rc-'),
        );
      if (
        node.type === 'rule' &&
        (isAdminOnlySelector(node.selector) || adminCropVariables)
      ) {
        targetContainer.append(node.clone());
        node.remove();
        continue;
      }
      if (node.type !== 'atrule' || !node.nodes) continue;

      const targetAtRule = node.clone({ nodes: [] });
      extract(node, targetAtRule);
      if (targetAtRule.nodes.length > 0) targetContainer.append(targetAtRule);
      if (node.nodes.length === 0) node.remove();
    }
  };

  extract(publicRoot, adminRoot);
  return {
    publicCss: publicRoot.toString(),
    adminCss: adminRoot.toString(),
  };
}

function splitAdminStyles(template: string) {
  const styleMatch = template.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) return template;

  const { publicCss, adminCss } = extractAdminCss(styleMatch[1]);
  if (!adminCss) return template;

  const hash = createHash('sha256').update(adminCss).digest('hex').slice(0, 8);
  const fileName = `admin-theme-${hash}.css`;
  mkdirSync(join(distDir, 'assets'), { recursive: true });
  writeFileSync(join(distDir, 'assets', fileName), adminCss);

  const loader = [
    '<script>',
    "if(location.pathname==='/admin'||location.pathname.startsWith('/admin/')){",
    "var adminCss=document.createElement('link');",
    "adminCss.rel='stylesheet';",
    `adminCss.href='/assets/${fileName}';`,
    'document.head.appendChild(adminCss)',
    '}',
    '</script>',
  ].join('');

  return template.replace(styleMatch[0], `${loader}<style>${publicCss}</style>`);
}

function buildFallbackLinks(page: CatalogPage): FallbackLink[] {
  const contextualLinks =
    page.kind === 'service' || page.path === '/services'
      ? serviceFallbackLinks
      : page.kind === 'package' || page.path === '/packages'
        ? packageFallbackLinks
        : [];
  const links = [...page.related, ...contextualLinks, ...coreFallbackLinks];
  const seen = new Set<string>();

  return links.filter((link) => {
    if (!link.path || link.path === page.path || seen.has(link.path)) {
      return false;
    }
    seen.add(link.path);
    return true;
  });
}

function injectRouteHtml(template: string, page: CatalogPage) {
  const path = page.path;
  const url = absoluteUrl(siteUrl, path);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const heading = escapeHtml(page.heading);
  const body = escapeHtml(page.body);
  const isService = page.kind === 'service';
  const isPackage = page.kind === 'package';

  const businessJson = JSON.stringify(
    buildBusinessJsonLd(siteUrl, seoPages, { services: serviceCatalog }),
  );
  const webpageJson = JSON.stringify(
    buildWebPageJsonLd(siteUrl, { ...page, siteName }, url),
  );
  const extraScripts: string[] = [];

  if (path !== '/') {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-breadcrumb">${JSON.stringify(buildBreadcrumbJsonLd(siteUrl, page))}</script>`,
    );
  }

  const serviceLd = buildServiceOrPackageJsonLd(siteUrl, page, seoPages);
  if (serviceLd) {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-service">${JSON.stringify(serviceLd)}</script>`,
    );
  }

  const faqs =
    isService || isPackage
      ? page.faqs
      : path === '/booking'
        ? (seoPages.faqs ?? [])
        : [];
  const faqLd = buildFaqPageJsonLd(faqs);
  if (faqLd) {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-faq">${JSON.stringify(faqLd)}</script>`,
    );
  }

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);

  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
  );

  const replacements: Array<[string, string]> = [
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

  if (path === '/' && firstHeroImage) {
    const href = escapeHtml(
      mediaUrl(firstHeroImage, HERO_DEFAULT_WIDTH, 'webp'),
    );
    const source = escapeHtml(firstHeroImage);
    const srcSet = escapeHtml(
      mediaSrcSet(firstHeroImage, [...HERO_WIDTHS], 'webp') || '',
    );
    const responsiveAttributes = srcSet
      ? ` imagesrcset="${srcSet}" imagesizes="${HERO_SIZES}"`
      : '';
    html = html.replace(
      '</head>',
      `    <link rel="preload" as="image" href="${href}"${responsiveAttributes} fetchpriority="high" data-home-hero-source="${source}" />\n  </head>`,
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
    /\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
    '',
  );
  html = html.replace('</head>', `    ${jsonLdBlock}\n  </head>`);

  const faqNoscript = faqs.length
    ? [
        '    <section>',
        '      <h2>Frequently asked questions</h2>',
        ...faqs.flatMap((faq) => [
          `      <h3>${escapeHtml(faq.question)}</h3>`,
          `      <p>${escapeHtml(faq.answer)}</p>`,
        ]),
        '    </section>',
      ]
    : [];

  const sectionNoscript = (page.sections ?? []).flatMap((section) => [
    `    <section>`,
    `      <h2>${escapeHtml(section.heading)}</h2>`,
    ...section.paragraphs.map((p) => `      <p>${escapeHtml(p)}</p>`),
    `    </section>`,
  ]);

  const imageNoscript = page.fallbackImages?.length
    ? [
        '    <section>',
        '      <h2>Selected work</h2>',
        ...page.fallbackImages.slice(0, 6).map(
          (image) =>
            `      <p><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" width="800" height="1000" loading="lazy" /></p>`,
        ),
        '    </section>',
      ]
    : [];

  const leadNoscript = page.lead
    ? `    <p>${escapeHtml(page.lead)}</p>`
    : null;

  const fallbackLinks = buildFallbackLinks(page);
  const navigationNoscript = [
    '    <nav aria-label="Site navigation">',
    '      <h2>Explore Doll Pictures</h2>',
    '      <ul>',
    ...fallbackLinks.map(
      (link) =>
        `        <li><a href="${escapeHtml(link.path)}">${escapeHtml(link.label)}</a></li>`,
    ),
    '      </ul>',
    '    </nav>',
  ];

  const noscript = [
    '<noscript>',
    '  <main style="font-family:Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1.25rem;line-height:1.6;color:#111">',
    `    <h1>${heading}</h1>`,
    leadNoscript,
    `    <p>${body}</p>`,
    ...imageNoscript,
    ...sectionNoscript,
    ...faqNoscript,
    ...navigationNoscript,
    `    <p>${escapeHtml(siteName)} · Erode, Tamil Nadu</p>`,
    '  </main>',
    '</noscript>',
  ]
    .filter(Boolean)
    .join('\n');

  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"></div>\n    ${noscript}`,
  );

  return html;
}

function writeRoute(path: string, html: string) {
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

function inject404Html(template: string) {
  const title = escapeHtml('Page Not Found — Doll Pictures');
  const description = escapeHtml(
    'This page could not be found. Return to Doll Pictures for cinematic wedding and portrait photography in Erode.',
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

const template = splitAdminStyles(
  readFileSync(join(distDir, 'index.html'), 'utf8'),
);
const written: string[] = [];

for (const page of Object.values(pages)) {
  if (!page?.path) continue;
  const html = injectRouteHtml(template, page);
  written.push(writeRoute(page.path, html));
}

const notFoundHtml = inject404Html(template);
const notFoundFile = join(distDir, '404.html');
writeFileSync(notFoundFile, notFoundHtml);
written.push(notFoundFile);

const sitemapPaths = Object.values(pages).map((page) => page.path);
const sitemapFile = join(distDir, 'sitemap.xml');
writeFileSync(sitemapFile, buildSitemapXml(siteUrl, sitemapPaths));

const apiNote = apiBase
  ? ` (CMS overlays: ${packagesByPath.size} packages, ${servicesByPath.size} services${firstHeroImage ? ', hero preloaded' : ''})`
  : ' (static JSON only — set VITE_API_URL for CMS SEO overlays)';

console.log(`Prerendered ${written.length} files for ${siteUrl}${apiNote}`);
console.log(`Generated dist/sitemap.xml with ${sitemapPaths.length} URLs`);
for (const file of written) {
  console.log(`  ${file.replace(root + '/', '')}`);
}
