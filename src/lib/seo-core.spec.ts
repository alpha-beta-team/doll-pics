import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveServicePage } from './seo-core';

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
