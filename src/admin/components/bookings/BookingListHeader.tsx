export function BookingListHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex min-h-7 items-center px-1">
      <h2 id="booking-list-title" className="truncate text-sm font-semibold text-admin-text">
        {title}<span className="font-medium tabular-nums text-admin-subtle"> · {count} {count === 1 ? 'record' : 'records'}</span>
      </h2>
    </div>
  );
}
