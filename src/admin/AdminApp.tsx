import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PhotosPage } from './pages/PhotosPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { PackagesPage } from './pages/PackagesPage';
import { PackageCategoriesPage } from './pages/PackageCategoriesPage';
import { SiteContentPage } from './pages/SiteContentPage';
import { WorkEnquiriesPage } from './pages/WorkEnquiriesPage';
import { EnquiryDetailPage } from './pages/EnquiryDetailPage';
import { TodayPage } from './pages/TodayPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { UsersPage } from './pages/UsersPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { HelpPage } from './pages/HelpPage';
import { BookingsPage } from './pages/BookingsPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { HeroSlidesPage } from './pages/HeroSlidesPage';
import { StoryScenesPage } from './pages/StoryScenesPage';
import { StatsPage } from './pages/StatsPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { BehindScenesPage } from './pages/BehindScenesPage';
import { TeamMembersPage } from './pages/TeamMembersPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { applyPageSeo } from '../lib/seo';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import { useAuth } from './contexts/AuthContext';

function OwnerRoute() {
  const { user } = useAuth();
  return user?.role === 'owner' ? <Outlet /> : <Navigate to="/admin/today" replace />;
}

function useAdminNoIndex() {
  useEffect(() => {
    applyPageSeo({
      path: '/admin',
      title: 'Admin — Doll Pictures',
      description: 'Private admin area.',
      noindex: true,
    });
  }, []);
}

export default function AdminApp() {
  useAdminNoIndex();

  // Public site may leave color-scheme=dark on <html>; keep admin form chrome light.
  useEffect(() => {
    const root = document.documentElement;
    const prevScheme = root.style.colorScheme;
    root.style.colorScheme = 'light';
    return () => {
      root.style.colorScheme = prevScheme;
    };
  }, []);

  return (
    <AuthProvider>
      <ConfirmDialogProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="/" element={<RequireAuth />}>
            <Route index element={<Navigate to="/admin/today" replace />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="enquiries" element={<WorkEnquiriesPage />} />
            <Route path="enquiries/:id" element={<EnquiryDetailPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route element={<OwnerRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="photos" element={<PhotosPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="package-categories" element={<PackageCategoriesPage />} />
              <Route path="site-content" element={<SiteContentPage />} />
              <Route path="hero-slides" element={<HeroSlidesPage />} />
              <Route path="story-scenes" element={<StoryScenesPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="behind-scenes" element={<BehindScenesPage />} />
              <Route path="team-members" element={<TeamMembersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/admin/today" replace />} />
        </Routes>
      </ConfirmDialogProvider>
    </AuthProvider>
  );
}
