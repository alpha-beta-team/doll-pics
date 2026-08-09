import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PhotosWorkspacePage as PhotosPage } from "./pages/PhotosWorkspacePage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PackagesPage } from "./pages/PackagesPage";
import { PackageCategoriesPage } from "./pages/PackageCategoriesPage";
import { SiteContentPage } from "./pages/SiteContentPage";
import { WorkEnquiriesPage } from "./pages/WorkEnquiriesPage";
import { EnquiryDetailPage } from "./pages/EnquiryDetailPage";
import { TodayPage } from "./pages/TodayPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { UsersPage } from "./pages/UsersPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { HelpPage } from "./pages/HelpPage";
import { BookingsPage } from "./pages/BookingsPage";
import { BookingDetailPage } from "./pages/BookingDetailPage";
import { HeroSlidesPage } from "./pages/HeroSlidesPage";
import { StoryScenesPage } from "./pages/StoryScenesPage";
import { StatsPage } from "./pages/StatsPage";
import { TestimonialsPage } from "./pages/TestimonialsPage";
import { BehindScenesPage } from "./pages/BehindScenesPage";
import { TeamMembersPage } from "./pages/TeamMembersPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { OccasionsPage } from "./pages/OccasionsPage";
import { QuotationsPage } from "./pages/QuotationsPage";
import { QuotationCanvasEditorPage } from "./pages/QuotationCanvasEditorPage";
import { applyPageSeo } from "../lib/seo";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";
import { useAuth } from "./contexts/AuthContext";

function OwnerRoute() {
  const { user } = useAuth();
  return user?.role === "owner" ? (
    <Outlet />
  ) : (
    <Navigate to="/admin/today" replace />
  );
}

function useAdminNoIndex() {
  useEffect(() => {
    applyPageSeo({
      path: "/admin",
      title: "Admin — Doll Pictures",
      description: "Private admin area.",
      noindex: true,
    });
  }, []);
}

export default function AdminApp() {
  useAdminNoIndex();

  // Keep the admin palette independent from the visitor site's saved theme.
  useEffect(() => {
    const root = document.documentElement;
    const previousAdminTheme = root.getAttribute("data-admin-theme");
    const bootstrappedForAdmin = previousAdminTheme === "studio";
    const visitorTheme = root.getAttribute("data-theme");
    const prevScheme =
      bootstrappedForAdmin &&
      (visitorTheme === "light" || visitorTheme === "dark")
        ? visitorTheme
        : root.style.colorScheme;
    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const previousThemeColor = bootstrappedForAdmin
      ? "#2563eb"
      : themeMeta?.content;
    root.setAttribute("data-admin-theme", "studio");
    root.style.colorScheme = "light";
    if (themeMeta) themeMeta.content = "#2d2b27";
    return () => {
      root.removeAttribute("data-admin-theme");
      root.style.colorScheme = prevScheme;
      if (themeMeta && previousThemeColor)
        themeMeta.content = previousThemeColor;
    };
  }, []);

  return (
    <div className="admin-theme min-h-screen bg-admin-canvas text-admin-text">
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
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="occasions" element={<OccasionsPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route
                path="quotations/:id"
                element={<QuotationCanvasEditorPage />}
              />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route element={<OwnerRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="photos" element={<PhotosPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="packages" element={<PackagesPage />} />
                <Route
                  path="package-categories"
                  element={<PackageCategoriesPage />}
                />
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
    </div>
  );
}
