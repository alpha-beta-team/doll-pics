import assert from 'node:assert/strict';
import test from 'node:test';
import { selectServiceImages, type ServiceImage } from './serviceImages';

const image = (src: string): ServiceImage => ({ src, alt: src });

test('keeps the configured category cover first and removes its duplicate', () => {
  const cover = image('/wedding-cover.webp');
  const result = selectServiceImages({
    sourceOnly: true,
    sourceImages: [cover, image('/wedding-2.webp'), cover, image('/wedding-3.webp')],
    featuredWork: [],
    galleryImages: [],
    inlineCount: 0,
  });

  assert.equal(result.hero?.src, cover.src);
  assert.deepEqual(result.gallery.map(item => item.src), [
    '/wedding-2.webp',
    '/wedding-3.webp',
  ]);
});
