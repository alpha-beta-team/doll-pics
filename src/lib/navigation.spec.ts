import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPublishedServiceNavLinks,
  normalizeServiceNavLinks,
} from './navigation';

test('returns no service navigation when API data is absent or empty', () => {
  assert.deepEqual(normalizeServiceNavLinks(), []);
  assert.deepEqual(normalizeServiceNavLinks(null), []);
  assert.deepEqual(normalizeServiceNavLinks([]), []);
});

test('normalizes API service fields and sorts by order', () => {
  const links = normalizeServiceNavLinks([
    {
      _id: 'family-id',
      label: '  Family  ',
      path: '  /family-photography-erode  ',
      description: '  Family portraits  ',
      icon: '  Heart  ',
      imageUrl: '  /family.webp  ',
      seoTitle: '  Family Photography  ',
      seoDescription: '  Family sessions in Erode  ',
      heading: '  Family photography  ',
      lead: '  Warm family portraits  ',
      order: 2,
    },
    {
      id: 'wedding-id',
      label: 'Wedding',
      path: '/wedding-photography-erode',
      order: 0,
    },
  ]);

  assert.deepEqual(links, [
    {
      id: 'wedding-id',
      label: 'Wedding',
      path: '/wedding-photography-erode',
      description: '',
      icon: 'Camera',
      imageUrl: '',
      order: 0,
      isPublished: true,
    },
    {
      id: 'family-id',
      label: 'Family',
      path: '/family-photography-erode',
      description: 'Family portraits',
      icon: 'Heart',
      imageUrl: '/family.webp',
      seoTitle: 'Family Photography',
      seoDescription: 'Family sessions in Erode',
      heading: 'Family photography',
      lead: 'Warm family portraits',
      order: 2,
      isPublished: true,
    },
  ]);
});

test('returns only published API services', () => {
  const links = getPublishedServiceNavLinks([
    { label: 'Hidden', path: '/hidden', isPublished: false },
    { label: 'Visible', path: '/visible', isPublished: true },
  ]);

  assert.deepEqual(links.map((link) => link.label), ['Visible']);
});
