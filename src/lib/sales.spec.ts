import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SalePrice } from '../components/packages/SalePrice';
import type { PublicPackage } from '../shared/types';
import { packageEnquirePath } from './pricing';
import { categoryOfferCounts } from './sales';
const offer = { campaignId: 'sale-1', revision: 1, name: 'Diwali', terms: 'Confirm during sale', startsAt: '2030-11-01T00:00:00+05:30', endsAt: '2030-11-11T00:00:00+05:30', discountType: 'percentage' as const, discountValue: 20, basePrice: 10000, discountAmount: 2000, salePrice: 8000 };
const pkg: PublicPackage = { id: 'package-1', name: 'Gold', pricingMode: 'price', price: 10000, description: '', inclusions: [], pricing: { basePrice: 10000, effectivePrice: 8000, token: 'token', evaluatedAt: '', nextTransitionAt: offer.endsAt, activeOffer: offer, upcomingOffer: null } };
test('live sale renders original with semantic deletion and actual payable amount', t => {
  t.mock.method(Date, 'now', () => +new Date('2030-11-05T00:00:00Z'));
  const html = renderToStaticMarkup(React.createElement(SalePrice, { pkg }));
  assert.match(html, /<del>₹10,000<\/del>/); assert.match(html, /₹8,000/); assert.match(html, /Save ₹2,000/);
});
test('upcoming offer is hidden and keeps the regular price', t => {
  t.mock.method(Date, 'now', () => +new Date('2030-10-30T00:00:00Z'));
  const html = renderToStaticMarkup(React.createElement(SalePrice, { pkg: { ...pkg, pricing: { ...pkg.pricing!, activeOffer: null, upcomingOffer: offer } } }));
  assert.match(html, /₹10,000/); assert.doesNotMatch(html, /Upcoming|Diwali|₹8,000|<del>/);
});
test('expired metadata never advertises a live discount and starting-price labels survive', t => {
  t.mock.method(Date, 'now', () => +new Date(offer.endsAt));
  const html = renderToStaticMarkup(React.createElement(SalePrice, { pkg }));
  assert.doesNotMatch(html, /<del>|Save ₹2,000|₹8,000/);
  assert.match(html, /₹10,000/);
  t.mock.method(Date, 'now', () => +new Date('2030-11-05T00:00:00Z'));
  assert.match(renderToStaticMarkup(React.createElement(SalePrice, { pkg: { ...pkg, pricingMode: 'startingFrom' } })), /Starting from ₹8,000/);
});
test('package enquiry link carries IDs for server validated attribution', t => {
  t.mock.method(Date, 'now', () => Date.parse('2030-11-05T00:00:00Z'));
  const url = new URL(packageEnquirePath(pkg), 'https://example.test');
  assert.equal(url.searchParams.get('packageId'), 'package-1');
  assert.equal(url.searchParams.get('campaignId'), 'sale-1');
});

test('category badges count live eligible packages only, with canonical slugs and unique IDs', () => {
  const now = Date.parse('2030-11-05T00:00:00Z');
  const live = { ...pkg, categorySlug: ' Wedding ' };
  const future = { ...pkg, id: 'future', categorySlug: 'wedding', pricing: { ...pkg.pricing!, activeOffer: null, upcomingOffer: offer } };
  const expired = { ...pkg, id: 'expired', categorySlug: 'wedding', pricing: { ...pkg.pricing!, activeOffer: { ...offer, endsAt: '2030-11-04T00:00:00Z' } } };
  const counts = categoryOfferCounts([live, live, future, expired, { ...pkg, id: 'other', categorySlug: 'family' }, { ...pkg, pricing: undefined }], now);
  assert.deepEqual([...counts], [['wedding', 1], ['family', 1]]);
  assert.equal(categoryOfferCounts([live], Date.parse(offer.startsAt)).get('wedding'), 1);
  assert.equal(categoryOfferCounts([live], Date.parse(offer.endsAt)).size, 0);
  assert.equal(categoryOfferCounts([live], Date.parse(offer.startsAt) - 1).size, 0);
  assert.equal(categoryOfferCounts([{ ...live, pricing: { ...pkg.pricing!, activeOffer: { ...offer, startsAt: 'invalid' } } }], now).size, 0);
});

test('enquiry links omit upcoming and expired campaign attribution', () => {
  const now = Date.parse('2030-10-30T00:00:00Z');
  for (const pricing of [pkg.pricing, { ...pkg.pricing!, activeOffer: null, upcomingOffer: offer }]) {
    assert.equal(new URL(packageEnquirePath({ ...pkg, pricing }, now), 'https://example.test').searchParams.has('campaignId'), false);
  }
  assert.equal(new URL(packageEnquirePath(pkg, Date.parse(offer.endsAt)), 'https://example.test').searchParams.has('campaignId'), false);
});
