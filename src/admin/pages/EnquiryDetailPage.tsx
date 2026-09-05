import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Edit3, MessageCircle, Phone, MapPin, Clock3 } from 'lucide-react';
import { api } from '../api/client';
import { EnquiryFormModal } from '../components/EnquiryFormModal';
import { EnquiryStageBadge } from '../components/EnquiryStageBadge';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Enquiry, EnquiryStage } from '../types';
import { formatTimeWindow } from '../../shared/bookingTime';
import { dateTimeLocalInKolkata, followUpDateError, kolkataLocalToIso } from '../components/followUp.utils';
import { FollowUpPanel } from '../components/FollowUpPanel';
import { CustomerLookupPanel } from '../components/CustomerLookupPanel';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import { VoiceNotesPanel } from '../components/VoiceNotesPanel';
import { ImportantDatesPanel } from '../components/ImportantDatesPanel';
import { QuotationEnquiryPanel } from '../components/QuotationEnquiryPanel';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { hasStaffPermission } from '../access/roles';
import { AdminTabs } from '../components/AdminTabs';
import { BookingDialog as DetailDialog, BookingSection as DetailSection, BookingTabPanel as DetailTabPanel } from '../components/bookings/BookingDetailSections';
import { leadSourceLabel } from '../components/leadSource';

export function EnquiryDetailPage() {
  const { id } = useParams();
  return <EnquiryDetailWorkspace key={id} />;
}

