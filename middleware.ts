import { publicCanonicalPath } from './src/lib/publicCanonicalPath';
import { CORE_PUBLIC_PATHS, isRecord, normalizePublicLandingPath } from './src/lib/publicRoutePath';

// Assets and the catalog itself never need canonical-path middleware.
export const config = { runtime: 'nodejs', matcher: ['/((?!.*\\.).*)'] };

/** GET/HEAD public aliases only. Returning nothing preserves normal hosting behavior. */
export default async function middleware(request: Request): Promise<Response | undefined> {
  if (!['GET', 'HEAD'].includes(request.method)) return;
  const url = new URL(request.url);
  const candidate = url.pathname.replace(/\/$/, '').toLowerCase() || '/';
  if (candidate === url.pathname) return;
  let canonical = publicCanonicalPath(url.pathname, CORE_PUBLIC_PATHS);
  if (!canonical) {
    // Reject private roots, opaque/encoded paths and malformed URLs before any fetch.
    if (normalizePublicLandingPath(candidate) !== candidate
      || !publicCanonicalPath(url.pathname, [candidate])) return;
    try {
      const response = await fetch(new URL('/public-catalog.json', url.origin), {
        signal: AbortSignal.timeout(5000), redirect: 'error',
      });
      if (!response.ok) return;
      const catalog: unknown = await response.json();
      if (!isRecord(catalog) || catalog.version !== 1 || !Array.isArray(catalog.paths)
        || !catalog.paths.every(path => typeof path === 'string'
          && (CORE_PUBLIC_PATHS.includes(path) || normalizePublicLandingPath(path) === path))) return;
      canonical = publicCanonicalPath(url.pathname, catalog.paths);
    } catch { return; } // An unavailable manifest never authorizes a guessed destination.
  }
  if (!canonical || canonical === url.pathname) return;
  url.pathname = canonical;
  return Response.redirect(url, 308);
}
