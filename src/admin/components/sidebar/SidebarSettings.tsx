import type { ReactNode } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_VERSION, type NavigationNode } from '../../nav/config';

type Props = {
  groups: NavigationNode[];
  utility: NavigationNode[];
  activeRoute?: string;
  collapsed: boolean;
  isMobile: boolean;
  loggingOut: boolean;
  returnTo: string;
  onNavigate: () => void;
  onLogout: () => void;
};

export function SidebarSettings({ groups, utility, activeRoute, collapsed, isMobile, loggingOut, returnTo, onNavigate, onLogout }: Props) {
  const staff = groups.find((group) => group.id === 'staff-management')?.children ?? [];
  const payIds = ['salary-management', 'attendance-settings', 'attendance-reports'];
  const columns = [
    { label: 'Studio', items: utility },
    { label: 'Team', items: staff.filter((item) => !payIds.includes(item.id)) },
    { label: 'Pay & reports', items: staff.filter((item) => payIds.includes(item.id)) },
  ].filter((column) => column.items.length);
  return (
    <div id="sidebar-settings" role="region" aria-label="Settings navigation" className={`absolute z-[75] overflow-y-auto overscroll-contain rounded-xl border border-[#DDE3E3] bg-white p-2.5 text-[#14201F] shadow-[0_12px_32px_rgba(16,42,44,0.24)] ${isMobile ? 'bottom-full left-0 mb-3 max-h-[calc(100dvh-100px)] w-[min(680px,calc(100vw-24px))]' : collapsed ? 'bottom-0 left-full ml-3 max-h-[calc(100dvh-32px)] w-[min(680px,calc(100vw-100px))]' : 'bottom-full left-0 mb-3 max-h-[calc(100dvh-100px)] w-[min(680px,calc(100vw-32px))]'}`}>
      <div className="grid grid-cols-1 gap-x-2 gap-y-3 sm:grid-cols-3">
        {columns.map((column) => (
          <section key={column.label} aria-label={column.label}>
            <h2 className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5B6766]">{column.label}</h2>
            <ul>{(() => {
              const renderItem = (item: NavigationNode): ReactNode => {
                if (item.children?.length) return <li key={item.id}><details>
                  <summary className="min-h-9 cursor-pointer rounded-lg px-2.5 py-2 text-[13.5px] font-semibold">{item.label}</summary>
                  <ul className="pl-2">{item.children.map(renderItem)}</ul>
                </details></li>;
                if (!item.route) return null;
                const Icon = item.icon;
                return <li key={item.id}><Link to={item.route} onClick={onNavigate} aria-current={activeRoute === item.route ? 'page' : undefined} className={`flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] outline-none hover:bg-[#F0F3F3] focus-visible:ring-2 focus-visible:ring-[#0B5C60] ${activeRoute === item.route ? 'bg-[#E8F2F2] font-semibold text-[#0B5C60]' : ''}`}><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#43504F]" /><span>{item.label}</span></Link></li>;
              };
              return column.items.map(renderItem);
            })()}</ul>
          </section>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-[#EEF1F1] pt-1.5 text-[13.5px]">
        <Link to="/admin/change-password" state={{ from: returnTo }} onClick={onNavigate} className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 outline-none hover:bg-[#F0F3F3] focus-visible:ring-2 focus-visible:ring-[#0B5C60]"><KeyRound className="h-4 w-4" />Change password</Link>
        <button type="button" disabled={loggingOut} onClick={onLogout} className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-red-700 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-[#0B5C60] disabled:opacity-60"><LogOut className="h-4 w-4" />{loggingOut ? 'Signing out…' : 'Sign out'}</button>
        <span className="px-2.5 text-[11.5px] text-[#5B6766]">{APP_VERSION}</span>
      </div>
    </div>
  );
}
