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
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40',
            collapsed ? 'justify-center px-0' : nested ? 'pl-10 pr-3' : 'px-3',
            isActive
              ? 'bg-[#EFF6FF] text-[#2563EB]'
              : 'text-[#1E293B] hover:bg-black/[0.03] hover:text-[#1E293B]',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB]"
              />
            )}
            <Icon
              className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#1E293B]'}`}
            />
            {!collapsed && <span className="truncate">{label}</span>}
            {collapsed && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium text-[#1E293B] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
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
