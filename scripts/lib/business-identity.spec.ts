import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  DISPLAY_BRAND_NAME,
  OPENING_HOURS,
  withCanonicalBusinessIdentity,
} from '../../src/lib/businessIdentity';
import { buildLocalBusinessJsonLd } from '../../src/lib/seo-core';
import { root } from './env.mjs';

test('canonical identity contains the approved NAP and opening hours', () => {
  assert.equal(BUSINESS_NAME, 'Doll Pictures by Ramya Vignesh');
  assert.equal(DISPLAY_BRAND_NAME, 'Doll Pictures');
  assert.equal(BUSINESS_EMAIL, 'dollpictures2025@gmail.com');
  assert.equal(BUSINESS_PHONE, '+91 99945 55673');
  assert.equal(BUSINESS_WHATSAPP, '+91 99945 55673');
  assert.equal(OPENING_HOURS.length, 7);
});

test('business structured data uses the canonical identity without invented profiles', () => {
  const routeData = JSON.parse(
    readFileSync(join(root, 'src/data/seo-pages.json'), 'utf8'),
  );
  const seoData = withCanonicalBusinessIdentity(routeData);
  const jsonLd = buildLocalBusinessJsonLd(
    'https://dollpictures.in',
    seoData,
  );

  assert.equal(jsonLd['@type'], 'LocalBusiness');
  assert.equal(jsonLd.name, BUSINESS_NAME);
  assert.equal(jsonLd.alternateName, DISPLAY_BRAND_NAME);
  assert.equal(jsonLd.telephone, BUSINESS_PHONE);
  assert.equal(jsonLd.email, BUSINESS_EMAIL);
  assert.equal(jsonLd.address.streetAddress, 'URT TOWERS, 139/4-D, Perundurai Rd, Teachers Colony, Palayapalayam');
  assert.equal(jsonLd.openingHoursSpecification?.length, 6);
  assert.equal(jsonLd.sameAs, undefined);
});

test('static HTML fallback stays synchronized with canonical contact values', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');

  assert.match(html, new RegExp(BUSINESS_NAME));
  assert.match(html, new RegExp(BUSINESS_PHONE.replace('+', '\\+')));
  assert.match(html, new RegExp(BUSINESS_EMAIL));
  assert.match(html, /"@type": "LocalBusiness"/);
  assert.doesNotMatch(html, /PhotographyBusiness/);
  assert.match(html, /"openingHoursSpecification"/);
  assert.doesNotMatch(html, /95975/);
});
