import { AdminAlert } from '../components/ui/AdminUi';
import { formatCustomerName } from '../../shared/formatCustomerName';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronLeft, Globe, MoreHorizontal, XCircle, CalendarCheck, Edit3, MessageCircle, Phone, MapPin, Clock3 } from 'lucide-react';
import './enquiries.css';
import './enquiry-detail.css';
import { BookingFormModal } from '../components/BookingFormModal';
import { EnquiryActivity } from '../components/enquiries/EnquiryHistory';
import { indiaDay } from '../components/enquiries/enquiryList';
import { EnquiryCallOutcomeForm } from '../components/enquiries/EnquiryCallOutcomeForm';
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
import { BookingNotesFollowUps, type BookingNotesHandle } from '../components/bookings/BookingNotesFollowUps';
import { enquiryWorkspaceApi } from '../api/bookingWorkspace';
import type { BookingWorkspace } from '../../shared/bookingWorkspace';
import type { StaffAccountOption } from '../types';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { AdminTabs } from '../components/AdminTabs';
import { BookingDialog as DetailDialog, BookingSection as DetailSection, BookingTabPanel as DetailTabPanel } from '../components/bookings/BookingDetailSections';
import { leadSourceLabel } from '../components/leadSource';

export function EnquiryDetailPage() {
  const { id } = useParams();
  return <EnquiryDetailWorkspace key={id} />;
}

