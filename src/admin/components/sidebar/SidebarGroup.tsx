import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import type { NavigationNode } from '../../nav/config';
import { SidebarItem } from './SidebarItem';

type SidebarGroupProps = {
  group: NavigationNode;
  activeRoute?: string;
  collapsed: boolean;
  utility?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
};

export function SidebarGroup({
  group,
  activeRoute,
  collapsed,
  utility = false,
  open: controlledOpen,
  onOpenChange,
  onNavigate,
}: SidebarGroupProps) {
  const panelId = useId();
  const childActive = group.children?.some((child) => child.route === activeRoute) ?? false;
  const [internalOpen, setInternalOpen] = useState(childActive || group.id === 'overview');
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const Icon = group.icon;
  const open = controlledOpen ?? internalOpen;
  const children = group.children?.filter(
    (child): child is NavigationNode & { route: string } => Boolean(child.route),
  ) ?? [];

  const setOpen = (nextOpen: boolean) => {
    if (onOpenChange) onOpenChange(nextOpen);
    else setInternalOpen(nextOpen);
  };

  useEffect(() => {
    if (childActive && controlledOpen === undefined) setInternalOpen(true);
  }, [childActive, controlledOpen]);

  useEffect(() => {
    if (!collapsed) setFlyoutOpen(false);
  }, [collapsed]);

  const handleFlyoutKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      (event.currentTarget as HTMLElement).focus();
      setFlyoutOpen(false);
    }
  };

  if (collapsed) {
    return (
      <li className="relative" onMouseLeave={() => setFlyoutOpen(false)}>
        <button
          type="button"
          aria-label={group.label}
          aria-expanded={flyoutOpen}
          aria-controls={panelId}
          data-sidebar-control="true"
          onClick={() => setFlyoutOpen((current) => !current)}
          onFocus={() => setFlyoutOpen(true)}
          onKeyDown={handleFlyoutKey}
          className={[
            'group relative flex min-h-10 w-full items-center justify-center rounded-xl text-sm outline-none transition-colors',
            'focus-visible:ring-2 focus-visible:ring-admin-nav-focus focus-visible:ring-offset-1 focus-visible:ring-offset-admin-nav',
            childActive || flyoutOpen
              ? 'text-admin-nav-active-text'
              : 'text-admin-nav-secondary hover:bg-admin-nav-hover hover:text-admin-nav-text',
          ].join(' ')}
        >
          <Icon
            aria-hidden="true"
            className={`h-[18px] w-[18px] ${childActive ? 'text-admin-nav-icon-active' : 'text-admin-nav-icon group-hover:text-admin-nav-text'}`}
          />
          {!flyoutOpen && (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-[70] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-semibold text-admin-text opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {group.label}
            </span>
          )}
        </button>

        {flyoutOpen && (
          <div
            ref={flyoutRef}
            id={panelId}
            className={`absolute left-full z-[65] ml-3 min-w-56 rounded-xl border border-admin-border bg-admin-surface p-2 shadow-2xl ${utility ? 'bottom-0' : 'top-0'}`}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setFlyoutOpen(false);
              }
            }}
          >
            <p className="px-2.5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-admin-subtle">
              {group.label}
            </p>
            <ul className="space-y-1">
              {children.map((child, index) => (
                <Fragment key={child.id}>
                  {child.subgroupLabel && child.subgroupLabel !== children[index - 1]?.subgroupLabel && (
                    <li role="presentation" className={`${index ? 'pt-2' : ''} px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-admin-subtle`}>
                      {child.subgroupLabel}
                    </li>
                  )}
                  <SidebarItem
                    item={child}
                    activeRoute={activeRoute}
                    collapsed={false}
                    onNavigate={() => {
                      setFlyoutOpen(false);
                      onNavigate?.();
                    }}
                  />
                </Fragment>
              ))}
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
        data-sidebar-control="true"
        onClick={() => setOpen(!open)}
        className={[
          'group flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-none transition-colors',
          'focus-visible:ring-2 focus-visible:ring-admin-nav-focus focus-visible:ring-offset-1 focus-visible:ring-offset-admin-nav',
          childActive
            ? 'text-admin-nav-active-text'
            : 'text-admin-nav-secondary hover:bg-admin-nav-hover hover:text-admin-nav-text',
        ].join(' ')}
      >
        <Icon
          aria-hidden="true"
          className={`h-[18px] w-[18px] shrink-0 ${childActive ? 'text-admin-nav-icon-active' : 'text-admin-nav-icon group-hover:text-admin-nav-text'}`}
        />
        <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-admin-nav-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <ul className="mt-1 space-y-1 pb-1">
            {children.map((child, index) => (
              <Fragment key={child.id}>
                {child.subgroupLabel && child.subgroupLabel !== children[index - 1]?.subgroupLabel && (
                  <li role="presentation" className={`${index ? 'pt-2' : ''} pb-1 pl-10 pr-3 text-[10px] font-bold uppercase tracking-[0.14em] text-admin-nav-muted`}>
                    {child.subgroupLabel}
                  </li>
                )}
                <SidebarItem
                  item={child}
                  activeRoute={activeRoute}
                  collapsed={false}
                  nested
                  onNavigate={onNavigate}
                />
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
