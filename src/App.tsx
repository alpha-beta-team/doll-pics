import type { PublicSnapshot } from './lib/publicSnapshot';
import { Suspense, lazy, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { ThemeProvider } from './contexts/ThemeContext';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import { publicCanonicalPath } from './lib/publicCanonicalPath';
import { CORE_PUBLIC_PATHS } from './lib/publicRoutePath';
import { useBusinessSeo } from './hooks/useBusinessSeo';
import { Site } from './pages/Site';
import { SECTION_PATHS } from './lib/navigation';

const Packages = lazy(() =>
  import('./pages/Packages').then((m) => ({ default: m.Packages })),
);
const About = lazy(() =>
  import('./pages/About').then((m) => ({ default: m.About })),
);
const Stories = lazy(() =>
  import('./pages/Stories').then((m) => ({ default: m.Stories })),
);
const Contact = lazy(() =>
  import('./pages/Contact').then((m) => ({ default: m.Contact })),
);
const Privacy = lazy(() =>
  import('./pages/Privacy').then((m) => ({ default: m.Privacy })),
);
const Terms = lazy(() =>
  import('./pages/Terms').then((m) => ({ default: m.Terms })),
);
const LandingResolver = lazy(() =>
  import('./pages/LandingResolver').then((m) => ({
    default: m.LandingResolver,
  })),
);
const AdminApp = lazy(() => import('./admin/AdminApp'));
const EmployeeApp = lazy(() => import('./employee/EmployeeApp'));
const KioskApp = lazy(() => import('./kiosk/KioskApp'));
const QuotationPage = lazy(() =>
  import('./pages/QuotationPage').then((m) => ({ default: m.QuotationPage })),
);

function AdminLoading() {
  return (
    <div className="admin-theme flex min-h-screen items-center justify-center bg-admin-canvas text-admin-text">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" />
    </div>
  );
}

function PublicLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
    </div>
  );
}

function PublicBusinessSeo() {
  useBusinessSeo();
  return null;
}

function PublicCanonicalRoute() {
  const location = useLocation();
  const { publicCatalog, loading } = useSiteData();
  // Core routes are always known; wait for publication before resolving CMS aliases.
  const canonical = publicCanonicalPath(location.pathname, CORE_PUBLIC_PATHS)
    ?? (!loading ? publicCanonicalPath(location.pathname, publicCatalog.paths) : undefined);
  if (canonical && canonical !== location.pathname) {
    return <Navigate replace to={{ pathname: canonical, search: location.search, hash: location.hash }} state={location.state} />;
  }
  return <><PublicBusinessSeo /><Outlet /></>;
}

function PublicLayout({ snapshot }: { snapshot?: PublicSnapshot }) {
  return (
    <ThemeProvider initialTheme={snapshot ? 'dark' : undefined}>
      <SiteDataProvider initialData={snapshot?.data} initialLoaded={snapshot?.loaded}>
        <PublicCanonicalRoute />
      </SiteDataProvider>
    </ThemeProvider>
  );
}

interface AppProps { snapshot?: PublicSnapshot; PilotPage?: ComponentType }

export function AppRoutes({ snapshot, PilotPage }: AppProps) {
  return (
    <>
      <GoogleAnalytics />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminLoading />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          path="/employee/*"
          element={
            <Suspense fallback={<AdminLoading />}>
              <EmployeeApp />
            </Suspense>
          }
        />
        <Route
          path="/kiosk/*"
          element={
            <Suspense fallback={<AdminLoading />}>
              <KioskApp />
            </Suspense>
          }
        />
        <Route
          path="/quotation/:token"
          element={
            <Suspense fallback={<PublicLoading />}>
              <QuotationPage />
            </Suspense>
          }
        />
        <Route element={<PublicLayout snapshot={snapshot} />}>
          {snapshot && PilotPage ? <Route path={snapshot.path} element={<PilotPage />} /> : null}
          <Route path="/" element={<Site />} />
          <Route
            path="/packages"
            element={
              <Suspense fallback={<PublicLoading />}>
                <Packages />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<PublicLoading />}>
                <About />
              </Suspense>
            }
          />
          <Route
            path="/stories"
            element={
              <Suspense fallback={<PublicLoading />}>
                <Stories />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<PublicLoading />}>
                <Contact />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<PublicLoading />}>
                <Privacy />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<PublicLoading />}>
                <Terms />
              </Suspense>
            }
          />
          {SECTION_PATHS.map((path) => (
            <Route key={path} path={path} element={<Site />} />
          ))}
          <Route
            path="*"
            element={
              <Suspense fallback={<PublicLoading />}>
                <LandingResolver />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

function App(props: AppProps) {
  return <BrowserRouter><AppRoutes {...props} /></BrowserRouter>;
}
export default App;
