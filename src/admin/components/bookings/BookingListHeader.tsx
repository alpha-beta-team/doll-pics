import type { BookingListScope } from './bookingList';

type BookingListHeaderProps = {
  title: string;
  count: number;
  scope: BookingListScope;
  pendingCount: number;
  totalCount: number;
  onScopeChange: (scope: BookingListScope) => void;
};

export function BookingListHeader({
  title,
  count,
  scope,
  pendingCount,
  totalCount,
  onScopeChange,
}: BookingListHeaderProps) {
  return (
    <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
      <h2 id="booking-list-title" className="truncate text-sm font-semibold text-admin-text">
        {title}<span className="font-medium tabular-nums text-admin-subtle"> · {count} {count === 1 ? 'record' : 'records'}</span>
      </h2>
      <div className="inline-flex w-fit rounded-lg border border-admin-border bg-admin-surface p-1" role="group" aria-label="Booking view">
        <button
          type="button"
          aria-pressed={scope === 'pending'}
          onClick={() => onScopeChange('pending')}
          className={`min-h-9 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'pending' ? 'bg-admin-primary text-white shadow-sm' : 'text-admin-secondary hover:bg-admin-muted hover:text-admin-text'}`}
        >
          Pending shoots <span className={`ml-1 tabular-nums ${scope === 'pending' ? 'text-white/75' : 'text-admin-subtle'}`}>{pendingCount}</span>
        </button>
        <button
          type="button"
          aria-pressed={scope === 'all'}
          onClick={() => onScopeChange('all')}
          className={`min-h-9 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'all' ? 'bg-admin-primary text-white shadow-sm' : 'text-admin-secondary hover:bg-admin-muted hover:text-admin-text'}`}
        >
          All bookings <span className={`ml-1 tabular-nums ${scope === 'all' ? 'text-white/75' : 'text-admin-subtle'}`}>{totalCount}</span>
        </button>
      </div>
    </div>
  );
}
