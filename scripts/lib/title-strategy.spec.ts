import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCatalogMetadata, buildPageCatalog, loadStaticSeoData } from './seo-build';

function catalog() {
  return buildPageCatalog({ ...loadStaticSeoData(), packagesByPath: new Map(), servicesByPath: new Map() });
}

test('static catalog has unique metadata and concise brand suffixes', () => {
  const pages = catalog();
  assertCatalogMetadata(pages);
  for (const page of Object.values(pages)) assert.ok(page.title.endsWith(' | Doll Pictures'));
  assert.equal(pages['/'].title, 'Wedding & Baby Photography in Erode | Doll Pictures');
});

test('metadata validation catches duplicate and empty CMS overlay metadata', () => {
  const pages = catalog();
  pages['/cms-only'] = { ...pages['/'], path: '/cms-only' };
  assert.throws(() => assertCatalogMetadata(pages), /duplicate title/);
  pages['/cms-only'].title = 'Custom Photography | Doll Pictures';
  assert.throws(() => assertCatalogMetadata(pages), /duplicate description/);
  pages['/cms-only'].description = ' ';
  assert.throws(() => assertCatalogMetadata(pages), /empty description/);
});
