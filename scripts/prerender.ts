import { PORTFOLIO_PHOTO_LIMIT } from '../src/lib/publicHtmlRoutes';
import { resolveApiServiceCategory } from '../src/lib/serviceCategory';
import { parsePublicSnapshot } from '../src/lib/publicSnapshot';
import { serviceCatalogFromLinks } from '../src/lib/seo-core';
import { removeRetiredCatalogPages } from './lib/catalog-output';
import { PUBLIC_HTML_ROUTES, publicHtmlKind, SERVICE_GALLERY_LIMIT } from '../src/lib/publicHtmlRoutes';
import { serializeInlineJson, shouldRenderPublicPage } from './lib/public-html';
import { createServer } from 'vite';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import postcss, { type Container } from 'postcss';
import { fetchJson, loadEnvFiles, root } from './lib/env.mjs';
import {
  absoluteUrl,
  assertCatalogCoverage,
  assertCatalogMetadata,
  assertCmsReadiness,
  buildBreadcrumbJsonLd,
  buildBusinessJsonLd,
  buildFaqPageJsonLd,
  buildPageCatalog,
  buildServiceOrPackageJsonLd,
  buildWebPageJsonLd,
  getSiteUrl,
  loadCmsOverlays,
  loadStaticSeoData,
} from './lib/seo-build';
import type { CatalogPage } from '../src/lib/seo-core';
import {
  HERO_DEFAULT_WIDTH,
  HERO_QUALITY,
  HERO_SIZES,
  HERO_WIDTHS,
  mediaSrcSet,
  mediaUrl,
} from '../src/lib/images';
import { buildSitemapXml } from './lib/sitemap.mjs';

loadEnvFiles();

const distDir = process.env.PRERENDER_DIST_DIR || join(root, 'dist');
const siteUrl = getSiteUrl();
const ogImage = `${siteUrl}/og-share.jpg`;

const { seoPages, servicePages, packagePages } =
  loadStaticSeoData();
const overlays = await loadCmsOverlays();
const { publicCatalog, packagesByPath, servicesByPath, lastmodByPath, apiBase, siteContent, packageCategories } = overlays;
if (String(process.env.SEO_REQUIRE_CMS ?? '').toLowerCase() === 'true') assertCmsReadiness(overlays);

