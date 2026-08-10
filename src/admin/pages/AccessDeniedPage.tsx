import { ArrowLeft, ShieldX } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getDefaultAdminRoute } from '../access/roles';
import { AdminCard } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export function AccessDeniedPage() {
  const { user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center">
      <AdminCard className="w-full p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <ShieldX className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-admin-text">You don’t have access to this page</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-admin-subtle">
          {from ? `Your current role cannot open ${from}.` : 'Your current role cannot open the requested area.'}
          {' '}Ask the studio owner if your responsibilities have changed.
        </p>
        <Link
          to={getDefaultAdminRoute(user)}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-admin-primary px-5 text-sm font-semibold text-white transition hover:bg-admin-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" /> Go to my workspace
        </Link>
      </AdminCard>
    </div>
  );
}
