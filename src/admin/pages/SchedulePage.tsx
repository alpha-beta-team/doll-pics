import { BookingCancellationDialog } from '../components/bookings/BookingCancellationDialog';
import { AdminAlert } from '../components/ui/AdminUi';
import { formatCustomerName } from '../../shared/formatCustomerName';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal,
  MessageCircle, Phone, Search, RefreshCw, X,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  Booking, BookingWritePayload, Package, ScheduleBookingItem,
  ServiceNavLink, StaffAccountOption,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import type { ManualWhatsAppContext, WhatsAppTemplateId } from '../components/whatsappTemplates';
import { useScheduleAvailability, useScheduleConfirmation } from '../hooks/useScheduleAvailability';
import { ScheduleAvailabilityNotice } from '../components/ScheduleAvailabilityNotice';
import { saveWithScheduleConfirmation } from '../components/scheduleConfirmation';
import { bookingDurationLabel, bookingTimeWindowError } from '../../shared/bookingTime';
import {
  addScheduleDays, endTimeFor, formatScheduleDay, formatScheduleTime, kolkataToday,
  minutesToTime, scheduleDates, slotHasConflict, timeToMinutes,
  photographerClash, photographerColor, shootTiming,
} from './schedule.utils';
import { AdminIconButton } from '../components/ui';
import { ScheduleAgenda, ScheduleCalendar, ScheduleWeekStrip } from './ScheduleViews';
import './schedule.css';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { hasStaffPermission } from '../access/roles';
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';

type ViewMode = 'day' | 'week' | 'agenda';
type SlotChoice = { bookingDate: string; startTime: string };
type ComposerState = { context: ManualWhatsAppContext; template: WhatsAppTemplateId };

function whatsappContext(item: ScheduleBookingItem | Booking, includePayments: boolean): ManualWhatsAppContext {
  return {
    customerName: item.customerName,
    customerCode: 'customerCode' in item ? item.customerCode : undefined,
    phone: 'customerPhone' in item ? item.customerPhone : '',
    service: 'service' in item ? item.service : item.shootType,
    bookingDate: item.bookingDate,
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location,
    optedOut: Boolean(item.whatsappOptOutAt),
    consentRecorded: item.whatsappOptIn,
    ...('paymentSummary' in item && includePayments ? {
      balanceDue: item.paymentSummary.balanceDue,
      paymentDueDate: item.paymentDueDate,
    } : {}),
  };
}

