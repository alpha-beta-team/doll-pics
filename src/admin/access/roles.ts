import type {
  StaffAccount,
  StaffAccessArea,
  StaffAccessLevel,
  StaffPermissionOverrides,
  StaffAccountRole,
} from '../types';

export type RoleAccessLevel = StaffAccessLevel;
export type RoleAccessArea = StaffAccessArea;
export type FeatureGroupId = 'overview' | 'sales' | 'content' | 'settings';
export type FeatureFlagId = 'reports' | 'portfolio' | 'packages' | 'website' | 'integrations';
export type NavigationSectionId = 'overview' | 'studio_operations' | 'sales_finance' | 'portfolio' | 'packages' | 'website' | 'settings';

export const FEATURE_GROUPS: Array<{ id: FeatureGroupId; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Daily workspace and dashboard' },
  { id: 'sales', label: 'Sales', description: 'Leads, bookings, schedules, and quotations' },
  { id: 'content', label: 'Content', description: 'Portfolio, packages, and website content' },
  { id: 'settings', label: 'Owner settings', description: 'Financial, integration, and staff settings' },
];

export type FeatureDetails = {
  label: string;
  group: FeatureGroupId;
  routes: readonly string[];
  ownerLocked?: boolean;
  supportedLevels: readonly StaffAccessLevel[];
  navigation: {
    id: string;
    label: string;
    section: NavigationSectionId;
    displayOrder: number;
    mobileQuickOrder?: number;
    featureFlag?: FeatureFlagId;
  };
};

const editableLevels = ['none', 'view', 'manage'] as const;
const ownerOnlyLevels = ['none', 'manage'] as const;

