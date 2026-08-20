import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemapXml } from './lib/sitemap.mjs';

test('builds a canonical, deduplicated static sitemap', () => {
  const xml = buildSitemapXml('https://dollpictures.in/', [
    '/',
    '/work/',
    '/work',
    'invalid',
  ]);

  assert.match(xml, /<loc>https:\/\/dollpictures\.in<\/loc>/);
  assert.match(xml, /<loc>https:\/\/dollpictures\.in\/work<\/loc>/);
  assert.equal((xml.match(/\/work<\/loc>/g) ?? []).length, 1);
  assert.doesNotMatch(xml, /invalid/);
});
