import type { EnquiryListScope } from './enquiryList';

type EnquiryViewSwitchProps = {
  scope: EnquiryListScope;
  activeCount: number;
  totalCount: number;
  onScopeChange: (scope: EnquiryListScope) => void;
};

export function EnquiryViewSwitch({
  scope,
  activeCount,
  totalCount,
  onScopeChange,
}: EnquiryViewSwitchProps) {
  return (
    <div className="inline-flex w-fit rounded-lg bg-admin-muted p-0.5" role="group" aria-label="Enquiry view">
      <button
        type="button"
        aria-pressed={scope === 'active'}
        aria-controls="enquiry-list-panel"
        onClick={() => onScopeChange('active')}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'active' ? 'bg-admin-surface text-admin-text shadow-sm ring-1 ring-admin-border' : 'text-admin-secondary hover:text-admin-text'}`}
      >
        Active enquiries
        <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${scope === 'active' ? 'bg-admin-primary text-white' : 'bg-admin-surface text-admin-subtle'}`}>{activeCount}</span>
      </button>
      <button
        type="button"
        aria-pressed={scope === 'all'}
        aria-controls="enquiry-list-panel"
        onClick={() => onScopeChange('all')}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${scope === 'all' ? 'bg-admin-surface text-admin-text shadow-sm ring-1 ring-admin-border' : 'text-admin-secondary hover:text-admin-text'}`}
      >
        All enquiries
        <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${scope === 'all' ? 'bg-admin-primary text-white' : 'bg-admin-surface text-admin-subtle'}`}>{totalCount}</span>
      </button>
    </div>
  );
}

export function EnquiryListHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex min-h-7 items-center px-1">
      <h2 id="enquiry-list-title" className="truncate text-sm font-semibold text-admin-text">
        {title}<span className="font-medium tabular-nums text-admin-subtle"> · {count} {count === 1 ? 'lead' : 'leads'}</span>
      </h2>
    </div>
  );
}
