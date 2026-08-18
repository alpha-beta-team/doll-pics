import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  KeyRound,
  LogOut,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminShell } from '../../contexts/AdminShellContext';
import {
  activeNavigationRoute,
  APP_VERSION,
  PRIMARY_NAVIGATION,
  resolveNavigation,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  STUDIO_WORKSPACES,
  UTILITY_NAVIGATION,
  type StudioWorkspace,
} from '../../nav/config';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { SidebarGroup } from './SidebarGroup';
import { canManage } from '../../access/roles';

type SidebarProps = {
  workspaces?: StudioWorkspace[];
  activeWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
};

export function Sidebar({
  workspaces = STUDIO_WORKSPACES,
  activeWorkspaceId = STUDIO_WORKSPACES[0].id,
  onWorkspaceChange,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, mobileOpen, isMobile, toggleCollapsed, closeMobile } = useAdminShell();
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visiblePrimary = resolveNavigation(PRIMARY_NAVIGATION, user);
  const visibleUtility = resolveNavigation(UTILITY_NAVIGATION, user);
  const allVisible = [...visiblePrimary, ...visibleUtility];
  const activeRoute = activeNavigationRoute(allVisible, location.pathname);
  const activePrimaryGroupId = visiblePrimary.find((group) =>
    group.children?.some((child) => child.route === activeRoute),
  )?.id;
  const [openPrimaryGroupId, setOpenPrimaryGroupId] = useState<string | null>('overview');
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0];
  const displayName = user?.name || user?.email || 'Studio user';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const showCollapsedChrome = collapsed && !isMobile;
  const width = showCollapsedChrome ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  useEffect(() => {
    if (activePrimaryGroupId) setOpenPrimaryGroupId(activePrimaryGroupId);
  }, [activePrimaryGroupId]);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => mobileCloseRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const focusable = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [closeMobile, isMobile, mobileOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    if (isMobile && !mobileOpen) sidebar.setAttribute('inert', '');
    else sidebar.removeAttribute('inert');
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const closeProfile = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const escapeProfile = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeProfile);
    document.addEventListener('keydown', escapeProfile);
    return () => {
      document.removeEventListener('mousedown', closeProfile);
      document.removeEventListener('keydown', escapeProfile);
    };
  }, [profileOpen]);

  const handleNavigate = () => {
    setProfileOpen(false);
    if (isMobile) closeMobile();
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      closeMobile();
      navigate('/admin/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavigationKeys = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-sidebar-control="true"]'),
    ).filter((element) => element.offsetParent !== null);
    if (!controls.length) return;
    const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = controls.length - 1;
    if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % controls.length;
    if (event.key === 'ArrowUp') nextIndex = currentIndex < 0 ? controls.length - 1 : (currentIndex - 1 + controls.length) % controls.length;
    event.preventDefault();
    controls[nextIndex]?.focus();
  };

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-stone-950/55 backdrop-blur-[2px]"
          onClick={closeMobile}
        />
      )}

      <aside
        ref={sidebarRef}
        id="admin-sidebar"
        aria-label="Admin navigation"
        aria-modal={isMobile ? true : undefined}
        aria-hidden={isMobile && !mobileOpen ? true : undefined}
        role={isMobile ? 'dialog' : undefined}
        className={[
          'fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-admin-nav-border bg-admin-nav text-admin-nav-text shadow-[8px_0_30px_rgba(33,31,27,0.08)]',
          'transition-[width,transform] duration-200 ease-out motion-reduce:transition-none',
          isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
        ].join(' ')}
        style={{ width }}
      >
        <div className={`flex shrink-0 items-center border-b border-admin-nav-border ${showCollapsedChrome ? 'h-[72px] justify-center px-2' : 'h-[72px] gap-2 px-3'}`}>
          <div className={`flex min-w-0 flex-1 items-center ${showCollapsedChrome ? 'justify-center' : 'gap-2.5'}`}>
            <img
              src={workspace.logoUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover shadow-sm"
            />
            {!showCollapsedChrome && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-admin-nav-text">{workspace.name}</p>
                <p className="truncate text-[11px] text-admin-nav-muted">{workspace.descriptor}</p>
              </div>
            )}
            {!showCollapsedChrome && workspaces.length > 1 && (
              <label className="relative">
                <span className="sr-only">Choose studio workspace</span>
                <select
                  value={workspace.id}
                  onChange={(event) => onWorkspaceChange?.(event.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                >
                  {workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <ChevronDown className="h-4 w-4 text-admin-nav-muted" aria-hidden="true" />
              </label>
            )}
          </div>

          {isMobile ? (
            <button
              ref={mobileCloseRef}
              type="button"
              onClick={closeMobile}
              aria-label="Close sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-admin-nav-secondary outline-none transition hover:bg-admin-nav-hover hover:text-admin-nav-text focus-visible:ring-2 focus-visible:ring-admin-nav-focus"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              aria-controls="admin-sidebar-nav"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-admin-nav-muted outline-none transition hover:bg-admin-nav-hover hover:text-admin-nav-text focus-visible:ring-2 focus-visible:ring-admin-nav-focus ${showCollapsedChrome ? 'absolute -right-3 top-[54px] border border-admin-nav-border bg-admin-nav shadow-md' : ''}`}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {canManage(user, 'bookings') && <div className={showCollapsedChrome ? 'px-2 py-3' : 'px-3 py-4'}>
          <Link
            to="/admin/bookings?new=1"
            onClick={handleNavigate}
            data-sidebar-control="true"
            aria-label={showCollapsedChrome ? 'New Booking' : undefined}
            className={`group relative flex h-11 items-center justify-center rounded-xl bg-admin-nav-cta font-semibold text-admin-nav-cta-text shadow-sm outline-none transition hover:bg-admin-nav-cta-hover focus-visible:ring-2 focus-visible:ring-admin-nav-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-nav ${showCollapsedChrome ? 'w-full' : 'gap-2 px-4 text-sm'}`}
          >
            <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
            {!showCollapsedChrome && <span>New Booking</span>}
            {showCollapsedChrome && (
              <span role="tooltip" className="pointer-events-none absolute left-full z-[70] ml-3 whitespace-nowrap rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-semibold text-admin-text opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">New Booking</span>
            )}
          </Link>
        </div>}

        <nav
          id="admin-sidebar-nav"
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-3 ${showCollapsedChrome ? 'px-2' : 'px-3'}`}
          onKeyDown={handleNavigationKeys}
        >
          <SidebarSection label="Primary navigation">
            {visiblePrimary.map((group) => (
              <SidebarGroup
                key={group.id}
                group={group}
                activeRoute={activeRoute}
                collapsed={showCollapsedChrome}
                open={openPrimaryGroupId === group.id}
                onOpenChange={(open) => setOpenPrimaryGroupId(open ? group.id : null)}
                onNavigate={handleNavigate}
              />
            ))}
          </SidebarSection>
        </nav>

        <div className={`shrink-0 border-t border-admin-nav-border bg-admin-nav-deep ${showCollapsedChrome ? 'space-y-1 px-2 py-3' : 'space-y-1 px-3 py-3'}`} onKeyDown={handleNavigationKeys}>
          <ul className="space-y-1">
            {visibleUtility.map((item) => item.children ? (
              <SidebarGroup key={item.id} group={item} activeRoute={activeRoute} collapsed={showCollapsedChrome} utility onNavigate={handleNavigate} />
            ) : item.route ? (
              <SidebarItem key={item.id} item={item as typeof item & { route: string }} activeRoute={activeRoute} collapsed={showCollapsedChrome} onNavigate={handleNavigate} />
            ) : null)}
          </ul>

          <div ref={profileRef} className="relative pt-1">
            {profileOpen && (
              <div
                role="menu"
                aria-label="Staff account menu"
                className={`absolute z-[75] min-w-60 rounded-xl border border-admin-border bg-admin-surface p-2 text-admin-text shadow-2xl ${showCollapsedChrome ? 'bottom-0 left-full ml-3' : 'bottom-full inset-x-0 mb-2'}`}
              >
                <div className="border-b border-admin-border px-3 py-2.5">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-admin-subtle">{user?.email}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-admin-primary">{user?.role}</p>
                </div>
                <Link
                  role="menuitem"
                  to="/admin/change-password"
                  state={{ from: location.pathname }}
                  onClick={handleNavigate}
                  className="mt-1 flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-admin-secondary outline-none hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" /> Change password
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  disabled={loggingOut}
                  onClick={() => void handleLogout()}
                  className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-red-700 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-wait disabled:opacity-60"
                >
                  <LogOut className={`h-4 w-4 ${loggingOut ? 'animate-pulse' : ''}`} aria-hidden="true" />
                  {loggingOut ? 'Signing out…' : 'Logout'}
                </button>
              </div>
            )}
            <button
              type="button"
              aria-label={showCollapsedChrome ? `Open profile for ${displayName}` : undefined}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              data-sidebar-control="true"
              onClick={() => setProfileOpen((current) => !current)}
              className={`group flex min-h-11 w-full items-center rounded-xl text-admin-nav-secondary outline-none transition hover:bg-admin-nav-hover hover:text-admin-nav-text focus-visible:ring-2 focus-visible:ring-admin-nav-focus ${showCollapsedChrome ? 'justify-center' : 'gap-2.5 px-2'}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-nav-active text-xs font-bold text-admin-nav-active-text">
                {initials || <UserRound className="h-4 w-4" />}
              </span>
              {!showCollapsedChrome && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold text-admin-nav-text">{displayName}</span>
                    <span className="block truncate text-[11px] capitalize text-admin-nav-muted">{user?.role}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-admin-nav-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </div>
          {!showCollapsedChrome && <p className="px-2 pt-1 text-[10px] text-admin-nav-muted">{APP_VERSION}</p>}
        </div>
      </aside>
    </>
  );
}
