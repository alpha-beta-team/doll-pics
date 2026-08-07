import { useState } from 'react';
import { CalendarClock, Check, Clock3 } from 'lucide-react';
import {
  canUseLaterToday,
  followUpDateError,
  followUpShortcutValue,
  type FollowUpShortcut,
} from './followUp.utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
  disabled?: boolean;
  onValidation?: (error: string | null) => void;
};

const options: Array<{ id: Exclude<FollowUpShortcut, 'custom' | 'none'>; label: string }> = [
  { id: 'later', label: 'Later today' },
  { id: 'tomorrow', label: 'Tomorrow 10 AM' },
  { id: 'three_days', label: 'In 3 days' },
  { id: 'next_week', label: 'Next week' },
];

export function FollowUpShortcuts({ value, onChange, allowNone, disabled, onValidation }: Props) {
  const [selected, setSelected] = useState<FollowUpShortcut>(value ? 'custom' : allowNone ? 'none' : 'custom');
  const [error, setError] = useState('');
  const choose = (choice: FollowUpShortcut) => {
    setSelected(choice);
    setError('');
    onValidation?.(null);
    if (choice === 'none') return onChange('');
    if (choice !== 'custom') onChange(followUpShortcutValue(choice));
  };
  const customChange = (next: string) => {
    setSelected('custom');
    onChange(next);
    const nextError = next ? followUpDateError(next) : null;
    setError(nextError || '');
    onValidation?.(nextError);
  };
  const buttonClass = (active: boolean) => `flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600'}`;
  return <div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {allowNone && <button type="button" disabled={disabled} onClick={() => choose('none')} className={buttonClass(selected === 'none')}><Check className="h-4 w-4" />No follow-up</button>}
      {options.filter(option => option.id !== 'later' || canUseLaterToday()).map(option => <button key={option.id} type="button" disabled={disabled} onClick={() => choose(option.id)} className={buttonClass(selected === option.id)}>{option.id === 'later' ? <Clock3 className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}{option.label}</button>)}
      <button type="button" disabled={disabled} onClick={() => choose('custom')} className={buttonClass(selected === 'custom')}>Choose date/time</button>
    </div>
    {selected === 'custom' && <label className="mt-3 block text-sm font-medium text-slate-700">Date and time<input type="datetime-local" value={value} onChange={event => customChange(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base" aria-invalid={Boolean(error)} />{error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}</label>}
  </div>;
}