export const FEATURE_CATALOG = {
  dashboard: { label: 'Dashboard', group: 'overview', routes: ['/admin/dashboard'], supportedLevels: editableLevels, navigation: { id: 'reports-summary', label: 'Dashboard', section: 'overview', displayOrder: 30, featureFlag: 'reports' } },
  today: { label: 'Today', group: 'overview', routes: ['/admin/today'], supportedLevels: editableLevels, navigation: { id: 'today', label: 'Today', section: 'overview', displayOrder: 10, mobileQuickOrder: 10 } },
  enquiries: { label: 'Enquiries', group: 'sales', routes: ['/admin/enquiries', '/admin/enquiries/:id'], supportedLevels: editableLevels, navigation: { id: 'enquiries', label: 'Enquiries', section: 'studio_operations', displayOrder: 20, mobileQuickOrder: 30 } },
  bookings: { label: 'Bookings', group: 'sales', routes: ['/admin/bookings', '/admin/bookings/:id'], supportedLevels: editableLevels, navigation: { id: 'bookings', label: 'Bookings', section: 'studio_operations', displayOrder: 10, mobileQuickOrder: 40 } },
  schedule: { label: 'Schedule', group: 'sales', routes: ['/admin/schedule'], supportedLevels: editableLevels, navigation: { id: 'schedule', label: 'Schedule', section: 'overview', displayOrder: 20, mobileQuickOrder: 20 } },
  occasions: { label: 'Occasions', group: 'sales', routes: ['/admin/occasions'], supportedLevels: editableLevels, navigation: { id: 'occasions', label: 'Occasions', section: 'studio_operations', displayOrder: 30 } },
  quotations: { label: 'Quotations', group: 'sales', routes: ['/admin/quotations', '/admin/quotations/:id'], supportedLevels: editableLevels, navigation: { id: 'quotations', label: 'Quotations', section: 'sales_finance', displayOrder: 10 } },
  payments: { label: 'Payments', group: 'settings', routes: ['/admin/payments'], ownerLocked: true, supportedLevels: ownerOnlyLevels, navigation: { id: 'payments', label: 'Payments', section: 'sales_finance', displayOrder: 20 } },
  photos: { label: 'Photos', group: 'content', routes: ['/admin/photos'], supportedLevels: editableLevels, navigation: { id: 'photos', label: 'Photos', section: 'portfolio', displayOrder: 10, featureFlag: 'portfolio' } },
  categories: { label: 'Categories', group: 'content', routes: ['/admin/categories'], supportedLevels: editableLevels, navigation: { id: 'categories', label: 'Categories', section: 'portfolio', displayOrder: 20, featureFlag: 'portfolio' } },
  packages: { label: 'Packages', group: 'content', routes: ['/admin/packages'], supportedLevels: editableLevels, navigation: { id: 'all-packages', label: 'All Packages', section: 'packages', displayOrder: 10, featureFlag: 'packages' } },
  package_categories: { label: 'Package categories', group: 'content', routes: ['/admin/package-categories'], supportedLevels: editableLevels, navigation: { id: 'package-categories', label: 'Package Categories', section: 'packages', displayOrder: 20, featureFlag: 'packages' } },
  hero_slides: { label: 'Hero slides', group: 'content', routes: ['/admin/hero-slides'], supportedLevels: editableLevels, navigation: { id: 'hero-slides', label: 'Hero Slides', section: 'website', displayOrder: 10, featureFlag: 'website' } },
  story_scenes: { label: 'Story scenes', group: 'content', routes: ['/admin/story-scenes'], supportedLevels: editableLevels, navigation: { id: 'story-scenes', label: 'Story Scenes', section: 'website', displayOrder: 20, featureFlag: 'website' } },
  statistics: { label: 'Statistics', group: 'content', routes: ['/admin/stats'], supportedLevels: editableLevels, navigation: { id: 'statistics', label: 'Statistics', section: 'website', displayOrder: 30, featureFlag: 'website' } },
  testimonials: { label: 'Testimonials', group: 'content', routes: ['/admin/testimonials'], supportedLevels: editableLevels, navigation: { id: 'testimonials', label: 'Testimonials', section: 'website', displayOrder: 40, featureFlag: 'website' } },
  behind_scenes: { label: 'Behind the scenes', group: 'content', routes: ['/admin/behind-scenes'], supportedLevels: editableLevels, navigation: { id: 'behind-scenes', label: 'Behind the Scenes', section: 'portfolio', displayOrder: 30, featureFlag: 'portfolio' } },
  staff_profiles: { label: 'Staff profiles', group: 'content', routes: ['/admin/staff-profiles'], supportedLevels: editableLevels, navigation: { id: 'staff-profiles', label: 'Team Members', section: 'website', displayOrder: 50, featureFlag: 'website' } },
  site_content: { label: 'General site content', group: 'content', routes: ['/admin/site-content'], supportedLevels: editableLevels, navigation: { id: 'site-content', label: 'General Site Content', section: 'website', displayOrder: 60, featureFlag: 'website' } },
  integrations: { label: 'Integrations', group: 'settings', routes: ['/admin/integrations'], ownerLocked: true, supportedLevels: ownerOnlyLevels, navigation: { id: 'integrations', label: 'Integrations', section: 'settings', displayOrder: 20, featureFlag: 'integrations' } },
  staff_accounts: { label: 'Staff accounts & access', group: 'settings', routes: ['/admin/staff-accounts'], ownerLocked: true, supportedLevels: ownerOnlyLevels, navigation: { id: 'staff-accounts', label: 'Staff Accounts', section: 'settings', displayOrder: 10 } },
} as const satisfies Record<StaffAccessArea, FeatureDetails>;

export const FEATURE_ORDER = Object.keys(FEATURE_CATALOG) as StaffAccessArea[];
export const ROLE_ACCESS_AREAS = FEATURE_ORDER.map((id) => ({ id, label: FEATURE_CATALOG[id].label }));

export function isOwnerLockedFeature(area: StaffAccessArea): boolean {
  return Boolean((FEATURE_CATALOG[area] as FeatureDetails).ownerLocked);
}

type RoleDetails = {
  label: string;
  shortLabel: string;
  description: string;
  badgeClassName: string;
  selectionClassName: string;
  access: Record<StaffAccessArea, StaffAccessLevel>;
};

export const ROLE_ORDER: StaffAccountRole[] = ['owner', 'sales', 'content_manager'];

