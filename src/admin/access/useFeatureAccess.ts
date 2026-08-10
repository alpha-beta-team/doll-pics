import { useAuth } from '../contexts/AuthContext';
import type { UserAccessArea } from '../types';
import { resolveUserAccess } from './roles';

export function useFeatureAccess(feature: UserAccessArea) {
  const { user } = useAuth();
  const level = resolveUserAccess(user, feature);
  return {
    level,
    canView: level !== 'none',
    canManage: level === 'manage',
    isReadOnly: level === 'view',
  };
}