function EnquiryDetailWorkspace() {
  const { canManage, isReadOnly } = useFeatureAccess('enquiries');
  const { canView: canViewBookings } = useFeatureAccess('bookings');
  const { user } = useAuth();
  const canViewPhone = hasStaffPermission(user, 'mask_phone_number');
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [params, setParams] = useSearchParams();
  const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'customer', label: 'Customer' }, { id: 'notes', label: 'Notes' }, ...(canManage ? [{ id: 'quotations', label: 'Quotations' }] : [])];
  const tab = tabs.some(value => value.id === params.get('tab')) ? params.get('tab')! : 'overview';
  const selectTab = (value: string) => setParams(previous => { const next = new URLSearchParams(previous); next.set('tab', value); return next; });
  const [visited, setVisited] = useState(() => new Set([tab]));
  useEffect(() => { setVisited(previous => new Set([...previous, tab])); }, [tab]);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [item, setItem] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!success) return; const timer = window.setTimeout(() => setSuccess(''), 5000); return () => window.clearTimeout(timer); }, [success]);
  const [editing, setEditing] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try { setItem(await api.getEnquiry(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load this enquiry.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const setStage = async (stage: EnquiryStage) => {
    if (!item || !canManage || saving || item.stage === 'booked' || stage === item.stage || stage === 'booked') return;
    if (stage === 'closed_lost') {
      const ok = await confirm({ title: 'Mark as not interested?', description: 'This closes the enquiry and removes its follow-up.', confirmLabel: 'Close enquiry', variant: 'danger' });
      if (!ok) return;
    }
    setSaving(true); setError('');
    try { setItem(await api.updateEnquiryStage(item.id, stage)); setSuccess(stage === 'closed_lost' ? 'Enquiry closed.' : 'Enquiry stage updated.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update the stage.'); }
    finally { setSaving(false); }
  };

  const schedule = async (when: string, note = followUpNote) => {
    if (!item || !canManage || saving) return;
    if (!when) return setFollowUpError('Choose a follow-up date and time.');
    const validationError = followUpDateError(when);
    if (validationError) return setFollowUpError(validationError);
    setSaving(true); setFollowUpError('');
    try { setItem(await api.scheduleEnquiryFollowUp(item.id, kolkataLocalToIso(when), note || undefined)); setFollowUpAt(''); setFollowUpNote(''); setSuccess('Follow-up saved.'); setFollowUpOpen(false); }
    catch (err) { setFollowUpError(err instanceof Error ? err.message : 'Could not schedule the follow-up.'); }
    finally { setSaving(false); }
  };

  const complete = async () => {
    if (!item) return;
    setSaving(true);
    try { setItem(await api.completeEnquiryFollowUp(item.id)); setSuccess('Follow-up completed.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not complete the follow-up.'); }
    finally { setSaving(false); }
  };

  const openFollowUp = () => {
    if (!item) return;
    setFollowUpAt(item.nextFollowUpAt ? dateTimeLocalInKolkata(new Date(item.nextFollowUpAt)) : '');
    setFollowUpNote(item.followUpNote || ''); setFollowUpError(''); setFollowUpOpen(true);
  };
  const closeFollowUp = async () => {
    if (!item || saving) return;
    const dirty = followUpAt !== (item.nextFollowUpAt ? dateTimeLocalInKolkata(new Date(item.nextFollowUpAt)) : '') || followUpNote !== (item.followUpNote || '');
    if (dirty && !await confirm({ title: 'Discard unsaved follow-up?', description: 'Your reminder changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    setFollowUpOpen(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  if (!item) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Enquiry not found.'}</div>;
  const closed = ['booked', 'closed_lost'].includes(item.stage);

  const overdue = !closed && item.nextFollowUpAt && new Date(item.nextFollowUpAt).getTime() < Date.now();
  const stages: EnquiryStage[] = ['new', 'contacted', 'follow_up', 'booked', 'closed_lost'];

  return <div className="mx-auto max-w-6xl space-y-4">
    <div className="flex items-center justify-between gap-3"><Link to="/admin/enquiries" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-admin-secondary"><ArrowLeft className="h-4 w-4" />All enquiries</Link>{isReadOnly && <ReadOnlyNotice />}</div>
    {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button onClick={() => setError('')} className="ml-auto min-h-11">Dismiss</button></div>}
    {success && <div role="status" className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}<button onClick={() => setSuccess('')} className="ml-auto min-h-11">Dismiss</button></div>}
    <header className="rounded-2xl border border-admin-border bg-admin-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2"><h1 className="min-w-0 break-words text-xl font-semibold text-admin-text sm:text-2xl">{item.name}</h1><EnquiryStageBadge stage={item.stage} /></div>
      <p className="mt-1 text-sm text-admin-secondary">{item.shootType || 'Service not decided'}</p>
      <div className="mt-2 flex items-center gap-2 text-sm text-admin-secondary"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />{item.phone ? canViewPhone ? <a href={`tel:${item.phone}`} className="font-medium text-admin-primary hover:underline" aria-label={`Call ${item.name}`}>{item.phone}</a> : <span>{item.phone}</span> : <span>Mobile number not recorded</span>}</div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-admin-subtle"><span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 shrink-0" />{dateLabel(item.bookingDate)}{item.startTime && item.endTime ? ` · ${formatTimeWindow(item.startTime, item.endTime)}` : ''}</span><span className="flex min-w-0 items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{item.location || 'Location not set'}</span></span></div>
      {canManage && <div className="mt-3 flex flex-wrap items-center gap-2">{canViewPhone && <><a href={`tel:${item.phone}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 border border-slate-200 text-sm font-semibold text-slate-700"><Phone className="h-4 w-4" /> Call</a><button type="button" onClick={() => setMessageOpen(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</button></>}{!canViewPhone && <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Client phone is masked for this account.</div>}<button onClick={() => setEditing(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 border border-slate-200 text-sm font-semibold text-slate-700"><Edit3 className="h-4 w-4" /> Edit</button><button disabled={closed} title={closed ? 'Closed enquiries cannot be converted' : undefined} onClick={() => navigate('/admin/bookings', { state: { convertFromEnquiry: item } })} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 bg-blue-600 text-sm font-semibold text-white disabled:bg-slate-300"><CalendarCheck className="h-4 w-4" /> Convert to booking</button></div>}
      {closed && <p className="mt-3 text-sm text-admin-subtle">{item.stage === 'booked' ? 'This enquiry has been converted.' : 'This enquiry is closed. Reopen its stage before converting.'}{item.convertedBookingId && canViewBookings && <Link className="ml-2 font-semibold text-admin-primary underline" to={`/admin/bookings/${item.convertedBookingId}`}>Open booking</Link>}</p>}
    </header>
    <div className="sticky top-16 z-10 rounded-xl border border-admin-border bg-admin-surface shadow-sm"><AdminTabs label="Enquiry details" tabs={tabs} value={tab} onChange={selectTab} wrap compact /></div>
    <DetailTabPanel namespace="enquiry-details" id="overview" active={tab === 'overview'}>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <DetailSection title="Next follow-up" action={canManage && !closed ? <button className="min-h-11 text-sm font-semibold text-admin-primary" onClick={openFollowUp}>{item.nextFollowUpAt ? 'Edit follow-up' : 'Schedule follow-up'}</button> : undefined}>
          <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-admin-subtle" /><div><p className="text-sm font-semibold">{closed ? item.stage === 'booked' ? 'Follow-ups continue on the booking' : 'Enquiry closed' : item.nextFollowUpAt ? followUpLabel(item.nextFollowUpAt) : 'Follow-up not scheduled'}</p>{overdue && <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Overdue</span>}{!closed && item.followUpNote && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-admin-secondary">{item.followUpNote}</p>}</div></div>
          {canManage && !closed && item.nextFollowUpAt && <button disabled={saving} onClick={() => void complete()} className="mt-2 min-h-11 text-sm font-semibold text-admin-primary">Mark complete</button>}
        </DetailSection>
        <DetailSection title="Enquiry stage">{canManage ? <><label className="block text-sm text-admin-secondary">Stage<select aria-label="Enquiry stage" value={item.stage} disabled={saving || item.stage === 'booked'} onChange={event => void setStage(event.target.value as EnquiryStage)} className="mt-2 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-text">{stages.map(stage => <option key={stage} value={stage} disabled={stage === 'booked'}>{stageLabel(stage)}</option>)}</select></label><p className="mt-2 text-xs text-admin-subtle">{item.stage === 'booked' ? 'Manage the converted booking using Open booking.' : 'Use Convert to booking to mark this enquiry as booked.'}</p></> : <EnquiryStageBadge stage={item.stage} />}</DetailSection>
        <DetailSection title="Shoot preferences"><dl className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Service" value={item.shootType} /><Detail label="Preferred date" value={dateLabel(item.bookingDate)} /><Detail label="Preferred time" value={item.startTime && item.endTime ? formatTimeWindow(item.startTime, item.endTime) : ''} /><Detail label="Location" value={item.location} /></dl></DetailSection>
        <DetailSection title="Customer message"><p className="whitespace-pre-wrap break-words text-sm text-admin-secondary">{item.message || 'No customer message recorded.'}</p></DetailSection>
      </div>
    </DetailTabPanel>
    <DetailTabPanel namespace="enquiry-details" id="customer" active={tab === 'customer'}>
      <DetailSection title="Customer"><dl className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Phone" value={item.phone} /><Detail label="Email" value={item.email} /><Detail label="Source" value={leadSourceLabel(item.source)} /></dl></DetailSection>
      {canManage && canViewPhone && (visited.has('customer') || tab === 'customer') && <><CustomerLookupPanel phone={item.phone} current={{ type: 'enquiry', id: item.id }} /><ImportantDatesPanel compact phone={item.phone} customerName={item.name} email={item.email} source={{ type: 'enquiry', id: item.id }} /></>}
    </DetailTabPanel>
    <DetailTabPanel namespace="enquiry-details" id="notes" active={tab === 'notes'}><DetailSection title="Internal notes" action={canManage ? <button className="min-h-11 text-sm font-semibold text-admin-primary" onClick={() => setEditing(true)}>Edit notes</button> : undefined}><p className="whitespace-pre-wrap break-words text-sm text-admin-secondary">{item.notes || 'No internal notes recorded.'}</p></DetailSection></DetailTabPanel>
    {canManage && (visited.has('notes') || tab === 'notes') && <VoiceNotesPanel compact recordType="enquiry" recordId={item.id} hidden={tab !== 'notes'} />}
    {canManage && <DetailTabPanel namespace="enquiry-details" id="quotations" active={tab === 'quotations'}>{(visited.has('quotations') || tab === 'quotations') && <QuotationEnquiryPanel enquiryId={item.id} compact />}</DetailTabPanel>}
    {followUpOpen && canManage && !closed && <DetailDialog title={item.nextFollowUpAt ? 'Edit follow-up' : 'Schedule follow-up'} onClose={() => void closeFollowUp()}>{followUpError && <p role="alert" className="mb-3 text-sm text-red-700">{followUpError}</p>}    {canManage && !closed && <FollowUpPanel
      value={followUpAt}
      note={followUpNote}
      onChange={setFollowUpAt}
      onNoteChange={setFollowUpNote}
      onSubmit={() => void schedule(followUpAt)}
      disabled={saving}
      submitLabel={item.nextFollowUpAt ? 'Save follow-up changes' : 'Save follow-up'}
      current={item.nextFollowUpAt ? {
        dateLabel: new Date(item.nextFollowUpAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
        note: item.followUpNote,
        overdue: new Date(item.nextFollowUpAt).getTime() < Date.now(),
      } : undefined}

    />}<button disabled={saving} onClick={() => void closeFollowUp()} className="mt-3 min-h-11 px-3 text-sm">Cancel</button></DetailDialog>}
    {canManage && editing && <EnquiryFormModal enquiry={item} onClose={() => setEditing(false)} onSaved={saved => { setItem(saved); setEditing(false); setSuccess('Enquiry details saved.'); }} />}
    {canManage && messageOpen && canViewPhone && <WhatsAppComposer context={{ customerName: item.name, phone: item.phone, service: item.shootType, bookingDate: item.bookingDate, startTime: item.startTime, endTime: item.endTime, location: item.location, consentRecorded: item.whatsappOptIn, optedOut: Boolean(item.whatsappOptOutAt) }} onClose={() => setMessageOpen(false)} />}
  </div>;
}

function Detail({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium text-slate-700">{value || 'Not recorded'}</dd></div>; }

function stageLabel(stage: EnquiryStage) { return stage === 'closed_lost' ? 'Not interested' : stage === 'follow_up' ? 'Follow-up' : stage[0].toUpperCase() + stage.slice(1); }
function dateLabel(value?: string) { return value ? new Date(`${value.slice(0, 10)}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Date not set'; }
function followUpLabel(value: string) { return new Date(value).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); }
