import { SHOOT_TYPE_OPTIONS } from '../../../lib/shootTypes';

export type ServiceCategorySource = {
  shootType?: string;
};

export type ServiceCategoryOption = {
  value: string;
  label: string;
  count: number;
};

export const UNDECIDED_SERVICE_CATEGORY = 'not-decided';

const canonicalLabels = new Map(
  SHOOT_TYPE_OPTIONS.map(label => [normalizeServiceCategory(label), label]),
);

const canonicalOrder = new Map(
  SHOOT_TYPE_OPTIONS.map((label, index) => [normalizeServiceCategory(label), index]),
);

export function normalizeServiceCategory(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-IN');
  return normalized || UNDECIDED_SERVICE_CATEGORY;
}

export function serviceCategoryLabel(value: string, fallback?: string) {
  if (value === UNDECIDED_SERVICE_CATEGORY) return 'Not decided';
  return canonicalLabels.get(value) || fallback?.trim() || value;
}

export function serviceCategoryMatches(item: ServiceCategorySource, value: string) {
  return !value || normalizeServiceCategory(item.shootType) === value;
}

export function serviceCategoryTabId(value: string) {
  const suffix = (value || 'all').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `service-category-${suffix}-tab`;
}

export function buildServiceCategoryOptions(
  allItems: ServiceCategorySource[],
  matchingItems: ServiceCategorySource[],
): ServiceCategoryOption[] {
  const labels = new Map<string, string>();
  allItems.forEach(item => {
    const value = normalizeServiceCategory(item.shootType);
    if (!labels.has(value)) labels.set(value, serviceCategoryLabel(value, item.shootType));
  });

  const counts = new Map<string, number>();
  matchingItems.forEach(item => {
    const value = normalizeServiceCategory(item.shootType);
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const categories = Array.from(labels, ([value, label]) => ({
    value,
    label,
    count: counts.get(value) || 0,
  })).sort((left, right) => {
    if (left.value === UNDECIDED_SERVICE_CATEGORY) return 1;
    if (right.value === UNDECIDED_SERVICE_CATEGORY) return -1;
    const leftOrder = canonicalOrder.get(left.value);
    const rightOrder = canonicalOrder.get(right.value);
    if (leftOrder != null || rightOrder != null) {
      return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);
    }
    return left.label.localeCompare(right.label, 'en-IN', { sensitivity: 'base' });
  });

  return [{ value: '', label: 'All services', count: matchingItems.length }, ...categories];
}
