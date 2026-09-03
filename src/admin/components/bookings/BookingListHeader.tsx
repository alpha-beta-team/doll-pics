import type { BookingListScope } from './bookingList';

type BookingViewSwitchProps = {
  scope: BookingListScope;
  pendingCount: number;
  totalCount: number;
  onScopeChange: (scope: BookingListScope) => void;
};

export function BookingViewSwitch({
  scope,
  pendingCount,
  totalCount,
  onScopeChange,
}: BookingViewSwitchProps) {
  return (
    <div className="inline-flex w-fit rounded-lg border border-admin-border bg-admin-muted/60 p-1" role="group" aria-label="Booking view">
      <button
        type="button"
        aria-pressed={scope === 'pending'}
        onClick={() => onScopeChange('pending')}
        className={`min-h-9 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'pending' ? 'bg-admin-primary text-white shadow-sm' : 'text-admin-secondary hover:bg-admin-surface hover:text-admin-text'}`}
      >
        Pending shoots <span className={`ml-1 tabular-nums ${scope === 'pending' ? 'text-white/75' : 'text-admin-subtle'}`}>{pendingCount}</span>
      </button>
      <button
        type="button"
        aria-pressed={scope === 'all'}
        onClick={() => onScopeChange('all')}
        className={`min-h-9 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'all' ? 'bg-admin-primary text-white shadow-sm' : 'text-admin-secondary hover:bg-admin-surface hover:text-admin-text'}`}
      >
        All bookings <span className={`ml-1 tabular-nums ${scope === 'all' ? 'text-white/75' : 'text-admin-subtle'}`}>{totalCount}</span>
      </button>
    </div>
  );
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
