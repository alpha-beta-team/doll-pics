import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isImageKitUrl,
  isTransformableMediaUrl,
  mediaSrcSet,
  mediaUrl,
} from './images';

test('mediaUrl adds bounded ImageKit transformations', () => {
  const source =
    'https://ik.imagekit.io/dollpictures/photos/example/2000.webp';
  assert.equal(isImageKitUrl(source), true);
  assert.equal(isTransformableMediaUrl(source), true);
  assert.equal(
    mediaUrl(source, 750, 'webp'),
    'https://ik.imagekit.io/dollpictures/tr:w-750,q-78,f-webp/photos/example/2000.webp',
  );
});

test('mediaUrl replaces an existing ImageKit path transformation', () => {
  const source =
    'https://ik.imagekit.io/dollpictures/tr:w-2000,q-90/photos/example/2000.webp';
  assert.equal(
    mediaUrl(source, 480),
    'https://ik.imagekit.io/dollpictures/tr:w-480,q-78,f-auto/photos/example/2000.webp',
  );
});

test('mediaSrcSet creates responsive ImageKit candidates', () => {
  const source =
    'https://ik.imagekit.io/dollpictures/photos/example/2000.webp';
  assert.equal(
    mediaSrcSet(source, [480, 750], 'webp'),
    [
      'https://ik.imagekit.io/dollpictures/tr:w-480,q-78,f-webp/photos/example/2000.webp 480w',
      'https://ik.imagekit.io/dollpictures/tr:w-750,q-78,f-webp/photos/example/2000.webp 750w',
    ].join(', '),
  );
});

test('non-CDN URLs remain unchanged', () => {
  const source = 'https://example.com/photo.jpg';
  assert.equal(isTransformableMediaUrl(source), false);
  assert.equal(mediaUrl(source, 750, 'webp'), source);
  assert.equal(mediaSrcSet(source, [480, 750], 'webp'), undefined);
});
