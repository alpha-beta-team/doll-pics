import { useAuth } from '../contexts/AuthContext';
import type { StaffAccessArea } from '../types';
import { resolveStaffAccess } from './roles';

export function useFeatureAccess(feature: StaffAccessArea) {
  const { user } = useAuth();
  const level = resolveStaffAccess(user, feature);
  return {
    level,
    canView: level !== 'none',
    canManage: level === 'manage',
    isReadOnly: level === 'view',
  };
}
