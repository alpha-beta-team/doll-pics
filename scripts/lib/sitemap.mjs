function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildSitemapXml(siteUrl, paths) {
  const origin = String(siteUrl).replace(/\/$/, '');
  const normalizedPaths = paths
    .filter((path) => typeof path === 'string' && path.startsWith('/'))
    .map((path) => (path.length > 1 ? path.replace(/\/+$/, '') : path));
  const uniquePaths = [...new Set(normalizedPaths)];

  const urls = uniquePaths.map((path) => {
    const location = path === '/' ? origin : `${origin}${path}`;
    return `  <url>\n    <loc>${escapeXml(location)}</loc>\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
