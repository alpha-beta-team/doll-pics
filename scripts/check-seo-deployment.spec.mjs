import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractLocations,
  validateLocations,
} from './check-seo-deployment.mjs';

test('extracts and decodes sitemap locations', () => {
  const locations = extractLocations(
    '<urlset><url><loc>https://dollpictures.in/</loc></url><url><loc>https://dollpictures.in/work&amp;more</loc></url></urlset>',
  );

  assert.deepEqual(locations, [
    'https://dollpictures.in/',
    'https://dollpictures.in/work&more',
  ]);
});

test('accepts canonical required URLs', () => {
  assert.deepEqual(
    validateLocations(
      ['https://dollpictures.in', 'https://dollpictures.in/gallery'],
      ['/', '/gallery'],
    ),
    [],
  );
});

test('rejects duplicate, private, parameterized, and non-canonical URLs', () => {
  const failures = validateLocations(
    [
      'http://www.dollpictures.in/gallery',
      'https://dollpictures.in/admin',
      'https://dollpictures.in/gallery?draft=1',
      'https://dollpictures.in/gallery?draft=1',
    ],
    [],
  );

  assert.ok(failures.some((failure) => failure.includes('Non-HTTPS')));
  assert.ok(failures.some((failure) => failure.includes('Non-canonical')));
  assert.ok(failures.some((failure) => failure.includes('Private route')));
  assert.ok(failures.some((failure) => failure.includes('Parameters')));
  assert.ok(failures.some((failure) => failure.includes('Duplicate')));
});
