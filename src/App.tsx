import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Site } from './pages/Site';
import { Packages } from './pages/Packages';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { SECTION_PATHS } from './lib/navigation';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Site />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/about" element={<About />} />
        {SECTION_PATHS.map((path) => (
          <Route key={path} path={path} element={<Site />} />
        ))}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminLoading />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
