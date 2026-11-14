import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomerBookingPresentation } from '../src/components/CustomerBookingPresentation';
import { isPrivatePath, publicPath } from '../src/lib/attribution';
import { normalizePublicLandingPath } from '../src/lib/publicRoutePath';
import type { CustomerBooking } from '../src/shared/customerBooking';

const booking: CustomerBooking = {
  customerName: 'Test family', shootType: 'Family portrait', packageName: '', bookingDate: '',
  startTime: '', endTime: '', location: '', status: 'confirmed', expectedDeliveryDate: '', update: '', delivery: {},
};

test('customer pages and tokens never become public analytics paths or CMS landing paths', () => {
  for (const path of ['/customer-booking', '/customer-booking/secret', '/CUSTOMER-BOOKING/secret']) {
    assert.equal(isPrivatePath(path), true);
    assert.equal(publicPath(path), '');
    assert.equal(normalizePublicLandingPath(path), undefined);
  }
});

test('customer presentation reflects actual status and handles missing details', () => {
  let html = renderToStaticMarkup(<CustomerBookingPresentation booking={booking} />);
  assert.match(html, /To be confirmed/);
  assert.match(html, /We look forward to welcoming you/);
  html = renderToStaticMarkup(<CustomerBookingPresentation booking={{ ...booking, status: 'shoot_completed' }} />);
  assert.match(html, /Preparing delivery/);
  assert.doesNotMatch(html, /Your photographs are ready/);
  html = renderToStaticMarkup(<CustomerBookingPresentation booking={{ ...booking, status: 'delivered' }} />);
  assert.match(html, /Contact the studio for your photographs/);
});

test('delivery links require delivered status and updates remain escaped plain text', () => {
  const ready: CustomerBooking = { ...booking, status: 'delivered', update: '<script>private update</script>', delivery: { galleryUrl: 'https://example.test/gallery' } };
  let html = renderToStaticMarkup(<CustomerBookingPresentation booking={ready} />);
  assert.match(html, /href="https:\/\/example.test\/gallery"/);
  assert.match(html, /&lt;script&gt;private update&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  for (const status of ['cancelled', 'confirmed', 'shoot_completed'] as const) {
    html = renderToStaticMarkup(<CustomerBookingPresentation booking={{ ...ready, status }} />);
    assert.doesNotMatch(html, /href="https:\/\/example.test\/gallery"/);
    if (status === 'cancelled') assert.match(html, /This booking has been cancelled/);
  }
  html = renderToStaticMarkup(<CustomerBookingPresentation booking={{ ...ready, delivery: { galleryUrl: 'javascript:alert(1)' } }} />);
  assert.doesNotMatch(html, /javascript:/);
});
