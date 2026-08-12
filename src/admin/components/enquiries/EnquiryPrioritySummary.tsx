import type { EnquiryPriorityFilter } from './enquiryList';

type EnquiryPrioritySummaryProps = {
  newCount: number;
  dueTodayCount: number;
  overdueCount: number;
  newSelected: boolean;
  priority: EnquiryPriorityFilter;
  onNew: () => void;
  onPriorityChange: (priority: EnquiryPriorityFilter) => void;
};

export function EnquiryPrioritySummary({
  newCount,
  dueTodayCount,
  overdueCount,
  newSelected,
  priority,
  onNew,
  onPriorityChange,
}: EnquiryPrioritySummaryProps) {
  if (newCount + dueTodayCount + overdueCount === 0) return null;

  return (
    <section aria-label="Enquiries needing attention" className="flex min-h-10 items-center gap-1 overflow-x-auto rounded-xl border border-admin-border bg-admin-surface px-1.5 py-1 shadow-[0_2px_8px_rgba(62,56,46,0.025)]">
      <span className="hidden shrink-0 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-admin-gold sm:inline">Priority</span>
      <PriorityButton label="New" count={newCount} selected={newSelected} tone="sage" onClick={onNew} />
      <PriorityButton label="Follow-ups due" shortLabel="Due" count={dueTodayCount} selected={priority === 'due_today'} tone="amber" onClick={() => onPriorityChange(priority === 'due_today' ? '' : 'due_today')} />
      <PriorityButton label="Overdue" count={overdueCount} selected={priority === 'overdue'} tone="red" onClick={() => onPriorityChange(priority === 'overdue' ? '' : 'overdue')} />
    </section>
  );
}

function PriorityButton({
  label,
  shortLabel,
  count,
  selected,
  tone,
  onClick,
}: {
  label: string;
  shortLabel?: string;
  count: number;
  selected: boolean;
  tone: 'sage' | 'amber' | 'red';
  onClick: () => void;
}) {
  const styles = {
    sage: selected ? 'bg-emerald-100 text-emerald-950 ring-emerald-300' : 'text-emerald-800 hover:bg-emerald-50',
    amber: selected ? 'bg-amber-100 text-amber-950 ring-amber-300' : 'text-amber-800 hover:bg-amber-50',
    red: selected ? 'bg-red-100 text-red-900 ring-red-300' : 'text-red-700 hover:bg-red-50',
  }[tone];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold outline-none ring-1 ring-transparent transition focus-visible:ring-2 focus-visible:ring-admin-focus ${styles}`}
    >
      <span className={shortLabel ? 'hidden min-[370px]:inline' : ''}>{label}</span>
      {shortLabel && <span className="min-[370px]:hidden">{shortLabel}</span>}
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
