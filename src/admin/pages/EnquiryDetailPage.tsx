import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, CalendarClock, Edit3, MessageCircle, Phone } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import { EnquiryStageBadge } from '../components/EnquiryStageBadge';
import { whatsappUrl } from '../contact';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Enquiry, EnquiryStage } from '../types';
import { formatTimeWindow } from '../../shared/bookingTime';

export function EnquiryDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [item, setItem] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try { setItem(await api.getEnquiry(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load this enquiry.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const setStage = async (stage: EnquiryStage) => {
    if (!item || stage === 'booked') return;
    if (stage === 'closed_lost') {
      const ok = await confirm({ title: 'Mark as not interested?', description: 'This closes the enquiry and removes its follow-up.', confirmLabel: 'Close enquiry', variant: 'danger' });
      if (!ok) return;
    }
    setSaving(true);
    try { setItem(await api.updateEnquiryStage(item.id, stage)); setSuccess(stage === 'closed_lost' ? 'Enquiry closed.' : 'Enquiry stage updated.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update the stage.'); }
    finally { setSaving(false); }
  };

  const schedule = async (when: string, note = followUpNote) => {
    if (!item || !when) return;
    setSaving(true);
    try { setItem(await api.scheduleEnquiryFollowUp(item.id, new Date(when).toISOString(), note || undefined)); setFollowUpAt(''); setFollowUpNote(''); setSuccess('Follow-up saved.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not schedule the follow-up.'); }
    finally { setSaving(false); }
  };

  const complete = async () => {
    if (!item) return;
    setSaving(true);
    try { setItem(await api.completeEnquiryFollowUp(item.id)); setSuccess('Follow-up completed.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not complete the follow-up.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  if (!item) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Enquiry not found.'}</div>;
  const tomorrow = tomorrowAtTen();
  const closed = ['booked', 'closed_lost'].includes(item.stage);

  return <div className="mx-auto max-w-3xl space-y-4">
    <Link to="/admin/enquiries" className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" /> All enquiries</Link>
    {error && <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button onClick={() => setError('')} className="ml-auto">Dismiss</button></div>}
    {success && <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}<button onClick={() => setSuccess('')} className="ml-auto">Dismiss</button></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">{item.name}</h1><p className="mt-1 text-sm text-slate-500">{item.shootType || 'Service not decided'} · {item.phone}</p></div><EnquiryStageBadge stage={item.stage} /></div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><a href={`tel:${item.phone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-semibold text-slate-700"><Phone className="h-4 w-4" /> Call</a><a href={whatsappUrl(item.phone)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</a><button onClick={() => setEditing(true)} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-semibold text-slate-700"><Edit3 className="h-4 w-4" /> Edit</button><button disabled={closed} onClick={() => navigate('/admin/bookings', { state: { convertFromEnquiry: item } })} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white disabled:bg-slate-300"><CalendarCheck className="h-4 w-4" /> Convert</button></div>
    </section>

    {!closed && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-semibold text-amber-950">Next follow-up</h2>
      {item.nextFollowUpAt && <div className="mt-3 rounded-xl bg-white p-4"><p className="font-semibold text-slate-900">{new Date(item.nextFollowUpAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p><p className="mt-1 text-sm text-slate-500">{item.followUpNote || 'No note added'}</p><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={saving} onClick={() => void complete()} className="h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white">Done</button><button disabled={saving} onClick={() => void schedule(tomorrow, item.followUpNote)} className="h-11 rounded-xl border border-amber-300 bg-white text-sm font-semibold text-amber-800">Tomorrow</button></div></div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-amber-950">Date and time<input type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-amber-300 bg-white px-3" /></label><label className="text-sm font-medium text-amber-950">Reminder note<input value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-amber-300 bg-white px-3" placeholder="What should we discuss?" /></label></div><button disabled={!followUpAt || saving} onClick={() => void schedule(followUpAt)} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 font-semibold text-white disabled:opacity-50"><CalendarClock className="h-4 w-4" /> Save follow-up</button>
    </section>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Enquiry stage</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{(['new', 'contacted', 'follow_up', 'booked', 'closed_lost'] as EnquiryStage[]).map(stage => <button key={stage} disabled={saving || stage === 'booked' || item.stage === 'booked'} onClick={() => void setStage(stage)} className={`min-h-11 rounded-xl px-2 text-sm font-semibold ${item.stage === stage ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 disabled:opacity-50'}`}>{stage === 'closed_lost' ? 'Not interested' : stage === 'follow_up' ? 'Follow-up' : stage[0].toUpperCase() + stage.slice(1)}</button>)}</div></section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Details</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><Detail label="Email" value={item.email} /><Detail label="Preferred date" value={item.bookingDate} /><Detail label="Preferred time" value={item.startTime && item.endTime ? formatTimeWindow(item.startTime, item.endTime) : ''} /><Detail label="Location" value={item.location} /><Detail label="Source" value={item.source.replace('_', ' ')} /><Detail label="Customer message" value={item.message} /><Detail label="Internal notes" value={item.notes} /></dl></section>
    {editing && <EnquiryFormModal enquiry={item} onClose={() => setEditing(false)} onSaved={saved => { setItem(saved); setEditing(false); setSuccess('Enquiry details saved.'); }} />}
  </div>;
}

function Detail({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap font-medium text-slate-700">{value || '—'}</dd></div>; }
function tomorrowAtTen() { const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(10, 0, 0, 0); const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
