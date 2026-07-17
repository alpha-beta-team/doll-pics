import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { NavGroup } from '../../nav/config';
import { SidebarItem } from './SidebarItem';

type SidebarGroupProps = {
  group: NavGroup;
  collapsed: boolean;
  onNavigate?: () => void;
};

function pathMatches(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SidebarGroup({ group, collapsed, onNavigate }: SidebarGroupProps) {
  const location = useLocation();
  const panelId = useId();
  const childActive = group.children.some((child) => pathMatches(location.pathname, child.to));
  const [open, setOpen] = useState(childActive);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  useEffect(() => {
    if (childActive) {
      setOpen(true);
    }
  }, [childActive]);

  useEffect(() => {
    if (!collapsed) {
      setFlyoutOpen(false);
    }
  }, [collapsed]);

  const Icon = group.icon;

  if (collapsed) {
    return (
      <li
        className="relative"
        onMouseLeave={() => setFlyoutOpen(false)}
      >
        <button
          type="button"
          aria-label={group.label}
          aria-expanded={flyoutOpen}
          aria-controls={panelId}
          title={group.label}
          onClick={() => setFlyoutOpen((prev) => !prev)}
          onFocus={() => setFlyoutOpen(true)}
          className={[
            'group relative flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-medium transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40',
            childActive || flyoutOpen
              ? 'bg-[#EFF6FF] text-[#2563EB]'
              : 'text-[#1E293B] hover:bg-black/[0.03]',
          ].join(' ')}
        >
          {(childActive || flyoutOpen) && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2563EB]"
            />
          )}
          <Icon
            className={`h-5 w-5 shrink-0 ${
              childActive || flyoutOpen ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#1E293B]'
            }`}
          />
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium text-[#1E293B] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {group.label}
          </span>
        </button>

        {flyoutOpen && (
          <div
            id={panelId}
            role="menu"
            className="absolute left-full top-0 z-50 ml-2 min-w-[200px] rounded-[10px] border border-[#E5E7EB] bg-[#FCFBF8] p-2 shadow-sm"
          >
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.children.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <li key={child.to}>
                    <NavLink
                      to={child.to}
                      role="menuitem"
                      onClick={() => {
                        setFlyoutOpen(false);
                        onNavigate?.();
                      }}
                      className={({ isActive }) =>
                        [
                          'flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40',
                          isActive
                            ? 'bg-[#EFF6FF] text-[#2563EB]'
                            : 'text-[#1E293B] hover:bg-black/[0.03]',
                        ].join(' ')
                      }
                    >
                      <ChildIcon className="h-4 w-4 shrink-0 text-[#64748B]" />
                      <span className="truncate">{child.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'group relative flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40',
          childActive
            ? 'bg-[#EFF6FF]/70 text-[#2563EB]'
            : 'text-[#1E293B] hover:bg-black/[0.03]',
        ].join(' ')}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${
            childActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#1E293B]'
          }`}
        />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul id={panelId} className="mt-0.5 space-y-0.5">
          {group.children.map((child) => (
            <SidebarItem
              key={child.to}
              to={child.to}
              label={child.label}
              icon={child.icon}
              collapsed={false}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
