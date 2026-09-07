import { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import {
  normalizePathname,
} from '../lib/navigation';

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
  const { publicCatalog, loading } = useSiteData();

  if (loading) return <LandingLoading />;

  const isService = publicCatalog.serviceLinks.some(link => link.path === path);
  const isPackage = publicCatalog.packageLinks.some(link => link.path === path);

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
