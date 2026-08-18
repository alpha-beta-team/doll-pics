import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { Filter, Plus, RefreshCw, Search, X } from 'lucide-react';
import { AdminButton, AdminIconButton } from '../ui';

type SalesToolbarProps = {
  itemName: 'enquiry' | 'booking';
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

export function SalesToolbar({
  itemName,
  query,
  onQueryChange,
  filtersOpen,
  onFiltersOpenChange,
  activeFilterCount,
  refreshing,
  onRefresh,
  canManage,
  onAdd,
}: SalesToolbarProps) {
  const pluralName = `${itemName}s`;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(Boolean(query));
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen) window.setTimeout(() => mobileSearchRef.current?.focus(), 0);
  }, [mobileSearchOpen]);

  const clearOrCloseSearch = () => {
    if (query) onQueryChange('');
    else setMobileSearchOpen(false);
  };

  return (
    <section aria-label={`${itemName === 'enquiry' ? 'Enquiry' : 'Booking'} tools`} className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 overflow-hidden rounded-xl border border-admin-control bg-admin-surface shadow-[0_2px_8px_rgba(62,56,46,0.025)] sm:hidden">
          <SegmentButton label={`Search ${pluralName}`} pressed={mobileSearchOpen} aria-expanded={mobileSearchOpen} onClick={() => setMobileSearchOpen(value => !value)}>
            <Search className="h-5 w-5" aria-hidden="true" />
          </SegmentButton>
          <SegmentButton label={`Filter ${pluralName}`} pressed={filtersOpen} aria-expanded={filtersOpen} aria-controls={`${itemName}-advanced-filters`} onClick={() => onFiltersOpenChange(!filtersOpen)} badge={activeFilterCount}>
            <Filter className="h-5 w-5" aria-hidden="true" />
          </SegmentButton>
          <SegmentButton label={refreshing ? `Refreshing ${pluralName}` : `Refresh ${pluralName}`} onClick={onRefresh} disabled={refreshing} last>
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </SegmentButton>
        </div>

        <label className="hidden h-11 min-w-64 items-center gap-2 rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-subtle transition focus-within:border-admin-focus focus-within:ring-2 focus-within:ring-admin-focus/20 sm:flex xl:min-w-80">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search {pluralName}</span>
          <input value={query} onChange={event => onQueryChange(event.target.value)} type="text" role="searchbox" placeholder={`Search ${pluralName}`} className="min-w-0 flex-1 bg-transparent text-sm text-admin-text outline-none placeholder:text-admin-subtle" />
          {query && (
            <button type="button" onClick={() => onQueryChange('')} aria-label={`Clear ${itemName} search`} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>

        <AdminButton variant="secondary" aria-expanded={filtersOpen} aria-controls={`${itemName}-advanced-filters`} onClick={() => onFiltersOpenChange(!filtersOpen)} className="relative hidden !h-11 shrink-0 !px-3 sm:inline-flex">
          <Filter className="h-4 w-4" aria-hidden="true" />Filter
          {activeFilterCount > 0 && <FilterBadge count={activeFilterCount} />}
        </AdminButton>
        <AdminIconButton label={refreshing ? `Refreshing ${pluralName}` : `Refresh ${pluralName}`} onClick={onRefresh} disabled={refreshing} className="hidden !h-11 !w-11 shrink-0 sm:inline-flex">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
        </AdminIconButton>

        {canManage && (
          <AdminButton onClick={onAdd} className="h-11 min-w-0 flex-1 shrink !px-3 text-[13px] sm:flex-none sm:shrink-0 sm:text-sm">
            <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />Add {itemName}
          </AdminButton>
        )}
      </div>

      {mobileSearchOpen && (
        <label className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-subtle focus-within:border-admin-focus focus-within:ring-2 focus-within:ring-admin-focus/20 sm:hidden">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search {pluralName}</span>
          <input ref={mobileSearchRef} value={query} onChange={event => onQueryChange(event.target.value)} type="text" role="searchbox" placeholder="Name, phone, service or package" className="min-w-0 flex-1 bg-transparent text-sm text-admin-text outline-none placeholder:text-admin-subtle" />
          <button type="button" aria-label={query ? 'Clear search' : 'Close search'} onClick={clearOrCloseSearch} className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </label>
      )}
    </section>
  );
}

function SegmentButton({
  label,
  pressed,
  badge = 0,
  last = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  pressed?: boolean;
  badge?: number;
  last?: boolean;
}) {
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`relative flex h-11 w-11 items-center justify-center text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus disabled:opacity-50 ${last ? '' : 'border-r border-admin-border'} ${pressed ? 'bg-admin-muted text-admin-primary' : ''}`}
    >
      {children}
      {badge > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-admin-primary px-1 text-[9px] font-bold text-white" aria-label={`${badge} filters active`}>{badge}</span>}
    </button>
  );
}

function FilterBadge({ count }: { count: number }) {
  return <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-admin-primary px-1.5 text-[10px] font-bold text-white" aria-label={`${count} filters active`}>{count}</span>;
}
