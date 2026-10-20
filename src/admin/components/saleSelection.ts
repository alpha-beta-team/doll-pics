import type { Package } from '../types';
import type { SaleInput } from '../../shared/types/sales';
export function isSaleEligible(pkg: Package) {
  return pkg.isPublished && pkg.pricingMode !== 'enquire' && pkg.price != null && Number.isFinite(pkg.price) && pkg.price > 0;
}
export function saleCategoryGroups(packages: Package[]) {
  const groups = new Map<string, { id: string; name: string; packages: Package[]; eligibleIds: string[] }>();
  for (const pkg of packages) {
    const id = pkg.categoryId || 'uncategorised';
    const group = groups.get(id) ?? { id, name: pkg.categoryName || 'Uncategorised', packages: [], eligibleIds: [] };
    group.packages.push(pkg);
    if (isSaleEligible(pkg)) group.eligibleIds.push(pkg.id);
    groups.set(id, group);
  }
  return [...groups.values()];
}
export function categorySelection(ids: string[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  const count = ids.filter(id => selected.has(id)).length;
  return { count, state: count === 0 ? 'none' : count === ids.length ? 'all' : 'partial' } as const;
}
export function setSalePackages(form: SaleInput, ids: string[]): SaleInput {
  const packageIds = [...new Set(ids)];
  const selected = new Set(packageIds);
  return { ...form, packageIds, overrides: form.overrides?.filter(row => selected.has(row.packageId)) };
}
export function toggleSaleCategory(form: SaleInput, group: ReturnType<typeof saleCategoryGroups>[number]) {
  if (!group.eligibleIds.length) return form;
  if (categorySelection(group.eligibleIds, form.packageIds).state === 'all') {
    const members = new Set(group.packages.map(pkg => pkg.id));
    return setSalePackages(form, form.packageIds.filter(id => !members.has(id)));
  }
  return setSalePackages(form, [...form.packageIds, ...group.eligibleIds]);
}
