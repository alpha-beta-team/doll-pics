import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, Clock3, MessageCircle, Phone, Plus, RefreshCw, RotateCcw, X } from 'lucide-react';
import { api } from '../api/client';
import { InstallAppButton } from '../components/InstallAppButton';
import type { TodayFollowUp, TodaySummaryItem, TodayWorkspace } from '../types';
import { FollowUpShortcuts } from '../components/FollowUpShortcuts';
import { followUpDateError, kolkataLocalToIso } from '../components/followUp.utils';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import type { ManualWhatsAppContext, WhatsAppTemplateId } from '../components/whatsappTemplates';
import { AdminAlert, AdminButton, AdminIconButton, AdminLoadingState, AdminPageHeader } from '../components/ui';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { useFeatureAccess } from '../access/useFeatureAccess';

export function TodayPage() {
  const { canManage, isReadOnly } = useFeatureAccess('today');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { canView: canViewEnquiries } = useFeatureAccess('enquiries');
  const { canView: canViewBookings } = useFeatureAccess('bookings');
  const navigate = useNavigate();
  const [work, setWork] = useState<TodayWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rescheduling, setRescheduling] = useState<TodayFollowUp | null>(null);
  const [message, setMessage] = useState<{ context: ManualWhatsAppContext; initial: WhatsAppTemplateId } | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    setError('');
    try {
      const loaded = await api.getTodayWorkspace(undefined, signal);
      if (signal?.aborted) return;
      setWork({
        ...loaded,
        followUps: loaded.followUps
          .filter((item) => item.entityType === 'enquiry' ? canViewEnquiries : canViewBookings)
          .map((item) => canViewPayments ? item : ({ ...item, balanceDue: undefined, paymentDueDate: undefined })),
        newEnquiries: canViewEnquiries ? loaded.newEnquiries : [],
        todayShoots: canViewBookings ? loaded.todayShoots : [],
        tomorrowShoots: canViewBookings ? loaded.tomorrowShoots : [],
      });
    }
    catch (err) { if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Could not load today’s work.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [canViewBookings, canViewEnquiries, canViewPayments]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const complete = async (item: TodayFollowUp) => {
    try {
      if (item.entityType === 'enquiry') await api.completeEnquiryFollowUp(item.id);
      else await api.completeBookingFollowUp(item.id);
      setSuccess(`${item.name}'s follow-up is done.`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not complete the follow-up.'); }
  };
  const reschedule = async (item: TodayFollowUp, when: string, note: string) => {
    try {
      if (item.entityType === 'enquiry') await api.scheduleEnquiryFollowUp(item.id, kolkataLocalToIso(when), note || undefined);
      else await api.scheduleBookingFollowUp(item.id, kolkataLocalToIso(when), note || undefined);
      setSuccess(`${item.name}'s follow-up was rescheduled.`);
      setRescheduling(null);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not reschedule the follow-up.'); throw err; }
  };
  if (loading) return <AdminLoadingState label="Preparing today’s studio work…" />;
  return <div className="mx-auto max-w-5xl space-y-5">
    <AdminPageHeader eyebrow={new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} title="Today’s work" description="Start at the top and finish one item at a time." actions={<><InstallAppButton />{isReadOnly && <ReadOnlyNotice />}<AdminIconButton label="Refresh today’s work" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></AdminIconButton>{canManage && <AdminButton onClick={() => navigate('/admin/enquiries?new=1')} className="hidden sm:inline-flex"><Plus className="h-4 w-4" />Add enquiry</AdminButton>}</>} />
    {error && <AdminAlert><span>{work ? `Could not refresh. Showing previously loaded work. ${error}` : error}</span><button className="ml-3 font-semibold underline" onClick={() => void load()}>Try again</button></AdminAlert>}
    {success && <div className="flex rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}<button className="ml-auto" onClick={() => setSuccess('')}>Dismiss</button></div>}
    {work && <>
      <div id="today-followups"><WorkSection title="Follow-ups" count={work.followUps.length} urgent={work.followUps.some(item => item.overdue)} empty="No follow-ups due. You are up to date.">
        {work.followUps.map(item => (
          <FollowUpTask
            key={`${item.entityType}-${item.id}`}
            item={item}
            canManage={canManage}
            onMessage={() => setMessage({ context: followUpMessageContext(item), initial: item.entityType === 'booking' ? 'booking_confirmation' : 'enquiry_follow_up' })}
            onComplete={() => void complete(item)}
            onReschedule={() => setRescheduling(item)}
          />
        ))}
      </WorkSection></div>
      <div id="today-new-enquiries"><WorkSection title="New enquiries" count={work.newEnquiries.length} empty="No new enquiries waiting.">{work.newEnquiries.map(item => <SimpleTask key={item.id} item={item} to={`/admin/enquiries/${item.id}`} enquiry onMessage={canManage ? () => setMessage({ context: summaryMessageContext(item), initial: 'enquiry_follow_up' }) : undefined} />)}</WorkSection></div>
      <div id="today-shoots"><WorkSection title="Today’s shoots" count={work.todayShoots.length} empty="No confirmed shoots today.">{work.todayShoots.map(item => <SimpleTask key={item.id} item={item} to={`/admin/bookings/${item.id}`} calendar onMessage={canManage ? () => setMessage({ context: summaryMessageContext(item), initial: 'shoot_reminder' }) : undefined} />)}</WorkSection></div>
      <div id="today-tomorrow"><WorkSection title="Tomorrow’s shoots" count={work.tomorrowShoots.length} empty="No confirmed shoots tomorrow.">{work.tomorrowShoots.map(item => <SimpleTask key={item.id} item={item} to={`/admin/bookings/${item.id}`} calendar onMessage={canManage ? () => setMessage({ context: summaryMessageContext(item), initial: 'shoot_reminder' }) : undefined} />)}</WorkSection></div>
    </>}
    {canManage && rescheduling && <FollowUpDialog item={rescheduling} onClose={() => setRescheduling(null)} onSave={reschedule} />}
    {canManage && message && <WhatsAppComposer context={message.context} initialTemplate={message.initial} onClose={() => setMessage(null)} />}
  </div>;
}

function WorkSection({ title, count, empty, urgent, children }: { title: string; count: number; empty: string; urgent?: boolean; children: React.ReactNode }) { return <section className={`rounded-2xl border bg-admin-muted/55 p-4 sm:p-5 ${urgent ? 'border-red-200' : 'border-admin-border'}`}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2><span className={`inline-flex min-w-7 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${urgent ? 'bg-red-100 text-red-700' : 'bg-admin-surface text-admin-secondary'}`}>{count}</span></div><div className="space-y-3">{count ? children : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">{empty}</div>}</div></section>; }

function FollowUpTask({ item, canManage, onMessage, onComplete, onReschedule }: { item: TodayFollowUp; canManage: boolean; onMessage: () => void; onComplete: () => void; onReschedule: () => void }) {
  const target = `/admin/${item.entityType === 'enquiry' ? 'enquiries' : 'bookings'}/${item.id}`;
  const iconButton = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-admin-control bg-admin-surface text-admin-secondary transition-colors hover:bg-admin-muted hover:text-admin-text';
  return <article className={`rounded-xl border bg-admin-surface p-4 shadow-sm transition-shadow hover:shadow-md ${item.overdue ? 'border-red-200' : 'border-admin-border'}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-admin-text">{item.name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${item.entityType === 'enquiry' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>{item.entityType}</span>
        </div>
        <p className="mt-1 truncate text-sm text-admin-secondary">{item.shootType || 'Service not decided'}{item.note ? ` · ${item.note}` : ''}</p>
        <p className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold ${item.overdue ? 'text-red-600' : 'text-amber-700'}`}><Clock3 className="h-3.5 w-3.5" />{item.overdue ? 'Overdue · ' : ''}{item.dueAt ? formatDateTime(item.dueAt) : 'Due today'}</p>
      </div>

      <div className={`${canManage ? 'grid grid-cols-5' : 'flex justify-end'} gap-2 sm:flex sm:shrink-0`}>
        {canManage && <>
          <a href={`tel:${item.phone}`} aria-label={`Call ${item.name}`} title="Call" className={iconButton}><Phone className="h-4 w-4" /></a>
          <button type="button" aria-label={`Message ${item.name} on WhatsApp`} title="WhatsApp" onClick={onMessage} className={`${iconButton} text-emerald-700`}><MessageCircle className="h-4 w-4" /></button>
          <button type="button" aria-label={`Reschedule ${item.name}'s follow-up`} title="Reschedule" onClick={onReschedule} className={iconButton}><RotateCcw className="h-4 w-4" /></button>
          <button type="button" aria-label={`Mark ${item.name}'s follow-up done`} title="Mark done" onClick={onComplete} className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700 sm:w-auto sm:px-4"><Check className="h-4 w-4" /><span className="hidden sm:inline">Done</span></button>
        </>}
        <Link to={target} aria-label={`Open ${item.name}'s ${item.entityType}`} title={`Open ${item.entityType}`} className={iconButton}><ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  </article>;
}
function SimpleTask({ item, to, calendar, enquiry, onMessage }: { item: TodaySummaryItem; to: string; calendar?: boolean; enquiry?: boolean; onMessage?: () => void }) { return <article className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{calendar ? <CalendarDays className="h-5 w-5" /> : item.name.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold text-slate-900">{item.name}</p>{enquiry && item.source && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">{item.source.replace(/_/g, ' ')}</span>}</div><p className="truncate text-sm text-slate-500">{item.shootType || 'Service not decided'}{item.location ? ` · ${item.location}` : ''}</p>{enquiry && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><a href={`tel:${item.phone}`} className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900"><Phone className="h-3.5 w-3.5" />{item.phone}</a>{item.bookingDate && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Preferred {formatDate(item.bookingDate)}</span>}{item.createdAt && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Received {formatDateTime(item.createdAt)}</span>}</div>}</div>{onMessage && <button type="button" onClick={onMessage} className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300 text-emerald-700" aria-label={`Message ${item.name}`}><MessageCircle className="h-4 w-4" /></button>}<Link to={to} className="flex h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Open</Link></article>; }
function formatDateTime(value: string) { return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); }
function formatDate(value: string) { return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

function summaryMessageContext(item: TodaySummaryItem): ManualWhatsAppContext { return { customerName: item.name, phone: item.phone, service: item.shootType, bookingDate: item.bookingDate, startTime: item.startTime, endTime: item.endTime, location: item.location, consentRecorded: item.whatsappOptIn, optedOut: Boolean(item.whatsappOptOutAt) }; }
function followUpMessageContext(item: TodayFollowUp): ManualWhatsAppContext { return { customerName: item.name, phone: item.phone, service: item.shootType, bookingDate: item.bookingDate, startTime: item.startTime, endTime: item.endTime, location: item.location, balanceDue: item.balanceDue, paymentDueDate: item.paymentDueDate, consentRecorded: item.whatsappOptIn, optedOut: Boolean(item.whatsappOptOutAt) }; }

function FollowUpDialog({ item, onClose, onSave }: { item: TodayFollowUp; onClose: () => void; onSave: (item: TodayFollowUp, when: string, note: string) => Promise<void> }) {
  const [when, setWhen] = useState('');
  const [note, setNote] = useState(item.note || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => { const nextError = followUpDateError(when); if (nextError) return setError(nextError); setSaving(true); setError(''); try { await onSave(item, when, note.trim()); } catch { setError('Could not reschedule the follow-up.'); setSaving(false); } };
  return <div className="fixed inset-0 z-[85] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-2xl"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Reschedule {item.name}</h2><p className="text-sm text-slate-500">Choose the next follow-up.</p></div><button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center" aria-label="Close"><X className="h-5 w-5" /></button></div><div className="mt-4"><FollowUpShortcuts value={when} onChange={value => { setWhen(value); setError(''); }} disabled={saving} /></div><input value={note} onChange={event => setNote(event.target.value)} placeholder="What should we discuss?" className="mt-3 h-12 w-full rounded-xl border border-slate-300 px-3" />{error && <p className="mt-2 text-sm text-red-600">{error}</p>}<div className="mt-4 grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold">Cancel</button><button type="button" disabled={saving || !when} onClick={() => void save()} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save follow-up'}</button></div></div></div>;
}
