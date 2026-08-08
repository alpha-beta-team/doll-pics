import { useCallback, useEffect, useState } from 'react';
import { CalendarHeart, Cake, Pencil, Plus, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import type { CustomerOccasion } from '../types';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

type Props = {
  phone: string;
  customerName: string;
  email?: string;
  source: { type: 'enquiry' | 'booking'; id: string };
};

export function ImportantDatesPanel(props: Props) {
  const confirm = useConfirmDialog();
  const [items, setItems] = useState<CustomerOccasion[]>([]);
  const [editing, setEditing] = useState<CustomerOccasion | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!props.phone) return;
    setError('');
    try { setItems(await api.getOccasions(props.phone, true)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load important dates.'); }
    finally { setLoading(false); }
  }, [props.phone]);
  useEffect(() => { void load(); }, [load]);

  const archive = async (item: CustomerOccasion) => {
    const accepted = await confirm({
      title: item.active ? 'Archive this reminder?' : 'Restore this reminder?',
      description: item.active ? 'Its previous contact history will be kept.' : 'It will appear in upcoming reminders again.',
      confirmLabel: item.active ? 'Archive' : 'Restore',
      variant: item.active ? 'danger' : 'primary',
    });
    if (!accepted) return;
    try { await api.updateOccasion(item.id, { active: !item.active }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update this reminder.'); }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Important dates</h2><p className="mt-1 text-sm text-slate-500">Birthday and anniversary reminders for this phone.</p></div><button type="button" onClick={() => setEditing('new')} className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Add</button></div>
    {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" />Loading dates…</div> : <div className="mt-4 space-y-3">
      {items.map(item => <article key={item.id} className={`rounded-xl border p-4 ${item.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
        <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.type === 'birthday' ? 'bg-pink-50 text-pink-600' : 'bg-violet-50 text-violet-600'}`}>{item.type === 'birthday' ? <Cake className="h-5 w-5" /> : <CalendarHeart className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{item.occasionName}</p><p className="mt-0.5 text-sm capitalize text-slate-500">{item.type} · {formatDate(item.occasionDate)}</p><p className="mt-1 text-xs text-slate-500">Next: {formatDate(item.nextOccurrenceDate)}{item.contactedForOccurrence ? ' · Contacted' : ''}</p></div><button type="button" onClick={() => setEditing(item)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200" aria-label={`Edit ${item.occasionName}`}><Pencil className="h-4 w-4" /></button></div>
        {!!item.contactHistory?.length && <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium text-slate-600">Previous contacts ({item.contactHistory.length})</summary><div className="mt-2 space-y-1 text-xs text-slate-500">{item.contactHistory.map(entry => <p key={`${entry.occurrenceDate}-${entry.contactedAt}`}>{formatDate(entry.occurrenceDate)} · {entry.contactedBy.name} · {formatDateTime(entry.contactedAt)}</p>)}</div></details>}
        <button type="button" onClick={() => void archive(item)} className={`mt-3 min-h-10 text-sm font-semibold ${item.active ? 'text-red-600' : 'text-blue-600'}`}>{item.active ? 'Archive reminder' : 'Restore reminder'}</button>
      </article>)}
      {!items.length && <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No important dates saved yet.</div>}
    </div>}
    {editing && <OccasionForm initial={editing === 'new' ? null : editing} {...props} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}
  </section>;
}

function OccasionForm({ initial, phone, customerName, email, source, onClose, onSaved }: Props & { initial: CustomerOccasion | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [type, setType] = useState<'birthday' | 'anniversary'>(initial?.type || 'birthday');
  const [occasionName, setOccasionName] = useState(initial?.occasionName || customerName);
  const [date, setDate] = useState(initial?.occasionDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (occasionName.trim().length < 2 || !date) return setError('Enter the person/couple name and a valid date.');
    setSaving(true); setError('');
    try {
      if (initial) await api.updateOccasion(initial.id, { type, occasionName, occasionDate: date });
      else await api.createOccasion({ type, occasionName, occasionDate: date, customerName, phone, email: email || undefined, sourceType: source.type, sourceId: source.id });
      await onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save this date.'); setSaving(false); }
  };
  return <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"><h3 className="text-lg font-semibold text-slate-900">{initial ? 'Edit important date' : 'Add important date'}</h3>{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-4 space-y-4"><label className="block text-sm font-medium text-slate-700">Type<select value={type} onChange={e => setType(e.target.value as typeof type)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3"><option value="birthday">Birthday</option><option value="anniversary">Wedding anniversary</option></select></label><label className="block text-sm font-medium text-slate-700">{type === 'birthday' ? 'Person name' : 'Couple / occasion name'}<input autoFocus value={occasionName} onChange={e => setOccasionName(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" /></label><label className="block text-sm font-medium text-slate-700">Original date<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" /></label></div><div className="mt-5 grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold">Cancel</button><button type="button" disabled={saving} onClick={() => void save()} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save date'}</button></div></div></div>;
}

function formatDate(value: string) { return value ? new Date(`${value}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'; }
function formatDateTime(value: string) { return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); }
