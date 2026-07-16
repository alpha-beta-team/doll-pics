import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { ThemeProvider } from './contexts/ThemeContext';
import { Site } from './pages/Site';
import { SECTION_PATHS, SERVICE_PATHS } from './lib/navigation';

const Packages = lazy(() =>
  import('./pages/Packages').then((m) => ({ default: m.Packages })),
);
const About = lazy(() =>
  import('./pages/About').then((m) => ({ default: m.About })),
);
const Privacy = lazy(() =>
  import('./pages/Privacy').then((m) => ({ default: m.Privacy })),
);
const Terms = lazy(() =>
  import('./pages/Terms').then((m) => ({ default: m.Terms })),
);
const ServicePage = lazy(() =>
  import('./pages/ServicePage').then((m) => ({ default: m.ServicePage })),
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
);
const AdminApp = lazy(() => import('./admin/AdminApp'));

function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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

function PublicThemeLayout() {
  return (
    <ThemeProvider>
      <Outlet />
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
        <Route element={<PublicThemeLayout />}>
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
          {SERVICE_PATHS.map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <Suspense fallback={<PublicLoading />}>
                  <ServicePage />
                </Suspense>
              }
            />
          ))}
          <Route
            path="*"
            element={
              <Suspense fallback={<PublicLoading />}>
                <NotFound />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
