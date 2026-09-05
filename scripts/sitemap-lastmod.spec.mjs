import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemapXml } from './lib/sitemap.mjs';
test('only reliable route dates reach static sitemap XML', () => {
  const dates = { '/a': '2026-01-01T00:00:00Z', '/bad': 'invalid', '/future': '2999-01-01' };
  const paths = ['/a', '/b', '/bad', '/future'];
  const xml = buildSitemapXml('https://dollpictures.in', paths, dates);
  assert.equal(xml, buildSitemapXml('https://dollpictures.in', paths, dates));
  assert.equal((xml.match(/<lastmod>/g) || []).length, 1);
  assert.match(xml, /<lastmod>2026-01-01T00:00:00.000Z<\/lastmod>/);
});
