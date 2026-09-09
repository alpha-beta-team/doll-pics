import { ArrowDownWideNarrow, Filter, Plus, RefreshCw, Search, X } from 'lucide-react';
import type { ServiceCategoryOption } from './serviceCategories';

export type SalesMobileHeaderProps<V extends string, S extends string> = {
  title: string;
  itemName: 'enquiry' | 'booking';
  itemPlural: 'enquiries' | 'bookings';
  total: number;
  totalLabel: string;
  summary: string;
  addLabel: string;
  views: ReadonlyArray<{ value: V; label: string; count: number }>;
  view: V | '';
  onViewChange: (view: V) => void;
  query: string;
  onQueryChange: (query: string) => void;
  filtersOpen: boolean;
  activeFilterCount: number;
  onToggleFilters: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  canManage: boolean;
  onAdd: () => void;
  services: ServiceCategoryOption[];
  service: string;
  onServiceChange: (service: string) => void;
  sort: S;
  sortOptions: ReadonlyArray<{ value: S; label: string; shortLabel: string }>;
  onSortChange: (sort: S) => void;
};

export function SalesMobileHeader<V extends string, S extends string>(props: SalesMobileHeaderProps<V, S>) {
  return (
    <header className="enquiry-mobile-header space-y-3.5 px-4 pt-3.5 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-admin-text">{props.title}</h1>
          <p className="mt-0.5 text-xs text-admin-subtle">{props.total} {props.totalLabel} <span aria-hidden="true">•</span> <span className="font-semibold text-admin-primary">{props.summary}</span></p>
        </div>
        {props.canManage && <button type="button" onClick={props.onAdd} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-admin-primary px-3 text-xs font-semibold text-white shadow-sm outline-none hover:bg-admin-primary-hover focus-visible:ring-2 focus-visible:ring-admin-focus"><Plus className="h-4 w-4" aria-hidden="true" />{props.addLabel}</button>}
      </div>
      <div className="flex h-11 items-center rounded-xl border border-admin-border bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-admin-focus/30">
        <Search className="mr-2 h-4 w-4 shrink-0 text-admin-subtle" aria-hidden="true" />
        <input aria-label={`Search ${props.itemPlural}`} type="search" value={props.query} onChange={event => props.onQueryChange(event.target.value)} placeholder={`Search ${props.itemPlural} by name, phone…`} className="min-w-0 flex-1 bg-transparent text-xs text-admin-text outline-none placeholder:text-admin-subtle" />
        {props.query && <button type="button" aria-label={`Clear ${props.itemName} search`} onClick={() => props.onQueryChange('')} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-admin-subtle outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"><X className="h-4 w-4" aria-hidden="true" /></button>}
        <button type="button" aria-label={`Filter ${props.itemPlural}`} aria-expanded={props.filtersOpen} aria-controls={`${props.itemName}-advanced-filters`} onClick={props.onToggleFilters} className="relative -mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-admin-subtle outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"><Filter className="h-4 w-4" aria-hidden="true" />{props.activeFilterCount > 0 && <span className="absolute right-0 top-0 rounded-full bg-admin-primary px-1 text-[9px] text-white">{props.activeFilterCount}</span>}</button>
      </div>
      <div className="enquiry-mobile-scroll flex gap-2 overflow-x-auto py-0.5" role="group" aria-label={`${props.title} view`}>
        {props.views.map(view => <button key={view.value} type="button" aria-pressed={props.view === view.value} aria-controls={`${props.itemName}-list-panel`} onClick={() => props.onViewChange(view.value)} className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus ${props.view === view.value ? 'border-transparent bg-[#1b2a21] text-white' : 'border-admin-border bg-white text-admin-secondary'}`}>
          {view.label}<span className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${props.view === view.value ? 'bg-white/20 text-white' : 'bg-admin-muted text-admin-secondary'}`}>{view.count}</span>
        </button>)}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="enquiry-mobile-scroll flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5" role="group" aria-label="Filter by photography service">
          {props.services.map(service => <button key={service.value} type="button" aria-pressed={props.service === service.value} aria-controls={`${props.itemName}-list-panel`} onClick={() => props.onServiceChange(service.value === props.service ? '' : service.value)} className={`min-h-8 shrink-0 rounded-md border px-2.5 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus ${props.service === service.value ? 'border-transparent bg-admin-primary text-white' : 'border-admin-border bg-white text-admin-secondary'}`}>{service.label} ({service.count})</button>)}
        </div>
        <label className="relative flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-admin-border bg-white px-2 text-[11px] font-medium text-admin-secondary focus-within:ring-2 focus-within:ring-admin-focus">
          <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" /><span aria-hidden="true">{props.sortOptions.find(option => option.value === props.sort)?.shortLabel}</span>
          <select aria-label={`Sort ${props.itemPlural}`} value={props.sort} onChange={event => props.onSortChange(event.target.value as S)} className="absolute inset-0 h-full w-full opacity-0">{props.sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label>
      </div>
      {props.filtersOpen && <button type="button" onClick={props.onRefresh} disabled={props.refreshing} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-admin-primary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${props.refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh {props.itemPlural}</button>}
    </header>
  );
}
