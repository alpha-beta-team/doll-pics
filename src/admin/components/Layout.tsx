import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminShellProvider, useAdminShell } from '../contexts/AdminShellContext';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from '../nav/config';
import { Sidebar } from './sidebar';
import { TopBar } from './TopBar';

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
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

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
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminShellProvider>
      <AdminShell />
    </AdminShellProvider>
  );
}
