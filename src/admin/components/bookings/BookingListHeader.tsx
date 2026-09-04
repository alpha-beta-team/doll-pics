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
    <div className="inline-flex w-fit rounded-lg bg-admin-muted p-0.5" role="group" aria-label="Booking view">
      <button
        type="button"
        aria-pressed={scope === 'pending'}
        aria-controls="booking-list-panel"
        onClick={() => onScopeChange('pending')}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'pending' ? 'bg-admin-surface text-admin-text shadow-sm ring-1 ring-admin-border' : 'text-admin-secondary hover:text-admin-text'}`}
      >
        Pending shoots
        <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${scope === 'pending' ? 'bg-admin-primary text-white' : 'bg-admin-surface text-admin-subtle'}`}>{pendingCount}</span>
      </button>
      <button
        type="button"
        aria-pressed={scope === 'all'}
        aria-controls="booking-list-panel"
        onClick={() => onScopeChange('all')}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'all' ? 'bg-admin-surface text-admin-text shadow-sm ring-1 ring-admin-border' : 'text-admin-secondary hover:text-admin-text'}`}
      >
        All bookings
        <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${scope === 'all' ? 'bg-admin-primary text-white' : 'bg-admin-surface text-admin-subtle'}`}>{totalCount}</span>
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
