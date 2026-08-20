import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CalendarHeart,
  CalendarRange,
  Camera,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileSignature,
  FileText,
  FolderOpen,
  HelpCircle,
  Home,
  Image,
  Images,
  LayoutList,
  Mail,
  MapPinned,
  MessageSquareQuote,
  Package,
  PanelsTopLeft,
  Plug,
  Tags,
  UserCog,
  Users,
  FileSpreadsheet,
  WalletCards,
} from 'lucide-react';
import { canManage, canView, FEATURE_CATALOG, type FeatureDetails, type FeatureFlagId } from '../access/roles';
import type { StaffAccount, StaffAccessArea } from '../types';

export type NavigationAccess = { feature: StaffAccessArea; level: 'view' | 'manage' };
export type AdminFeatureFlag = FeatureFlagId;

export type NavigationNode = {
  id: string;
  label: string;
  route?: string;
  icon: LucideIcon;
  children?: NavigationNode[];
  subgroupLabel?: string;
  access?: NavigationAccess;
  featureFlag?: AdminFeatureFlag;
  displayOrder: number;
  mobileQuickOrder?: number;
};

export type AdminFeatureFlags = Partial<Record<AdminFeatureFlag, boolean>>;

export type StudioWorkspace = {
  id: string;
  name: string;
  descriptor: string;
  logoUrl: string;
};

export const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';
export const SIDEBAR_EXPANDED_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const APP_VERSION = 'v1.0.0';

export const STUDIO_WORKSPACES: StudioWorkspace[] = [
  {
    id: 'doll-pictures',
    name: 'Doll Pictures',
    descriptor: 'Photography Studio',
    logoUrl: '/logo-doll.png',
  },
];

const leaf = (
  id: string,
  label: string,
  route: string,
  icon: LucideIcon,
  displayOrder: number,
  feature?: StaffAccessArea,
  options: Pick<NavigationNode, 'featureFlag' | 'mobileQuickOrder' | 'subgroupLabel'> = {},
): NavigationNode => {
  const registered = feature ? FEATURE_CATALOG[feature] : undefined;
  const navigation = registered?.navigation as FeatureDetails['navigation'] | undefined;
  return {
  id: navigation?.id ?? id,
  label: navigation?.label ?? label,
  route: registered?.routes[0] ?? route,
  icon,
  displayOrder: navigation?.displayOrder ?? displayOrder,
  access: feature ? { feature, level: 'view' } : undefined,
  featureFlag: navigation?.featureFlag ?? options.featureFlag,
  mobileQuickOrder: navigation?.mobileQuickOrder ?? options.mobileQuickOrder,
  subgroupLabel: options.subgroupLabel,
};
};

