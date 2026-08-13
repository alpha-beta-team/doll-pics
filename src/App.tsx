import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { ThemeProvider } from './contexts/ThemeContext';
import { SiteDataProvider } from './contexts/SiteDataContext';
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

function PublicLayout() {
  return (
    <ThemeProvider>
      <SiteDataProvider>
        <PublicBusinessSeo />
        <Outlet />
      </SiteDataProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
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
        <Route element={<PublicLayout />}>
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
    </BrowserRouter>
  );
}

export default App;
