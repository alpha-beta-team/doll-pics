/** Explicit rollout scope shared by build-time rendering and browser media loading. */
export const PUBLIC_SERVICE_HTML_ROUTES = {
  '/newborn-baby-photography-erode': 'newborn',
  '/wedding-photography-erode': 'wedding',
  '/maternity-photography-erode': 'maternity',
} as const;
export const PUBLIC_HTML_ROUTES = { '/': null, '/services': null, '/packages': null, ...PUBLIC_SERVICE_HTML_ROUTES } as const;
export type PublicHtmlPath = keyof typeof PUBLIC_HTML_ROUTES;
export const SERVICE_GALLERY_LIMIT = 30;
export function isPublicHtmlPath(path: string): path is PublicHtmlPath {
  return Object.prototype.hasOwnProperty.call(PUBLIC_HTML_ROUTES, path);
}
