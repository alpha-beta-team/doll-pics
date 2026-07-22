import type { ReactNode } from 'react';

type SidebarSectionProps = {
  label: string;
  collapsed: boolean;
  children: ReactNode;
};

export function SidebarSection({ label, collapsed, children }: SidebarSectionProps) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}
