import type {
  UserAccessArea,
  UserAccessLevel,
  UserPermissionOverrides,
  UserRole,
} from '../types';

export type RoleAccessLevel = UserAccessLevel;

export const ROLE_ACCESS_AREAS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'payments', label: 'Payments' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'content', label: 'Site content' },
  { id: 'photos', label: 'Photos' },
  { id: 'users', label: 'Users & access' },
] as const;

export type RoleAccessArea = UserAccessArea;

type RoleDetails = {
  label: string;
  shortLabel: string;
  description: string;
  badgeClassName: string;
  selectionClassName: string;
  access: Record<RoleAccessArea, RoleAccessLevel>;
};

export const ROLE_ORDER: UserRole[] = ['owner', 'sales', 'content_manager'];

export const ROLE_CATALOG: Record<UserRole, RoleDetails> = {
  owner: {
    label: 'Owner',
    shortLabel: 'Full access',
    description: 'Complete studio access, including payments, content, and staff accounts.',
    badgeClassName: 'bg-amber-100 text-amber-900',
    selectionClassName: 'border-amber-400 bg-amber-50 ring-amber-200',
    access: {
      dashboard: 'view',
      payments: 'manage',
      enquiries: 'manage',
      bookings: 'manage',
      schedule: 'manage',
      content: 'manage',
      photos: 'manage',
      users: 'manage',
    },
  },
  sales: {
    label: 'Sales',
    shortLabel: 'Studio operations',
    description: 'Manage enquiries, bookings, and schedules for day-to-day sales work.',
    badgeClassName: 'bg-blue-100 text-blue-800',
    selectionClassName: 'border-blue-500 bg-blue-50 ring-blue-200',
    access: {
      dashboard: 'view',
      payments: 'none',
      enquiries: 'manage',
      bookings: 'manage',
      schedule: 'manage',
      content: 'none',
      photos: 'none',
      users: 'none',
    },
  },
  content_manager: {
    label: 'Content Manager',
    shortLabel: 'Website and photos',
    description: 'Manage website content and photos, with read-only enquiry visibility.',
    badgeClassName: 'bg-violet-100 text-violet-800',
    selectionClassName: 'border-violet-500 bg-violet-50 ring-violet-200',
    access: {
      dashboard: 'view',
      payments: 'none',
      enquiries: 'view',
      bookings: 'none',
      schedule: 'none',
      content: 'manage',
      photos: 'manage',
      users: 'none',
    },
  },
};

export function normalizeUserRole(value: unknown, fallback: UserRole = 'sales'): UserRole {
  if (value === 'operations') return 'sales';
  if (value === 'owner' || value === 'sales' || value === 'content_manager') return value;
  return fallback;
}

export function normalizePermissionOverrides(value: unknown): UserPermissionOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const source = value as Record<string, unknown>;
  return ROLE_ACCESS_AREAS.reduce<UserPermissionOverrides>((overrides, { id }) => {
    const level = source[id];
    if (level === 'manage' || level === 'view' || level === 'none') overrides[id] = level;
    return overrides;
  }, {});
}

export function getOverrideCount(overrides?: UserPermissionOverrides): number {
  return Object.keys(overrides ?? {}).length;
}

export function getEffectiveAccess(
  role: UserRole,
  area: UserAccessArea,
  overrides?: UserPermissionOverrides,
): UserAccessLevel {
  return overrides?.[area] ?? ROLE_CATALOG[role].access[area];
}

export function getAccessSummary(role: UserRole): string[] {
  return ROLE_ACCESS_AREAS
    .filter(({ id }) => ROLE_CATALOG[role].access[id] !== 'none')
    .map(({ id, label }) => {
      const level = ROLE_CATALOG[role].access[id];
      return level === 'view' ? `${label} (view only)` : label;
    });
}
