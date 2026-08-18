import { CalendarClock, Check, Clock3 } from 'lucide-react';
import { FollowUpShortcuts } from './FollowUpShortcuts';

type CurrentFollowUp = {
  dateLabel: string;
  note?: string;
  overdue?: boolean;
};

type Props = {
  value: string;
  note: string;
  onChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitLabel?: string;
  notePlaceholder?: string;
  current?: CurrentFollowUp;
  onComplete?: () => void;
  className?: string;
};

export function FollowUpPanel({
  value,
  note,
  onChange,
  onNoteChange,
  onSubmit,
  disabled,
  submitLabel = 'Save follow-up',
  notePlaceholder = 'What should we discuss?',
  current,
  onComplete,
  className = '',
}: Props) {
  return (
    <section className={`rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-amber-950">Next follow-up</h2>
          <p className="mt-1 text-sm leading-5 text-amber-800">Set a reminder so the next customer conversation is clear.</p>
        </div>
        {current && onComplete && (
          <button
            type="button"
            disabled={disabled}
            onClick={onComplete}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Mark complete
          </button>
        )}
      </div>

      {current && (
        <div className={`mt-4 flex items-start gap-3 rounded-xl border bg-white p-4 ${current.overdue ? 'border-red-200' : 'border-amber-200'}`}>
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${current.overdue ? 'bg-red-50 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
            <Clock3 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{current.dateLabel}</p>
              {current.overdue && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Overdue</span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">{current.note || 'No reminder note added'}</p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <FollowUpShortcuts value={value} onChange={onChange} disabled={disabled} />
      </div>

      <label className="mt-4 block text-sm font-semibold text-amber-950">
        Reminder note
        <input
          value={note}
          onChange={event => onNoteChange(event.target.value)}
          disabled={disabled}
          className="mt-1.5 h-12 w-full rounded-xl border border-amber-300 bg-white px-3 text-base font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          placeholder={notePlaceholder}
        />
      </label>

      <button
        type="button"
        disabled={disabled || !value}
        onClick={onSubmit}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarClock className="h-4 w-4" />
        {disabled ? 'Saving…' : submitLabel}
      </button>
    </section>
  );
}
