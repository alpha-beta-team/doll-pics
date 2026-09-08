import { PUBLIC_SERVICE_HTML_ROUTES } from './publicHtmlRoutes';

const API_ONLY_SERVICE_CATEGORIES: Record<string, string> = {
  ...PUBLIC_SERVICE_HTML_ROUTES,
  '/baby-milestone-photography-erode': 'baby-milestone',
  '/baby-shower-photography-erode': 'baby-shower',
  '/cake-smash-photography-erode': 'cake-smash',
  '/family-photography-erode': 'family',
};

export function resolveApiServiceCategory(path: string, serviceLabel?: string): string | undefined {
  const configured = API_ONLY_SERVICE_CATEGORIES[path];
  if (configured) return configured;

  const normalizedLabel = (serviceLabel ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\bphotography\b|\bin erode\b/g, '').trim();
  return normalizedLabel
    ? normalizedLabel.replace(/\s+/g, '-')
    : undefined;
}

