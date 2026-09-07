import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import type { renderPublicPilot } from '../../src/entry-public-server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const { renderPublicPilot: render } = await server.ssrLoadModule('/src/entry-public-server.tsx') as { renderPublicPilot: typeof renderPublicPilot };
const photo = { id: 'fixture', title: 'Newborn fixture portrait', variants: { original: { url: '/og-share.jpg' } } };

test('offline pilot renders useful service HTML without claiming loaded CMS data', async () => {
  const { html, snapshot } = await render({});
  const document = new JSDOM(html).window.document;
  assert.match(document.querySelector('h1')?.textContent ?? '', /newborn/i);
  assert.ok(document.querySelector('a[href^="tel:"]'));
  assert.ok(document.querySelector('a[href*="wa.me"]'));
  assert.deepEqual(snapshot.loaded, []);
  assert.deepEqual(snapshot.data.serviceMedia?.loaded, []);
});

test('partial media failures retain whichever public resource loaded', async () => {
  const coverOnly = await render({ cover: { name: 'Newborn', slug: 'newborn', coverPhotoId: photo } as Parameters<typeof render>[0]['cover'] });
  assert.deepEqual(coverOnly.snapshot.data.serviceMedia?.loaded, ['cover']);
  assert.equal(coverOnly.snapshot.data.serviceMedia?.cover.length, 1);
  assert.match(coverOnly.html, /og-share\.jpg/);
  const photosOnly = await render({ photos: [photo] as Parameters<typeof render>[0]['photos'] });
  assert.deepEqual(photosOnly.snapshot.data.serviceMedia?.loaded, ['photos']);
  assert.equal(photosOnly.snapshot.data.serviceMedia?.photos.length, 1);
  assert.match(photosOnly.html, /og-share\.jpg/);
});
