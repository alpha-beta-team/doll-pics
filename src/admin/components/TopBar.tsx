import { Menu } from 'lucide-react';
import { useAdminShell } from '../contexts/AdminShellContext';
import { GlobalSearch } from './GlobalSearch';

type TopBarProps = {
  sidebarWidth: number;
};

export function TopBar({ sidebarWidth }: TopBarProps) {
  const { isMobile, toggleMobile, mobileOpen } = useAdminShell();

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-admin-border bg-admin-surface/95 px-4 text-admin-text shadow-[0_1px_0_rgba(72,64,53,0.02)] backdrop-blur transition-[left] duration-200 ease-out motion-reduce:transition-none sm:px-6"
      style={{ left: isMobile ? 0 : sidebarWidth }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {isMobile && (
          <button
            type="button"
            onClick={toggleMobile}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-admin-subtle transition-colors hover:bg-admin-muted hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-admin-gold">Doll Pictures</p>
          <p className="truncate text-sm font-semibold text-admin-text sm:text-base">Studio Workspace</p>
        </div>
      </div>
      <div className="ml-3 flex flex-1 justify-end md:ml-8 md:justify-center">
        <GlobalSearch />
      </div>
    </header>
  );
}
