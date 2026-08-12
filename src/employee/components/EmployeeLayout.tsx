import { CalendarDays, CalendarPlus, Clock3, Home, LogOut, UserRound } from 'lucide-react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../EmployeeAuthContext';
import { EmployeeLoading } from './EmployeeUi';

const navigation = [
  { to: '/employee', label: 'Home', icon: Home, end: true },
  { to: '/employee/attendance', label: 'Attendance', icon: Clock3 },
  { to: '/employee/leave', label: 'Leave', icon: CalendarPlus },
  { to: '/employee/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/employee/profile', label: 'Profile', icon: UserRound },
];

export function EmployeeRequireAuth() {
  const auth = useEmployeeAuth();
  const location = useLocation();
  if (auth.isLoading) return <div className="min-h-screen bg-slate-50"><EmployeeLoading label="Opening your workspace…" /></div>;
  if (!auth.isAuthenticated) return <Navigate to="/employee/login" replace state={{ from: location.pathname }} />;
  if (auth.user?.mustChangePassword && location.pathname !== '/employee/change-password') return <Navigate to="/employee/change-password" replace />;
  return <EmployeeLayout />;
}

function EmployeeLayout() {
  const { user, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <img src="/logo-doll.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Doll Pictures</p><p className="truncate text-xs text-slate-500">{user?.name} · {user?.employeeCode}</p></div>
          <button type="button" onClick={() => { logout(); navigate('/employee/login', { replace: true }); }} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(4.5rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur" aria-label="Employee navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}><Icon className="h-5 w-5" /><span className="truncate">{label}</span></NavLink>)}
      </nav>
    </div>
  );
}
