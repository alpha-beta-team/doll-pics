import type { ServiceNavLink } from '../types';

export const SERVICE_ICON_OPTIONS = [
  'Heart',
  'Camera',
  'Gift',
  'Baby',
  'Sparkles',
  'Briefcase',
  'Plane',
] as const;

export type ServiceFormErrors = Partial<Record<'label' | 'path', string>>;

export function createEmptyService(order: number): ServiceNavLink {
  return {
    label: '',
    path: '',
    description: '',
    icon: 'Camera',
    imageUrl: '',
    seoTitle: '',
    seoDescription: '',
    heading: '',
    lead: '',
    order,
    isPublished: false,
  };
}

export function normalizeServicePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, '')
    : withLeadingSlash;
}

export function validateService(
  service: ServiceNavLink,
  services: ServiceNavLink[],
): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  const label = service.label.trim();
  const path = normalizeServicePath(service.path);

  if (!label) errors.label = 'Enter a service label.';

  if (!path) {
    errors.path = 'Enter a public path.';
  } else if (
    path === '/' ||
    path.startsWith('//') ||
    path.includes('://') ||
    /\s/.test(path) ||
    /[?#]/.test(path)
  ) {
    errors.path = 'Use a path such as /maternity-photography-erode without spaces, a query, or a hash.';
  } else {
    const duplicate = services.some((candidate) => {
      if (service.id && candidate.id === service.id) return false;
      return normalizeServicePath(candidate.path).toLowerCase() === path.toLowerCase();
    });
    if (duplicate) errors.path = 'Another service already uses this path.';
  }

  return errors;
}

export function sortAndRenumberServices(
  services: ServiceNavLink[],
): ServiceNavLink[] {
  return [...services]
    .sort((left, right) => left.order - right.order)
    .map((service, order) => ({ ...service, order }));
}

export function reorderServices(
  services: ServiceNavLink[],
  fromIndex: number,
  toIndex: number,
): ServiceNavLink[] {
  const ordered = sortAndRenumberServices(services);
  if (
    fromIndex < 0 ||
    fromIndex >= ordered.length ||
    toIndex < 0 ||
    toIndex >= ordered.length ||
    fromIndex === toIndex
  ) {
    return ordered;
  }
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);
  return ordered.map((service, order) => ({ ...service, order }));
}

export function removeService(
  services: ServiceNavLink[],
  id: string,
): ServiceNavLink[] {
  return sortAndRenumberServices(
    services.filter((service) => service.id !== id),
  );
}

export function appendService(
  services: ServiceNavLink[],
  service: ServiceNavLink,
): ServiceNavLink[] {
  const ordered = sortAndRenumberServices(services);
  return [...ordered, { ...service, order: ordered.length }];
}

export function replaceService(
  services: ServiceNavLink[],
  id: string,
  service: ServiceNavLink,
): ServiceNavLink[] {
  return sortAndRenumberServices(
    services.map((candidate) =>
      candidate.id === id
        ? { ...service, id: candidate.id, order: candidate.order }
        : candidate,
    ),
  );
}

export function prepareServiceForSave(service: ServiceNavLink): ServiceNavLink {
  return {
    ...service,
    label: service.label.trim(),
    path: normalizeServicePath(service.path),
    description: service.description.trim(),
    icon: service.icon.trim() || 'Camera',
    imageUrl: service.imageUrl.trim(),
    seoTitle: service.seoTitle?.trim() ?? '',
    seoDescription: service.seoDescription?.trim() ?? '',
    heading: service.heading?.trim() ?? '',
    lead: service.lead?.trim() ?? '',
  };
}
