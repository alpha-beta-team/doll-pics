import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractLocations,
  validateIndexableHtml,
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

test('accepts indexable prerendered HTML with internal links', () => {
  const html = `
    <html>
      <head>
        <title>Wedding Packages in Erode</title>
        <meta name="description" content="Compare wedding packages." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://dollpictures.in/wedding-packages-erode" />
      </head>
      <body>
        <h1>Wedding packages in Erode</h1>
        <a href="/packages">All packages</a>
        <a href="/booking">Book a session</a>
      </body>
    </html>`;

  assert.deepEqual(
    validateIndexableHtml(
      html,
      'https://dollpictures.in/wedding-packages-erode',
    ),
    [],
  );
});

test('rejects noindex HTML with a mismatched canonical and thin body', () => {
  const failures = validateIndexableHtml(
    '<title>Page</title><meta name="robots" content="noindex"><link rel="canonical" href="https://dollpictures.in/other"><h1>Page</h1>',
    'https://dollpictures.in/packages',
  );

  assert.ok(failures.some((failure) => failure.includes('meta description')));
  assert.ok(failures.some((failure) => failure.includes('noindex')));
  assert.ok(failures.some((failure) => failure.includes('canonical mismatch')));
  assert.ok(failures.some((failure) => failure.includes('internal links')));
});
