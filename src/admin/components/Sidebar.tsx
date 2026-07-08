import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Images,
  FolderOpen,
  Package,
  FileText,
  Mail,
  Camera,
  Users,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/photos', label: 'Photos', icon: Images },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/site-content', label: 'Site Content', icon: FileText },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Mail },
];

const homepageItems = [
  { to: '/admin/hero-slides', label: 'Hero Slides', icon: Images },
  { to: '/admin/story-scenes', label: 'Story Scenes', icon: FileText },
  { to: '/admin/stats', label: 'Statistics', icon: LayoutDashboard },
  { to: '/admin/testimonials', label: 'Testimonials', icon: Mail },
  { to: '/admin/behind-scenes', label: 'Behind the Scenes', icon: Camera },
  { to: '/admin/team-members', label: 'Team Members', icon: Users },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Camera className="w-6 h-6 text-blue-600" />
        <span className="ml-2 font-semibold text-gray-900">Studio CMS</span>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="px-3 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Homepage
        </p>
        <ul className="space-y-1">
          {homepageItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Lumina Photography CMS</p>
        <p className="text-xs text-gray-400 mt-1">v1.0.0</p>
      </div>
    </aside>
  );
}
