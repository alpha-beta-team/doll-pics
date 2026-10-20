import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SaleDetail, SaleInput } from '../../shared/types/sales';
import type { Package } from '../types';
import { SaleDetails } from './SaleDetails';
import { SalePackageSelector } from './SalePackageSelector';
const sale: SaleDetail = { _id: 'sale', name: 'Diwali', description: 'Seasonal offer', terms: 'Confirm during sale', startsAt: '2030-11-01T00:00:00+05:30', endsAt: '2030-11-11T00:00:00+05:30', state: 'draft', phase: 'draft', enabled: true, revision: 1, showUpcoming: true, discountType: 'percentage', discountValue: 20, packageIds: ['gold'], packages: [{ packageId: 'gold', packageName: 'Wedding Gold', categoryId: 'wedding', categoryName: 'Wedding', pricingMode: 'price', discountType: 'percentage', discountValue: 20, basePrice: 10000, discountAmount: 2000, salePrice: 8000, hasOverride: false, priceSource: 'preview', availability: 'available', warnings: [] }] };
test('sale details show selected category, package, original price, savings and final price', () => {
  const html = renderToStaticMarkup(createElement(SaleDetails, { sale }));
  for (const value of ['Wedding Gold', 'Wedding', '₹10,000', '₹2,000', '₹8,000', 'This sale is a draft', 'Current price preview', 'Confirm during sale']) assert.ok(html.includes(value), value);
});
test('published sale detail presents saved commercial values and availability warnings', () => {
  const html = renderToStaticMarkup(createElement(SaleDetails, { sale: { ...sale, state: 'published', phase: 'live', packages: [{ ...sale.packages[0], priceSource: 'saved', warnings: ['Package is currently unpublished.'] }] } }));
  assert.match(html, /Saved campaign price/); assert.match(html, /currently unpublished/); assert.doesNotMatch(html, /This sale is a draft/);
});
test('category buttons expose selected and partial borders and accessible selection counts', () => {
  const packages = [{ id: 'gold', categoryId: 'wedding', categoryName: 'Wedding', name: 'Gold', isPublished: true, pricingMode: 'price', price: 10000 }, { id: 'silver', categoryId: 'wedding', categoryName: 'Wedding', name: 'Silver', isPublished: true, pricingMode: 'price', price: 5000 }] as Package[];
  const value = { ...sale, packageIds: ['gold'] } as SaleInput;
  const partial = renderToStaticMarkup(createElement(SalePackageSelector, { packages, value, onChange: () => {} }));
  assert.match(partial, /aria-pressed="mixed"/); assert.match(partial, /border-dashed/); assert.match(partial, /1 \/ 2 selected/);
  const selected = renderToStaticMarkup(createElement(SalePackageSelector, { packages, value: { ...value, packageIds: ['gold', 'silver'] }, onChange: () => {} }));
  assert.match(selected, /aria-pressed="true"/); assert.match(selected, /border-blue-600/); assert.match(selected, /2 \/ 2 selected/);
});
