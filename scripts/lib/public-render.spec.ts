import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import type { renderPublicService } from '../../src/entry-public-server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const { renderPublicService: render } = await server.ssrLoadModule('/src/entry-public-server.tsx') as { renderPublicService: typeof renderPublicService };
const photo = { id: 'fixture', title: 'Newborn fixture portrait', variants: { original: { url: '/og-share.jpg' } } };

test('offline pilot renders useful service HTML without claiming loaded CMS data', async () => {
  const { html, snapshot } = await render({ path: "/newborn-baby-photography-erode",});
  const document = new JSDOM(html).window.document;
  assert.match(document.querySelector('h1')?.textContent ?? '', /newborn/i);
  assert.ok(document.querySelector('a[href^="tel:"]'));
  assert.ok(document.querySelector('a[href*="wa.me"]'));
  assert.deepEqual(snapshot.loaded, []);
  assert.deepEqual(snapshot.data.serviceMedia?.loaded, []);
});

test('partial media failures retain whichever public resource loaded', async () => {
  for (const path of ['/newborn-baby-photography-erode', '/wedding-photography-erode', '/maternity-photography-erode'] as const) {
  const coverOnly = await render({ path, cover: { name: 'Newborn', slug: 'newborn', coverPhotoId: photo } as Parameters<typeof render>[0]['cover'] });
  assert.deepEqual(coverOnly.snapshot.data.serviceMedia?.loaded, ['cover']);
  assert.equal(coverOnly.snapshot.data.serviceMedia?.cover.length, 1);
  assert.match(coverOnly.html, /og-share\.jpg/);
  const photosOnly = await render({ path, photos: [photo] as Parameters<typeof render>[0]['photos'] });
  assert.deepEqual(photosOnly.snapshot.data.serviceMedia?.loaded, ['photos']);
  assert.equal(photosOnly.snapshot.data.serviceMedia?.photos.length, 1);
  assert.match(photosOnly.html, /og-share\.jpg/);
  }
});

const { parsePublicSnapshot } = await server.ssrLoadModule('/src/lib/publicSnapshot.ts') as typeof import('../../src/lib/publicSnapshot');
for (const path of ['/newborn-baby-photography-erode', '/wedding-photography-erode', '/maternity-photography-erode'] as const) {
  test(`${path}: valid v1 snapshots round-trip and malformed/cross-route data is rejected`, async () => {
    const { snapshot, html } = await render({ path });
    assert.ok(html.includes('<h1'));
    assert.ok(parsePublicSnapshot(JSON.stringify(snapshot), path + '/'));
    assert.equal(parsePublicSnapshot(JSON.stringify(snapshot), '/admin'), undefined);
    assert.equal(parsePublicSnapshot(JSON.stringify(snapshot), path === '/wedding-photography-erode' ? '/maternity-photography-erode' : '/wedding-photography-erode'), undefined);
    for (const bad of [null, {}, { ...snapshot, version: 2 }, { ...snapshot, loaded: ['unknown'] },
      { ...snapshot, data: { ...snapshot.data, serviceMedia: { path, photos: null } } },
      { ...snapshot, data: { ...snapshot.data, siteContent: null } },
      { ...snapshot, data: { ...snapshot.data, packageNavLinks: {} } }]) {
      assert.equal(parsePublicSnapshot(JSON.stringify(bad), path), undefined);
    }
    assert.equal(parsePublicSnapshot('{bad', path), undefined);
    const empty = await render({ path, photos: [] });
    assert.deepEqual(empty.snapshot.data.serviceMedia?.loaded, ['photos']);
    assert.deepEqual(empty.snapshot.data.serviceMedia?.photos, []);
  });
}
