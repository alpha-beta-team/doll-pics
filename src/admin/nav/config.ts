import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  CalendarHeart,
  CalendarRange,
  Camera,
  CircleDollarSign,
  FileSignature,
  FileText,
  FolderOpen,
  HelpCircle,
  Home,
  Image,
  Images,
  Mail,
  MessageSquareQuote,
  Package,
  PanelsTopLeft,
  Plug,
  Settings,
  Tags,
  UserCog,
  Users,
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
  options: Pick<NavigationNode, 'featureFlag' | 'mobileQuickOrder'> = {},
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
    id: 'studio-operations',
    label: 'Studio Operations',
    icon: CalendarDays,
    displayOrder: 20,
    children: [
      leaf('bookings', 'Bookings', '/admin/bookings', CalendarDays, 10, 'bookings', { mobileQuickOrder: 40 }),
      leaf('enquiries', 'Enquiries', '/admin/enquiries', Mail, 20, 'enquiries', { mobileQuickOrder: 30 }),
      leaf('occasions', 'Occasions', '/admin/occasions', CalendarHeart, 30, 'occasions'),
    ],
  },
  {
    id: 'sales-finance',
    label: 'Sales & Finance',
    icon: CircleDollarSign,
    displayOrder: 30,
    children: [
      leaf('quotations', 'Quotations', '/admin/quotations', FileSignature, 10, 'quotations'),
      leaf('payments', 'Payments', '/admin/payments', CircleDollarSign, 20, 'payments'),
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Images,
    featureFlag: 'portfolio',
    displayOrder: 40,
    children: [
      leaf('photos', 'Photos', '/admin/photos', Images, 10, 'photos'),
      leaf('categories', 'Categories', '/admin/categories', FolderOpen, 20, 'categories'),
      leaf('behind-scenes', 'Behind the Scenes', '/admin/behind-scenes', Camera, 30, 'behind_scenes'),
    ],
  },
  {
    id: 'packages',
    label: 'Packages',
    icon: Package,
    featureFlag: 'packages',
    displayOrder: 50,
    children: [
      leaf('all-packages', 'All Packages', '/admin/packages', Package, 10, 'packages'),
      leaf('package-categories', 'Package Categories', '/admin/package-categories', Tags, 20, 'package_categories'),
    ],
  },
  {
    id: 'website',
    label: 'Website',
    icon: PanelsTopLeft,
    featureFlag: 'website',
    displayOrder: 60,
    children: [
      leaf('hero-slides', 'Hero Slides', '/admin/hero-slides', Image, 10, 'hero_slides'),
      leaf('story-scenes', 'Story Scenes', '/admin/story-scenes', FileText, 20, 'story_scenes'),
      leaf('statistics', 'Statistics', '/admin/stats', BarChart3, 30, 'statistics'),
      leaf('testimonials', 'Testimonials', '/admin/testimonials', MessageSquareQuote, 40, 'testimonials'),
      leaf('staff-profiles', 'Team Members', '/admin/staff-profiles', Users, 50, 'staff_profiles'),
      leaf('site-content', 'General Site Content', '/admin/site-content', FileText, 60, 'site_content'),
    ],
  },
];

export const UTILITY_NAVIGATION: NavigationNode[] = [
  {
    id: 'studio-settings',
    label: 'Studio Settings',
    icon: Settings,
    displayOrder: 10,
    children: [
      leaf('staff-accounts', 'Staff Accounts', '/admin/staff-accounts', UserCog, 10, 'staff_accounts'),
      leaf('integrations', 'Integrations', '/admin/integrations', Plug, 20, 'integrations', { featureFlag: 'integrations' }),
    ],
  },
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
