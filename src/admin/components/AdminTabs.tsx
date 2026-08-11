import type { LucideIcon } from 'lucide-react';

export type AdminTab = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

export function AdminTabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: AdminTab[];
  value: string;
  onChange: (tab: string) => void;
  label: string;
}) {
  return (
    <div
      className="overflow-x-auto border-b border-admin-border"
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const current = tabs.findIndex((tab) => tab.id === value);
        let next = current;
        if (event.key === 'ArrowLeft') next = current <= 0 ? tabs.length - 1 : current - 1;
        if (event.key === 'ArrowRight') next = current >= tabs.length - 1 ? 0 : current + 1;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        const nextTab = tabs[next];
        if (!nextTab) return;
        const tablist = event.currentTarget;
        event.preventDefault();
        onChange(nextTab.id);
        window.requestAnimationFrame(() => {
          tablist.querySelector<HTMLButtonElement>(`[data-admin-tab="${nextTab.id}"]`)?.focus();
        });
      }}
    >
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = tab.id === value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-admin-tab={tab.id}
              id={`${label}-${tab.id}-tab`.replace(/\s+/g, '-').toLowerCase()}
              aria-selected={active}
              aria-controls={`${label}-${tab.id}-panel`.replace(/\s+/g, '-').toLowerCase()}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`relative inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${active ? 'text-admin-primary' : 'text-admin-subtle hover:text-admin-text'}`}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {tab.label}
              {active && <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-admin-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
