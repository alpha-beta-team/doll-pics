import type { Package } from '../types';

export function packagePrefill(packages: Package[], id: string, currentShootType: string) {
  const selected = packages.find(item => item.id === id);
  return {
    agreedTotal: selected?.price == null ? undefined : String(selected.price),
    shootType: selected
      ? selected.categoryName || selected.shootType || currentShootType
      : currentShootType,
  };
}
