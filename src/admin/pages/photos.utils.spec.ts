import assert from 'node:assert/strict';
import test from 'node:test';
import type { Photo } from '../types';
import {
  filterPhotos,
  getUploadActionLabel,
  getEligibleCoverReplacements,
  getUsedCategoryCounts,
  setUploadCategoryCover,
  toggleVisibleSelection,
} from './photos.utils';

function photo(overrides: Partial<Photo>): Photo {
  return {
    id: 'photo-1',
    title: 'Wedding portrait',
    altText: 'A couple standing together',
    categories: ['wedding'],
    variants: { webp: '', avif: '', original: '', sizes: [] },
    imageTransform: null,
    width: 1200,
    height: 800,
    order: 0,
    isFeatured: false,
    isPublished: true,
    location: 'Erode',
    year: '2026',
    createdAt: '',
    ...overrides,
  };
}

test('filterPhotos combines category, status and local search', () => {
  const photos = [
    photo({ id: '1' }),
    photo({ id: '2', title: 'Newborn session', categories: ['newborn'], isPublished: false }),
    photo({ id: '3', title: 'Newborn family', categories: ['newborn'], isPublished: true }),
  ];
  assert.deepEqual(filterPhotos(photos, 'newborn', 'published', 'family').map(item => item.id), ['3']);
  assert.deepEqual(filterPhotos(photos, '', 'draft', 'session').map(item => item.id), ['2']);
});

test('getUsedCategoryCounts counts each photo once per category', () => {
  const counts = getUsedCategoryCounts([
    photo({ id: '1', categories: ['wedding', 'featured', 'wedding'] }),
    photo({ id: '2', categories: ['wedding'] }),
  ]);
  assert.equal(counts.get('wedding'), 2);
  assert.equal(counts.get('featured'), 1);
});

test('toggleVisibleSelection only changes visible photo ids', () => {
  assert.deepEqual([...toggleVisibleSelection(new Set(['hidden']), ['one', 'two'])].sort(), ['hidden', 'one', 'two']);
  assert.deepEqual([...toggleVisibleSelection(new Set(['hidden', 'one', 'two']), ['one', 'two'])], ['hidden']);
});

test('upload action label describes publish intent', () => {
  assert.equal(getUploadActionLabel(2, 2), 'Upload and publish 2 photos');
  assert.equal(getUploadActionLabel(2, 0), 'Upload 2 photos as drafts');
  assert.equal(getUploadActionLabel(3, 1), 'Upload 3 photos · publish 1');
});

test('selecting an upload cover publishes it and keeps one cover per category', () => {
  const items = [
    { id: 'one', categoryId: 'wedding', isCategoryCover: true, isPublished: true },
    { id: 'two', categoryId: 'wedding', isCategoryCover: false, isPublished: false },
    { id: 'three', categoryId: 'newborn', isCategoryCover: true, isPublished: true },
  ];
  const updated = setUploadCategoryCover(items, 'two', true);
  assert.deepEqual(updated.map(item => [item.id, item.isCategoryCover, item.isPublished]), [
    ['one', false, true],
    ['two', true, true],
    ['three', true, true],
  ]);
});

test('cover replacement candidates are published category photos outside the action', () => {
  const candidates = getEligibleCoverReplacements([
    photo({ id: 'current' }),
    photo({ id: 'eligible' }),
    photo({ id: 'draft', isPublished: false }),
    photo({ id: 'other-category', categories: ['newborn'] }),
  ], 'wedding', ['current']);
  assert.deepEqual(candidates.map(item => item.id), ['eligible']);
});
