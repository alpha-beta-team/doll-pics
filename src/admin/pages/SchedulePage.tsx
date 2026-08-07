import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, CalendarDays, ChevronLeft, ChevronRight,
  MapPin, MessageCircle, Phone, Plus, RefreshCw, UserRound, X,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  Booking, BookingWritePayload, Package, ScheduleBookingItem, ScheduleConflictResponse,
  TeamMember,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { WhatsAppComposer } from '../components/WhatsAppComposer';
import type { ManualWhatsAppContext, WhatsAppTemplateId } from '../components/whatsappTemplates';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  addScheduleDays, endTimeFor, formatScheduleDay, formatScheduleTime, kolkataToday,
  minutesToTime, occupiesSchedule, scheduleDates, slotHasConflict, timeToMinutes,
  visibleHourBounds, windowsOverlap,
} from './schedule.utils';

type ViewMode = 'day' | 'week';
type SlotChoice = { bookingDate: string; startTime: string };
type ComposerState = { context: ManualWhatsAppContext; template: WhatsAppTemplateId };

const STATUS_CLASS: Record<ScheduleBookingItem['status'], string> = {
  draft: 'border-slate-400 bg-slate-100 text-slate-800',
  confirmed: 'border-emerald-500 bg-emerald-50 text-emerald-950',
  shoot_completed: 'border-blue-500 bg-blue-50 text-blue-950',
  delivered: 'border-violet-500 bg-violet-50 text-violet-950',
  cancelled: 'border-red-400 bg-red-50 text-red-800 opacity-70',
};

function whatsappContext(item: ScheduleBookingItem | Booking): ManualWhatsAppContext {
  return {
    customerName: item.customerName,
    phone: 'customerPhone' in item ? item.customerPhone : '',
    service: 'service' in item ? item.service : item.shootType,
    bookingDate: item.bookingDate,
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location,
    optedOut: Boolean(item.whatsappOptOutAt),
    consentRecorded: item.whatsappOptIn,
    ...('paymentSummary' in item ? {
      balanceDue: item.paymentSummary.balanceDue,
      paymentDueDate: item.paymentDueDate,
    } : {}),
  };
}