let buildHeroSlides: unknown[] | undefined;
async function loadFirstHeroImage() {
  if (!apiBase) return '';
  try {
    const slides = await fetchJson(`${apiBase}/hero-slides`);
    if (!Array.isArray(slides)) return '';
    buildHeroSlides = slides;
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
const serviceCatalog = serviceCatalogFromLinks(publicCatalog.serviceLinks);
const pages = buildPageCatalog({
  seoPages,
  servicePages,
  packagePages,
  publicCatalog,
});

if (String(process.env.SEO_REQUIRE_CMS ?? '').toLowerCase() === 'true') {
  assertCatalogCoverage(pages, publicCatalog.paths);
}

assertCatalogMetadata(pages);

const siteName = seoPages.siteName;

// Parsed as CSS only when scripting is disabled; React and the LCP poster keep
// their existing presentation when JavaScript is enabled.
const fallbackStyle = `<style>
  body{background:#fff;color:#111}
  #home-hero-poster{display:none!important}
  .public-fallback{box-sizing:border-box;max-width:48rem;margin:0 auto;padding:2rem 1.25rem 3rem;background:#fff;color:#111;color-scheme:light;font:1rem/1.65 Georgia,serif;overflow-wrap:anywhere;cursor:auto;user-select:text}
  .public-fallback h1{font-size:clamp(2rem,6vw,3rem);line-height:1.2;font-weight:700;margin:0 0 1.25rem}
  .public-fallback h2{font-size:1.5rem;line-height:1.3;font-weight:700;margin:2rem 0 .75rem}
  .public-fallback p,.public-fallback ul{margin:.75rem 0}
  .public-fallback ul{padding-left:1.5rem;list-style:disc}
  .public-fallback li{margin:.5rem 0}
  .public-fallback a{color:#174ea6;text-decoration:underline;text-underline-offset:.15em;font-weight:600}
  .public-fallback a:visited{color:#633394}
  .public-fallback a:focus-visible{outline:3px solid #174ea6;outline-offset:4px;border-radius:2px}
  .public-fallback img{display:block;max-width:100%;height:auto;margin:1rem 0}
  .public-fallback ::selection{color:#fff;background:#174ea6}
</style>`;

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

  const businessJson = serializeInlineJson(
    buildBusinessJsonLd(siteUrl, seoPages, { services: serviceCatalog }),
  );
  const webpageJson = serializeInlineJson(
    buildWebPageJsonLd(siteUrl, { ...page, siteName }, url),
  );
  const extraScripts: string[] = [];

  if (path !== '/') {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-breadcrumb">${serializeInlineJson(buildBreadcrumbJsonLd(siteUrl, page))}</script>`,
    );
  }

  const serviceLd = buildServiceOrPackageJsonLd(siteUrl, page, seoPages);
  if (serviceLd) {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-service">${serializeInlineJson(serviceLd)}</script>`,
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
      `<script type="application/ld+json" id="seo-jsonld-faq">${serializeInlineJson(faqLd)}</script>`,
    );
  }

  let html = template.replace(/<meta name="robots"[^>]*>/g, '<meta name="robots" content="index, follow" />');

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
      mediaUrl(firstHeroImage, HERO_DEFAULT_WIDTH, 'webp', HERO_QUALITY),
    );
    const source = escapeHtml(firstHeroImage);
    const srcSet = escapeHtml(
      mediaSrcSet(
        firstHeroImage,
        [...HERO_WIDTHS],
        'webp',
        HERO_QUALITY,
      ) || '',
    );
    const responsiveAttributes = srcSet
      ? ` imagesrcset="${srcSet}" imagesizes="${HERO_SIZES}"`
      : '';
    html = html.replace(
      '</head>',
      [
        `    <link rel="preload" as="image" href="${href}"${responsiveAttributes} fetchpriority="high" data-home-hero-source="${source}" />`,
        '    <style id="home-hero-poster-style">',
        '      #home-hero-poster{position:absolute;z-index:1;inset:0 0 auto;width:100%;height:max(760px,100svh);overflow:hidden;pointer-events:none;background:#090908}',
        '      #home-hero-poster picture,#home-hero-poster img{display:block;width:100%;height:100%}',
        '      #home-hero-poster img{object-fit:cover;object-position:center}',
        '      #home-hero-poster:before,#home-hero-poster:after{content:"";position:absolute;inset:0}',
        '      #home-hero-poster:before{background:linear-gradient(90deg,rgba(6,6,5,.92) 0%,rgba(6,6,5,.66) 42%,rgba(6,6,5,.18) 72%,rgba(6,6,5,.34) 100%)}',
        '      #home-hero-poster:after{background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 34%,rgba(0,0,0,.15) 62%,rgba(0,0,0,.82) 100%)}',
        '    </style>',
        '  </head>',
      ].join('\n'),
    );

    const poster = [
      '    <div id="home-hero-poster" aria-hidden="true">',
      '      <picture>',
      srcSet
        ? `        <source type="image/webp" srcset="${srcSet}" sizes="${HERO_SIZES}" />`
        : '',
      `        <img src="${href}" alt="" width="1920" height="1080" sizes="${HERO_SIZES}" fetchpriority="high" decoding="async" data-home-hero-poster-image />`,
      '      </picture>',
      '    </div>',
      '    <script>if(location.pathname!=="/"){document.getElementById("home-hero-poster")?.remove();document.getElementById("home-hero-poster-style")?.remove();document.querySelectorAll("link[data-home-hero-source]").forEach(function(link){link.remove()})}</script>',
    ]
      .filter(Boolean)
      .join('\n');
    if (!Object.hasOwn(PUBLIC_HTML_ROUTES, page.path)) html = html.replace('<body>', `<body>\n${poster}`);
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
    ...(section.imageUrl ? [
      `      <img src="${escapeHtml(section.imageUrl)}" alt="${escapeHtml(section.imageAlt || section.heading)}" loading="lazy" decoding="async" />`,
    ] : []),
    `    </section>`,
  ]);

  // Seed fallback images have no verified studio authorship or publication consent.
  // CMS-authored section images above remain available in non-rendered pages.
  const imageNoscript: string[] = [];

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
    fallbackStyle,
    '  <main class="public-fallback">',
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

  // The base template is a public homepage. An error document must not inherit
  // its canonical, social card or structured-data identity.
  let html = template
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*(?:name|property)=["'](?:og:|twitter:)[^"']*["'])[^>]*>/gi, '')
    .replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '');
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
    fallbackStyle,
    '  <main class="public-fallback">',
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

