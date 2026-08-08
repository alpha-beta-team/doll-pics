import type { QuotationOption } from "../types";

export function moveQuotationSection(
  order: string[],
  section: string,
  direction: -1 | 1,
) {
  const index = order.indexOf(section);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function placeQuotationSectionBefore(
  order: string[],
  section: string,
  target: string,
) {
  if (section === target || !order.includes(section) || !order.includes(target))
    return order;
  const next = order.filter((item) => item !== section);
  next.splice(next.indexOf(target), 0, section);
  return next;
}

export function toggleGalleryPhoto(selected: string[], id: string, limit = 6) {
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  return selected.length < limit ? [...selected, id] : selected;
}

export function recommendQuotationOption(
  options: QuotationOption[],
  id: string,
  recommended: boolean,
) {
  return options.map((option) =>
    option.id === id
      ? { ...option, recommended }
      : recommended
        ? { ...option, recommended: false }
        : option,
  );
}
