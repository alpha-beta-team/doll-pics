import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PhotosWorkspacePage as PhotosPage } from "./pages/PhotosWorkspacePage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PackagesPage } from "./pages/PackagesPage";
import { PackageCategoriesPage } from "./pages/PackageCategoriesPage";
import { SiteContentPage } from "./pages/SiteContentPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ServiceEditorPage } from "./pages/ServiceEditorPage";
import { WorkEnquiriesPage } from "./pages/WorkEnquiriesPage";
import { EnquiryDetailPage } from "./pages/EnquiryDetailPage";
import { TodayPage } from "./pages/TodayPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { StaffAccountsPage } from "./pages/StaffAccountsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { HelpPage } from "./pages/HelpPage";
import { BookingsPage } from "./pages/BookingsPage";
import { BookingDetailPage } from "./pages/BookingDetailPage";
import { HeroSlidesPage } from "./pages/HeroSlidesPage";
import { StoryScenesPage } from "./pages/StoryScenesPage";
import { StatsPage } from "./pages/StatsPage";
import { TestimonialsPage } from "./pages/TestimonialsPage";
import { BehindScenesPage } from "./pages/BehindScenesPage";
import { StaffProfilesPage } from "./pages/StaffProfilesPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { OccasionsPage } from "./pages/OccasionsPage";
import { QuotationsPage } from "./pages/QuotationsPage";
import { QuotationCanvasEditorPage } from "./pages/QuotationCanvasEditorPage";
import { applyPageSeo } from "../lib/seo";
import { ConfirmDialogProvider } from "./components/ConfirmDialog";
import { AccessRoute, DefaultAdminRedirect } from "./components/AccessRoute";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { AttendanceAdminPage } from "./pages/AttendanceAdminPage";
import { AttendanceRequestsPage } from "./pages/AttendanceRequestsPage";
import { TeamLeaveCalendarPage } from "./pages/TeamLeaveCalendarPage";
import { FieldAssignmentsPage } from "./pages/FieldAssignmentsPage";
import { AttendanceReportsPage } from "./pages/AttendanceReportsPage";
import { AttendanceSettingsPage } from "./pages/AttendanceSettingsPage";
import { OwnerOverviewPage } from "./pages/OwnerOverviewPage";

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
