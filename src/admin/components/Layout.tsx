import { AuthRecovery } from "./AuthRecovery";
import { Suspense } from "react";
import { RouteLoadBoundary } from "./RouteLoadBoundary";
import { AdminLoadingState } from "./ui";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  AdminShellProvider,
  useAdminShell,
} from "../contexts/AdminShellContext";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from "../nav/config";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";

function AdminShell() {
  const { collapsed, isMobile } = useAdminShell();
  const location = useLocation();
  const salesList = /^\/admin\/(enquiries|bookings)\/?$/.test(location.pathname);
  const bookingDetail = /^\/admin\/bookings\/[^/]+$/.test(location.pathname);
  const detailWorkspace = /^\/admin\/(bookings|enquiries)\/[^/]+$/.test(location.pathname);
  const enquiryDetail = detailWorkspace && !bookingDetail;
  const postShoot = /^\/admin\/post-shoot\/?$/.test(location.pathname);
  const schedulePage = /^\/admin\/schedule\/?$/.test(location.pathname);
  const desktopSchedule = schedulePage && !isMobile;
  const desktopList = (salesList && !isMobile) || desktopSchedule;
  const desktopOwner = /^\/admin\/owner\/?$/.test(location.pathname) && !isMobile;
  const headerlessWorkspace = desktopList || desktopOwner;
  const sidebarWidth = isMobile
    ? 0
    : collapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div className={`min-h-screen ${detailWorkspace ? 'overflow-x-clip' : 'overflow-x-hidden'} ${bookingDetail ? 'bd-record-shell relative bg-white' : enquiryDetail || schedulePage || postShoot ? 'bg-[#fbfcfc]' : salesList ? 'bg-[#f8faf7]' : 'bg-admin-canvas'} text-admin-text`}>
      <Sidebar />
      {headerlessWorkspace ? <GlobalSearch presentation="shortcut" /> : <TopBar sidebarWidth={sidebarWidth} bookingRecord={bookingDetail} enquiryDetail={enquiryDetail} />}
      <main
        className={`min-h-screen min-w-0 max-w-full ${detailWorkspace ? 'overflow-x-clip' : 'overflow-x-hidden'} ${headerlessWorkspace ? '' : bookingDetail ? 'pt-14' : 'pt-16'} transition-[padding] duration-200 ease-out`}
        style={{ paddingLeft: sidebarWidth }}
      >
        <div className={`min-w-0 max-w-full ${postShoot ? '' : desktopSchedule ? 'px-4 pt-[22px] pb-8 xl:px-8' : bookingDetail ? 'pb-28 md:pb-0' : enquiryDetail ? 'enquiry-detail-frame' : salesList ? (location.pathname.startsWith('/admin/enquiries') ? 'pb-28 md:pb-0' : 'pb-28 md:pb-7') : 'p-3 pb-28 sm:p-6 sm:pb-24 md:p-7 md:pb-7'}`}>
          <RouteLoadBoundary key={location.pathname}>
            <Suspense fallback={<AdminLoadingState label="Loading page…" />}><Outlet /></Suspense>
          </RouteLoadBoundary>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, status, user } = useAuth();
  const location = useLocation();

  if (status === 'checking' || status === 'error') return <AuthRecovery />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (user?.mustChangePassword) {
    return (
      <Navigate
        to="/admin/change-password"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return (
    <AdminShellProvider>
      <AdminShell />
    </AdminShellProvider>
  );
}