export const ROLE_CATALOG: Record<StaffAccountRole, RoleDetails> = {
  owner: {
    label: 'Owner',
    shortLabel: 'Full access',
    description: 'Complete studio access, including payments, content, and staff accounts.',
    badgeClassName: 'bg-amber-100 text-amber-900',
    selectionClassName: 'border-amber-400 bg-amber-50 ring-amber-200',
    access: {
      dashboard: 'view', today: 'manage', enquiries: 'manage', bookings: 'manage', schedule: 'manage',
      occasions: 'manage', quotations: 'manage', payments: 'manage', photos: 'manage', categories: 'manage',
      packages: 'manage', package_categories: 'manage', hero_slides: 'manage', story_scenes: 'manage',
      statistics: 'manage', testimonials: 'manage', behind_scenes: 'manage', staff_profiles: 'manage',
      site_content: 'manage', integrations: 'manage', staff_accounts: 'manage',
    },
  },
  sales: {
    label: 'Sales',
    shortLabel: 'Studio operations',
    description: 'Manage enquiries, bookings, schedules, occasions, and quotations.',
    badgeClassName: 'bg-blue-100 text-blue-800',
    selectionClassName: 'border-blue-500 bg-blue-50 ring-blue-200',
    access: {
      dashboard: 'view', today: 'manage', enquiries: 'manage', bookings: 'manage', schedule: 'manage',
      occasions: 'manage', quotations: 'manage', payments: 'none', photos: 'none', categories: 'none',
      packages: 'none', package_categories: 'none', hero_slides: 'none', story_scenes: 'none',
      statistics: 'none', testimonials: 'none', behind_scenes: 'none', staff_profiles: 'none',
      site_content: 'none', integrations: 'none', staff_accounts: 'none',
    },
  },
  content_manager: {
    label: 'Content Manager',
    shortLabel: 'Website and photos',
    description: 'Manage portfolio, packages, and website content, with read-only enquiry visibility.',
    badgeClassName: 'bg-violet-100 text-violet-800',
    selectionClassName: 'border-violet-500 bg-violet-50 ring-violet-200',
    access: {
      dashboard: 'view', today: 'none', enquiries: 'view', bookings: 'none', schedule: 'none',
      occasions: 'none', quotations: 'none', payments: 'none', photos: 'manage', categories: 'manage',
      packages: 'manage', package_categories: 'manage', hero_slides: 'manage', story_scenes: 'manage',
      statistics: 'manage', testimonials: 'manage', behind_scenes: 'manage', staff_profiles: 'manage',
      site_content: 'manage', integrations: 'none', staff_accounts: 'none',
    },
  },
};

export function normalizeStaffAccountRole(value: unknown, fallback: StaffAccountRole = 'sales'): StaffAccountRole {
  if (value === 'operations') return 'sales';
  if (value === 'owner' || value === 'sales' || value === 'content_manager') return value;
  return fallback;
}

export function normalizePermissionOverrides(value: unknown): StaffPermissionOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return FEATURE_ORDER.reduce<StaffPermissionOverrides>((overrides, id) => {
    if (isOwnerLockedFeature(id)) return overrides;
    const level = source[id];
    if (level === 'manage' || level === 'view' || level === 'none') overrides[id] = level;
    return overrides;
  }, {});
}

export function getOverrideCount(overrides?: StaffPermissionOverrides): number {
  return Object.keys(normalizePermissionOverrides(overrides)).length;
}

export function getEffectiveAccess(
  role: StaffAccountRole,
  area: StaffAccessArea,
  overrides?: StaffPermissionOverrides,
): StaffAccessLevel {
  if (isOwnerLockedFeature(area)) return role === 'owner' ? ROLE_CATALOG.owner.access[area] : 'none';
  if (role === 'owner') return ROLE_CATALOG.owner.access[area];
  return overrides?.[area] ?? ROLE_CATALOG[role].access[area];
}

export function resolveStaffAccess(user: StaffAccount | null | undefined, area: StaffAccessArea): StaffAccessLevel {
  if (!user || user.isActive === false) return 'none';
  return getEffectiveAccess(user.role, area, user.permissionOverrides);
}

export function canView(user: StaffAccount | null | undefined, area: StaffAccessArea): boolean {
  return resolveStaffAccess(user, area) !== 'none';
}

export function canManage(user: StaffAccount | null | undefined, area: StaffAccessArea): boolean {
  return resolveStaffAccess(user, area) === 'manage';
}

export function getDefaultAdminRoute(user: StaffAccount | null | undefined): string {
  if (canView(user, 'today')) return '/admin/today';
  if (canView(user, 'dashboard')) return '/admin/dashboard';
  const first = FEATURE_ORDER.find((feature) => canView(user, feature));
  return first ? FEATURE_CATALOG[first].routes[0] : '/admin/help';
}

export function getAccessSummary(role: StaffAccountRole): string[] {
  return FEATURE_ORDER
    .filter((id) => ROLE_CATALOG[role].access[id] !== 'none')
    .map((id) => {
      const level = ROLE_CATALOG[role].access[id];
      return level === 'view' ? `${FEATURE_CATALOG[id].label} (view only)` : FEATURE_CATALOG[id].label;
    });
}
