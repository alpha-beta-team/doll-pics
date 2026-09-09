import { ChevronLeft, ChevronRight } from 'lucide-react';

type SalesListPaginationProps = {
  itemPlural: 'enquiries' | 'bookings';
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export function SalesListPagination({ itemPlural, page, pageCount, pageSize, total, onChange }: SalesListPaginationProps) {
  const buttonClass = 'flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium outline-none transition hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus';
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border bg-slate-50/60 px-6 py-4">
      <p className="text-xs text-admin-subtle" role="status">Showing <strong className="font-semibold text-admin-secondary">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> of <strong className="font-semibold text-admin-secondary">{total}</strong> {itemPlural}</p>
      <nav aria-label={`${itemPlural === 'bookings' ? 'Booking' : 'Enquiry'} pagination`} className="flex items-center gap-2">
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className={`${buttonClass} border border-admin-border bg-white text-admin-secondary disabled:cursor-not-allowed disabled:opacity-40`}><ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />Previous</button>
        <span aria-current="page" className="whitespace-nowrap rounded-lg bg-admin-muted px-3 py-2 text-xs font-semibold text-admin-secondary">Page {page} of {pageCount}</span>
        <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)} className={`${buttonClass} border border-admin-border bg-white text-admin-secondary disabled:cursor-not-allowed disabled:opacity-40`}>Next<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
      </nav>
    </footer>
  );
}
