import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminShell } from '../contexts/AdminShellContext';
import {
  activeNavigationRoute,
  mobileQuickNavigation,
  PRIMARY_NAVIGATION,
  resolveNavigation,
} from '../nav/config';

export function MobileBottomNav() {
  const { user } = useAuth();
  const { openMobile, mobileOpen } = useAdminShell();
  const location = useLocation();
  const primary = resolveNavigation(PRIMARY_NAVIGATION, user);
  const items = mobileQuickNavigation(primary);
  const activeRoute = activeNavigationRoute(primary, location.pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-flow-col auto-cols-fr border-t border-admin-border bg-admin-surface/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_25px_rgba(54,50,43,0.08)] backdrop-blur md:hidden"
      aria-label="Daily work"
      aria-hidden={mobileOpen ? true : undefined}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.route === activeRoute;
        return (
          <Link
            key={item.id}
            to={item.route}
            aria-current={active ? 'page' : undefined}
            tabIndex={mobileOpen ? -1 : undefined}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus ${active ? 'text-admin-primary' : 'text-admin-subtle hover:text-admin-secondary'}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={openMobile}
        tabIndex={mobileOpen ? -1 : undefined}
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-admin-subtle outline-none transition-colors hover:text-admin-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />More
      </button>
    </nav>
  );
}
