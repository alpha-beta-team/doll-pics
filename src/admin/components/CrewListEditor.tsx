import { Trash2 } from 'lucide-react';
import { CREW_SERVICE_OPTIONS, CrewServiceType } from '../../shared/crew';
import type { BookingCrewMember } from '../../shared/crew';
import type { StaffAccountOption } from '../types';

export function CrewListEditor({ value, staffAccounts, onChange, showAddButton = true }: {
  showAddButton?: boolean;
  value: BookingCrewMember[];
  staffAccounts: StaffAccountOption[];
  onChange: (rows: BookingCrewMember[]) => void;
}) {
  const update = (index: number, patch: Partial<BookingCrewMember>) =>
    onChange(value.map((row, i) => i === index ? { ...row, ...patch } : row));
  const input = 'mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm';
  return <fieldset className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
    <legend className="px-1 text-base font-semibold text-slate-900">Crew List</legend>
    <p className="text-sm text-slate-500">Add a service and its crew member. Add more rows for additional members.</p>
    {value.map((row, index) => <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-sm text-slate-700">Service {index + 1}
        <select aria-label={`Crew service ${index + 1}`} className={input} value={row.serviceType} onChange={event => update(index, { serviceType: event.target.value as CrewServiceType })}>
          {CREW_SERVICE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-700">Member {index + 1}
        <select aria-label={`Crew member ${index + 1}`} className={input} value={row.staffAccountId} onChange={event => update(index, { staffAccountId: event.target.value, memberName: staffAccounts.find(account => account.id === event.target.value)?.name ?? '' })}>
          <option value="">Select member</option>
          {row.staffAccountId && !staffAccounts.some(account => account.id === row.staffAccountId) && <option value={row.staffAccountId}>{row.memberName || 'Saved member'} (current)</option>}
          {staffAccounts.map(account => <option key={account.id} value={account.id}>{account.name}{account.jobTitle ? ` · ${account.jobTitle}` : ''}</option>)}
        </select>
      </label>
      <button type="button" aria-label={`Remove crew row ${index + 1}`} title="Delete crew member" className="flex h-11 w-11 items-center justify-center self-end justify-self-end rounded-lg text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" onClick={() => onChange(value.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
    </div>)}
    {!staffAccounts.length && <p className="text-sm text-slate-500">No staff available. Add an active staff member to assign crew.</p>}
    {showAddButton && <button type="button" disabled={value.length >= 100} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50" onClick={() => onChange([...value, { serviceType: CrewServiceType.CandidPhoto, staffAccountId: '', memberName: '' }])}>Add crew member</button>}
  </fieldset>;
}
