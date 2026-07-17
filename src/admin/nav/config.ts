import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  CalendarDays,
  Mail,
  Images,
  FolderOpen,
  Camera,
  Package,
  Tags,
  PanelsTopLeft,
  Image,
  FileText,
  BarChart3,
  MessageSquareQuote,
  Users,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavItem[];
};

export type NavSectionEntry =
  | { type: 'link'; item: NavItem }
  | { type: 'group'; group: NavGroup };

export type NavSection = {
  id: string;
  label: string;
  items: NavSectionEntry[];
};

export const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';
export const SIDEBAR_EXPANDED_WIDTH = 270;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const APP_VERSION = 'v1.0.0';

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        type: 'link',
        item: { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      {
        type: 'link',
        item: { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
      },
      {
        type: 'link',
        item: { to: '/admin/enquiries', label: 'Enquiries', icon: Mail },
      },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    items: [
      {
        type: 'link',
        item: { to: '/admin/photos', label: 'Photos', icon: Images },
      },
      {
        type: 'link',
        item: { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
      },
      {
        type: 'link',
        item: { to: '/admin/behind-scenes', label: 'Behind the Scenes', icon: Camera },
      },
    ],
  },
  {
    id: 'packages',
    label: 'Packages',
    items: [
      {
        type: 'link',
        item: { to: '/admin/packages', label: 'Packages', icon: Package },
      },
      {
        type: 'link',
        item: { to: '/admin/package-categories', label: 'Package Categories', icon: Tags },
      },
    ],
  },
  {
    id: 'website',
    label: 'Website Content',
    items: [
      {
        type: 'group',
        group: {
          id: 'homepage',
          label: 'Homepage',
          icon: PanelsTopLeft,
          children: [
            { to: '/admin/hero-slides', label: 'Hero Slides', icon: Image },
            { to: '/admin/story-scenes', label: 'Story Scenes', icon: FileText },
            { to: '/admin/stats', label: 'Statistics', icon: BarChart3 },
            { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
            { to: '/admin/team-members', label: 'Team Members', icon: Users },
          ],
        },
      },
      {
        type: 'link',
        item: { to: '/admin/site-content', label: 'Site Content', icon: FileText },
      },
    ],
  },
];
