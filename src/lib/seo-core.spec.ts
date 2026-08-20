import assert from 'node:assert/strict';
import test from 'node:test';
import {
  META_DESCRIPTION_MAX_LENGTH,
  resolveMetaDescription,
  resolvePackagePage,
  resolveServicePage,
} from './seo-core';

test('keeps every meta description within the crawler limit', () => {
  const longDescription = 'Photography memories in Erode '.repeat(10);
  const description = resolveMetaDescription('/custom', longDescription);

  assert.ok(description.length <= META_DESCRIPTION_MAX_LENGTH);
  assert.match(description, /…$/);
});

test('uses curated descriptions for CMS pages flagged by the SEO audit', () => {
  const service = resolveServicePage('/baby-shower-photography-erode', null, {
    label: 'Baby Shower',
    path: '/baby-shower-photography-erode',
    description: 'Card description',
    seoDescription: 'A'.repeat(201),
  });
  const packagePage = resolvePackagePage('/toddler-baby-shoot-packages-erode', null, {
    label: 'Toddler Baby Shoot',
    path: '/toddler-baby-shoot-packages-erode',
    categorySlug: 'toddler-baby-shoot',
    description: 'Card description',
    seoDescription: 'B'.repeat(191),
  });

  assert.equal(service?.description.length, 143);
  assert.equal(packagePage?.description.length, 135);
  assert.equal(
    resolveMetaDescription(
      '/baby-shower-photography-erode',
      'Fresh CMS description.',
    ),
    'Fresh CMS description.',
  );
});

test('CMS service sections replace static sections and preserve section images', () => {
  const page = resolveServicePage('/family', {
    title: 'Family',
    description: 'Family photography',
    heading: 'Family photography',
    body: 'Family photography',
    serviceName: 'Family photography',
    label: 'Family',
    lead: 'Family sessions',
    sections: [{ heading: 'Static', paragraphs: ['Static copy'] }],
  }, {
    label: 'Family',
    path: '/family',
    description: 'Family photography',
    sections: [{
      heading: 'Relaxed portraits',
      body: 'First paragraph.\n\nSecond paragraph.',
      imageUrl: '/family-section.webp',
      imageAlt: 'Family laughing together',
    }],
  });

  assert.deepEqual(page?.sections, [{
    heading: 'Relaxed portraits',
    paragraphs: ['First paragraph.', 'Second paragraph.'],
    imageUrl: '/family-section.webp',
    imageAlt: 'Family laughing together',
  }]);
});

test('static service sections are not rendered when MongoDB has none', () => {
  const page = resolveServicePage('/family', {
    title: 'Family',
    description: 'Family photography',
    heading: 'Family photography',
    body: 'Family photography',
    serviceName: 'Family photography',
    label: 'Family',
    lead: 'Family sessions',
    sections: [{ heading: 'Static section', paragraphs: ['Static copy'] }],
  }, {
    label: 'Family',
    path: '/family',
    description: 'Family photography',
    sections: [],
  });

  assert.deepEqual(page?.sections, []);
});