export function SchedulePage() {
  const scheduleAccess = useFeatureAccess('schedule');
  const bookingAccess = useFeatureAccess('bookings');
  const canManage = scheduleAccess.canManage && bookingAccess.canManage;
  const isReadOnly = !canManage;
  const { user } = useAuth();
  const canViewPhone = hasStaffPermission(user, 'mask_phone_number');
  const [clock, setClock] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState('');
  const [reviewPast, setReviewPast] = useState(false);
  const [staffError, setStaffError] = useState('');
  const today = kolkataToday(clock);
  const time = clock.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const now = today + 'T' + time;
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>(() =>
    window.matchMedia('(max-width: 767px)').matches ? 'day' : 'week',
  );
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [anchorDate, setAnchorDate] = useState(kolkataToday);
  const [showCancelled, setShowCancelled] = useState(false);
  const [compact, setCompact] = useState(true);
  const [reviewOverlaps, setReviewOverlaps] = useState(false);
  const [focusTime, setFocusTime] = useState<string>();
  const [bookings, setBookings] = useState<ScheduleBookingItem[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookingServices, setBookingServices] = useState<ServiceNavLink[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<ScheduleBookingItem | null>(null);
  const [selected, setSelected] = useState<ScheduleBookingItem | null>(null);
  const [slot, setSlot] = useState<SlotChoice | null>(null);
  const [creatingAt, setCreatingAt] = useState<{ bookingDate: string; startTime: string; endTime: string } | null>(null);
  const [rescheduling, setRescheduling] = useState<ScheduleBookingItem | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);

  const dates = useMemo(() => scheduleDates(anchorDate, view === 'week' ? 'week' : 'day'), [anchorDate, view]);
  const requestDates = isMobile ? scheduleDates(anchorDate, 'week') : dates;
  const dateFrom = requestDates[0];
  const dateTo = requestDates[requestDates.length - 1];
  const visibleBookings = useMemo(() => isMobile ? bookings.filter(item => item.bookingDate === anchorDate) : bookings, [isMobile, bookings, anchorDate]);
  const query = search.trim().toLowerCase();
  const searchResults = query ? visibleBookings.filter(item =>
    item.customerName.toLowerCase().includes(query) || (canViewPhone && item.customerPhone.includes(query)),
  ) : [];
  const existingOverlaps = useMemo(() => visibleBookings.flatMap((item, index) =>
    visibleBookings.slice(index + 1).filter(other => photographerClash(item, other)).map(other => ({ item, other })),
  ), [visibleBookings]);

  const overdue = visibleBookings.filter(item => shootTiming(item, now) === 'Past, not closed');
  const shooting = visibleBookings.filter(item => shootTiming(item, now) === 'Shooting now');
  const upcoming = visibleBookings.filter(item => item.status === 'confirmed' && item.bookingDate === today && item.endTime && item.startTime > time);
  const nextTime = upcoming.reduce((first, item) => first < item.startTime ? first : item.startTime, '24:00');
  const photographers = new Map<string, string>();
  for (const item of visibleBookings) {
    if (item.assignedStaffAccountId) photographers.set(item.assignedStaffAccountId, item.assignedStaffAccountName || 'Assigned photographer');
  }
  photographers.set('unassigned', 'Unassigned');
  const activeHighlight = photographers.has(highlight) ? highlight : '';
  const loadVersion = useRef(0);
  const loadSchedule = useCallback(async (refresh = false, signal?: AbortSignal) => {
    const version = ++loadVersion.current;
    setRefreshing(refresh);
    setLoading(!refresh);
    setError('');
    try {
      const response = await api.getSchedule(dateFrom, dateTo, showCancelled, signal);
      if (version === loadVersion.current && !signal?.aborted) {
        setBookings(response.bookings);
        setSelected(current => current ? response.bookings.find(row => row.id === current.id) || null : null);
      }
    } catch (err) {
      if (version === loadVersion.current && (err as Error).name !== 'AbortError') setError(err instanceof Error ? err.message : 'Failed to load the schedule');
    } finally {
      if (version === loadVersion.current && !signal?.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, [dateFrom, dateTo, showCancelled]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setIsMobile(media.matches);
      if (media.matches) setView('day');
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSchedule(false, controller.signal);
    return () => controller.abort();
  }, [loadSchedule]);

  useEffect(() => {
    if (!canManage) return;
    void api.getAssignableStaffAccounts().then(setStaffAccounts).catch(() => setStaffError('Could not load photographers. Reopen Schedule to retry.'));
    void Promise.all([api.getPackages(), api.getPhotographyServices().catch(() => [])])
      .then(([packageRows, services]) => { setPackages(packageRows); setBookingServices(services); })
      .catch(() => undefined);
  }, [canManage]);

  const move = (direction: -1 | 1) => setAnchorDate(current =>
    addScheduleDays(current, direction * (view === 'week' ? 7 : 1)),
  );

  const cancelBooking = async (item: ScheduleBookingItem, reason: string) => {
    try {
      const updated = await api.transitionBooking(item.id, 'cancelled', undefined, undefined, { reason });
      setSelected(null);
      await loadSchedule(true);
      setComposer({ context: whatsappContext(updated, canViewPayments), template: 'booking_cancelled' });
      return true;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const saveNew = async (payload: BookingWritePayload) => {
    await api.createBooking(payload);
    setCreatingAt(null);
    await loadSchedule(true);
  };

  const openDay = (date: string, startTime?: string) => {
    setAnchorDate(date); setView('day'); setFocusTime(startTime); setReviewOverlaps(false);
  };
  const openBooking = (item: ScheduleBookingItem) => {
    setReviewOverlaps(false);
    setReviewPast(false);
    setSearch('');
    setSelected(item);
  };

  const title = view !== 'week'
    ? formatScheduleDay(anchorDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${formatScheduleDay(dateFrom, { day: 'numeric', month: 'short' })} – ${formatScheduleDay(dateTo, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const sameMonth = dateFrom.slice(0, 7) === dateTo.slice(0, 7);
  const rangeLabel = view === 'week'
    ? `${formatScheduleDay(dateFrom, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })} – ${formatScheduleDay(dateTo, { day: 'numeric', month: 'short' })}`
    : formatScheduleDay(anchorDate);
  const datePicker = (
    <label className="sc-date"><span className="sr-only">Choose date</span><input type="date" value={anchorDate} onChange={event => { if (event.target.value) { setAnchorDate(event.target.value); setFocusTime(undefined); } }} /></label>
  );
  const displayControls = <>
    <label><input type="checkbox" checked={showCancelled} onChange={event => setShowCancelled(event.target.checked)} /> Show cancelled</label>
    <label className="sc-density"><input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} /> Compact calendar</label>
    <AdminIconButton label="Refresh schedule" onClick={() => void loadSchedule(true)} disabled={refreshing || loading}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></AdminIconButton>
  </>;
  return (
    <div className="studio-schedule mx-auto max-w-[1700px] space-y-3">
      <section className="sc-toolbar" aria-label="Schedule controls">
        <header className="sc-heading"><h1>Schedule</h1><p className="sc-period">{view === 'week' ? rangeLabel + ' ' + dateTo.slice(0, 4) : title}{!loading && !error && ` · ${visibleBookings.filter(item => item.status !== 'cancelled').length} shoots`}</p></header>
        {isReadOnly && <ReadOnlyNotice />}
        <div className="sc-navigation">
          <AdminIconButton label={view === 'week' ? 'Previous week' : 'Previous day'} onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></AdminIconButton>
          {isMobile ? datePicker : <details className="sc-filters sc-period-menu" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false; }} onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}>
            <summary aria-label="Date and display options">{rangeLabel}</summary>
            <div className="sc-filter-panel">
              {datePicker}
              <button type="button" onClick={e => { setView('agenda'); e.currentTarget.closest('details')!.open = false; }}>Agenda</button>
              {displayControls}
            </div>
          </details>}
          <AdminIconButton label={view === 'week' ? 'Next week' : 'Next day'} onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></AdminIconButton>
        </div>
        {!isMobile && <div className="sc-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearch(''); }} onKeyDown={event => { if (event.key === 'Escape') setSearch(''); }}>
          <Search size={15} /><input type="search" aria-label={canViewPhone ? 'Search customer or phone' : 'Search customer'} placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
          {search.trim() && !loading && !error && <div className="sc-matches">{searchResults.length ? searchResults.map(item => <button key={item.id} onClick={() => openBooking(item)}><strong>{formatCustomerName(item.customerName)}</strong><small>{formatScheduleDay(item.bookingDate)} · {formatScheduleTime(item.startTime)}</small></button>) : <p>No matching shoots in this period.</p>}</div>}
        </div>}
        <button type="button" className="sc-control" onClick={() => { setAnchorDate(kolkataToday()); setFocusTime(undefined); }}>Today</button>
        <div className="sc-view-switch" aria-label="Schedule view">
          {(['day', 'week'] as const).map(mode => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>{mode}</button>)}
        </div>
        {isMobile && <details className="sc-filters">
          <summary className="sc-control" aria-label="Display options"><SlidersHorizontal className="h-4 w-4" /><span>Display{showCancelled ? ' •' : ''}</span></summary>
          <div className="sc-filter-panel">{displayControls}</div>
        </details>}
        {canManage && <button type="button" className="sc-primary" onClick={() => setCreatingAt({ bookingDate: anchorDate, startTime: '11:00', endTime: '12:00' })}>+ New booking</button>}
      </section>
      {!loading && !error && <div className="sc-summary">
        {dates.includes(today) && <><strong className="sc-now">Now {time}</strong>{shooting.length ? shooting.map(item => <button key={item.id} onClick={() => openBooking(item)}><i style={{ background: photographerColor(item.assignedStaffAccountId) }} /><b>{formatCustomerName(item.customerName)}</b> <small>till {formatScheduleTime(item.endTime)}</small></button>) : <span>No shoots now</span>}
          <span className="sc-next">Next</span>{upcoming.length ? upcoming.filter(item => item.startTime === nextTime).map(item => <button key={item.id} onClick={() => openBooking(item)}><i style={{ background: photographerColor(item.assignedStaffAccountId) }} /><b>{formatCustomerName(item.customerName)}</b> <small>{formatScheduleTime(nextTime)}</small></button>) : <span>No more today</span>}</>}
        <div className="sc-reviews"><button className="sc-overlap-badge" disabled={!existingOverlaps.length} onClick={() => setReviewOverlaps(true)}>{existingOverlaps.length} {existingOverlaps.length === 1 ? 'clash' : 'clashes'}</button>
        <button className="sc-past-badge" disabled={!overdue.length} onClick={() => setReviewPast(true)}>{overdue.length} to close</button></div>
      </div>}
      {isMobile && <ScheduleWeekStrip anchorDate={anchorDate} bookings={bookings} onDate={date => openDay(date)} />}

      {error && <AdminAlert contentClassName="flex items-center gap-2">{error}</AdminAlert>}
      {loading ? <div className="flex h-72 items-center justify-center" role="status" aria-label="Loading schedule"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div> : error ? <p className="p-4 text-sm text-slate-600">Schedule unavailable. Refresh to try again.</p> : <>
        {(isMobile || view === 'agenda') ? <ScheduleAgenda date={anchorDate} bookings={bookings} canManage={canManage} onBooking={openBooking} onEmptySlot={setSlot} /> :
          <ScheduleCalendar key={`${view}-${anchorDate}`} dates={dates} bookings={bookings} canManage={canManage} now={now} highlight={activeHighlight} compact={compact} focusTime={focusTime} onDay={openDay} onBooking={openBooking} onEmptySlot={choice => setCreatingAt({ ...choice, endTime: endTimeFor(choice.startTime, 1) })}>
          <div className="sc-photographers" aria-label="Highlight photographer">
          <button aria-pressed={!activeHighlight} onClick={() => setHighlight('')}>All</button>
          {Array.from(photographers, ([id, name]) => <button key={id} aria-pressed={activeHighlight === id} onClick={() => setHighlight(activeHighlight === id ? '' : id)}><i style={{ backgroundColor: photographerColor(id === 'unassigned' ? null : id) }} />{name}</button>)}
          </div>
          </ScheduleCalendar>}
      </>}
      {reviewPast && <Sheet title="To close" subtitle={title} onClose={() => setReviewPast(false)}><div className="sc-review-rows">{overdue.map(item => <button key={item.id} onClick={() => openBooking(item)}><strong>{item.customerName}</strong><span>{formatScheduleDay(item.bookingDate)} · {formatScheduleTime(item.endTime)} · {item.status}</span></button>)}</div></Sheet>}
      {reviewOverlaps && <Sheet title="Photographer clashes" subtitle="Overlapping shoots assigned to the same photographer." onClose={() => setReviewOverlaps(false)} wide>
        <div className="sc-overlap-list">{existingOverlaps.map(({ item, other }) => {
          const overlapStart = item.startTime > other.startTime ? item.startTime : other.startTime;
          const overlapEnd = item.endTime < other.endTime ? item.endTime : other.endTime;
          return <article key={`${item.id}-${other.id}`} className="sc-overlap-pair">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{formatScheduleDay(item.bookingDate)} · {formatScheduleTime(overlapStart)}–{formatScheduleTime(overlapEnd)}</h3>
              <button type="button" className="sc-text-action" onClick={() => openDay(item.bookingDate, overlapStart)}>View day <ChevronRight className="h-4 w-4" /></button></div>
            {[item, other].map(booking => <div key={booking.id} className="sc-overlap-booking">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openBooking(booking)}><strong className="block text-sm">{formatCustomerName(booking.customerName)}</strong><span className="block text-xs">{formatScheduleTime(booking.startTime)}–{formatScheduleTime(booking.endTime)} · {booking.service || 'Service not set'}</span><span className="block text-xs text-slate-500">{booking.assignedStaffAccountName || 'Staff not assigned'} · {booking.location || 'Location not set'}</span></button>
              {canManage && <button type="button" className="sc-control" onClick={() => { setReviewOverlaps(false); setRescheduling(booking); }}>Reschedule<span className="sr-only"> {formatCustomerName(booking.customerName)}</span></button>}
            </div>)}
          </article>;
        })}</div>
      </Sheet>}

      {canManage && slot && <DurationSheet slot={slot} bookings={bookings} onClose={() => setSlot(null)} onChoose={endTime => { setCreatingAt({ ...slot, endTime }); setSlot(null); }} />}
      {canManage && creatingAt && <BookingFormModal packages={packages} services={bookingServices} staffAccounts={staffAccounts} initialSchedule={creatingAt} onClose={() => setCreatingAt(null)} onSave={saveNew} />}
      {selected && <BookingActionSheet key={selected.id} item={selected} now={now} canManage={canManage} canOpen={bookingAccess.canView} canViewPhone={canViewPhone} staff={staffAccounts} staffError={staffError} onSaved={async updated => {
        setSelected(item => item?.id === updated.id ? { ...item, status: updated.status, assignedStaffAccountId: updated.assignedStaffAccountId || null, assignedStaffAccountName: updated.assignedStaffAccountName || '' } : item);
        await loadSchedule(true);
      }} onClose={() => setSelected(null)} onOpen={() => navigate(`/admin/bookings/${selected.id}`)} onWhatsApp={() => { setComposer({ context: whatsappContext(selected, canViewPayments), template: 'booking_confirmation' }); setSelected(null); }} onReschedule={() => { setRescheduling(selected); setSelected(null); }} onCancel={() => { setCancelling(selected); setSelected(null); }} />}
      {canManage && cancelling && <BookingCancellationDialog customerName={cancelling.customerName} onClose={() => setCancelling(null)} onConfirm={reason => cancelBooking(cancelling, reason)} />}
      {canManage && rescheduling && <RescheduleSheet item={rescheduling} visibleBookings={bookings} onClose={() => setRescheduling(null)} onSaved={async updated => { setRescheduling(null); await loadSchedule(true); setComposer({ context: whatsappContext(updated, canViewPayments), template: 'booking_rescheduled' }); }} />}
      {canViewPhone && composer && <WhatsAppComposer context={composer.context} initialTemplate={composer.template} onClose={() => setComposer(null)} />}
    </div>
  );
}

function DurationSheet({ slot, bookings, onClose, onChoose }: { slot: SlotChoice; bookings: ScheduleBookingItem[]; onClose: () => void; onChoose: (endTime: string) => void }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customEndTime, setCustomEndTime] = useState(endTimeFor(slot.startTime, 1));
  const [customError, setCustomError] = useState('');
  const continueCustom = () => {
    if (!customEndTime || timeToMinutes(customEndTime) <= timeToMinutes(slot.startTime)) {
      return setCustomError('End time must be later than the start time.');
    }
    onChoose(customEndTime);
  };
  return <Sheet title="Choose shoot duration" subtitle={`${formatScheduleDay(slot.bookingDate)} · ${formatScheduleTime(slot.startTime)}`} onClose={onClose}><div className="grid gap-3 p-4">{([1, 2, 3] as const).map(duration => { const end = endTimeFor(slot.startTime, duration); const blocked = timeToMinutes(end) > 20 * 60; const overlap = slotHasConflict(bookings, slot.bookingDate, slot.startTime, end); return <button key={duration} type="button" disabled={blocked} onClick={() => onChoose(end)} className="flex min-h-16 items-center justify-between rounded-xl border border-slate-300 px-4 text-left disabled:bg-slate-100 disabled:text-slate-400"><span><strong className="block text-sm">{duration} hour{duration === 1 ? '' : 's'}</strong><span className="text-xs">{formatScheduleTime(slot.startTime)}–{formatScheduleTime(end)}</span></span>{blocked ? <span className="text-xs font-semibold">Outside preset hours</span> : overlap ? <span className="text-xs font-semibold text-blue-700">Existing bookings</span> : <ChevronRight className="h-5 w-5" />}</button>; })}<button type="button" onClick={() => { setCustomOpen(value => !value); setCustomError(''); }} className="flex min-h-14 items-center justify-between rounded-xl border border-slate-300 px-4 text-left"><span><strong className="block text-sm">Custom duration</strong><span className="text-xs text-slate-500">Choose an exact end time</span></span><ChevronRight className={`h-5 w-5 transition ${customOpen ? 'rotate-90' : ''}`} /></button>{customOpen && <div className="rounded-xl bg-slate-50 p-3"><label className="text-sm font-medium text-slate-700">End time<input autoFocus type="time" min={slot.startTime} value={customEndTime} onChange={event => { setCustomEndTime(event.target.value); setCustomError(''); }} className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base" /></label>{customError && <AdminAlert as="span" className="mt-2">{customError}</AdminAlert>}<button type="button" onClick={continueCustom} className="mt-3 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white">Continue with custom time</button></div>}</div></Sheet>;
}

function BookingActionSheet({ item, now, staff, staffError, canManage, canOpen, canViewPhone, onSaved, onClose, onOpen, onWhatsApp, onReschedule, onCancel }: {
  item: ScheduleBookingItem; now: string; staff: StaffAccountOption[]; staffError: string; canManage: boolean; canOpen: boolean; canViewPhone: boolean;
  onSaved: (booking: Booking) => Promise<void>; onClose: () => void; onOpen: () => void;
  onWhatsApp: () => void; onReschedule: () => void; onCancel: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const confirm = useConfirmDialog();
  const timing = shootTiming(item, now);
  const canComplete = item.status === 'confirmed' && (timing === 'Past, not closed' || timing === 'Shooting now');
  const editable = canManage && (item.status === 'draft' || item.status === 'confirmed');
  async function save(write: () => Promise<Booking>) {
    setBusy(true); setError('');
    try { await onSaved(await write()); setEditing(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this booking. Try again.'); }
    finally { setBusy(false); }
  }
  async function complete() {
    if (await confirm({ title: 'Mark shoot as completed?', description: `Confirm that the photography session for ${item.customerName} has finished.`, confirmLabel: 'Mark as done' })) {
      await save(() => api.transitionBooking(item.id, 'shoot_completed'));
    }
  }
  return <Sheet drawer badge={timing} title={formatCustomerName(item.customerName)} subtitle={[formatScheduleDay(item.bookingDate), item.startTime ? `${formatScheduleTime(item.startTime)}–${formatScheduleTime(item.endTime)}` : 'Time not set', bookingDurationLabel(item.startTime, item.endTime)].filter(Boolean).join(' · ')} onClose={() => { if (!busy) onClose(); }}>
    <div className="sc-drawer-content">
      <div className="sc-drawer-actions">
        {canViewPhone && item.customerPhone && <><button className="sc-whatsapp" onClick={onWhatsApp}><MessageCircle size={15} />WhatsApp</button><a href={`tel:${item.customerPhone}`}><Phone size={15} />Call</a></>}
        {canOpen && <button onClick={onOpen}>Booking ↗</button>}
      </div>
      <dl><dt>Photographer</dt><dd>{item.assignedStaffAccountId ? item.assignedStaffAccountName : 'Unassigned'}{!item.assignedStaffAccountId && item.assignedStaffAccountName && <small>Previous name: {item.assignedStaffAccountName}</small>}
        {editable && <button disabled={busy} onClick={() => setEditing(!editing)} aria-expanded={editing}>Change</button>}
        {editing && <><select aria-label="Change photographer" disabled={busy || Boolean(staffError)} value={item.assignedStaffAccountId || ''} onChange={e => { const id = e.target.value; void save(() => api.updateBooking(item.id, { assignedStaffAccountId: id || null })); }}>
          <option value="">Unassigned</option>{item.assignedStaffAccountId && !staff.some(person => person.canTakeShoots === true && person.id === item.assignedStaffAccountId) && <option value={item.assignedStaffAccountId}>{item.assignedStaffAccountName}</option>}{staff.filter(person => person.canTakeShoots === true).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select>{staffError && <small role="alert">{staffError}</small>}</>}
      </dd>{canViewPhone && <><dt>Phone</dt><dd>{item.customerPhone || '—'}</dd></>}<dt>Shoot type</dt><dd>{item.service || '—'}</dd><dt>Location</dt><dd>{item.location || '—'}</dd><dt>Status</dt><dd className="capitalize">{item.status.replace('_', ' ')}</dd></dl>
      {error && <AdminAlert>{error}</AdminAlert>}
      {editable && <details><summary>More actions</summary><button disabled={busy} onClick={onCancel}>Cancel booking</button></details>}
    </div>
    {editable && <footer className="sc-drawer-actions"><button disabled={busy} onClick={onReschedule}>Reschedule</button>{item.status === 'draft' ? <button className="sc-primary" onClick={onOpen}>Open booking to confirm</button> : <button className="sc-primary" disabled={busy || !canComplete} onClick={() => void complete()}>Mark as done</button>}</footer>}
  </Sheet>;
}

function RescheduleSheet({ item, visibleBookings, onClose, onSaved }: { item: ScheduleBookingItem; visibleBookings: ScheduleBookingItem[]; onClose: () => void; onSaved: (booking: Booking) => void | Promise<void> }) {
  const initialMinutes = item.startTime && item.endTime
    ? timeToMinutes(item.endTime) - timeToMinutes(item.startTime)
    : 60;
  const initialDuration: 1 | 2 | 3 | 'custom' = initialMinutes === 60
    ? 1
    : initialMinutes === 120
      ? 2
      : initialMinutes === 180
        ? 3
        : 'custom';
  const [bookingDate, setBookingDate] = useState(item.bookingDate);
  const [startTime, setStartTime] = useState(item.startTime || '11:00');
  const [endTime, setEndTime] = useState(item.endTime || endTimeFor('11:00', 1));
  const [duration, setDuration] = useState<1 | 2 | 3 | 'custom'>(initialDuration);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const changed = bookingDate !== item.bookingDate || startTime !== item.startTime || endTime !== item.endTime;
  const availability = useScheduleAvailability(bookingDate, startTime, endTime, item.id, changed);
  const acknowledge = useScheduleConfirmation(JSON.stringify([item.id, bookingDate, startTime, endTime]));
  const changeTime = () => window.setTimeout(() => document.getElementById('reschedule-start-time')?.focus(), 0);

  const chooseDuration = (value: 1 | 2 | 3) => { setDuration(value); setEndTime(endTimeFor(startTime, value)); };
  const chooseStart = (value: string) => {
    const customMinutes = Math.max(30, timeToMinutes(endTime) - timeToMinutes(startTime));
    setStartTime(value);
    setEndTime(duration === 'custom'
      ? minutesToTime(timeToMinutes(value) + customMinutes)
      : endTimeFor(value, duration));
  };
  const submit = async () => {
    if (submitting.current || availability.checking || availability.error) return;
    const invalid = bookingTimeWindowError(bookingDate, startTime, endTime);
    if (invalid || !bookingDate || !startTime || !endTime) return setError(invalid || 'Choose a valid date and time window.');
    submitting.current = true;
    setSaving(true); setError('');
    try {
      const accepted = await acknowledge(availability.conflicts);
      if (!accepted) { changeTime(); return; }
      const result = await saveWithScheduleConfirmation(
        flags => api.rescheduleBooking(item.id, { bookingDate, startTime, endTime, ...flags }), acknowledge, accepted,
      );
      if (result.saved) await onSaved(result.value);
      else changeTime();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to reschedule booking'); }
    finally { submitting.current = false; setSaving(false); }
  };

  const today = kolkataToday();
  const durationUnavailable = (value: 1 | 2 | 3) => {
    const candidateEnd = endTimeFor(startTime, value);
    return timeToMinutes(candidateEnd) > 20 * 60;
  };
  return <Sheet title="Reschedule booking" subtitle={formatCustomerName(item.customerName)} onClose={onClose} wide>
    <div className="space-y-5 overflow-y-auto p-4">
      {error && <AdminAlert>{error}</AdminAlert>}
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setBookingDate(today)} className="h-11 rounded-xl border border-slate-300 font-semibold text-slate-700">Today</button><button type="button" onClick={() => setBookingDate(addScheduleDays(today, 1))} className="h-11 rounded-xl border border-slate-300 font-semibold text-slate-700">Tomorrow</button></div>
      <label className="block text-sm font-medium text-slate-700">Booking date<input type="date" value={bookingDate} onChange={event => setBookingDate(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-base" /></label>
      <div><p className="text-sm font-medium text-slate-700">Duration</p><div className="mt-2 grid grid-cols-2 gap-2">{([1, 2, 3] as const).map(value => { const blocked = durationUnavailable(value); return <button key={value} type="button" disabled={blocked} onClick={() => chooseDuration(value)} className={`h-11 rounded-xl border text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 ${duration === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}>{value} hour{value === 1 ? '' : 's'}{blocked ? ' · outside preset hours' : slotHasConflict(visibleBookings, bookingDate, startTime, endTimeFor(startTime, value), item.id) ? ' · existing bookings' : ''}</button>; })}<button type="button" onClick={() => setDuration('custom')} className={`h-11 rounded-xl border text-sm font-semibold ${duration === 'custom' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}>Custom</button></div></div>
      <div><p className="text-sm font-medium text-slate-700">Hourly starts</p><div className="mt-2 grid grid-cols-3 gap-2">{Array.from({ length: 9 }, (_, index) => minutesToTime((11 + index) * 60)).map(value => { const customMinutes = Math.max(30, timeToMinutes(endTime) - timeToMinutes(startTime)); const end = duration === 'custom' ? minutesToTime(timeToMinutes(value) + customMinutes) : endTimeFor(value, duration); const blocked = timeToMinutes(end) > 20 * 60; const overlap = slotHasConflict(visibleBookings, bookingDate, value, end, item.id); return <button key={value} type="button" disabled={blocked} onClick={() => chooseStart(value)} className={`h-11 rounded-xl border text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400 ${startTime === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}>{formatScheduleTime(value)}{overlap && <span className="block text-[10px]">Existing bookings</span>}</button>; })}</div></div>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Custom start<input id="reschedule-start-time" type="time" value={startTime} onChange={event => { setStartTime(event.target.value); setDuration('custom'); }} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-base" /></label><label className="text-sm font-medium text-slate-700">Custom end<input type="time" value={endTime} onChange={event => { setEndTime(event.target.value); setDuration('custom'); }} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-base" /></label></div>
      <ScheduleAvailabilityNotice availability={availability} />
    </div>
    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void submit()} disabled={saving || availability.checking || Boolean(availability.error)} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save new time'}</button></div>
  </Sheet>;
}

function Sheet({ title, subtitle, onClose, children, wide = false, drawer = false, badge }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean; drawer?: boolean; badge?: string }) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div ref={sheetRef} tabIndex={-1} className={`fixed inset-0 z-[80] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4 ${drawer ? 'sc-drawer' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={event => {
    // Leave nested confirmation dialogs in control of their own keyboard events.
    if ((event.target as HTMLElement).closest('[role="dialog"]') !== sheetRef.current) return;
    if (event.key === 'Escape') { event.stopPropagation(); closeRef.current(); }
    if (event.key === 'Tab') {
      const controls = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === sheetRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === sheetRef.current)) { event.preventDefault(); first.focus(); }
    }
  }}><div className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}><header className="flex items-center justify-between border-b border-slate-200 p-4"><div className="min-w-0">{badge && <strong className="sc-timing" data-state={badge}>{badge}</strong>}<h2 id={titleId} className="truncate font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}</div><button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></header>{children}</div></div>;
}
