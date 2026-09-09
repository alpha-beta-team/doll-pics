import { ChevronDown } from 'lucide-react';
import type { BookingListScope } from './bookingList';

type BookingViewSwitchProps = {
  scope: BookingListScope;
  pendingCount: number;
  totalCount: number;
  onScopeChange: (scope: BookingListScope) => void;
};

export function BookingViewSelect({ scope, pendingCount, totalCount, onScopeChange }: BookingViewSwitchProps) {
  return <label className="enquiry-view-select relative inline-flex shrink-0">
    <select aria-label="Booking view" aria-controls="booking-list-panel" value={scope} onChange={event => onScopeChange(event.target.value as BookingListScope)} className="appearance-none outline-none focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2">
      <option value="pending">Pending shoots ({pendingCount})</option><option value="all">All bookings ({totalCount})</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" aria-hidden="true" />
  </label>;
}

export function BookingListHeader({ title, count }: { title?: string; count: number }) {
  return (
    <div className="flex min-h-7 items-center px-1">
      <h2 id="booking-list-title" className="truncate text-sm font-medium text-admin-subtle">
        {title ? <><span className="font-semibold text-admin-text">{title}</span> · </> : 'Showing '}
        <span className="tabular-nums">{count} {count === 1 ? 'record' : 'records'}</span>
      </h2>
    </div>
  );
}
