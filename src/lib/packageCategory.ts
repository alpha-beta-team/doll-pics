export function normalizePackageCategorySlug(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return slug === 'toddler-baby-shoots' ? 'toddler-baby-shoot' : slug;
}

export function packageMatchesCategory(
  pkg: { categorySlug?: string; shootType?: string; categoryName?: string },
  categorySlug: string,
  label: string,
): boolean {
  if (pkg.categorySlug?.trim()) return normalizePackageCategorySlug(pkg.categorySlug) === normalizePackageCategorySlug(categorySlug);
  const name = (pkg.categoryName || pkg.shootType || '').trim().toLowerCase();
  return name === label.toLowerCase() || name === categorySlug.replace(/-/g, ' ');
}

