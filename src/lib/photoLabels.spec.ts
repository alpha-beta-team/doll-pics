import assert from 'node:assert/strict';
import test from 'node:test';
import { isCameraFilename, photoLabels } from './photoLabels';

test('camera names become factual labels without erasing authored descriptions', () => {
  for (const title of ['DSC01131', 'IMG_1234.JPG', 'DSCF0123', '_DSC1234.NEF', 'PXL_20260907_123456.jpg', 'P1000123']) {
    assert.equal(isCameraFilename(title), true, title);
    assert.deepEqual(photoLabels({ title, altText: 'DSC01078' }, 'Newborn'), { title: 'Newborn photography', alt: 'Newborn photography' });
  }
  assert.deepEqual(photoLabels({ title: ' A quiet afternoon ', altText: ' Baby resting in a basket ' }), { title: 'A quiet afternoon', alt: 'Baby resting in a basket' });
  assert.equal(photoLabels({ title: 'IMG_1234', altText: 'Hands holding a newborn' }).alt, 'Hands holding a newborn');
  assert.equal(isCameraFilename('Wedding 2026'), false);
  assert.equal(isCameraFilename('IMG_1234 at the studio'), false);
});

test('missing labels use public category context or neutral studio wording', () => {
  assert.deepEqual(photoLabels({}), { title: 'Photography by Doll Pictures', alt: 'Photography by Doll Pictures' });
  assert.equal(photoLabels({ title: '', categoryIds: ['private-id', { name: 'Maternity', slug: 'maternity' }] }).title, 'Maternity photography');
  assert.equal(photoLabels({ title: 'DSC0012' }, 'Photography').alt, 'Photography by Doll Pictures');
});
