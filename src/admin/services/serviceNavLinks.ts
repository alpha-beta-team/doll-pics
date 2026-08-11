import type { ServiceContentSection, ServiceNavLink } from '../types';

export const MIN_SERVICE_SECTIONS = 1;
export const MAX_SERVICE_SECTIONS = 6;

export const SERVICE_ICON_OPTIONS = [
  'Heart',
  'Camera',
  'Gift',
  'Baby',
  'Sparkles',
  'Briefcase',
  'Plane',
] as const;

export type ServiceFormErrors = Partial<Record<'label' | 'path' | 'sections', string>>;

export function createEmptyServiceSection(): ServiceContentSection {
  return { heading: '', body: '', imageUrl: '', imageAlt: '' };
}

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
    sections: [createEmptyServiceSection()],
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

export function serviceCategorySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateService(
  service: ServiceNavLink,
  services: ServiceNavLink[],
): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  const label = service.label.trim();
  const path = normalizeServicePath(service.path);

  if (!label) errors.label = 'Enter a service label.';

  if (service.sections.length < MIN_SERVICE_SECTIONS) {
    errors.sections = 'Add at least one page section.';
  } else if (service.sections.length > MAX_SERVICE_SECTIONS) {
    errors.sections = `Use no more than ${MAX_SERVICE_SECTIONS} page sections.`;
  } else if (service.sections.some((section) => !section.heading.trim() || !section.body.trim())) {
    errors.sections = 'Enter a heading and body for every page section.';
  }

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
    sections: service.sections.map((section) => ({
      ...section,
      heading: section.heading.trim(),
      body: section.body.trim(),
      imageUrl: section.imageUrl.trim(),
      imageAlt: section.imageAlt.trim(),
    })),
  };
}
