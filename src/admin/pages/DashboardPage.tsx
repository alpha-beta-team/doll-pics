import { Link } from 'react-router-dom';
import {
  Images,
  FolderOpen,
  Package,
  Mail,
  CalendarDays,
  LayoutDashboard,
} from 'lucide-react';

const QUICK_LINKS = [
  { to: '/admin/photos', label: 'Photos', icon: Images },
  { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Mail },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
] as const;

/** Lightweight admin home — stats dashboard deferred until a dedicated API exists. */
export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your photography studio</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Stats coming later</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              The overview counters were removed to avoid loading every photo,
              package, and enquiry on each visit. A proper dashboard API will
              power this page later.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
            Quick links
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-500" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
