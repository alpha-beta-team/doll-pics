import { AdminAlert } from '../components/ui/AdminUi';
import { formatCustomerName } from '../../shared/formatCustomerName';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, SlidersHorizontal,
  MapPin, MessageCircle, Phone, RefreshCw, UserRound, X,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  Booking, BookingWritePayload, Package, ScheduleBookingItem,
  ServiceNavLink, StaffAccountOption,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import type { ManualWhatsAppContext, WhatsAppTemplateId } from '../components/whatsappTemplates';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useScheduleAvailability, useScheduleConfirmation } from '../hooks/useScheduleAvailability';
import { ScheduleAvailabilityNotice } from '../components/ScheduleAvailabilityNotice';
import { saveWithScheduleConfirmation } from '../components/scheduleConfirmation';
import { bookingTimeWindowError } from '../../shared/bookingTime';
import {
  addScheduleDays, endTimeFor, formatScheduleDay, formatScheduleTime, kolkataToday,
  minutesToTime, occupiesSchedule, scheduleDates, slotHasConflict, timeToMinutes,
  windowsOverlap,
} from './schedule.utils';
import { AdminIconButton, AdminPageHeader } from '../components/ui';
import { ScheduleAgenda, ScheduleCalendar, ScheduleWeekStrip } from './ScheduleViews';
import './schedule.css';
import { useFeatureAccess } from '../access/useFeatureAccess';
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
  const { canManage, isReadOnly } = useFeatureAccess('schedule');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
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
  const existingOverlaps = useMemo(() => visibleBookings.flatMap((item, index) =>
    visibleBookings.slice(index + 1).filter(other =>
      item.bookingDate === other.bookingDate && item.startTime && item.endTime
      && other.startTime && other.endTime && occupiesSchedule(item)
      && occupiesSchedule(other)
      && windowsOverlap(item.startTime, item.endTime, other.startTime, other.endTime),
    ).map(other => ({ item, other })),
  ), [visibleBookings]);

  const loadSchedule = useCallback(async (refresh = false, signal?: AbortSignal) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const response = await api.getSchedule(dateFrom, dateTo, showCancelled, signal);
      setBookings(response.bookings);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(err instanceof Error ? err.message : 'Failed to load the schedule');
    } finally {
      if (!signal?.aborted) { setLoading(false); setRefreshing(false); }
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
    void Promise.all([api.getPackages(), api.getPhotographyServices().catch(() => []), api.getAssignableStaffAccounts()])
      .then(([packageRows, services, accountRows]) => { setPackages(packageRows); setBookingServices(services); setStaffAccounts(accountRows); })
      .catch(() => undefined);
  }, [canManage]);

  const move = (direction: -1 | 1) => setAnchorDate(current =>
    addScheduleDays(current, direction * (view === 'week' ? 7 : 1)),
  );

  const cancelBooking = async (item: ScheduleBookingItem) => {
    const accepted = await confirm({
      title: 'Cancel this booking?',
      description: `${formatCustomerName(item.customerName)} · ${formatScheduleDay(item.bookingDate)}${item.startTime ? ` · ${formatScheduleTime(item.startTime)}` : ''}`,
      confirmLabel: 'Cancel booking', variant: 'danger',
    });
    if (!accepted) return;
    try {
      const updated = await api.transitionBooking(item.id, 'cancelled');
      setSelected(null);
      await loadSchedule(true);
      setComposer({ context: whatsappContext(updated, canViewPayments), template: 'booking_cancelled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
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
    if (canManage) setSelected(item); else navigate(`/admin/bookings/${item.id}`);
  };

  const title = view !== 'week'
    ? formatScheduleDay(anchorDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${formatScheduleDay(dateFrom, { day: 'numeric', month: 'short' })} – ${formatScheduleDay(dateTo, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="studio-schedule mx-auto max-w-[1700px] space-y-3">
      <AdminPageHeader compact title="Studio schedule" description="Plan shoots, review overlaps and find unbooked time." actions={<>
        {isReadOnly && <ReadOnlyNotice />}
      </>} />
      <section className="sc-toolbar" aria-label="Schedule controls">
        <div className="sc-navigation">
          <AdminIconButton label={view === 'week' ? 'Previous week' : 'Previous day'} onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></AdminIconButton>
          <AdminIconButton label={view === 'week' ? 'Next week' : 'Next day'} onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></AdminIconButton>
          <button type="button" className="sc-control" onClick={() => { setAnchorDate(kolkataToday()); setFocusTime(undefined); }}>Today</button>
        </div>
        <h2 className="sc-period" aria-live="polite">{title}</h2>
        <label className="sc-date"><span className="sr-only">Choose date</span><input type="date" value={anchorDate} onChange={event => { if (event.target.value) { setAnchorDate(event.target.value); setFocusTime(undefined); } }} /></label>
        <div className="sc-view-switch" aria-label="Schedule view">
          {(['day', 'week', 'agenda'] as const).map(mode => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>{mode}</button>)}
        </div>
        {!loading && !error && existingOverlaps.length > 0 && <button type="button" className="sc-overlap-badge" aria-label="Review overlaps" title={`${existingOverlaps.length} overlapping booking pairs. Review staff and location.`} onClick={() => setReviewOverlaps(true)}><AlertTriangle className="h-4 w-4 shrink-0" /><span>{existingOverlaps.length} overlap{existingOverlaps.length === 1 ? '' : 's'}</span></button>}
        <details className="sc-filters">
          <summary className="sc-control" aria-label="Display options"><SlidersHorizontal className="h-4 w-4" /><span>Display{showCancelled ? ' •' : ''}</span></summary>
          <div className="sc-filter-panel">
            <label><input type="checkbox" checked={showCancelled} onChange={event => setShowCancelled(event.target.checked)} /> Show cancelled</label>
            <label className="sc-density"><input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} /> Compact calendar</label>
          </div>
        </details>
        <AdminIconButton label="Refresh schedule" onClick={() => void loadSchedule(true)} disabled={refreshing || loading}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></AdminIconButton>
      </section>
      {isMobile && <ScheduleWeekStrip anchorDate={anchorDate} bookings={bookings} onDate={date => openDay(date)} />}

      {error && <AdminAlert contentClassName="flex items-center gap-2">{error}</AdminAlert>}
      {loading ? <div className="flex h-72 items-center justify-center" role="status" aria-label="Loading schedule"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div> : error ? <p className="p-4 text-sm text-slate-600">Schedule unavailable. Refresh to try again.</p> : <>
        {(isMobile || view === 'agenda') ? <ScheduleAgenda date={anchorDate} bookings={bookings} canManage={canManage} onBooking={openBooking} onEmptySlot={setSlot} /> :
          <ScheduleCalendar key={`${view}-${anchorDate}`} dates={dates} bookings={bookings} canManage={canManage} compact={compact} focusTime={focusTime} onDay={openDay} onBooking={openBooking} onEmptySlot={setSlot} />}
      </>}
      {reviewOverlaps && <Sheet title="Review time overlaps" subtitle="Check staff and location. Overlapping times may be valid with separate staff and spaces." onClose={() => setReviewOverlaps(false)} wide>
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
      {canManage && selected && <BookingActionSheet item={selected} onClose={() => setSelected(null)} onOpen={() => navigate(`/admin/bookings/${selected.id}`)} onWhatsApp={() => { setComposer({ context: whatsappContext(selected, canViewPayments), template: 'booking_confirmation' }); setSelected(null); }} onReschedule={() => { setRescheduling(selected); setSelected(null); }} onCancel={() => void cancelBooking(selected)} />}
      {canManage && rescheduling && <RescheduleSheet item={rescheduling} visibleBookings={bookings} onClose={() => setRescheduling(null)} onSaved={async updated => { setRescheduling(null); await loadSchedule(true); setComposer({ context: whatsappContext(updated, canViewPayments), template: 'booking_rescheduled' }); }} />}
      {canManage && composer && <WhatsAppComposer context={composer.context} initialTemplate={composer.template} onClose={() => setComposer(null)} />}
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

function BookingActionSheet({ item, onClose, onOpen, onWhatsApp, onReschedule, onCancel }: { item: ScheduleBookingItem; onClose: () => void; onOpen: () => void; onWhatsApp: () => void; onReschedule: () => void; onCancel: () => void }) {
  const canChange = item.status === 'draft' || item.status === 'confirmed';
  return <Sheet title={formatCustomerName(item.customerName)} subtitle={`${formatScheduleDay(item.bookingDate)} · ${item.startTime ? `${formatScheduleTime(item.startTime)}–${formatScheduleTime(item.endTime)}` : 'Time not set'}`} onClose={onClose}>
    <div className="space-y-3 p-4"><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><p className="font-semibold text-slate-900">{item.service || 'Service not set'}</p>{item.location && <p className="mt-1 flex items-center gap-2"><MapPin className="h-4 w-4" />{item.location}</p>}{item.assignedStaffAccountName && <p className="mt-1 flex items-center gap-2"><UserRound className="h-4 w-4" />{item.assignedStaffAccountName}</p>}</div>
      <div className="grid grid-cols-2 gap-2"><a href={`tel:${item.customerPhone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 font-semibold text-slate-700"><Phone className="h-4 w-4" />Call</a><button type="button" onClick={onWhatsApp} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300 text-sm font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</button><button type="button" onClick={onOpen} className="col-span-2 h-12 rounded-xl bg-blue-600 font-semibold text-white">Open booking</button></div>
      {canChange && <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={onReschedule} className="h-12 rounded-xl border border-blue-300 font-semibold text-blue-700">Reschedule</button><button type="button" onClick={onCancel} className="h-12 rounded-xl border border-red-300 font-semibold text-red-700">Cancel booking</button></div>}
    </div>
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

function Sheet({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div ref={sheetRef} tabIndex={-1} className="fixed inset-0 z-[80] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={event => {
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
  }}><div className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}><header className="flex items-center justify-between border-b border-slate-200 p-4"><div className="min-w-0"><h2 id={titleId} className="truncate font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}</div><button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></header>{children}</div></div>;
}