export const PRIMARY_NAVIGATION: NavigationNode[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    displayOrder: 10,
    children: [
      leaf('today', 'Today', '/admin/today', Home, 10, 'today', { mobileQuickOrder: 10 }),
      leaf('schedule', 'Schedule', '/admin/schedule', CalendarRange, 20, 'schedule', { mobileQuickOrder: 20 }),
      leaf('reports-summary', 'Dashboard', '/admin/dashboard', BarChart3, 30, 'dashboard', { featureFlag: 'reports' }),
    ],
  },
  {
    id: 'bookings-sales',
    label: 'Bookings & Sales',
    icon: CalendarDays,
    displayOrder: 20,
    children: [
      leaf('enquiries', 'Enquiries', '/admin/enquiries', Mail, 10, 'enquiries', { mobileQuickOrder: 30 }),
      leaf('bookings', 'Bookings', '/admin/bookings', CalendarDays, 20, 'bookings', { mobileQuickOrder: 40 }),
      leaf('occasions', 'Occasions', '/admin/occasions', CalendarHeart, 30, 'occasions'),
      leaf('quotations', 'Quotations', '/admin/quotations', FileSignature, 40, 'quotations'),
      leaf('payments', 'Revenue & Payments', '/admin/payments', CircleDollarSign, 50, 'payments'),
    ],
  },
  {
    id: 'staff-management',
    label: 'Staff Management',
    icon: UserCog,
    displayOrder: 30,
    children: [
      leaf('staff-accounts', 'Staff Accounts', '/admin/staff-accounts', UserCog, 10, 'staff_accounts', { subgroupLabel: 'Staff' }),
      leaf('salary-management', 'Salary Management', '/admin/staff-accounts/salary', WalletCards, 20, 'salary_management', { subgroupLabel: 'Staff' }),
      { id: 'attendance-overview', label: 'Attendance', route: '/admin/attendance', icon: Clock3, displayOrder: 20, subgroupLabel: 'Attendance & Leave', access: { feature: 'staff_accounts', level: 'view' } },
      { id: 'attendance-requests', label: 'Leave Requests', route: '/admin/attendance/requests', icon: ClipboardCheck, displayOrder: 30, subgroupLabel: 'Attendance & Leave', access: { feature: 'staff_accounts', level: 'view' } },
      { id: 'attendance-calendar', label: 'Team Calendar', route: '/admin/attendance/calendar', icon: CalendarCheck2, displayOrder: 40, subgroupLabel: 'Attendance & Leave', access: { feature: 'staff_accounts', level: 'view' } },
      { id: 'field-assignments', label: 'Field Assignments', route: '/admin/attendance/field-assignments', icon: MapPinned, displayOrder: 50, subgroupLabel: 'Attendance & Leave', access: { feature: 'staff_accounts', level: 'view' } },
      { id: 'attendance-reports', label: 'Attendance Reports', route: '/admin/attendance/reports', icon: FileSpreadsheet, displayOrder: 60, subgroupLabel: 'Attendance & Leave', access: { feature: 'staff_accounts', level: 'view' } },
      { id: 'attendance-settings', label: 'Attendance Settings', route: '/admin/attendance/settings', icon: Clock3, displayOrder: 70, subgroupLabel: 'Attendance & Leave', access: { feature: 'staff_accounts', level: 'view' } },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    icon: PanelsTopLeft,
    displayOrder: 40,
    children: [
      leaf('hero-slides', 'Hero Slides', '/admin/hero-slides', Image, 10, 'hero_slides', { subgroupLabel: 'Homepage' }),
      leaf('story-scenes', 'Story Scenes', '/admin/story-scenes', FileText, 20, 'story_scenes', { subgroupLabel: 'Homepage' }),
      leaf('statistics', 'Statistics', '/admin/stats', BarChart3, 30, 'statistics', { subgroupLabel: 'Homepage' }),
      {
        id: 'services',
        label: 'Services',
        route: '/admin/services',
        icon: LayoutList,
        displayOrder: 40,
        access: { feature: 'site_content', level: 'view' },
        featureFlag: 'website',
        subgroupLabel: 'Services & Packages',
      },
      leaf('all-packages', 'All Packages', '/admin/packages', Package, 50, 'packages', { subgroupLabel: 'Services & Packages' }),
      leaf('package-categories', 'Package Categories', '/admin/package-categories', Tags, 60, 'package_categories', { subgroupLabel: 'Services & Packages' }),
      leaf('photos', 'Photos', '/admin/photos', Images, 70, 'photos', { subgroupLabel: 'Portfolio' }),
      leaf('categories', 'Photo Categories', '/admin/categories', FolderOpen, 80, 'categories', { subgroupLabel: 'Portfolio' }),
      leaf('behind-scenes', 'Behind the Scenes', '/admin/behind-scenes', Camera, 90, 'behind_scenes', { subgroupLabel: 'Portfolio' }),
      leaf('testimonials', 'Testimonials', '/admin/testimonials', MessageSquareQuote, 100, 'testimonials', { subgroupLabel: 'People & Trust' }),
      leaf('staff-profiles', 'Team Members', '/admin/staff-profiles', Users, 110, 'staff_profiles', { subgroupLabel: 'People & Trust' }),
      leaf('site-content', 'Site Settings', '/admin/site-content', FileText, 120, 'site_content', { subgroupLabel: 'Settings' }),
    ],
  },
];

export const UTILITY_NAVIGATION: NavigationNode[] = [
  leaf('integrations', 'Integrations', '/admin/integrations', Plug, 10, 'integrations', { featureFlag: 'integrations' }),
  leaf('help', 'Quick Guide / Help', '/admin/help', HelpCircle, 20),
];

export const ADMIN_FEATURE_FLAGS: AdminFeatureFlags = {
  reports: true,
  portfolio: true,
  packages: true,
  website: true,
  integrations: true,
};

function meetsAccess(user: StaffAccount | null | undefined, access?: NavigationAccess) {
  if (!access) return Boolean(user);
  return access.level === 'manage'
    ? canManage(user, access.feature)
    : canView(user, access.feature);
}

export function resolveNavigation(
  nodes: NavigationNode[],
  user?: StaffAccount | null,
  featureFlags: AdminFeatureFlags = ADMIN_FEATURE_FLAGS,
): NavigationNode[] {
  return nodes
    .filter((node) => meetsAccess(user, node.access))
    .filter((node) => !node.featureFlag || featureFlags[node.featureFlag] !== false)
    .map((node) => ({
      ...node,
      children: node.children
        ? resolveNavigation(node.children, user, featureFlags)
        : undefined,
    }))
    .filter((node) => !node.children || node.children.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function flattenNavigation(nodes: NavigationNode[]): NavigationNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenNavigation(node.children) : [])]);
}

export function routeMatches(pathname: string, route: string) {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const normalizedRoute = route.replace(/\/$/, '') || '/';
  return normalizedPath === normalizedRoute || normalizedPath.startsWith(`${normalizedRoute}/`);
}

export function activeNavigationRoute(nodes: NavigationNode[], pathname: string) {
  return flattenNavigation(nodes)
    .filter((node): node is NavigationNode & { route: string } => Boolean(node.route))
    .filter((node) => routeMatches(pathname, node.route))
    .sort((a, b) => b.route.length - a.route.length)[0]?.route;
}

export function mobileQuickNavigation(nodes: NavigationNode[]) {
  return flattenNavigation(nodes)
    .filter((node): node is NavigationNode & { route: string; mobileQuickOrder: number } =>
      Boolean(node.route && node.mobileQuickOrder),
    )
    .sort((a, b) => a.mobileQuickOrder - b.mobileQuickOrder);
}
