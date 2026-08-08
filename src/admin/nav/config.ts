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
import type { User } from '../types';

export type AdminPermission = 'authenticated' | 'owner';
export type AdminFeatureFlag =
  | 'reports'
  | 'portfolio'
  | 'packages'
  | 'website'
  | 'integrations';

export type NavigationNode = {
  id: string;
  label: string;
  route?: string;
  icon: LucideIcon;
  children?: NavigationNode[];
  requiredPermission: AdminPermission;
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
  requiredPermission: AdminPermission = 'authenticated',
  options: Pick<NavigationNode, 'featureFlag' | 'mobileQuickOrder'> = {},
): NavigationNode => ({
  id,
  label,
  route,
  icon,
  displayOrder,
  requiredPermission,
  ...options,
});

export const PRIMARY_NAVIGATION: NavigationNode[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    requiredPermission: 'authenticated',
    displayOrder: 10,
    children: [
      leaf('today', 'Today', '/admin/today', Home, 10, 'authenticated', { mobileQuickOrder: 10 }),
      leaf('schedule', 'Schedule', '/admin/schedule', CalendarRange, 20, 'authenticated', { mobileQuickOrder: 20 }),
      leaf('reports-summary', 'Reports Summary', '/admin/dashboard', BarChart3, 30, 'owner', { featureFlag: 'reports' }),
    ],
  },
  {
    id: 'studio-operations',
    label: 'Studio Operations',
    icon: CalendarDays,
    requiredPermission: 'authenticated',
    displayOrder: 20,
    children: [
      leaf('bookings', 'Bookings', '/admin/bookings', CalendarDays, 10, 'authenticated', { mobileQuickOrder: 40 }),
      leaf('enquiries', 'Enquiries', '/admin/enquiries', Mail, 20, 'authenticated', { mobileQuickOrder: 30 }),
      leaf('occasions', 'Occasions', '/admin/occasions', CalendarHeart, 30),
    ],
  },
  {
    id: 'sales-finance',
    label: 'Sales & Finance',
    icon: CircleDollarSign,
    requiredPermission: 'authenticated',
    displayOrder: 30,
    children: [
      leaf('quotations', 'Quotations', '/admin/quotations', FileSignature, 10),
      leaf('payments', 'Payments', '/admin/payments', CircleDollarSign, 20),
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Images,
    requiredPermission: 'owner',
    featureFlag: 'portfolio',
    displayOrder: 40,
    children: [
      leaf('photos', 'Photos', '/admin/photos', Images, 10, 'owner'),
      leaf('categories', 'Categories', '/admin/categories', FolderOpen, 20, 'owner'),
      leaf('behind-scenes', 'Behind the Scenes', '/admin/behind-scenes', Camera, 30, 'owner'),
    ],
  },
  {
    id: 'packages',
    label: 'Packages',
    icon: Package,
    requiredPermission: 'owner',
    featureFlag: 'packages',
    displayOrder: 50,
    children: [
      leaf('all-packages', 'All Packages', '/admin/packages', Package, 10, 'owner'),
      leaf('package-categories', 'Package Categories', '/admin/package-categories', Tags, 20, 'owner'),
    ],
  },
  {
    id: 'website',
    label: 'Website',
    icon: PanelsTopLeft,
    requiredPermission: 'owner',
    featureFlag: 'website',
    displayOrder: 60,
    children: [
      leaf('hero-slides', 'Hero Slides', '/admin/hero-slides', Image, 10, 'owner'),
      leaf('story-scenes', 'Story Scenes', '/admin/story-scenes', FileText, 20, 'owner'),
      leaf('statistics', 'Statistics', '/admin/stats', BarChart3, 30, 'owner'),
      leaf('testimonials', 'Testimonials', '/admin/testimonials', MessageSquareQuote, 40, 'owner'),
      leaf('team-members', 'Team Members', '/admin/team-members', Users, 50, 'owner'),
      leaf('site-content', 'General Site Content', '/admin/site-content', FileText, 60, 'owner'),
    ],
  },
];

export const UTILITY_NAVIGATION: NavigationNode[] = [
  {
    id: 'studio-settings',
    label: 'Studio Settings',
    icon: Settings,
    requiredPermission: 'owner',
    displayOrder: 10,
    children: [
      leaf('staff-accounts', 'Staff Accounts', '/admin/users', UserCog, 10, 'owner'),
      leaf('integrations', 'Integrations', '/admin/integrations', Plug, 20, 'owner', { featureFlag: 'integrations' }),
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

function canAccess(permission: AdminPermission, role?: User['role']) {
  if (!role) return false;
  return permission === 'authenticated' || role === 'owner';
}

export function resolveNavigation(
  nodes: NavigationNode[],
  role?: User['role'],
  featureFlags: AdminFeatureFlags = ADMIN_FEATURE_FLAGS,
): NavigationNode[] {
  return nodes
    .filter((node) => canAccess(node.requiredPermission, role))
    .filter((node) => !node.featureFlag || featureFlags[node.featureFlag] !== false)
    .map((node) => ({
      ...node,
      children: node.children
        ? resolveNavigation(node.children, role, featureFlags)
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