const baseTemplate = splitAdminStyles(
  readFileSync(join(distDir, existsSync(join(distDir, 'app-shell.html')) ? 'app-shell.html' : 'index.html'), 'utf8'),
);
// Share the CMS overlays and one Vite instance across the registered services.
// Replace a previous seed when standalone prerender reuses the output directory.
const template = baseTemplate.replace(/<script id="public-route-catalog"[^>]*>[\s\S]*?<\/script>/g, '')
  .replace('</body>', () => `<script id="public-route-catalog" type="application/json">${serializeInlineJson(publicCatalog)}</script></body>`);

const privateShell = baseTemplate
  .replace(/<meta name="robots"[^>]*>/g, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
  .replace(/<meta\b(?=[^>]*(?:property=["']og:|name=["']twitter:))[^>]*>/gi, '')
  .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
writeFileSync(join(distDir, 'app-shell.html'), privateShell);

const rendered = new Map<string, { html: string; snapshot: unknown }>();
const renderPaths = publicCatalog.paths
  .filter(path => pages[path] && shouldRenderPublicPage(path, publicCatalog));
if (renderPaths.length) {
  const loadOptional = async (path: string) => {
    if (!apiBase) return undefined;
    try { return await fetchJson(`${apiBase}${path}`); }
    catch { console.warn(`Public HTML: optional media unavailable for ${path}`); return undefined; }
  };
  const server = await createServer({ cacheDir: join(root, 'node_modules/.vite-prerender'), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { renderPublicPage } = await server.ssrLoadModule('/src/entry-public-server.tsx');
    for (const path of renderPaths) {
      const packagePage = publicHtmlKind(path, publicCatalog) === 'package';
      const category = packagePage ? publicCatalog.packageLinks.find(link => link.path === path)?.categorySlug : resolveApiServiceCategory(path, publicCatalog.serviceLinks.find(link => link.path === path)?.label);
      const [cover, photos, hero, featured, gallery, offers, portfolio] = await Promise.all([
        category ? loadOptional(`/categories/${category}`) : undefined,
        category ? loadOptional(`/photos?category=${category}&limit=${SERVICE_GALLERY_LIMIT}`) : undefined,
        path === '/' ? buildHeroSlides : undefined,
        ['/', '/work'].includes(path) ? loadOptional('/photos?featured=true') : undefined,
        path === '/' ? loadOptional('/photos?limit=24') : undefined,
        packagePage ? loadOptional('/packages') : undefined,
        path === '/gallery' ? loadOptional(`/photos?limit=${PORTFOLIO_PHOTO_LIMIT}`) : undefined,
      ]);
      if (packagePage && String(process.env.SEO_REQUIRE_CMS).toLowerCase() === 'true' && !Array.isArray(offers)) throw new Error(`CMS packages unavailable for ${path}`);
      if (path === '/gallery' && String(process.env.SEO_REQUIRE_CMS).toLowerCase() === 'true' && !Array.isArray(portfolio)) throw new Error('CMS gallery photos unavailable for /gallery');
      if (path === '/work' && String(process.env.SEO_REQUIRE_CMS).toLowerCase() === 'true' && !Array.isArray(featured)) throw new Error('CMS featured photos unavailable for /work');
      rendered.set(path, await renderPublicPage({ path, siteContent, publicCatalog, categories: packageCategories,
        cover: cover && typeof cover === 'object' && !Array.isArray(cover) ? cover : undefined,
        photos: Array.isArray(photos) ? photos : undefined,
        offers: Array.isArray(offers) ? offers : undefined,
        portfolio: Array.isArray(portfolio) ? portfolio : undefined,
        home: path === '/' ? { hero: Array.isArray(hero) ? hero : undefined, featured: Array.isArray(featured) ? featured : undefined, gallery: Array.isArray(gallery) ? gallery : undefined } : path === '/work' ? { featured: Array.isArray(featured) ? featured : undefined } : undefined }));
    }
  } finally { await server.close(); }
}

const written: string[] = [];
const htmlSha256: Record<string, string> = {};
removeRetiredCatalogPages(distDir, publicCatalog.paths);

for (const page of Object.values(pages)) {
  if (!page?.path) continue;
  let html = injectRouteHtml(template, page);
  const service = rendered.get(page.path);
  if (service) {
    if (page.path === '/') html = html.replace(/<div id="home-hero-poster"[\s\S]*?<\/picture><\/div>/g, '').replace(/<style id="home-hero-poster-style">[\s\S]*?<\/style>/g, '');
    if (page.path === '/gallery') html = html.replace('</head>', '<style>[data-public-html="/gallery"] #gallery img{opacity:1}[data-public-html="/gallery"] [data-gallery-placeholder]{display:none}</style></head>');
    if (page.path === '/work') html = html.replace('</head>', '<style>[data-public-html="/work"] #work .reveal,[data-public-html="/work"] #work .reveal-blur{opacity:1;transform:none;filter:none}</style></head>');
    const serialized = serializeInlineJson(service.snapshot);
    if (!parsePublicSnapshot(serialized, page.path)) throw new Error(`Invalid public snapshot for ${page.path}`);
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    html = html.replace('<div id="root"></div>', () => `<div id="root" data-public-html="${page.path}">${service.html}</div><script id="public-page-snapshot" type="application/json">${serialized}</script>`);
    // Server-rendered gallery content must be visible without observer JavaScript.
    html = html.replace('</head>', '<style>[data-public-html] .services-editorial .reveal,[data-public-html] .services-editorial .reveal-blur,[data-public-html] .packages-editorial .reveal,[data-public-html] .packages-editorial .reveal-blur,[data-public-html] .packages-editorial main a[style],[data-public-html] .packages-editorial main article[style],[data-public-html] .home-reveal,[data-public-html] .hero-copy-enter{opacity:1;transform:none;filter:none;animation:none}</style></head>');
  }
  htmlSha256[page.path] = createHash('sha256').update(html).digest('hex');
  written.push(writeRoute(page.path, html));
}

const notFoundHtml = inject404Html(template);
const notFoundFile = join(distDir, '404.html');
writeFileSync(notFoundFile, notFoundHtml);
written.push(notFoundFile);

const sitemapPaths = Object.values(pages).map((page) => page.path);
let commit: string | undefined;
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch { /* Exported sources may not have Git metadata. */ }
writeFileSync(join(distDir, 'public-catalog.json'), JSON.stringify({
  version: 1,
  sources: Object.fromEntries(Object.entries(publicCatalog.sources).map(([key, source]) => [key, {
    status: source.status, ...(source.reason ? { reason: source.reason } : {}),
    rejectedRecords: source.rejectedRecords ?? 0,
    excludedConflicts: source.records.length - (key === 'services' ? publicCatalog.serviceLinks.length : publicCatalog.packageLinks.length),
  }])),
  paths: sitemapPaths,
  build: { commit: commit ?? null, createdAt: new Date().toISOString(), publicOrigin: siteUrl },
  htmlSha256,
}, null, 2));
const sitemapFile = join(distDir, 'sitemap.xml');
writeFileSync(sitemapFile, buildSitemapXml(siteUrl, sitemapPaths, lastmodByPath));

const apiNote = apiBase
  ? ` (CMS overlays: ${packagesByPath.size} packages, ${servicesByPath.size} services${firstHeroImage ? ', hero preloaded' : ''})`
  : ' (static JSON only — set VITE_API_URL for CMS SEO overlays)';

console.log(`Prerendered ${written.length} files for ${siteUrl}${apiNote}`);
console.log(`Generated dist/sitemap.xml with ${sitemapPaths.length} URLs`);
for (const file of written) {
  console.log(`  ${file.replace(root + '/', '')}`);
}
