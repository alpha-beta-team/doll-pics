import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvFiles, root } from './lib/env.mjs';
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildBusinessJsonLd,
  buildFaqPageJsonLd,
  buildPageCatalog,
  buildServiceOrPackageJsonLd,
  buildWebPageJsonLd,
  getSiteUrl,
  loadCmsOverlays,
  loadStaticSeoData,
} from './lib/seo-shared.mjs';

loadEnvFiles();

const distDir = join(root, 'dist');
const siteUrl = getSiteUrl();
const ogImage = `${siteUrl}/og-share.jpg`;

const { seoPages, servicePages, packagePages } = loadStaticSeoData();
const { packagesByPath, servicesByPath, apiBase } = await loadCmsOverlays();
const pages = buildPageCatalog({
  seoPages,
  servicePages,
  packagePages,
  packagesByPath,
  servicesByPath,
});

const siteName = seoPages.siteName;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function injectRouteHtml(template, page) {
  const path = page.path;
  const url = absoluteUrl(siteUrl, path);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const heading = escapeHtml(page.heading);
  const body = escapeHtml(page.body);
  const isService = page.kind === 'service';
  const isPackage = page.kind === 'package';

  const businessJson = JSON.stringify(buildBusinessJsonLd(siteUrl, seoPages));
  const webpageJson = JSON.stringify(
    buildWebPageJsonLd(siteUrl, { ...page, siteName }, url),
  );
  const extraScripts = [];

  if (path !== '/') {
    extraScripts.push(
      `<script type="application/ld+json" id="seo-jsonld-breadcrumb">${JSON.stringify(buildBreadcrumbJsonLd(siteUrl, page, url))}</script>`,
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
        ? seoPages.faqs ?? []
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

  // Remove any existing JSON-LD (with or without id attrs), then inject the route block.
  html = html.replace(
    /\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
    '',
  );
  html = html.replace(
    '</head>',
    `    ${jsonLdBlock}\n  </head>`,
  );

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

  const noscript = [
    '<noscript>',
    '  <main style="font-family:Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1.25rem;line-height:1.6;color:#111">',
    `    <h1>${heading}</h1>`,
    leadNoscript,
    `    <p>${body}</p>`,
    ...imageNoscript,
    ...sectionNoscript,
    ...faqNoscript,
    `    <p><a href="${siteUrl}/">${escapeHtml(siteName)}</a> · Erode, Tamil Nadu</p>`,
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

for (const page of Object.values(pages)) {
  if (!page?.path) continue;
  const html = injectRouteHtml(template, page);
  written.push(writeRoute(page.path, html));
}

const notFoundHtml = inject404Html(template);
const notFoundFile = join(distDir, '404.html');
writeFileSync(notFoundFile, notFoundHtml);
written.push(notFoundFile);

const apiNote = apiBase
  ? ` (CMS overlays: ${packagesByPath.size} packages, ${servicesByPath.size} services)`
  : ' (static JSON only — set VITE_API_URL for CMS SEO overlays)';

console.log(`Prerendered ${written.length} files for ${siteUrl}${apiNote}`);
for (const file of written) {
  console.log(`  ${file.replace(root + '/', '')}`);
}
