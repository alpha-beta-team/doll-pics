import { ChevronDown } from 'lucide-react';
import type { EnquiryListScope } from './enquiryList';

type EnquiryViewSelectProps = {
  scope: EnquiryListScope;
  activeCount: number;
  totalCount: number;
  onScopeChange: (scope: EnquiryListScope) => void;
};

export function EnquiryViewSelect({
  scope,
  activeCount,
  totalCount,
  onScopeChange,
}: EnquiryViewSelectProps) {
  return (
    <label className="enquiry-view-select relative inline-flex shrink-0">
      <span className="sr-only">Enquiry view</span>
      <select
        aria-label="Enquiry view"
        aria-controls="enquiry-list-panel"
        value={scope}
        onChange={event => onScopeChange(event.target.value as EnquiryListScope)}
        className="appearance-none outline-none focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2"
      >
        <option value="active">Active enquiries ({activeCount})</option>
        <option value="all">All enquiries ({totalCount})</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white" aria-hidden="true" />
    </label>
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
