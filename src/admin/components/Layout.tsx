import { Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminShellProvider, useAdminShell } from '../contexts/AdminShellContext';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from '../nav/config';
import { Sidebar } from './sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

function AdminShell() {
  const { collapsed, isMobile } = useAdminShell();
  const sidebarWidth =
    isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar sidebarWidth={sidebarWidth} />
      <main
        className="min-h-screen pt-16 transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: sidebarWidth }}
      >
        <div className="p-3 pb-28 sm:p-6 sm:pb-24 md:pb-6">
          <Outlet />
        </div>
      </main>
      <Link to="/admin/enquiries?new=1" aria-label="Add enquiry" className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg md:bottom-6 md:right-6"><Plus className="h-6 w-6" /></Link>
      <MobileBottomNav />
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
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
