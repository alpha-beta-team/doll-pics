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
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";

function AdminShell() {
  const { collapsed, isMobile } = useAdminShell();
  const location = useLocation();
  const immersiveEditor = /^\/admin\/quotations\/[^/]+$/.test(
    location.pathname,
  );
  const salesList = /^\/admin\/(enquiries|bookings)\/?$/.test(location.pathname);
  const detailWorkspace = /^\/admin\/(bookings|enquiries)\/[^/]+$/.test(location.pathname);
  const sidebarWidth = isMobile
    ? 0
    : collapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div className={`min-h-screen ${detailWorkspace ? 'overflow-x-clip' : 'overflow-x-hidden'} ${salesList ? 'bg-[#f8faf7]' : 'bg-admin-canvas'} text-admin-text`}>
      <Sidebar />
      <TopBar sidebarWidth={sidebarWidth} />
      <main
        className={`min-h-screen min-w-0 max-w-full ${detailWorkspace ? 'overflow-x-clip' : 'overflow-x-hidden'} pt-16 transition-[padding] duration-200 ease-out`}
        style={{ paddingLeft: sidebarWidth }}
      >
        <div className={`min-w-0 max-w-full ${salesList ? 'pb-28 md:pb-7' : 'p-3 pb-28 sm:p-6 sm:pb-24 md:p-7 md:pb-7'}`}>
          <RouteLoadBoundary key={location.pathname}>
            <Suspense fallback={<AdminLoadingState label="Loading page…" />}><Outlet /></Suspense>
          </RouteLoadBoundary>
        </div>
      </main>
      {!immersiveEditor && <MobileBottomNav />}
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
