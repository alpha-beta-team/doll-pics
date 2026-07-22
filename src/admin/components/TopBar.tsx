import { Menu } from 'lucide-react';
import { useAdminShell } from '../contexts/AdminShellContext';

type TopBarProps = {
  sidebarWidth: number;
};

export function TopBar({ sidebarWidth }: TopBarProps) {
  const { isMobile, toggleMobile, mobileOpen } = useAdminShell();

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 transition-[left] duration-200 ease-out sm:px-6"
      style={{ left: isMobile ? 0 : sidebarWidth }}
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            type="button"
            onClick={toggleMobile}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[#64748B] transition-colors hover:bg-gray-100 hover:text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-[#1E293B]">Admin Dashboard</h1>
      </div>
    </header>
  );
}
