import { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import {
  getPublishedServiceNavLinks,
  normalizePathname,
} from '../lib/navigation';
import { getPackagePage, getServicePage } from '../lib/seo';

const ServicePage = lazy(() =>
  import('./ServicePage').then((m) => ({ default: m.ServicePage })),
);
const PackageCategoryPage = lazy(() =>
  import('./PackageCategoryPage').then((m) => ({
    default: m.PackageCategoryPage,
  })),
);
const NotFound = lazy(() =>
  import('./NotFound').then((m) => ({ default: m.NotFound })),
);

function LandingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
    </div>
  );
}

/**
 * Resolves CMS (or fallback JSON) service/package landing paths.
 * Core routes must be registered before this catch-all in App.tsx.
 */
export function LandingResolver() {
  const { pathname } = useLocation();
  const path = normalizePathname(pathname);
  const { siteContent, packageNavLinks, loading } = useSiteData();

  if (loading) return <LandingLoading />;

  const serviceLinks = getPublishedServiceNavLinks(siteContent.serviceNavLinks);
  const isService =
    serviceLinks.some((link) => link.path === path) || Boolean(getServicePage(path));
  const isPackage =
    packageNavLinks.some((link) => link.path === path) ||
    Boolean(getPackagePage(path));

  return (
    <Suspense fallback={<LandingLoading />}>
      {isService ? (
        <ServicePage />
      ) : isPackage ? (
        <PackageCategoryPage />
      ) : (
        <NotFound />
      )}
    </Suspense>
  );
}
