import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { canManage, canView, getDefaultAdminRoute } from '../access/roles';
import { useAuth } from '../contexts/AuthContext';
import type { StaffAccessArea } from '../types';

export function AccessRoute({ feature, level = 'view' }: { feature: StaffAccessArea; level?: 'view' | 'manage' }) {
  const { user } = useAuth();
  const location = useLocation();
  const allowed = level === 'manage' ? canManage(user, feature) : canView(user, feature);

  return allowed
    ? <Outlet />
    : <Navigate to="/admin/access-denied" replace state={{ from: location.pathname }} />;
}

export function DefaultAdminRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDefaultAdminRoute(user)} replace />;
}
