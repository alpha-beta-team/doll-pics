import test from 'node:test';
import assert from 'node:assert/strict';
import type { Package } from '../types';
import type { SaleInput } from '../../shared/types/sales';
import { categorySelection, saleCategoryGroups, setSalePackages, toggleSaleCategory } from './saleSelection';
const packages = [
  { id: 'gold', categoryId: 'wedding', categoryName: 'Wedding', isPublished: true, pricingMode: 'price', price: 10000 },
  { id: 'silver', categoryId: 'wedding', categoryName: 'Wedding', isPublished: true, pricingMode: 'price', price: 5000 },
  { id: 'hidden', categoryId: 'wedding', categoryName: 'Wedding', isPublished: false, pricingMode: 'price', price: 5000 },
  { id: 'family', categoryId: 'family', categoryName: 'Family', isPublished: true, pricingMode: 'price', price: 3000 },
] as Package[];
const form = { packageIds: ['family'], overrides: [{ packageId: 'family', discountType: 'fixed', discountValue: 100 }] } as SaleInput;
test('selecting then deselecting a category toggles its packages without affecting other categories', () => {
  const group = saleCategoryGroups(packages)[0];
  const selected = toggleSaleCategory(form, group);
  assert.deepEqual(selected.packageIds, ['family', 'gold', 'silver']);
  assert.equal(categorySelection(group.eligibleIds, selected.packageIds).state, 'all');
  assert.deepEqual(toggleSaleCategory(selected, group), form);
});
test('partially selected category selects remaining eligible packages and clears overrides on deselection', () => {
  const group = saleCategoryGroups(packages)[0];
  const partial = { ...form, packageIds: ['family', 'gold'], overrides: [...form.overrides!, { packageId: 'gold', discountType: 'percentage' as const, discountValue: 10 }] };
  assert.equal(categorySelection(group.eligibleIds, partial.packageIds).state, 'partial');
  const all = toggleSaleCategory(partial, group);
  assert.equal(categorySelection(group.eligibleIds, all.packageIds).count, 2);
  assert.deepEqual(toggleSaleCategory(all, group).overrides, form.overrides);
});
test('canonical category IDs keep equally named services separate and zero-eligible groups are inert', () => {
  const duplicate = { ...packages[3], categoryName: 'Wedding' };
  assert.equal(saleCategoryGroups([packages[0], duplicate]).length, 2);
  const unavailable = saleCategoryGroups([packages[2]])[0];
  assert.deepEqual(unavailable.eligibleIds, []);
  assert.equal(toggleSaleCategory(form, unavailable), form);
});
test('individual package deselection removes its override and duplicate IDs are normalised', () => {
  const value = setSalePackages({ ...form, packageIds: ['family', 'gold'] }, ['gold', 'gold']);
  assert.deepEqual(value.packageIds, ['gold']);
  assert.deepEqual(value.overrides, []);
});
