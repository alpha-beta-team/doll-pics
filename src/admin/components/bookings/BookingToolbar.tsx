import { useEffect, useRef, useState } from 'react';
import { Filter, Plus, RefreshCw, Search, X } from 'lucide-react';
import { AdminButton, AdminIconButton } from '../ui';

type BookingToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  activeFilterCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd: () => void;
};

export function BookingToolbar({
  query,
  onQueryChange,
  filtersOpen,
  onFiltersOpenChange,
  activeFilterCount,
  refreshing,
  onRefresh,
  canManage,
  onAdd,
}: BookingToolbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(Boolean(query));
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen) window.setTimeout(() => mobileSearchRef.current?.focus(), 0);
  }, [mobileSearchOpen]);

  const filterBadge = activeFilterCount > 0 && (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-admin-primary px-1.5 text-[11px] font-bold leading-5 text-white" aria-label={`${activeFilterCount} additional filters active`}>
      {activeFilterCount}
    </span>
  );

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="flex h-11 shrink-0 divide-x divide-admin-border overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-[0_2px_8px_rgba(62,56,46,0.025)] sm:hidden">
          <button type="button" aria-label="Search bookings" aria-expanded={mobileSearchOpen} onClick={() => setMobileSearchOpen(value => !value)} className="flex h-11 w-11 items-center justify-center text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus">
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Filter bookings" aria-expanded={filtersOpen} aria-controls="booking-advanced-filters" onClick={() => onFiltersOpenChange(!filtersOpen)} className="relative flex h-11 w-11 items-center justify-center text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus">
            <Filter className="h-4 w-4" aria-hidden="true" />
            {activeFilterCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-admin-primary px-1 text-[9px] font-bold text-white" aria-label={`${activeFilterCount} additional filters active`}>{activeFilterCount}</span>}
          </button>
          <button type="button" aria-label="Refresh bookings" onClick={onRefresh} disabled={refreshing} className="flex h-11 w-11 items-center justify-center text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <label className="hidden h-11 min-w-0 items-center gap-2 rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-subtle transition focus-within:border-admin-focus focus-within:ring-2 focus-within:ring-admin-focus/20 sm:flex sm:w-48 lg:w-56">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search bookings</span>
          <input value={query} onChange={event => onQueryChange(event.target.value)} type="search" placeholder="Search bookings" className="min-w-0 flex-1 bg-transparent text-sm text-admin-text outline-none placeholder:text-admin-subtle" />
        </label>

        <AdminButton variant="secondary" aria-expanded={filtersOpen} aria-controls="booking-advanced-filters" onClick={() => onFiltersOpenChange(!filtersOpen)} className="hidden !h-11 px-3 sm:inline-flex">
          <Filter className="h-4 w-4" aria-hidden="true" />Filter{filterBadge}
        </AdminButton>

        <AdminIconButton label="Refresh bookings" onClick={onRefresh} disabled={refreshing} className="hidden !h-11 !w-11 shrink-0 sm:inline-flex">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        </AdminIconButton>

        {canManage && (
          <AdminButton onClick={onAdd} className="!h-11 shrink-0 !px-3 sm:!px-4">
            <Plus className="h-4 w-4" aria-hidden="true" />Add booking
          </AdminButton>
        )}
      </div>

      {mobileSearchOpen && (
        <label className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-subtle focus-within:border-admin-focus focus-within:ring-2 focus-within:ring-admin-focus/20 sm:hidden">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search bookings</span>
          <input ref={mobileSearchRef} value={query} onChange={event => onQueryChange(event.target.value)} type="search" placeholder="Name, phone, service or package" className="min-w-0 flex-1 bg-transparent text-sm text-admin-text outline-none placeholder:text-admin-subtle" />
          <button type="button" aria-label={query ? 'Clear search' : 'Close search'} onClick={() => { if (query) onQueryChange(''); else setMobileSearchOpen(false); }} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </label>
      )}
    </div>
  );
}
