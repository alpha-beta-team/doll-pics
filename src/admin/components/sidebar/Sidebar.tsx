import { useNavigate } from 'react-router-dom';
import {
  Camera,
  ChevronLeft,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminShell } from '../../contexts/AdminShellContext';
import {
  APP_VERSION,
  NAV_SECTIONS,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from '../../nav/config';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { SidebarGroup } from './SidebarGroup';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { collapsed, mobileOpen, isMobile, toggleCollapsed, closeMobile } = useAdminShell();

  const displayName = user?.name || user?.email || 'Admin';
  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(entry =>
      entry.type === 'group' || !entry.item.ownerOnly || user?.role === 'owner',
    ),
  })).filter(section => user?.role === 'owner' || ['main', 'business'].includes(section.id));
  const width = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
  const showCollapsedChrome = collapsed && !isMobile;

  const handleLogout = async () => {
    await logout();
    closeMobile();
    navigate('/admin/login');
  };

  const handleNavigate = () => {
    if (isMobile) {
      closeMobile();
    }
  };

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[1px] transition-opacity"
          onClick={closeMobile}
        />
      )}

      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={[
          'fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-admin-border bg-admin-surface text-admin-text transition-[width,transform] duration-200 ease-out',
          isMobile
            ? mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0',
        ].join(' ')}
        style={{ width }}
      >
        {/* Brand */}
        <div
          className={[
            'flex shrink-0 items-center border-b border-admin-border',
            showCollapsedChrome
              ? 'flex-col gap-2 px-2 py-3'
              : 'h-16 justify-between gap-2 px-4',
          ].join(' ')}
        >
          <div
            className={[
              'flex min-w-0 items-center',
              showCollapsedChrome ? 'justify-center' : 'gap-2.5',
            ].join(' ')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-50">
              <Camera className="h-5 w-5 text-admin-focus" />
            </div>
            {!showCollapsedChrome && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-admin-text">
                  Doll Pictures
                </p>
                <p className="truncate text-xs leading-tight text-admin-subtle">Photography CMS</p>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-admin-subtle transition-colors hover:bg-admin-muted hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-admin-subtle transition-colors hover:bg-admin-muted hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          id="admin-sidebar-nav"
          className={[
            'flex-1 overflow-y-auto overflow-x-hidden py-4',
            showCollapsedChrome ? 'px-2' : 'px-3',
          ].join(' ')}
        >
          {visibleSections.map((section) => (
            <SidebarSection key={section.id} label={section.label} collapsed={showCollapsedChrome}>
              {section.items.map((entry) =>
                entry.type === 'link' ? (
                  <SidebarItem
                    key={entry.item.to}
                    to={entry.item.to}
                    label={entry.item.label}
                    icon={entry.item.icon}
                    collapsed={showCollapsedChrome}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <SidebarGroup
                    key={entry.group.id}
                    group={entry.group}
                    collapsed={showCollapsedChrome}
                    onNavigate={handleNavigate}
                  />
                ),
              )}
            </SidebarSection>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={[
            'shrink-0 border-t border-admin-border',
            showCollapsedChrome ? 'px-2 py-3' : 'px-3 py-3',
          ].join(' ')}
        >
          <div
            className={[
              'flex items-center',
              showCollapsedChrome ? 'flex-col gap-2' : 'gap-2.5',
            ].join(' ')}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50"
              title={displayName}
            >
              <User className="h-4 w-4 text-admin-focus" aria-hidden />
            </div>

            {!showCollapsedChrome && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-admin-text">{displayName}</p>
                {user?.email && user.name && (
                  <p className="truncate text-xs text-admin-subtle">{user.email}</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className={[
                'flex items-center justify-center rounded-[10px] text-admin-subtle transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus',
                showCollapsedChrome ? 'h-9 w-9' : 'h-9 gap-1.5 px-2.5 text-sm font-medium',
              ].join(' ')}
            >
              <LogOut className="h-4 w-4" />
              {!showCollapsedChrome && <span>Logout</span>}
            </button>
          </div>

          {!showCollapsedChrome && (
            <p className="mt-2 px-1 text-[11px] text-admin-subtle">{APP_VERSION}</p>
          )}
          {showCollapsedChrome && (
            <p className="mt-2 text-center text-[10px] text-admin-subtle">{APP_VERSION}</p>
          )}
        </div>
      </aside>
    </>
  );
}
