import { CORE_PUBLIC_PATHS, normalizePublicLandingPath } from './publicRoutePath.js';

/** Resolve variants only when the destination is in the authoritative public catalog. */
export function publicCanonicalPath(pathname: string, paths: readonly string[]): string | undefined {
  if (!/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(pathname) && pathname !== '/') return;
  const candidate = pathname === '/' ? '/' : pathname.replace(/\/$/, '').toLowerCase();
  if (!CORE_PUBLIC_PATHS.includes(candidate) && normalizePublicLandingPath(candidate) !== candidate) return;
  return paths.includes(candidate) ? candidate : undefined;
}
