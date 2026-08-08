import type { ReactNode } from 'react';

export function SidebarSection({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section aria-label={label} className="space-y-1">
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}