function EnquiryDetailWorkspace() {
  const { canManage, isReadOnly } = useFeatureAccess('enquiries');
  const { canView: canViewBookings, canManage: canCreateBooking } = useFeatureAccess('bookings');
  const { user } = useAuth();
  const canViewPhone = Boolean(user && (user.role === 'owner' || !user.permissions?.includes('mask_phone_number')));
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listSearch = typeof location.state?.listSearch === 'string' ? location.state.listSearch : '';
  const [conversion, setConversion] = useState<Pick<React.ComponentProps<typeof BookingFormModal>, 'packages' | 'services' | 'staffAccounts'> | null>(null);
  const openConversion = async () => {
    setSaving(true);
    try {
      const [packages, services, staffAccounts] = await Promise.all([api.getPackages(), api.getPhotographyServices(), api.getAssignableStaffAccounts()]);
      setConversion({ packages, services, staffAccounts });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load booking options.'); }
    finally { setSaving(false); }
  };
  const confirm = useConfirmDialog();
  const [params, setParams] = useSearchParams();
  const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'customer', label: 'Customer' }, { id: 'notes', label: 'Notes & follow-ups' }];
  const tab = tabs.some(value => value.id === params.get('tab')) ? params.get('tab')! : 'overview';
  const selectTab = (value: string) => setParams(previous => { const next = new URLSearchParams(previous); next.set('tab', value); return next; }, { replace: true, state: location.state });
  const [visited, setVisited] = useState(() => new Set([tab]));
  useEffect(() => { setVisited(previous => new Set([...previous, tab])); }, [tab]);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [item, setItem] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const header = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = header.current;
    const detail = element?.closest<HTMLElement>('.lead-detail');
    if (!element || !detail) return;
    const measure = () => detail.style.setProperty('--enquiry-header-height', `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); detail.style.removeProperty('--enquiry-header-height'); };
  }, [loading]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!success) return; const timer = window.setTimeout(() => setSuccess(''), 5000); return () => window.clearTimeout(timer); }, [success]);
  const [editing, setEditing] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [saving, setSaving] = useState(false);
  const notesRef = useRef<BookingNotesHandle>(null);
  const [workspace, setWorkspace] = useState<BookingWorkspace | null>(null);
  const [staff, setStaff] = useState<StaffAccountOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const loadStaff = useCallback(async () => {
    if (!canManage) return;
    setStaffLoading(true); setStaffError('');
    try { setStaff(await api.getAssignableStaffAccounts()); }
    catch (cause) { setStaffError(cause instanceof Error ? cause.message : 'Could not load staff'); }
    finally { setStaffLoading(false); }
  }, [canManage]);
  useEffect(() => { void loadStaff(); }, [loadStaff]);
  const receiveWorkspace = (state: BookingWorkspace) => {
    setWorkspace(state);
    setItem(previous => previous ? { ...previous, nextFollowUpAt: state.nextFollowUpAt || '', followUpNote: state.followUpNote } : previous);
  };
  const reloadNotes = () => notesRef.current?.retry();
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
    try { setItem(await api.updateEnquiryStage(item.id, stage)); setSuccess(stage === 'closed_lost' ? 'Enquiry closed.' : 'Enquiry stage updated.'); reloadNotes(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update the stage.'); }
    finally { setSaving(false); }
  };

  const schedule = async (when: string, note = followUpNote) => {
    if (!item || !canManage || saving) return;
    if (!when) return setFollowUpError('Choose a follow-up date and time.');
    const validationError = followUpDateError(when);
    if (validationError) return setFollowUpError(validationError);
    setSaving(true); setFollowUpError('');
    try { setItem(await api.scheduleEnquiryFollowUp(item.id, kolkataLocalToIso(when), note || undefined)); setFollowUpAt(''); setFollowUpNote(''); setSuccess('Follow-up saved.'); setFollowUpOpen(false); reloadNotes(); }
    catch (err) { setFollowUpError(err instanceof Error ? err.message : 'Could not schedule the follow-up.'); }
    finally { setSaving(false); }
  };

  const complete = async () => {
    if (!item) return;
    setSaving(true);
    try { setItem(await api.completeEnquiryFollowUp(item.id)); setSuccess('Follow-up completed.'); reloadNotes(); }
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
  if (!item) return <AdminAlert className="mx-auto max-w-xl">{error || 'Enquiry not found.'} <button onClick={() => void load()}>Retry</button></AdminAlert>;
  const breadcrumbHost = document.getElementById('enquiry-detail-breadcrumb');
  const closed = ['booked', 'closed_lost'].includes(item.stage);
  const displayedPhone = canViewPhone ? item.phone : 'Phone hidden';

  const overdue = !closed && item.nextFollowUpAt && new Date(item.nextFollowUpAt).getTime() < Date.now();
  const stageDescriptions = { new: 'Enquiry received', contacted: 'Contact made', follow_up: 'Waiting on customer', booked: 'Via Convert to booking', closed_lost: '' };
  const stages: EnquiryStage[] = ['new', 'contacted', 'follow_up', 'booked', 'closed_lost'];

  const shootInDays = (Date.parse(item.bookingDate?.slice(0, 10)) - Date.parse(indiaDay(new Date()))) / 86400000;
  const noteCount = workspace?.notes.length ?? (item.internalNotes?.length || 0) + Number(Boolean(item.notes));
  const today = indiaDay(new Date());
  const tomorrow = indiaDay(new Date(Date.now() + 86400000));
  const indiaMidnight = new Date(today + 'T00:00:00Z');
  const daysToSaturday = (6 - indiaMidnight.getUTCDay() + 7) % 7 || 7;
  const saturday = new Date(indiaMidnight.getTime() + daysToSaturday * 86400000);
  const quickTimes = [{ label: 'Today, 6 pm', value: today + 'T18:00' }, { label: 'Tomorrow, 11 am', value: tomorrow + 'T11:00' },
    { label: saturday.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }), value: saturday.toISOString().slice(0, 10) + 'T16:00' }];
  return <div className="lead-detail mx-auto max-w-6xl space-y-4">
    {breadcrumbHost && createPortal(<nav className="enquiry-crumb" aria-label="Breadcrumb"><Link aria-label="All enquiries" to={'/admin/enquiries' + listSearch}><ChevronLeft size={15}/>Enquiries</Link><span>/</span><strong>{formatCustomerName(item.name)}</strong></nav>, breadcrumbHost)}
    {isReadOnly && <ReadOnlyNotice/>}
    {error && <AdminAlert contentClassName="flex items-center gap-3">{error}<button onClick={() => setError('')} className="ml-auto min-h-11">Dismiss</button></AdminAlert>}
    {success && <AdminAlert tone="success" contentClassName="flex items-center gap-3">{success}<button onClick={() => setSuccess('')} className="ml-auto min-h-11">Dismiss</button></AdminAlert>}
    <header ref={header} className="enquiry-name-header rounded-2xl border border-admin-border bg-admin-surface p-4 shadow-sm">
      <div className="lead-identity" data-stage={item.stage}><span className="lead-avatar" aria-hidden="true">{formatCustomerName(item.name).charAt(0)}</span><div><div className="flex flex-wrap items-center gap-2"><h1 className="min-w-0 break-words text-xl font-semibold text-admin-text sm:text-2xl">{formatCustomerName(item.name)}</h1><EnquiryStageBadge stage={item.stage} /></div>
      <div className="enquiry-meta">
        <span><Phone/>{canViewPhone && item.phone ? <a href={'tel:' + item.phone}>{item.phone}</a> : displayedPhone || 'Phone not recorded'}</span>
        <span><CalendarCheck/>{dateLabel(item.bookingDate)}</span>
        <span><MapPin/>{item.location || 'Location not set'}</span>
        <span><Globe/>{leadSourceLabel(item.source)} · {item.shootType || 'Service not decided'}</span>
      </div></div></div>
      {canManage && <div className="lead-actions mt-3 flex flex-wrap items-center gap-2">{canViewPhone && item.phone && <><a href={`tel:${item.phone}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 border border-slate-200 text-sm font-semibold text-slate-700"><Phone className="h-4 w-4" /> Call</a><button type="button" onClick={() => setMessageOpen(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</button></>}{!canViewPhone && <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Client phone is masked for this account.</div>}<details className="enquiry-more"><summary aria-label="More actions"><MoreHorizontal size={16}/></summary><div>
        <button onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); setEditing(true); }}><Edit3 size={14}/>Edit enquiry</button>
        {!closed && <button onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); void setStage('closed_lost'); }}><XCircle size={14}/>Mark not interested</button>}
      </div></details>{canCreateBooking && canViewPhone && <button disabled={closed || saving} title={closed ? 'Closed enquiries cannot be converted' : undefined} onClick={() => void openConversion()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:min-h-9 bg-teal-800 text-sm font-semibold text-white disabled:bg-slate-300"><CalendarCheck className="h-4 w-4" /> Convert to booking</button>}</div>}
    </header>
    <section className="enquiry-stage-summary" aria-label="Enquiry progress">
      {closed && <p className="mt-3 text-sm text-admin-subtle">{item.stage === 'booked' ? 'This enquiry has been converted.' : 'This enquiry is closed. Reopen its stage before converting.'}{item.convertedBookingId && canViewBookings && <Link className="ml-2 font-semibold text-admin-primary underline" to={`/admin/bookings/${item.convertedBookingId}`}>Open booking</Link>}</p>}
      {!closed && !item.lastCall && !item.callHistory?.length && shootInDays >= 0 && shootInDays <= 7 && <p className="lead-notice"><AlertTriangle size={16}/><span><strong>{shootInDays === 0 ? 'Shoot is today.' : 'Shoot in ' + shootInDays + (shootInDays === 1 ? ' day.' : ' days.')}</strong> No call logged. Call today to confirm availability.</span></p>}
      <ol className="lead-stages" aria-label="Enquiry stage">{stages.map((stage, index) =>
        <li key={stage} data-complete={!closed && index < stages.indexOf(item.stage)}><button type="button" aria-current={item.stage === stage ? 'step' : undefined}
          disabled={!canManage || saving || item.stage === 'booked' || stage === 'booked'} onClick={() => void setStage(stage)}>
          {stage !== 'closed_lost' && <span className="lead-step" aria-hidden="true">{index + 1}</span>}
          {stage === 'closed_lost' && <XCircle size={13}/>}<span>{stageLabel(stage)}{stageDescriptions[stage] && <small>{stageDescriptions[stage]}</small>}</span>
        </button></li>)}</ol>
    </section>
    <div className="enquiry-detail-tabs"><AdminTabs label="Enquiry details" tabs={tabs.map(t => t.id === 'notes' ? { ...t, badge: String(noteCount) } : t)} value={tab} onChange={selectTab} wrap compact /></div>
    {item.saleContext && <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800"><h2 className="font-semibold">Enquired about {item.saleContext.campaignName}</h2><p className="mt-1">The offer is checked again at booking confirmation. This enquiry does not reserve a discounted price.</p></section>}
    <DetailTabPanel namespace="enquiry-details" id="overview" active={tab === 'overview'}>
      <div className="enquiry-shoot-preferences"><DetailSection title="Shoot preferences" action={canManage && <button onClick={() => setEditing(true)}><Edit3 size={13}/> Edit</button>}><dl className="enquiry-preferences"><Detail label="Service" value={item.shootType} action={canManage && (!item.shootType || item.shootType === 'Other') && <button onClick={() => setEditing(true)}>Set service</button>}/><Detail label="Preferred date" value={dateLabel(item.bookingDate)} action={shootInDays >= 0 && shootInDays <= 7 && <span className="enquiry-reminder-status">{shootInDays ? 'in ' + shootInDays + (shootInDays === 1 ? ' day' : ' days') : 'Today'}</span>}/><Detail label="Preferred time" value={item.startTime && item.endTime ? formatTimeWindow(item.startTime, item.endTime) : ''} action={canManage && !item.startTime && <button onClick={() => setEditing(true)}>Add</button>}/><Detail label="Location" value={item.location} /></dl></DetailSection></div>
      <div className="grid items-start gap-4 lg:grid-cols-[1.55fr_1fr]"><div className="space-y-4">
        {canManage && !closed && <DetailSection title="Log call outcome" action={<small>Saving updates the enquiry stage</small>}><EnquiryCallOutcomeForm enquiry={item} onSaved={value => { setItem(value); setSuccess('Call outcome saved.'); reloadNotes(); }} /></DetailSection>}
        <DetailSection title="Activity" action={<small>Calls, stage changes and notes</small>}><EnquiryActivity enquiry={item} workspaceNotes={workspace?.notes}/>{!item.lastCall && !item.callHistory?.length && <div className="enquiry-empty"><Phone size={16}/><div><strong>No calls logged yet</strong><p>Each saved call shows the outcome and who logged it.</p></div></div>}</DetailSection></div><div className="space-y-4">
        <DetailSection title="Next follow-up" action={<span className="enquiry-reminder-status">{closed ? 'Closed' : overdue ? 'Overdue' : item.nextFollowUpAt ? 'Scheduled' : 'Not scheduled'}</span>}>
          <div className="flex items-start gap-2">{(closed || item.nextFollowUpAt) && <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-admin-subtle" />}<div><p className="text-sm font-semibold">{closed ? item.stage === 'booked' ? 'Follow-ups continue on the booking' : 'Enquiry closed' : item.nextFollowUpAt ? followUpLabel(item.nextFollowUpAt) : canManage ? 'Pick a time to call ' + formatCustomerName(item.name) + ' back' : 'Follow-up not scheduled'}</p>{overdue && <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Overdue</span>}{!closed && item.followUpNote && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-admin-secondary">{item.followUpNote}</p>}</div></div>
          {canManage && !closed && !item.nextFollowUpAt && <div className="lead-chips">{quickTimes.filter(time => !followUpDateError(time.value)).map(time => <button key={time.value} onClick={() => { openFollowUp(); setFollowUpAt(time.value); }}>{time.label}</button>)}<button onClick={openFollowUp}><CalendarCheck size={14}/>Pick date</button></div>}
          {canManage && !closed && item.nextFollowUpAt && <button onClick={openFollowUp} className="mr-4 text-sm font-semibold">Edit follow-up</button>}
          {canManage && !closed && item.nextFollowUpAt && <button disabled={saving} onClick={() => void complete()} className="mt-2 min-h-11 text-sm font-semibold text-admin-primary">Mark complete</button>}
        </DetailSection>

        <DetailSection title="Customer message"><p className={item.message ? "whitespace-pre-wrap break-words text-sm" : "enquiry-empty"}>{item.message || 'No customer message recorded.'}</p></DetailSection>
      </div></div>
    </DetailTabPanel>
    <DetailTabPanel namespace="enquiry-details" id="customer" active={tab === 'customer'}>
      <div className="enquiry-customer-grid"><div>      <DetailSection title="Contact" action={canManage && <button onClick={() => setEditing(true)}>Edit</button>}><dl className="grid gap-3 text-sm sm:grid-cols-2"><Detail label="Name" value={item.name}/><Detail label="Phone" value={displayedPhone} /><Detail label="Email" value={item.email} /><Detail label="Source" value={leadSourceLabel(item.source)} /></dl></DetailSection>
      {canManage && canViewPhone && visited.has('customer') && <CustomerLookupPanel phone={item.phone} current={{ type: 'enquiry', id: item.id }}/>}
      </div><div>
      {canManage && visited.has('customer') && <VoiceNotesPanel compact recordType="enquiry" recordId={item.id} hidden={tab !== 'customer'}/>}
      </div></div>
    </DetailTabPanel>
    <DetailTabPanel namespace="enquiry-details" id="notes" active={tab === 'notes'}>
      <BookingNotesFollowUps ref={notesRef} allowTasks={!closed} recordType="enquiry" workspaceApi={enquiryWorkspaceApi}
        booking={{ id: item.id, customerName: formatCustomerName(item.name) }} canManage={canManage}
        staff={staff} staffLoading={staffLoading} staffError={staffError} retryStaff={() => void loadStaff()} onSummary={receiveWorkspace} />
    </DetailTabPanel>
    {conversion && canManage && canCreateBooking && <BookingFormModal lockEnquiry {...conversion} enquiry={item} onClose={() => setConversion(null)} onSave={async payload => {
      const booking = await api.createBooking(payload);
      navigate('/admin/bookings/' + booking.id);
    }}/>}
    {followUpOpen && canManage && !closed && <DetailDialog title={item.nextFollowUpAt ? 'Edit follow-up' : 'Schedule follow-up'} onClose={() => void closeFollowUp()}>{followUpError && <AdminAlert as="span" className="mb-3">{followUpError}</AdminAlert>}    {canManage && !closed && <FollowUpPanel
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
    {canManage && editing && <EnquiryFormModal enquiry={item} phoneReadOnly={!canViewPhone} onClose={() => setEditing(false)} onSaved={saved => { setItem(saved); setEditing(false); setSuccess('Enquiry details saved.'); reloadNotes(); }} />}
    {canManage && messageOpen && canViewPhone && <WhatsAppComposer context={{ customerName: item.name, phone: item.phone, service: item.shootType, bookingDate: item.bookingDate, startTime: item.startTime, endTime: item.endTime, location: item.location, consentRecorded: item.whatsappOptIn, optedOut: Boolean(item.whatsappOptOutAt) }} onClose={() => setMessageOpen(false)} />}
  </div>;
}

function Detail({ label, value, action }: { label: string; value?: string; action?: React.ReactNode }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium text-slate-700">{value || 'Not recorded'} {action}</dd></div>; }

function stageLabel(stage: EnquiryStage) { return stage === 'closed_lost' ? 'Not interested' : stage === 'follow_up' ? 'Follow-up' : stage[0].toUpperCase() + stage.slice(1); }
function dateLabel(value?: string) { return value ? new Date(`${value.slice(0, 10)}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short', timeZone: 'Asia/Kolkata' }) : 'Date not set'; }
function followUpLabel(value: string) { return new Date(value).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); }
