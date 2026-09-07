import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_PACKAGE_NAV_LINKS } from './navigation';
import { selectServicePreview, servicePackageLink, usableServiceImage } from './serviceDiscovery';

test('service packages match exact categories and honor public custom paths', () => {
  const links = DEFAULT_PACKAGE_NAV_LINKS.map(link => ({ ...link }));
  links.find(link => link.categorySlug === 'newborn')!.path = '/custom-newborn';
  assert.deepEqual(servicePackageLink('/newborn-baby-photography-erode/', links), { path: '/custom-newborn', label: 'View newborn packages' });
  assert.equal(servicePackageLink('/toddler-baby-photography-erode', links).path, '/toddler-baby-shoot-packages-erode');
  links.find(link => link.categorySlug === 'toddler-baby-shoot')!.categorySlug = 'toddler-baby-shoots';
  assert.equal(servicePackageLink('/toddler-baby-photography-erode', links).path, '/toddler-baby-shoot-packages-erode');
  links.find(link => link.categorySlug === 'wedding')!.isPublished = false;
  for (const path of ['/wedding-photography-erode', '/birthday-event-photography-erode', '/fashion-photography-erode', '/unknown']) {
    assert.deepEqual(servicePackageLink(path, links), { path: '/packages', label: 'Explore packages' });
  }
  assert.equal(servicePackageLink('/maternity-photography-erode', []).path, '/packages');
});

test('service previews reject missing files and never borrow another category or static media', () => {
  const path = '/newborn-baby-photography-erode';
  const photos = [
    { src: '/wedding.jpg', alt: 'Wedding', categorySlugs: ['wedding'] },
    { src: '/stock.jpg', alt: 'Newborn' },
    { src: '/real-newborn.webp', alt: 'Baby portrait', webpSrcSet: '/small.webp 400w, /large.webp 800w', categorySlugs: ['newborn'] },
  ];
  for (const src of ['', '  ', '/images/services/newborn.jpg', 'https://dollpictures.in/images/services/family.jpg?x=1']) assert.equal(usableServiceImage(src), false);
  assert.equal(selectServicePreview(path, '/configured.webp', 'Newborn', photos)?.src, '/configured.webp');
  assert.deepEqual(selectServicePreview(path, '/images/services/newborn.jpg', 'Newborn', photos), photos[2]);
  assert.equal(selectServicePreview(path, '', 'Newborn', photos.slice(0, 2)), undefined);
  assert.equal(selectServicePreview('/unknown', '', 'Newborn', photos), undefined);
});
