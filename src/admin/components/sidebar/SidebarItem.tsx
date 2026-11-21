import { Link } from 'react-router-dom';
import type { NavigationNode } from '../../nav/config';

type SidebarItemProps = {
  item: NavigationNode & { route: string };
  activeRoute?: string;
  collapsed: boolean;
  nested?: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({
  item,
  activeRoute,
  collapsed,
  nested = false,
  onNavigate,
}: SidebarItemProps) {
  const Icon = item.icon;
  const active = item.route === activeRoute;

  return (
    <li className="relative">
      <Link
        to={item.route}
        title={collapsed ? item.label : undefined}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        data-sidebar-control="true"
        className={[
          'group relative flex min-h-9 items-center gap-2.5 rounded-lg text-sm font-normal outline-none transition-colors duration-150',
          'focus-visible:ring-2 focus-visible:ring-admin-nav-focus focus-visible:ring-offset-1 focus-visible:ring-offset-admin-nav',
          collapsed ? 'justify-center px-0' : nested ? 'pl-10 pr-3' : 'px-2.5',
          active
            ? 'bg-admin-nav-active font-semibold text-admin-nav-active-text'
            : 'text-admin-nav-secondary hover:bg-admin-nav-hover hover:text-admin-nav-text',
        ].join(' ')}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 inset-y-0 w-[3px] rounded-l-lg bg-admin-nav-indicator"
          />
        )}
        <Icon
          aria-hidden="true"
          className={`h-[18px] w-[18px] shrink-0 ${
            active
              ? 'text-admin-nav-icon-active'
              : 'text-admin-nav-icon group-hover:text-admin-nav-text'
          }`}
        />
        {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
        {collapsed && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-semibold text-admin-text opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
}
