import assert from 'node:assert/strict';
import test from 'node:test';
import type { PublicBookingBackground } from '../shared/types';
import { usableBookingBackgrounds } from './bookingBackgrounds';

const background = (
  categorySlug: string,
  storageKey: string,
): PublicBookingBackground => ({
  categoryName: categorySlug,
  categorySlug,
  coverPhoto: {
    title: categorySlug,
    storageKey,
    variants: { original: { url: `https://cdn.example/${storageKey}` } },
  },
});

test('keeps unique real booking cover photos in API order', () => {
  const wedding = background('wedding', 'wedding/cover.jpg');
  const result = usableBookingBackgrounds([
    wedding,
    wedding,
    background('family', 'family/cover.jpg'),
  ]);

  assert.deepEqual(result.map((item) => item.categorySlug), ['wedding', 'family']);
});

test('rejects seed and picsum booking backgrounds', () => {
  const seed = background('newborn', 'seed/newborn/cover.jpg');
  const picsum = background('family', 'family/cover.jpg');
  picsum.coverPhoto.storageKey = '';
  picsum.coverPhoto.variants = {
    original: { url: 'https://picsum.photos/seed/family/1200/800' },
  };

  assert.deepEqual(usableBookingBackgrounds([seed, picsum]), []);
});
