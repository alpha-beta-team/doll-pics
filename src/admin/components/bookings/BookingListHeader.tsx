export function BookingListHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 px-1">
      <h2 id="booking-list-title" className="truncate text-sm font-semibold text-admin-text">{title}</h2>
      <p className="shrink-0 text-xs font-medium tabular-nums text-admin-subtle">{count} {count === 1 ? 'record' : 'records'}</p>
    </div>
  );
}
