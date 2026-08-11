import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSettingsTab, pickSiteSettings } from './siteSettings';
import type { SiteContent } from './types';

const content: SiteContent = {
  brandName: 'Doll Pictures',
  tagline: 'Stories in every frame',
  heroHeading: 'Hero',
  heroSubtext: 'Hero copy',
  about: 'About',
  ourStory: 'Story',
  mission: 'Mission',
  aboutHeroSubtext: 'About hero',
  contactEmail: 'hello@example.com',
  whatsapp: '+919999999999',
  phone: '+919999999999',
  socials: { instagram: 'https://instagram.com/doll' },
  serviceNavLinks: [{
    id: 'service-1',
    label: 'Maternity',
    path: '/maternity-photography-erode',
    description: '',
    icon: 'Camera',
    imageUrl: '',
    order: 0,
    isPublished: true,
  }],
};

test('site settings payload deliberately omits embedded services', () => {
  const settings = pickSiteSettings(content);
  assert.equal('serviceNavLinks' in settings, false);
  assert.equal(settings.brandName, 'Doll Pictures');
  assert.deepEqual(settings.socials, content.socials);
});

test('invalid or missing settings tabs default to brand', () => {
  assert.equal(normalizeSettingsTab(null), 'brand');
  assert.equal(normalizeSettingsTab('unknown'), 'brand');
  assert.equal(normalizeSettingsTab('about'), 'about');
  assert.equal(normalizeSettingsTab('contact'), 'contact');
});
