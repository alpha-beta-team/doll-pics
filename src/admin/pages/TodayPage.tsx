import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, CalendarHeart, Check, CheckCircle2, Circle, IndianRupee, MessageCircle, Phone, Plus, RefreshCw, RotateCcw, Star, X } from 'lucide-react';
import { api } from '../api/client';
import { InstallAppButton } from '../components/InstallAppButton';
import type { TodayFollowUp, TodayOccasionTask, TodayReviewTask, TodaySummaryItem, TodayWork } from '../types';
import { FollowUpShortcuts } from '../components/FollowUpShortcuts';
import { followUpDateError, kolkataLocalToIso } from '../components/followUp.utils';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import type { ManualWhatsAppContext, WhatsAppTemplateId } from '../components/whatsappTemplates';
import { endOfDayChecks } from '../components/todayChecklist.utils';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { occasionMessageContext, occasionUrgency } from '../components/occasionPresentation';
import { AdminAlert, AdminButton, AdminIconButton, AdminLoadingState, AdminPageHeader } from '../components/ui';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { useFeatureAccess } from '../access/useFeatureAccess';

export function TodayPage() {
  const { canManage, isReadOnly } = useFeatureAccess('today');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { canView: canViewEnquiries } = useFeatureAccess('enquiries');
  const { canView: canViewBookings } = useFeatureAccess('bookings');
  const { canView: canViewOccasions } = useFeatureAccess('occasions');
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [work, setWork] = useState<TodayWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rescheduling, setRescheduling] = useState<TodayFollowUp | null>(null);
  const [message, setMessage] = useState<{ context: ManualWhatsAppContext; initial: WhatsAppTemplateId; onOpened?: () => void | Promise<void> } | null>(null);
  const load = useCallback(async () => {
    setError('');
    try {
      const loaded = await api.getTodayWork();
      setWork({
        ...loaded,
        occasionsDue: canViewOccasions ? loaded.occasionsDue : [],
        reviewRequests: canViewBookings ? loaded.reviewRequests : [],
        followUps: loaded.followUps
          .filter((item) => item.entityType === 'enquiry' ? canViewEnquiries : canViewBookings)
          .map((item) => canViewPayments ? item : ({ ...item, balanceDue: undefined, paymentDueDate: undefined })),
        newEnquiries: canViewEnquiries ? loaded.newEnquiries : [],
        todayShoots: canViewBookings ? loaded.todayShoots : [],
        paymentsDue: canViewPayments && canViewBookings ? loaded.paymentsDue : [],
        tomorrowShoots: canViewBookings ? loaded.tomorrowShoots : [],
      });
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load today’s work.'); }
    finally { setLoading(false); }
  }, [canViewBookings, canViewEnquiries, canViewOccasions, canViewPayments]);
  useEffect(() => { void load(); }, [load]);

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
  const markOccasionContacted = async (item: TodayOccasionTask) => {
    try { await api.markOccasionContacted(item.id, item.nextOccurrenceDate); setSuccess(`${item.occasionName} marked contacted.`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not complete the occasion reminder.'); }
  };
  const updateReview = async (item: TodayReviewTask, action: 'requested' | 'received' | 'skipped') => {
    if (action === 'skipped') {
      const accepted = await confirm({ title: 'Skip this review request?', description: 'This closes the task without requesting a review.', confirmLabel: 'Skip review', variant: 'danger' });
      if (!accepted) return;
    }
    try { await api.updateBookingReview(item.bookingId, action); setSuccess(action === 'requested' ? 'Review request was opened in WhatsApp.' : `Review marked ${action}.`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update the review task.'); }
  };

  if (loading) return <AdminLoadingState label="Preparing today’s studio work…" />;
  return <div className="mx-auto max-w-5xl space-y-5">
    <AdminPageHeader eyebrow={new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} title="Today’s work" description="Start at the top and finish one item at a time." actions={<><InstallAppButton />{isReadOnly && <ReadOnlyNotice />}<AdminIconButton label="Refresh today’s work" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></AdminIconButton>{canManage && <AdminButton onClick={() => navigate('/admin/enquiries?new=1')} className="hidden sm:inline-flex"><Plus className="h-4 w-4" />Add enquiry</AdminButton>}</>} />
    {error && <AdminAlert><span>{error}</span><button className="ml-3 font-semibold underline" onClick={() => void load()}>Try again</button></AdminAlert>}
    {success && <div className="flex rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}<button className="ml-auto" onClick={() => setSuccess('')}>Dismiss</button></div>}
    {work && <>
      <EndOfDayChecklist work={work} />
      <div id="today-occasions"><WorkSection title="Birthdays & anniversaries" count={work.occasionsDue?.length || 0} urgent={work.occasionsDue?.some(item => item.overdue)} empty="No occasion reminders are due.">
        {(work.occasionsDue || []).map(item => <article key={item.id} className="rounded-2xl border border-admin-border bg-admin-surface p-4 shadow-sm transition hover:border-admin-control hover:shadow-md"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50"><CalendarHeart className="h-5 w-5 text-pink-600" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{item.occasionName}</p><p className="mt-1 text-sm capitalize text-slate-500">{item.type} · Contact {item.customerName}</p><p className={`mt-1 text-xs font-semibold ${item.overdue ? 'text-red-600' : 'text-pink-600'}`}>{occasionUrgency(item.daysUntil)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 border-t border-admin-border pt-4 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">{canManage && <><a href={`tel:${item.phone}`} className="action"><Phone className="h-4 w-4" />Call</a><button type="button" onClick={() => setMessage({ context: occasionMessageContext(item), initial: item.type })} className="action text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</button><button type="button" onClick={() => void markOccasionContacted(item)} className="action bg-emerald-600 text-white"><Check className="h-4 w-4" />Contacted</button></>}{item.source && <Link to={`/admin/${item.source.type === 'enquiry' ? 'enquiries' : 'bookings'}/${item.source.id}`} className="action">Source</Link>}{canManage && <button type="button" onClick={() => navigate('/admin/enquiries?new=1', { state: { occasionContact: { id: item.id, customerName: item.customerName, phone: item.phone } } })} className="action bg-blue-600 text-white">Create enquiry</button>}</div></article>)}
      </WorkSection></div>
      <div id="today-reviews"><WorkSection title="Review requests" count={work.reviewRequests?.length || 0} empty="No review requests are due.">
        {(work.reviewRequests || []).map(item => <article key={item.bookingId} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50"><Star className="h-5 w-5 text-amber-600" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{item.customerName}</p><p className="mt-1 text-sm text-slate-500">{item.service || 'Photography session'} · {item.requestCount ? 'Review follow-up' : 'First request'}</p><p className="mt-1 text-xs text-slate-500">Due {formatDateTime(item.dueAt)}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{canManage && <><a href={`tel:${item.phone}`} className="action"><Phone className="h-4 w-4" />Call</a><button type="button" disabled={item.optedOut} onClick={() => setMessage({ context: { customerName: item.customerName, phone: item.phone, service: item.service, reviewUrl: item.reviewUrl, consentRecorded: item.consentRecorded, optedOut: item.optedOut }, initial: 'review_request', onOpened: () => updateReview(item, 'requested') })} className="action text-emerald-700 disabled:opacity-40"><MessageCircle className="h-4 w-4" />WhatsApp</button></>}<Link to={`/admin/bookings/${item.bookingId}`} className="action">Open</Link>{canManage && <><button type="button" onClick={() => void updateReview(item, 'received')} className="action bg-emerald-600 text-white">Received</button><button type="button" onClick={() => void updateReview(item, 'skipped')} className="action text-slate-600">Skip</button></>}</div></article>)}
      </WorkSection></div>
      <div id="today-followups"><WorkSection title="Follow-ups" count={work.followUps.length} urgent={work.followUps.some(item => item.overdue)} empty="No follow-ups due. You are up to date.">
        {work.followUps.map(item => <article key={`${item.entityType}-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.shootType || 'Service not decided'}{item.note ? ` · ${item.note}` : ''}</p><p className={`mt-2 text-xs font-semibold ${item.overdue ? 'text-red-600' : 'text-amber-700'}`}>{item.overdue ? 'Overdue · ' : ''}{item.dueAt ? new Date(item.dueAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'Due today'}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.entityType === 'enquiry' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>{item.entityType}</span></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{canManage && <><a href={`tel:${item.phone}`} className="action"><Phone className="h-4 w-4" /> Call</a><button type="button" onClick={() => setMessage({ context: followUpMessageContext(item), initial: item.entityType === 'booking' ? 'booking_confirmation' : 'enquiry_follow_up' })} className="action text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</button><button onClick={() => void complete(item)} className="action bg-emerald-600 text-white"><Check className="h-4 w-4" /> Done</button><button onClick={() => setRescheduling(item)} className="action"><RotateCcw className="h-4 w-4" /> Reschedule</button></>}<Link to={`/admin/${item.entityType === 'enquiry' ? 'enquiries' : 'bookings'}/${item.id}`} className="action bg-slate-900 text-white">Open</Link></div></article>)}
      </WorkSection></div>
      <div id="today-new-enquiries"><WorkSection title="New enquiries" count={work.newEnquiries.length} empty="No new enquiries waiting.">{work.newEnquiries.map(item => <SimpleTask key={item.id} item={item} to={`/admin/enquiries/${item.id}`} onMessage={canManage ? () => setMessage({ context: summaryMessageContext(item), initial: 'enquiry_follow_up' }) : undefined} />)}</WorkSection></div>
      <div id="today-shoots"><WorkSection title="Today’s shoots" count={work.todayShoots.length} empty="No confirmed shoots today.">{work.todayShoots.map(item => <SimpleTask key={item.id} item={item} to={`/admin/bookings/${item.id}`} calendar onMessage={canManage ? () => setMessage({ context: summaryMessageContext(item), initial: 'shoot_reminder' }) : undefined} />)}</WorkSection></div>
      {canViewPayments && <div id="today-payments"><WorkSection title="Payments due" count={work.paymentsDue.length} empty="No payments are due today.">{work.paymentsDue.map(item => <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><IndianRupee className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="text-sm text-slate-500">Balance {money(item.balanceDue)} · due {item.paymentDueDate}</p></div>{canManage && <button type="button" onClick={() => setMessage({ context: { ...summaryMessageContext(item), balanceDue: item.balanceDue, paymentDueDate: item.paymentDueDate }, initial: 'payment_reminder' })} className="flex h-11 items-center gap-2 rounded-xl border border-emerald-300 px-3 text-sm font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" />Message</button>}<Link to={`/admin/bookings/${item.id}`} className="flex h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">Open</Link></article>)}</WorkSection></div>}
      <div id="today-tomorrow"><WorkSection title="Tomorrow’s shoots" count={work.tomorrowShoots.length} empty="No confirmed shoots tomorrow.">{work.tomorrowShoots.map(item => <SimpleTask key={item.id} item={item} to={`/admin/bookings/${item.id}`} calendar onMessage={canManage ? () => setMessage({ context: summaryMessageContext(item), initial: 'shoot_reminder' }) : undefined} />)}</WorkSection></div>
    </>}
    {canManage && rescheduling && <FollowUpDialog item={rescheduling} onClose={() => setRescheduling(null)} onSave={reschedule} />}
    {canManage && message && <WhatsAppComposer context={message.context} initialTemplate={message.initial} onOpened={message.onOpened} onClose={() => setMessage(null)} />}
  </div>;
}

function WorkSection({ title, count, empty, urgent, children }: { title: string; count: number; empty: string; urgent?: boolean; children: React.ReactNode }) { return <section className={`rounded-2xl border p-4 sm:p-5 ${urgent ? 'border-red-200 bg-red-50/50' : 'border-admin-border bg-admin-muted/55'}`}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2><span className={`inline-flex min-w-7 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${urgent ? 'bg-red-100 text-red-700' : 'bg-admin-surface text-admin-secondary'}`}>{count}</span></div><div className="space-y-3">{count ? children : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">{empty}</div>}</div></section>; }
function SimpleTask({ item, to, calendar, onMessage }: { item: TodaySummaryItem; to: string; calendar?: boolean; onMessage?: () => void }) { return <article className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{calendar ? <CalendarDays className="h-5 w-5" /> : item.name.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="truncate text-sm text-slate-500">{item.shootType || 'Service not decided'}{item.location ? ` · ${item.location}` : ''}</p></div>{onMessage && <button type="button" onClick={onMessage} className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300 text-emerald-700" aria-label={`Message ${item.name}`}><MessageCircle className="h-4 w-4" /></button>}<Link to={to} className="flex h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Open</Link></article>; }
function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
function formatDateTime(value: string) { return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); }

function summaryMessageContext(item: TodaySummaryItem): ManualWhatsAppContext { return { customerName: item.name, phone: item.phone, service: item.shootType, bookingDate: item.bookingDate, startTime: item.startTime, endTime: item.endTime, location: item.location, consentRecorded: item.whatsappOptIn, optedOut: Boolean(item.whatsappOptOutAt) }; }
function followUpMessageContext(item: TodayFollowUp): ManualWhatsAppContext { return { customerName: item.name, phone: item.phone, service: item.shootType, bookingDate: item.bookingDate, startTime: item.startTime, endTime: item.endTime, location: item.location, balanceDue: item.balanceDue, paymentDueDate: item.paymentDueDate, consentRecorded: item.whatsappOptIn, optedOut: Boolean(item.whatsappOptOutAt) }; }

function EndOfDayChecklist({ work }: { work: TodayWork }) {
  const checks = endOfDayChecks(work);
  const allClear = checks.every(check => check.count === 0);
  return <section className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${allClear ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50/60'}`}><div className="flex items-center gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${allClear ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}><CheckCircle2 className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-slate-900">End of day</h2><p className="text-sm text-slate-600">{allClear ? 'All clear for today.' : 'This updates automatically as work is completed.'}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{checks.map(check => <a key={check.label} href={check.href} className="flex min-h-11 items-center gap-3 rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">{check.count === 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-amber-600" />}<span className="flex-1">{check.label}</span><span className={check.count ? 'text-amber-700' : 'text-emerald-700'}>{check.count ? `${check.count} left` : 'Done'}</span></a>)}</div></section>;
}

function FollowUpDialog({ item, onClose, onSave }: { item: TodayFollowUp; onClose: () => void; onSave: (item: TodayFollowUp, when: string, note: string) => Promise<void> }) {
  const [when, setWhen] = useState('');
  const [note, setNote] = useState(item.note || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => { const nextError = followUpDateError(when); if (nextError) return setError(nextError); setSaving(true); setError(''); try { await onSave(item, when, note.trim()); } catch { setError('Could not reschedule the follow-up.'); setSaving(false); } };
  return <div className="fixed inset-0 z-[85] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className="w-full rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-2xl"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Reschedule {item.name}</h2><p className="text-sm text-slate-500">Choose the next follow-up.</p></div><button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center" aria-label="Close"><X className="h-5 w-5" /></button></div><div className="mt-4"><FollowUpShortcuts value={when} onChange={value => { setWhen(value); setError(''); }} disabled={saving} /></div><input value={note} onChange={event => setNote(event.target.value)} placeholder="What should we discuss?" className="mt-3 h-12 w-full rounded-xl border border-slate-300 px-3" />{error && <p className="mt-2 text-sm text-red-600">{error}</p>}<div className="mt-4 grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold">Cancel</button><button type="button" disabled={saving || !when} onClick={() => void save()} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save follow-up'}</button></div></div></div>;
}
