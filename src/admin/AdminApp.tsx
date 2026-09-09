import { lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { TodayPage } from "./pages/TodayPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { applyPageSeo } from "../lib/seo";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";
import { AccessRoute, DefaultAdminRedirect } from "./components/AccessRoute";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const PhotosPage = lazy(() => import('./pages/PhotosWorkspacePage').then(module => ({ default: module.PhotosWorkspacePage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(module => ({ default: module.CategoriesPage })));
const PackagesPage = lazy(() => import('./pages/PackagesPage').then(module => ({ default: module.PackagesPage })));
const PackageCategoriesPage = lazy(() => import('./pages/PackageCategoriesPage').then(module => ({ default: module.PackageCategoriesPage })));
const SiteContentPage = lazy(() => import('./pages/SiteContentPage').then(module => ({ default: module.SiteContentPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(module => ({ default: module.ServicesPage })));
const ServiceEditorPage = lazy(() => import('./pages/ServiceEditorPage').then(module => ({ default: module.ServiceEditorPage })));
const WorkEnquiriesPage = lazy(() => import('./pages/WorkEnquiriesPage').then(module => ({ default: module.WorkEnquiriesPage })));
const EnquiryDetailPage = lazy(() => import('./pages/EnquiryDetailPage').then(module => ({ default: module.EnquiryDetailPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(module => ({ default: module.PaymentsPage })));
const StaffAccountsPage = lazy(() => import('./pages/StaffAccountsPage').then(module => ({ default: module.StaffAccountsPage })));
const StaffAccountDetailPage = lazy(() => import('./pages/StaffAccountDetailPage').then(module => ({ default: module.StaffAccountDetailPage })));
const SalaryManagementPage = lazy(() => import('./pages/SalaryManagementPage').then(module => ({ default: module.SalaryManagementPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(module => ({ default: module.HelpPage })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then(module => ({ default: module.BookingsPage })));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage').then(module => ({ default: module.BookingDetailPage })));
const HeroSlidesPage = lazy(() => import('./pages/HeroSlidesPage').then(module => ({ default: module.HeroSlidesPage })));
const StoryScenesPage = lazy(() => import('./pages/StoryScenesPage').then(module => ({ default: module.StoryScenesPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then(module => ({ default: module.StatsPage })));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage').then(module => ({ default: module.TestimonialsPage })));
const BehindScenesPage = lazy(() => import('./pages/BehindScenesPage').then(module => ({ default: module.BehindScenesPage })));
const StaffProfilesPage = lazy(() => import('./pages/StaffProfilesPage').then(module => ({ default: module.StaffProfilesPage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage').then(module => ({ default: module.IntegrationsPage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(module => ({ default: module.SchedulePage })));
const OccasionsPage = lazy(() => import('./pages/OccasionsPage').then(module => ({ default: module.OccasionsPage })));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage').then(module => ({ default: module.QuotationsPage })));
const QuotationCanvasEditorPage = lazy(() => import('./pages/QuotationCanvasEditorPage').then(module => ({ default: module.QuotationCanvasEditorPage })));
const AttendanceAdminPage = lazy(() => import('./pages/AttendanceAdminPage').then(module => ({ default: module.AttendanceAdminPage })));
const AttendanceRequestsPage = lazy(() => import('./pages/AttendanceRequestsPage').then(module => ({ default: module.AttendanceRequestsPage })));
const TeamLeaveCalendarPage = lazy(() => import('./pages/TeamLeaveCalendarPage').then(module => ({ default: module.TeamLeaveCalendarPage })));
const FieldAssignmentsPage = lazy(() => import('./pages/FieldAssignmentsPage').then(module => ({ default: module.FieldAssignmentsPage })));
const AttendanceReportsPage = lazy(() => import('./pages/AttendanceReportsPage').then(module => ({ default: module.AttendanceReportsPage })));
const AttendanceSettingsPage = lazy(() => import('./pages/AttendanceSettingsPage').then(module => ({ default: module.AttendanceSettingsPage })));
const OwnerOverviewPage = lazy(() => import('./pages/OwnerOverviewPage').then(module => ({ default: module.OwnerOverviewPage })));

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
              <Route index element={<DefaultAdminRedirect />} />
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route element={<AccessRoute feature="owner_overview" />}><Route path="owner" element={<OwnerOverviewPage />} /></Route>
              <Route element={<AccessRoute feature="today" />}><Route path="today" element={<TodayPage />} /></Route>
              <Route element={<AccessRoute feature="enquiries" />}>
                <Route path="enquiries" element={<WorkEnquiriesPage />} />
                <Route path="enquiries/:id" element={<EnquiryDetailPage />} />
              </Route>
              <Route element={<AccessRoute feature="bookings" />}>
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
              </Route>
              <Route element={<AccessRoute feature="schedule" />}><Route path="schedule" element={<SchedulePage />} /></Route>
              <Route element={<AccessRoute feature="occasions" />}><Route path="occasions" element={<OccasionsPage />} /></Route>
              <Route element={<AccessRoute feature="quotations" />}>
                <Route path="quotations" element={<QuotationsPage />} />
                <Route path="quotations/:id" element={<QuotationCanvasEditorPage />} />
              </Route>
              <Route element={<AccessRoute feature="payments" />}><Route path="payments" element={<PaymentsPage />} /></Route>
              <Route element={<AccessRoute feature="dashboard" />}>
                <Route path="dashboard" element={<DashboardPage />} />
              </Route>
              <Route element={<AccessRoute feature="staff_accounts" />}>
                <Route path="staff-accounts" element={<StaffAccountsPage />} />
                <Route path="staff-accounts/:id" element={<StaffAccountDetailPage />} />
                <Route path="staff-accounts/salary" element={<SalaryManagementPage />} />
                <Route path="attendance" element={<AttendanceAdminPage />} />
                <Route path="attendance/requests" element={<AttendanceRequestsPage />} />
                <Route path="attendance/calendar" element={<TeamLeaveCalendarPage />} />
                <Route path="attendance/field-assignments" element={<FieldAssignmentsPage />} />
                <Route path="attendance/reports" element={<AttendanceReportsPage />} />
                <Route path="attendance/settings" element={<AttendanceSettingsPage />} />
              </Route>
              <Route element={<AccessRoute feature="integrations" />}>
                <Route path="integrations" element={<IntegrationsPage />} />
              </Route>
              <Route element={<AccessRoute feature="photos" />}>
                <Route path="photos" element={<PhotosPage />} />
              </Route>
              <Route element={<AccessRoute feature="categories" />}>
                <Route path="categories" element={<CategoriesPage />} />
              </Route>
              <Route element={<AccessRoute feature="packages" />}>
                <Route path="packages" element={<PackagesPage />} />
              </Route>
              <Route element={<AccessRoute feature="package_categories" />}>
                <Route
                  path="package-categories"
                  element={<PackageCategoriesPage />}
                />
              </Route>
              <Route element={<AccessRoute feature="site_content" />}>
                <Route path="site-content" element={<SiteContentPage />} />
              </Route>
              <Route element={<AccessRoute feature="services" />}>
                <Route path="services" element={<ServicesPage />} />
                <Route path="services/new" element={<ServiceEditorPage />} />
                <Route path="services/:id" element={<ServiceEditorPage />} />
              </Route>
              <Route element={<AccessRoute feature="hero_slides" />}>
                <Route path="hero-slides" element={<HeroSlidesPage />} />
              </Route>
              <Route element={<AccessRoute feature="story_scenes" />}>
                <Route path="story-scenes" element={<StoryScenesPage />} />
              </Route>
              <Route element={<AccessRoute feature="statistics" />}>
                <Route path="stats" element={<StatsPage />} />
              </Route>
              <Route element={<AccessRoute feature="testimonials" />}>
                <Route path="testimonials" element={<TestimonialsPage />} />
              </Route>
              <Route element={<AccessRoute feature="behind_scenes" />}>
                <Route path="behind-scenes" element={<BehindScenesPage />} />
              </Route>
              <Route element={<AccessRoute feature="staff_profiles" />}>
                <Route path="staff-profiles" element={<StaffProfilesPage />} />
              </Route>
            </Route>
            <Route path="*" element={<DefaultAdminRedirect />} />
          </Routes>
        </ConfirmDialogProvider>
      </AuthProvider>
    </div>
  );
}
