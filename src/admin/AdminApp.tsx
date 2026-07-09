import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PhotosPage } from './pages/PhotosPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { PackagesPage } from './pages/PackagesPage';
import { SiteContentPage } from './pages/SiteContentPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { HeroSlidesPage } from './pages/HeroSlidesPage';
import { StoryScenesPage } from './pages/StoryScenesPage';
import { StatsPage } from './pages/StatsPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { BehindScenesPage } from './pages/BehindScenesPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { applyPageSeo } from '../lib/seo';

function useAdminNoIndex() {
  useEffect(() => {
    applyPageSeo({
      path: '/admin',
      title: 'Admin — DOLL PICTURES',
      description: 'Private admin area.',
      noindex: true,
    });
  }, []);
}

export default function AdminApp() {
  useAdminNoIndex();

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="photos" element={<PhotosPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="site-content" element={<SiteContentPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="hero-slides" element={<HeroSlidesPage />} />
          <Route path="story-scenes" element={<StoryScenesPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="behind-scenes" element={<BehindScenesPage />} />
          <Route path="team-members" element={<TeamMembersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
