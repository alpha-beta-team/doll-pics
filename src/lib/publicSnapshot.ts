import type { SiteData, CmsResource } from '../contexts/SiteDataContext';

export const PUBLIC_HTML_PILOT_PATH = '/newborn-baby-photography-erode';
export interface PublicSnapshot {
  version: 1;
  path: typeof PUBLIC_HTML_PILOT_PATH;
  data: SiteData;
  loaded: CmsResource[];
}

export function readPublicSnapshot(): PublicSnapshot | undefined {
  const element = document.getElementById('public-page-snapshot');
  if (!element || window.location.pathname.replace(/\/$/, '') !== PUBLIC_HTML_PILOT_PATH) return;
  try {
    const value = JSON.parse(element.textContent || '');
    if (value.version === 1 && value.path === PUBLIC_HTML_PILOT_PATH && value.data?.siteContent && Array.isArray(value.loaded)) return value;
  } catch { /* Invalid or stale HTML uses the normal client entry. */ }
}
