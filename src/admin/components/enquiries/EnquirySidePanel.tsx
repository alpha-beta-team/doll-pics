import { AdminAlert } from '../ui/AdminUi';
import { formatCustomerName } from '../../../shared/formatCustomerName';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Enquiry } from '../../types';
import { api } from '../../api/client';
import { BookingDialog } from '../bookings/BookingDetailSections';
import { EnquiryStageBadge } from '../EnquiryStageBadge';
import { EnquiryFormModal } from '../EnquiryFormModal';
import { CustomerLookupPanel } from '../CustomerLookupPanel';
import { EnquiryFollowUpDialog } from './EnquiryFollowUpDialog';
import { EnquiryCallHistory, EnquiryCallOutcomeForm } from './EnquiryCallOutcomeForm';
import { callTimeLabel } from './enquiryCall.utils';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

export function EnquirySidePanel({ id, canManage, canViewPhone, canViewQuotations = false, canViewBookings = true, onClose, onChanged }: {
  id: string; canManage: boolean; canViewPhone: boolean; canViewQuotations?: boolean; canViewBookings?: boolean; onClose: () => void; onChanged: (item: Enquiry) => void;
}) {
  const [item, setItem] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retry, setRetry] = useState(0);
  const [mode, setMode] = useState<'overview' | 'call' | 'edit' | 'followUp'>('overview');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [callDirty, setCallDirty] = useState(false);
  const confirm = useConfirmDialog();
  const navigate = useNavigate();
  const openPage = async (path: string) => { if (await allowLeave()) navigate(path); };
  useEffect(() => {
    let active = true; setLoading(true); setItem(null); setError('');
    api.getEnquiry(id).then(value => { if (active) { setItem(value); setNote(value?.notes || ''); } }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this enquiry.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  const dirty = callDirty || note !== (item?.notes || '');
  const allowLeave = async () => !saving.current && (!dirty || await confirm({ title: 'Discard unsaved changes?', description: 'Your notes or call outcome have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' }));
  const close = async () => { if (await allowLeave()) onClose(); };
  const changeMode = async (next: typeof mode) => { if (await allowLeave()) { setCallDirty(false); setNote(item?.notes || ''); setMode(next); setError(''); } };
  const updated = (value: Enquiry) => { setItem(value); setNote(value.notes || ''); onChanged(value); setError(''); };
  const saveNote = async () => {
    if (!item || !canManage || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try { updated(await api.updateEnquiry(id, { notes: note.trim() })); setSuccess('Internal notes saved.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save notes.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const reopen = async () => {
    if (!item || !canManage || saving.current || !await allowLeave()) return;
    saving.current = true; setBusy(true); setError('');
    try { updated(await api.updateEnquiryStage(id, 'contacted')); setSuccess('Enquiry reopened.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not reopen this enquiry.'); }
    finally { saving.current = false; setBusy(false); }
  };
  if (mode === 'edit' && item && canManage) return <EnquiryFormModal enquiry={item} onClose={() => setMode('overview')} onSaved={value => { updated(value); setMode('overview'); setSuccess('Enquiry updated.'); }} />;
  if (mode === 'followUp' && item && canManage) return <EnquiryFollowUpDialog enquiry={item} onClose={() => setMode('overview')} onSaved={value => { updated(value); setMode('overview'); setSuccess('Follow-up updated.'); }} />;
  const closed = item && ['booked', 'closed_lost'].includes(item.stage);
  return <BookingDialog variant="drawer" title="Enquiry quick view" onClose={() => void close()}>
    {loading ? <p role="status" className="py-8 text-admin-subtle">Loading enquiry…</p> : !item ? <AdminAlert><p>{error || 'Enquiry not found.'}</p><button onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 font-semibold underline">Try again</button></AdminAlert> : <div className="space-y-5">
      <header><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-xl font-semibold">{formatCustomerName(item.name)}</h2><EnquiryStageBadge stage={item.stage} /></div><p className="mt-1 text-sm text-admin-secondary">{item.shootType || item.preferredEvent || 'Service not decided'}</p><p className="mt-2 text-sm">{canViewPhone ? item.phone : 'Phone hidden'}</p>
        <div className="mt-3 flex flex-wrap gap-2">{canManage && canViewPhone && item.phone && <a href={`tel:${item.phone}`} className="inline-flex min-h-11 items-center rounded-xl border border-admin-border px-3 text-sm font-semibold">Call customer</a>}{canManage && <button className="min-h-11 rounded-xl border border-admin-border px-3 text-sm font-semibold" onClick={() => void changeMode('edit')}>Edit enquiry</button>}
          <Link className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-admin-primary underline" to={`/admin/enquiries/${id}`} onClick={event => { event.preventDefault(); void openPage(`/admin/enquiries/${id}`); }}>Open full enquiry</Link>
          {canViewBookings && item.convertedBookingId && <Link to={`/admin/bookings/${item.convertedBookingId}`} onClick={event => { event.preventDefault(); void openPage(`/admin/bookings/${item.convertedBookingId}`); }} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold underline">Open booking</Link>}
        </div>
      </header>
      {item.stage === 'closed_lost' && canManage && <button disabled={busy} onClick={() => void reopen()} className="min-h-11 rounded-xl border border-admin-border px-3 text-sm font-semibold">Reopen enquiry</button>}
      {success && <AdminAlert tone="success" as="span">{success}</AdminAlert>}
      {error && <AdminAlert as="span">{error}</AdminAlert>}
      <div className="flex flex-wrap gap-2 border-b border-admin-border pb-3" aria-label="Quick view sections">{(['overview', ...(canManage && !closed ? ['call'] : [])] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => void changeMode(value as 'overview' | 'call')} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${mode === value ? 'bg-admin-primary text-white' : 'bg-admin-muted'}`}>{value === 'call' ? 'Log call outcome' : 'Overview'}</button>)}</div>
      {mode === 'call' && canManage && !closed && <EnquiryCallOutcomeForm enquiry={item} onDirtyChange={setCallDirty} onBusyChange={value => { saving.current = value; setBusy(value); }} onSaved={value => { updated(value); setCallDirty(false); setMode('overview'); setSuccess('Call outcome saved.'); }} />}
      {mode === 'overview' && <>
        <section className="rounded-xl border border-admin-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Next follow-up</h3>{canManage && !closed && <button onClick={() => void changeMode('followUp')} className="min-h-11 text-sm font-semibold text-admin-primary underline">{item.nextFollowUpAt ? 'Manage follow-up' : 'Schedule follow-up'}</button>}</div><p className="mt-2 text-sm">{closed ? 'Enquiry closed' : item.nextFollowUpAt ? `${callTimeLabel(item.nextFollowUpAt)} · India time` : 'No follow-up scheduled'}</p>{!closed && item.followUpNote && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-admin-secondary">{item.followUpNote}</p>}</section>
        <section className="rounded-xl border border-admin-border p-4"><h3 className="text-sm font-semibold">Shoot preferences</h3><p className="mt-2 text-sm">{item.bookingDate || 'Date not set'}{item.startTime ? ` · ${item.startTime}${item.endTime ? `–${item.endTime}` : ''}` : ''}</p><p className="mt-1 break-words text-sm text-admin-secondary">{item.location || 'Location not set'}</p>{item.message && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{item.message}</p>}</section>
        <section><label className="block text-sm font-semibold">Internal notes<textarea disabled={!canManage || busy} value={note} maxLength={2000} rows={3} onChange={event => setNote(event.target.value)} className="mt-2 w-full rounded-xl border border-admin-control bg-admin-surface p-3 text-base font-normal" /></label>{canManage && <button disabled={busy || note === item.notes} onClick={() => void saveNote()} className="mt-2 min-h-11 rounded-xl border border-admin-border px-4 text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save notes'}</button>}</section>
        {canManage && canViewPhone && <CustomerLookupPanel phone={item.phone} current={{ type: 'enquiry', id }} />}
      </>}
      {item.lastCall?.outcome === 'quotation_needed' && canViewQuotations && canManage && <Link to={`/admin/enquiries/${id}?tab=quotations`} onClick={event => { event.preventDefault(); void openPage(`/admin/enquiries/${id}?tab=quotations`); }} className="inline-flex min-h-11 items-center text-sm font-semibold text-admin-primary underline">Open quotations for this enquiry</Link>}
      <EnquiryCallHistory enquiry={item} />
    </div>}
  </BookingDialog>;
}