export function SchedulePage() {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [view, setView] = useState<ViewMode>(() =>
    window.matchMedia('(max-width: 767px)').matches ? 'day' : 'week',
  );
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [anchorDate, setAnchorDate] = useState(kolkataToday);
  const [showCancelled, setShowCancelled] = useState(false);
  const [bookings, setBookings] = useState<ScheduleBookingItem[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ScheduleBookingItem | null>(null);
  const [slot, setSlot] = useState<SlotChoice | null>(null);
  const [creatingAt, setCreatingAt] = useState<{ bookingDate: string; startTime: string; endTime: string } | null>(null);
  const [rescheduling, setRescheduling] = useState<ScheduleBookingItem | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);

  const dates = useMemo(() => scheduleDates(anchorDate, view), [anchorDate, view]);
  const dateFrom = dates[0];
  const dateTo = dates[dates.length - 1];
  const existingOverlaps = useMemo(() => bookings.flatMap((item, index) =>
    bookings.slice(index + 1).filter(other =>
      item.bookingDate === other.bookingDate && item.startTime && item.endTime
      && other.startTime && other.endTime && occupiesSchedule(item)
      && occupiesSchedule(other)
      && windowsOverlap(item.startTime, item.endTime, other.startTime, other.endTime),
    ).map(other => ({ item, other })),
  ), [bookings]);

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
    void Promise.all([api.getPackages(), api.getTeamMembers()])
      .then(([packageRows, memberRows]) => { setPackages(packageRows); setTeamMembers(memberRows); })
      .catch(() => undefined);
  }, []);

  const move = (direction: -1 | 1) => setAnchorDate(current =>
    addScheduleDays(current, direction * (view === 'week' ? 7 : 1)),
  );

  const cancelBooking = async (item: ScheduleBookingItem) => {
    const accepted = await confirm({
      title: 'Cancel this booking?',
      description: `${item.customerName} · ${formatScheduleDay(item.bookingDate)}${item.startTime ? ` · ${formatScheduleTime(item.startTime)}` : ''}`,
      confirmLabel: 'Cancel booking', variant: 'danger',
    });
    if (!accepted) return;
    try {
      const updated = await api.transitionBooking(item.id, 'cancelled');
      setSelected(null);
      await loadSchedule(true);
      setComposer({ context: whatsappContext(updated), template: 'booking_cancelled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const saveNew = async (payload: BookingWritePayload) => {
    await api.createBooking(payload);
    setCreatingAt(null);
    await loadSchedule(true);
  };

  const title = view === 'day'
    ? formatScheduleDay(dateFrom, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${formatScheduleDay(dateFrom, { day: 'numeric', month: 'short' })} – ${formatScheduleDay(dateTo, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="mx-auto max-w-[1700px] space-y-5">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-900">Studio schedule</h1><p className="mt-1 text-sm text-slate-500 md:hidden">Choose a day, then tap an available time.</p><p className="mt-1 hidden text-sm text-slate-500 md:block">Plan shoots and prevent overlapping bookings. Times use Asia/Kolkata.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden grid-cols-2 rounded-xl bg-slate-100 p-1 md:grid">
            {(['day', 'week'] as const).map(mode => <button key={mode} type="button" onClick={() => setView(mode)} className={`h-10 rounded-lg px-4 text-sm font-semibold capitalize ${view === mode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{mode}</button>)}
          </div>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showCancelled} onChange={event => setShowCancelled(event.target.checked)} /> Show cancelled</label>
          <button type="button" onClick={() => void loadSchedule(true)} disabled={refreshing} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600" aria-label="Refresh schedule"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      <section className="hidden flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex">
        <div className="flex items-center gap-2"><button type="button" onClick={() => move(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300" aria-label="Previous period"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => move(1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300" aria-label="Next period"><ChevronRight className="h-5 w-5" /></button><button type="button" onClick={() => setAnchorDate(kolkataToday())} className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">Today</button></div>
        <h2 className="order-first w-full text-center font-semibold text-slate-900 sm:order-none sm:w-auto">{title}</h2>
        <label className="sr-only" htmlFor="schedule-date-picker">Choose date</label><input id="schedule-date-picker" type="date" value={anchorDate} onChange={event => setAnchorDate(event.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
        <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="flex h-11 items-center justify-center rounded-xl border border-slate-300" aria-label="Previous day"><ChevronLeft className="h-5 w-5" /></button>
          <div className="text-center"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Day schedule</p><h2 className="mt-0.5 text-sm font-semibold text-slate-900">{title}</h2></div>
          <button type="button" onClick={() => move(1)} className="flex h-11 items-center justify-center rounded-xl border border-slate-300" aria-label="Next day"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-2"><button type="button" onClick={() => setAnchorDate(kolkataToday())} className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">Today</button><label className="relative"><span className="sr-only">Choose date</span><input type="date" value={anchorDate} onChange={event => setAnchorDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700" /></label></div>
      </section>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><AlertCircle className="h-5 w-5" />{error}<button type="button" onClick={() => setError('')} className="ml-auto" aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}
      {existingOverlaps.length > 0 && <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Existing booking overlap detected</p>{existingOverlaps.slice(0, 3).map(({ item, other }) => <p key={`${item.id}-${other.id}`} className="mt-1">{formatScheduleDay(item.bookingDate)}: {item.customerName} overlaps {other.customerName}.</p>)}</div></div>}

      {loading ? <div className="flex h-72 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div> : <>
        {isMobile && <MobileDayAgenda date={dateFrom} bookings={bookings} onBooking={setSelected} onEmptySlot={value => setSlot(value)} />}
        {!isMobile && <ScheduleCalendar dates={dates} bookings={bookings} onBooking={setSelected} onEmptySlot={value => setSlot(value)} />}
      </>}

      {slot && <DurationSheet slot={slot} bookings={bookings} onClose={() => setSlot(null)} onChoose={endTime => { setCreatingAt({ ...slot, endTime }); setSlot(null); }} />}
      {creatingAt && <BookingFormModal packages={packages} teamMembers={teamMembers} initialSchedule={creatingAt} onClose={() => setCreatingAt(null)} onSave={saveNew} />}
      {selected && <BookingActionSheet item={selected} onClose={() => setSelected(null)} onOpen={() => navigate(`/admin/bookings/${selected.id}`)} onWhatsApp={() => { setComposer({ context: whatsappContext(selected), template: 'booking_confirmation' }); setSelected(null); }} onReschedule={() => { setRescheduling(selected); setSelected(null); }} onCancel={() => void cancelBooking(selected)} />}
      {rescheduling && <RescheduleSheet item={rescheduling} visibleBookings={bookings} onClose={() => setRescheduling(null)} onSaved={async updated => { setRescheduling(null); await loadSchedule(true); setComposer({ context: whatsappContext(updated), template: 'booking_rescheduled' }); }} />}
      {composer && <WhatsAppComposer context={composer.context} initialTemplate={composer.template} onClose={() => setComposer(null)} />}
    </div>
  );
}

function MobileDayAgenda({ date, bookings, onBooking, onEmptySlot }: {
  date: string;
  bookings: ScheduleBookingItem[];
  onBooking: (item: ScheduleBookingItem) => void;
  onEmptySlot: (slot: SlotChoice) => void;
}) {
  const dayBookings = bookings.filter(item => item.bookingDate === date);
  const unknown = dayBookings.filter(item => !item.startTime || !item.endTime);
  const timed = dayBookings.filter(item => item.startTime && item.endTime);
  const activeShootCount = timed.filter(item => item.status !== 'cancelled').length;
  const available = Array.from({ length: 9 }, (_, index) => minutesToTime((11 + index) * 60))
    .filter(startTime => !slotHasConflict(bookings, date, startTime, endTimeFor(startTime, 1)));
  const entries: Array<
    | { kind: 'booking'; minute: number; item: ScheduleBookingItem }
    | { kind: 'available'; minute: number; startTime: string }
  > = [
    ...timed.map(item => ({ kind: 'booking' as const, minute: timeToMinutes(item.startTime), item })),
    ...available.map(startTime => ({ kind: 'available' as const, minute: timeToMinutes(startTime), startTime })),
  ].sort((a, b) => a.minute - b.minute || (a.kind === 'booking' ? -1 : 1));

  return <section className="space-y-3 md:hidden">
    <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
      <div className="flex items-center gap-2 text-blue-800"><CalendarDays className="h-5 w-5" /><span className="text-sm font-semibold">{activeShootCount} shoot{activeShootCount === 1 ? '' : 's'} scheduled</span></div>
      <span className="text-xs font-semibold text-blue-600">{available.length} open slots</span>
    </div>

    {unknown.length > 0 && <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" />Time not set</h3><div className="mt-2 space-y-2">{unknown.map(item => <button key={item.id} type="button" onClick={() => onBooking(item)} className="flex min-h-16 w-full items-center justify-between rounded-xl border border-amber-200 bg-white p-3 text-left"><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{item.customerName}</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{item.service || 'Service not set'}{item.location ? ` · ${item.location}` : ''}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-amber-600" /></button>)}</div></div>}

    {!timed.length && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">No shoots booked yet. Tap an available time below to create one.</p>}

    <div className="space-y-2">
      {entries.map(entry => entry.kind === 'booking' ? (
        <button key={`booking-${entry.item.id}`} type="button" onClick={() => onBooking(entry.item)} className={`flex min-h-[76px] w-full items-stretch overflow-hidden rounded-xl border text-left shadow-sm ${STATUS_CLASS[entry.item.status]}`}>
          <span className="flex w-[88px] shrink-0 flex-col justify-center border-r border-current/10 px-3"><strong className="text-sm">{formatScheduleTime(entry.item.startTime)}</strong><span className="mt-0.5 text-[11px] opacity-70">to {formatScheduleTime(entry.item.endTime)}</span></span>
          <span className="min-w-0 flex-1 self-center px-3 py-2"><strong className="block truncate text-sm">{entry.item.customerName}</strong><span className="mt-0.5 block truncate text-xs opacity-75">{entry.item.service || 'Service not set'}</span><span className="mt-1 block truncate text-[11px] font-semibold capitalize opacity-70">{entry.item.status.replace('_', ' ')}{entry.item.location ? ` · ${entry.item.location}` : ''}</span></span>
          <ChevronRight className="mr-2 h-5 w-5 shrink-0 self-center opacity-50" />
        </button>
      ) : (
        <button key={`available-${entry.startTime}`} type="button" onClick={() => onEmptySlot({ bookingDate: date, startTime: entry.startTime })} className="flex min-h-14 w-full items-center rounded-xl border border-dashed border-blue-300 bg-white text-left text-blue-700 transition active:bg-blue-50">
          <span className="w-[88px] shrink-0 px-3 text-sm font-semibold text-slate-600">{formatScheduleTime(entry.startTime)}</span>
          <span className="flex flex-1 items-center justify-between border-l border-slate-100 px-3 py-2"><span><strong className="block text-sm">Available</strong><span className="text-xs text-slate-500">Tap to add a booking</span></span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white"><Plus className="h-4 w-4" /></span></span>
        </button>
      ))}
    </div>
  </section>;
}

function ScheduleCalendar({ dates, bookings, onBooking, onEmptySlot }: {
  dates: string[];
  bookings: ScheduleBookingItem[];
  onBooking: (item: ScheduleBookingItem) => void;
  onEmptySlot: (slot: SlotChoice) => void;
}) {
  const { startHour, endHour } = visibleHourBounds(bookings);
  const rowHeight = 72;
  const height = (endHour - startHour) * rowHeight;
  const unknown = bookings.filter(item => !item.startTime || !item.endTime);
  const timed = bookings.filter(item => item.startTime && item.endTime);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {unknown.length > 0 && <div className="border-b border-amber-200 bg-amber-50 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" />Time not set</h3><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{unknown.map(item => <button key={item.id} type="button" onClick={() => onBooking(item)} className="min-h-12 min-w-52 rounded-xl border border-amber-300 bg-white p-3 text-left"><span className="block text-xs font-semibold text-amber-800">{formatScheduleDay(item.bookingDate)}</span><span className="mt-1 block truncate text-sm font-semibold text-slate-900">{item.customerName}</span><span className="block truncate text-xs text-slate-500">{item.service || 'Service not set'}</span></button>)}</div></div>}
    <div className="overflow-x-auto">
      <div style={{ minWidth: dates.length > 1 ? 1260 : 390 }}>
        <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `64px repeat(${dates.length}, minmax(180px, 1fr))` }}><div />{dates.map(date => <div key={date} className={`border-l border-slate-200 px-3 py-3 text-center ${date === kolkataToday() ? 'bg-blue-50' : ''}`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatScheduleDay(date, { weekday: 'short' })}</p><p className="mt-0.5 text-sm font-semibold text-slate-900">{formatScheduleDay(date, { day: 'numeric', month: 'short' })}</p></div>)}</div>
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${dates.length}, minmax(180px, 1fr))` }}>
          <div className="relative bg-slate-50" style={{ height }}>{Array.from({ length: endHour - startHour }, (_, index) => <span key={index} className="absolute right-2 -translate-y-2 text-[11px] font-medium text-slate-400" style={{ top: index * rowHeight }}>{formatScheduleTime(minutesToTime((startHour + index) * 60))}</span>)}</div>
          {dates.map(date => <DayLane key={date} date={date} bookings={timed.filter(item => item.bookingDate === date)} allBookings={bookings} startHour={startHour} endHour={endHour} rowHeight={rowHeight} height={height} onBooking={onBooking} onEmptySlot={onEmptySlot} />)}
        </div>
      </div>
    </div>
  </section>;
}

function DayLane({ date, bookings, allBookings, startHour, endHour, rowHeight, height, onBooking, onEmptySlot }: {
  date: string; bookings: ScheduleBookingItem[]; allBookings: ScheduleBookingItem[];
  startHour: number; endHour: number; rowHeight: number; height: number;
  onBooking: (item: ScheduleBookingItem) => void; onEmptySlot: (slot: SlotChoice) => void;
}) {
  return <div className={`relative border-l border-slate-200 ${date === kolkataToday() ? 'bg-blue-50/20' : ''}`} style={{ height }}>
    {Array.from({ length: endHour - startHour }, (_, index) => {
      const hour = startHour + index;
      const startTime = minutesToTime(hour * 60);
      const endTime = minutesToTime((hour + 1) * 60);
      const creatable = hour >= 11 && hour < 20 && !slotHasConflict(allBookings, date, startTime, endTime);
      return <button key={hour} type="button" disabled={!creatable} onClick={() => onEmptySlot({ bookingDate: date, startTime })} className="group absolute left-0 right-0 border-t border-slate-100 text-left disabled:cursor-default" style={{ top: index * rowHeight, height: rowHeight }} aria-label={creatable ? `Create booking ${formatScheduleDay(date)} at ${formatScheduleTime(startTime)}` : undefined}><span className={`ml-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold opacity-0 transition ${creatable ? 'group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-700' : ''}`}><Plus className="h-3 w-3" />Add</span></button>;
    })}
    {bookings.map(item => {
      const top = (timeToMinutes(item.startTime) - startHour * 60) / 60 * rowHeight;
      const eventHeight = Math.max(42, (timeToMinutes(item.endTime) - timeToMinutes(item.startTime)) / 60 * rowHeight - 4);
      return <button key={item.id} type="button" onClick={() => onBooking(item)} className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg border-l-4 px-2 py-1.5 text-left shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_CLASS[item.status]}`} style={{ top: top + 2, height: eventHeight }}><span className="block truncate text-xs font-bold">{formatScheduleTime(item.startTime)}–{formatScheduleTime(item.endTime)}</span><span className="mt-0.5 block truncate text-xs font-semibold">{item.customerName}</span><span className="block truncate text-[11px] opacity-75">{item.service || item.location || item.status.replace('_', ' ')}</span></button>;
    })}
  </div>;
}

function DurationSheet({ slot, bookings, onClose, onChoose }: { slot: SlotChoice; bookings: ScheduleBookingItem[]; onClose: () => void; onChoose: (endTime: string) => void }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customEndTime, setCustomEndTime] = useState(endTimeFor(slot.startTime, 1));
  const [customError, setCustomError] = useState('');
  const continueCustom = () => {
    if (!customEndTime || timeToMinutes(customEndTime) <= timeToMinutes(slot.startTime)) {
      return setCustomError('End time must be later than the start time.');
    }
    if (slotHasConflict(bookings, slot.bookingDate, slot.startTime, customEndTime)) {
      return setCustomError('This custom time overlaps another active booking.');
    }
    onChoose(customEndTime);
  };
  return <Sheet title="Choose shoot duration" subtitle={`${formatScheduleDay(slot.bookingDate)} · ${formatScheduleTime(slot.startTime)}`} onClose={onClose}><div className="grid gap-3 p-4">{([1, 2, 3] as const).map(duration => { const end = endTimeFor(slot.startTime, duration); const blocked = timeToMinutes(end) > 20 * 60 || slotHasConflict(bookings, slot.bookingDate, slot.startTime, end); return <button key={duration} type="button" disabled={blocked} onClick={() => onChoose(end)} className="flex min-h-16 items-center justify-between rounded-xl border border-slate-300 px-4 text-left disabled:bg-slate-100 disabled:text-slate-400"><span><strong className="block text-sm">{duration} hour{duration === 1 ? '' : 's'}</strong><span className="text-xs">{formatScheduleTime(slot.startTime)}–{formatScheduleTime(end)}</span></span>{blocked ? <span className="text-xs font-semibold">Unavailable</span> : <ChevronRight className="h-5 w-5" />}</button>; })}<button type="button" onClick={() => { setCustomOpen(value => !value); setCustomError(''); }} className="flex min-h-14 items-center justify-between rounded-xl border border-slate-300 px-4 text-left"><span><strong className="block text-sm">Custom duration</strong><span className="text-xs text-slate-500">Choose an exact end time</span></span><ChevronRight className={`h-5 w-5 transition ${customOpen ? 'rotate-90' : ''}`} /></button>{customOpen && <div className="rounded-xl bg-slate-50 p-3"><label className="text-sm font-medium text-slate-700">End time<input autoFocus type="time" min={slot.startTime} value={customEndTime} onChange={event => { setCustomEndTime(event.target.value); setCustomError(''); }} className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base" /></label>{customError && <p className="mt-2 text-sm font-medium text-red-600">{customError}</p>}<button type="button" onClick={continueCustom} className="mt-3 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white">Continue with custom time</button></div>}</div></Sheet>;
}

function BookingActionSheet({ item, onClose, onOpen, onWhatsApp, onReschedule, onCancel }: { item: ScheduleBookingItem; onClose: () => void; onOpen: () => void; onWhatsApp: () => void; onReschedule: () => void; onCancel: () => void }) {
  const canChange = item.status === 'draft' || item.status === 'confirmed';
  return <Sheet title={item.customerName} subtitle={`${formatScheduleDay(item.bookingDate)} · ${item.startTime ? `${formatScheduleTime(item.startTime)}–${formatScheduleTime(item.endTime)}` : 'Time not set'}`} onClose={onClose}>
    <div className="space-y-3 p-4"><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><p className="font-semibold text-slate-900">{item.service || 'Service not set'}</p>{item.location && <p className="mt-1 flex items-center gap-2"><MapPin className="h-4 w-4" />{item.location}</p>}{item.assignedTeamMemberName && <p className="mt-1 flex items-center gap-2"><UserRound className="h-4 w-4" />{item.assignedTeamMemberName}</p>}</div>
      <div className="grid grid-cols-2 gap-2"><a href={`tel:${item.customerPhone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 font-semibold text-slate-700"><Phone className="h-4 w-4" />Call</a><button type="button" onClick={onWhatsApp} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300 text-sm font-semibold text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</button><button type="button" onClick={onOpen} className="col-span-2 h-12 rounded-xl bg-blue-600 font-semibold text-white">Open booking</button></div>
      {canChange && <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={onReschedule} className="h-12 rounded-xl border border-blue-300 font-semibold text-blue-700">Reschedule</button><button type="button" onClick={onCancel} className="h-12 rounded-xl border border-red-300 font-semibold text-red-700">Cancel booking</button></div>}
    </div>
  </Sheet>;
}

function RescheduleSheet({ item, visibleBookings, onClose, onSaved }: { item: ScheduleBookingItem; visibleBookings: ScheduleBookingItem[]; onClose: () => void; onSaved: (booking: Booking) => void | Promise<void> }) {
  const confirm = useConfirmDialog();
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
  const [conflicts, setConflicts] = useState<ScheduleConflictResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingDate || !startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime)) { setConflicts(null); return; }
    const controller = new AbortController();
    setChecking(true);
    const timer = window.setTimeout(() => void api.checkScheduleConflicts({ bookingDate, startTime, endTime, excludeBookingId: item.id }, controller.signal).then(setConflicts).catch(err => { if ((err as Error).name !== 'AbortError') setError(err instanceof Error ? err.message : 'Failed to check availability'); }).finally(() => { if (!controller.signal.aborted) setChecking(false); }), 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [bookingDate, endTime, item.id, startTime]);

  const chooseDuration = (value: 1 | 2 | 3) => { setDuration(value); setEndTime(endTimeFor(startTime, value)); };
  const chooseStart = (value: string) => {
    const customMinutes = Math.max(30, timeToMinutes(endTime) - timeToMinutes(startTime));
    setStartTime(value);
    setEndTime(duration === 'custom'
      ? minutesToTime(timeToMinutes(value) + customMinutes)
      : endTimeFor(value, duration));
  };
  const submit = async () => {
    if (saving || checking || conflicts?.blocked) return;
    if (!bookingDate || !startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime)) return setError('Choose a valid date and time window.');
    let acknowledgeUntimedConflict = false;
    if (conflicts?.requiresUntimedConfirmation) {
      acknowledgeUntimedConflict = await confirm({ title: 'Another booking has no time', description: 'There is an active booking on this date without a time. Continue only after checking it will not clash.', confirmLabel: 'Reschedule anyway' });
      if (!acknowledgeUntimedConflict) return;
    }
    setSaving(true); setError('');
    try { await onSaved(await api.rescheduleBooking(item.id, { bookingDate, startTime, endTime, acknowledgeUntimedConflict })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to reschedule booking'); }
    finally { setSaving(false); }
  };

  const today = kolkataToday();
  const durationUnavailable = (value: 1 | 2 | 3) => {
    const candidateEnd = endTimeFor(startTime, value);
    return timeToMinutes(candidateEnd) > 20 * 60
      || slotHasConflict(visibleBookings, bookingDate, startTime, candidateEnd, item.id);
  };
  return <Sheet title="Reschedule booking" subtitle={item.customerName} onClose={onClose} wide>
    <div className="space-y-5 overflow-y-auto p-4">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setBookingDate(today)} className="h-11 rounded-xl border border-slate-300 font-semibold text-slate-700">Today</button><button type="button" onClick={() => setBookingDate(addScheduleDays(today, 1))} className="h-11 rounded-xl border border-slate-300 font-semibold text-slate-700">Tomorrow</button></div>
      <label className="block text-sm font-medium text-slate-700">Booking date<input type="date" value={bookingDate} onChange={event => setBookingDate(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-base" /></label>
      <div><p className="text-sm font-medium text-slate-700">Duration</p><div className="mt-2 grid grid-cols-2 gap-2">{([1, 2, 3] as const).map(value => { const blocked = durationUnavailable(value); return <button key={value} type="button" disabled={blocked} onClick={() => chooseDuration(value)} className={`h-11 rounded-xl border text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-400 ${duration === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}>{value} hour{value === 1 ? '' : 's'}{blocked ? ' · unavailable' : ''}</button>; })}<button type="button" onClick={() => setDuration('custom')} className={`h-11 rounded-xl border text-sm font-semibold ${duration === 'custom' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}>Custom</button></div></div>
      <div><p className="text-sm font-medium text-slate-700">Hourly starts</p><div className="mt-2 grid grid-cols-3 gap-2">{Array.from({ length: 9 }, (_, index) => minutesToTime((11 + index) * 60)).map(value => { const customMinutes = Math.max(30, timeToMinutes(endTime) - timeToMinutes(startTime)); const end = duration === 'custom' ? minutesToTime(timeToMinutes(value) + customMinutes) : endTimeFor(value, duration); const blocked = timeToMinutes(end) > 20 * 60 || slotHasConflict(visibleBookings, bookingDate, value, end, item.id); return <button key={value} type="button" disabled={blocked} onClick={() => chooseStart(value)} className={`h-11 rounded-xl border text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400 ${startTime === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600'}`}>{formatScheduleTime(value)}</button>; })}</div></div>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Custom start<input type="time" value={startTime} onChange={event => { setStartTime(event.target.value); setDuration('custom'); }} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-base" /></label><label className="text-sm font-medium text-slate-700">Custom end<input type="time" value={endTime} onChange={event => { setEndTime(event.target.value); setDuration('custom'); }} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-base" /></label></div>
      {checking && <p className="text-sm text-slate-500">Checking availability…</p>}
      {conflicts?.timedConflicts.map(conflict => <div key={conflict.id} className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><span><strong>Time unavailable.</strong> {conflict.customerName} is booked {formatScheduleTime(conflict.startTime)}–{formatScheduleTime(conflict.endTime)}.</span></div>)}
      {conflicts?.requiresUntimedConfirmation && !conflicts.blocked && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="h-5 w-5 shrink-0" /><span>{conflicts.untimedConflicts.length} active booking{conflicts.untimedConflicts.length === 1 ? '' : 's'} on this date {conflicts.untimedConflicts.length === 1 ? 'has' : 'have'} no time. Confirmation is required.</span></div>}
    </div>
    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void submit()} disabled={saving || checking || Boolean(conflicts?.blocked)} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save new time'}</button></div>
  </Sheet>;
}

function Sheet({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true"><div className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}><header className="flex items-center justify-between border-b border-slate-200 p-4"><div className="min-w-0"><h2 className="truncate font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}</div><button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></header>{children}</div></div>;
}
