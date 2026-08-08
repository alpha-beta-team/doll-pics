import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

type SidebarItemProps = {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  nested?: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({
  to,
  label,
  icon: Icon,
  collapsed,
  nested = false,
  onNavigate,
}: SidebarItemProps) {
  return (
    <li className="relative">
      <NavLink
        to={to}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        className={({ isActive }) =>
          [
            'group relative flex h-11 items-center gap-3 rounded-[10px] text-sm font-medium transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus',
            collapsed ? 'justify-center px-0' : nested ? 'pl-10 pr-3' : 'px-3',
            isActive
              ? 'bg-blue-50 text-admin-focus'
              : 'text-admin-secondary hover:bg-admin-muted hover:text-admin-text',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-admin-primary"
              />
            )}
            <Icon
              className={`h-5 w-5 shrink-0 ${isActive ? 'text-admin-focus' : 'text-admin-subtle group-hover:text-admin-text'}`}
            />
            {!collapsed && <span className="truncate">{label}</span>}
            {collapsed && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-admin-border bg-admin-elevated px-2 py-1 text-xs font-medium text-admin-text opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}
