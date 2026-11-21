import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-500.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/public-sans/latin-700.css';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Settings,
  ChevronLeft,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminShell } from '../../contexts/AdminShellContext';
import {
  activeNavigationRoute,
  PRIMARY_NAVIGATION,
  resolveNavigation,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  STUDIO_WORKSPACES,
  UTILITY_NAVIGATION,
  type StudioWorkspace,
} from '../../nav/config';
import { SidebarGroup } from './SidebarGroup';
import { SidebarSettings } from './SidebarSettings';
import { SidebarItem } from './SidebarItem';
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
  const primarySections = visiblePrimary.filter((group) => ['overview', 'bookings-sales'].includes(group.id));
  const bookingRecord = /^\/admin\/bookings\/[^/]+$/.test(location.pathname);
  const sidebarWebsite = visiblePrimary.find((group) => group.id === 'website');
  const settingsGroups = visiblePrimary.filter((group) => !['overview', 'bookings-sales', 'website'].includes(group.id));
  const activeRoute = activeNavigationRoute(allVisible, location.pathname);
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
    if (!isMobile || !mobileOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => mobileCloseRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (profileRef.current?.querySelector('#sidebar-settings')) return;
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const focusable = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), summary, select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0);
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
      if (event.key === 'Escape') {
        event.stopPropagation();
        setProfileOpen(false);
        profileRef.current?.querySelector<HTMLButtonElement>('button[aria-controls="sidebar-settings"]')?.focus();
      }
    };
    profileRef.current?.querySelector<HTMLElement>('#sidebar-settings a, #sidebar-settings button')?.focus();
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
          'admin-sidebar fixed left-0 top-0 z-50 flex h-dvh flex-col bg-admin-nav text-admin-nav-text',
          'transition-[width,transform] duration-200 ease-out motion-reduce:transition-none',
          isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
        ].join(' ')}
        style={{ width }}
      >
        <div className={`flex shrink-0 items-center ${showCollapsedChrome ? 'h-[64px] justify-center px-2' : 'h-[64px] gap-2 px-4'}`}>
          <div className={`flex min-w-0 flex-1 items-center ${showCollapsedChrome ? 'justify-center' : 'gap-2.5'}`}>
            <img
              src={workspace.logoUrl}
              alt=""
              className="h-[34px] w-[34px] shrink-0 rounded-lg object-cover"
            />
            {!showCollapsedChrome && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold tracking-tight text-admin-nav-text">{workspace.name}</p>
                <p className="truncate text-xs text-admin-nav-muted">{workspace.descriptor}</p>
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

        {canManage(user, 'bookings') && <div className={showCollapsedChrome ? 'px-2 pb-2' : 'px-3 pb-2'}>
          <Link
            to="/admin/bookings?new=1"
            onClick={handleNavigate}
            data-sidebar-control="true"
            aria-label={showCollapsedChrome ? 'New Booking' : undefined}
            className={`group relative flex h-[38px] items-center justify-center rounded-lg bg-admin-nav-cta font-semibold text-admin-nav-cta-text shadow-sm outline-none transition hover:bg-admin-nav-cta-hover focus-visible:ring-2 focus-visible:ring-admin-nav-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-nav ${showCollapsedChrome ? 'w-full' : 'gap-2 px-4 text-sm'}`}
          >
            <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
            {!showCollapsedChrome && <span>New booking</span>}
            {showCollapsedChrome && (
              <span role="tooltip" className="pointer-events-none absolute left-full z-[70] ml-3 whitespace-nowrap rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-semibold text-admin-text opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">New booking</span>
            )}
          </Link>
        </div>}

        <nav
          id="admin-sidebar-nav"
          className={`min-h-0 flex-1 overscroll-contain pb-3 ${showCollapsedChrome ? 'overflow-visible px-2' : 'overflow-y-auto overflow-x-hidden px-3'}`}
          onKeyDown={handleNavigationKeys}
        >
          {primarySections.map((section) => (
            <section key={section.id} aria-label={section.label}>
              {showCollapsedChrome ? <div className="mx-2 my-3 border-t border-admin-nav-border" /> : (
                <h2 className="px-2.5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7F9897]">{section.label}</h2>
              )}
              <ul>
                {section.children?.map((item) => item.route ? (
                  <SidebarItem key={item.id} item={item as typeof item & { route: string }} activeRoute={activeRoute} collapsed={showCollapsedChrome} onNavigate={handleNavigate} />
                ) : null)}
              </ul>
            </section>
          ))}
          {!bookingRecord && sidebarWebsite?.children?.length ? (
            <ul className="mt-4">
              <SidebarGroup group={sidebarWebsite} activeRoute={activeRoute} collapsed={showCollapsedChrome} onNavigate={handleNavigate} />
            </ul>
          ) : null}
        </nav>

        <div ref={profileRef} className={`relative mx-3 mb-3 shrink-0 border-t border-admin-nav-border pt-3 ${showCollapsedChrome ? 'flex justify-center' : ''}`}>
          {profileOpen && (
            <SidebarSettings groups={settingsGroups} utility={bookingRecord && sidebarWebsite ? [sidebarWebsite, ...visibleUtility] : visibleUtility} activeRoute={activeRoute} collapsed={showCollapsedChrome} isMobile={isMobile} loggingOut={loggingOut} onNavigate={handleNavigate} onLogout={() => void handleLogout()} returnTo={location.pathname} />
          )}
          <div className="flex min-w-0 items-center gap-2.5 px-1">
            {!showCollapsedChrome && <>
              <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-admin-nav-cta text-xs font-bold text-white">{initials || <UserRound className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13.5px] font-semibold text-white">{displayName}</span>
                <span className="block truncate text-xs capitalize text-admin-nav-muted">{user?.role?.replace(/_/g, ' ')}</span>
              </span>
            </>}
            <button type="button" aria-label="Settings" aria-expanded={profileOpen} aria-controls="sidebar-settings" data-sidebar-control="true" onClick={() => setProfileOpen((current) => !current)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2A5558] text-[#DCE7E6] outline-none transition hover:bg-admin-nav-hover focus-visible:ring-2 focus-visible:ring-admin-nav-focus ${profileOpen ? 'bg-admin-nav-active' : ''}`}>
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
