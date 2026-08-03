import { CalendarDays, CircleDollarSign, Home, Mail, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAdminShell } from '../contexts/AdminShellContext';

const items = [
  { to: '/admin/today', label: 'Today', icon: Home },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Mail },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/payments', label: 'Payments', icon: CircleDollarSign },
];

export function MobileBottomNav() {
  const { openMobile } = useAdminShell();
  return <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_25px_rgba(15,23,42,0.08)] md:hidden" aria-label="Daily work">
    {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}><Icon className="h-5 w-5" /><span className="truncate">{label}</span></NavLink>)}
    <button type="button" onClick={openMobile} className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-500"><Menu className="h-5 w-5" />More</button>
  </nav>;
}
