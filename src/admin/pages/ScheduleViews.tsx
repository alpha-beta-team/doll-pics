import { formatCustomerName } from '../../shared/formatCustomerName';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronRight, Plus } from 'lucide-react';
import type { ScheduleBookingItem } from '../types';
import {
  DEFAULT_END_HOUR, DEFAULT_START_HOUR, endTimeFor, formatScheduleDay, formatScheduleTime,
  kolkataToday, layoutScheduleBookings, minutesToTime, occupiesSchedule,
  scheduleDates, slotHasConflict, timeToMinutes, unbookedWindows, visibleHourBounds, windowsOverlap,
} from './schedule.utils';

type SlotChoice = { bookingDate: string; startTime: string };
type ScheduleActions = {
  bookings: ScheduleBookingItem[];
  canManage: boolean;
  onBooking: (item: ScheduleBookingItem) => void;
  onEmptySlot: (slot: SlotChoice) => void;
};
const STATUS_CLASS: Record<ScheduleBookingItem['status'], string> = {
  draft: 'border-slate-400 bg-slate-100 text-slate-800',
  confirmed: 'border-emerald-500 bg-emerald-50 text-emerald-950',
  shoot_completed: 'border-blue-500 bg-blue-50 text-blue-950',
  delivered: 'border-violet-500 bg-violet-50 text-violet-950',
  cancelled: 'border-red-400 bg-red-50 text-red-800 opacity-70',
};
const shortTime = (time: string) => formatScheduleTime(time).replace(':00', '');
const statusLabel = (item: ScheduleBookingItem) => item.status.replace(/_/g, ' ');
const shootCount = (items: ScheduleBookingItem[]) => items.filter(item => item.status !== 'cancelled').length;
const shootsLabel = (count: number) => `${count} shoot${count === 1 ? '' : 's'}`;
const gapMinutes = (gaps: ReturnType<typeof unbookedWindows>) => gaps.reduce((total, gap) => total + timeToMinutes(gap.endTime) - timeToMinutes(gap.startTime), 0);
const durationLabel = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : ''}${minutes % 60 ? ` ${minutes % 60}m` : ''}`.trim() || '0h';
const hasOverlap = (item: ScheduleBookingItem, bookings: ScheduleBookingItem[]) => occupiesSchedule(item) && bookings.some(other =>
  other.id !== item.id && other.bookingDate === item.bookingDate && occupiesSchedule(other)
  && other.startTime && other.endTime && windowsOverlap(item.startTime, item.endTime, other.startTime, other.endTime));

export function ScheduleWeekStrip({ anchorDate, bookings, onDate }: {
  anchorDate: string; bookings: ScheduleBookingItem[]; onDate: (date: string) => void;
}) {
  return <nav className="sc-week-strip" aria-label="Choose day of week">
    {scheduleDates(anchorDate, 'week').map(date => {
      const count = shootCount(bookings.filter(item => item.bookingDate === date));
      return <button type="button" key={date} aria-label={formatScheduleDay(date)} aria-pressed={date === anchorDate} aria-current={date === kolkataToday() ? 'date' : undefined} onClick={() => onDate(date)}>
        <span>{formatScheduleDay(date, { weekday: 'short' })}</span><strong>{formatScheduleDay(date, { day: 'numeric' })}</strong><small>{count} shoot{count === 1 ? '' : 's'}</small>
      </button>;
    })}
  </nav>;
}

function UntimedBookings({ bookings, onBooking }: Pick<ScheduleActions, 'bookings' | 'onBooking'>) {
  const unknown = bookings.filter(item => item.status !== 'cancelled' && (!item.startTime || !item.endTime));
  if (!unknown.length) return null;
  return <div className="sc-untimed"><h3><AlertTriangle className="h-4 w-4" />{unknown.length} booking{unknown.length === 1 ? '' : 's'} with time not set</h3>
    <p>Set these times before relying on unbooked periods.</p>
    <div>{unknown.map(item => <button type="button" key={item.id} onClick={() => onBooking(item)}>{formatCustomerName(item.customerName)} · {formatScheduleDay(item.bookingDate)} <ChevronRight className="h-3 w-3" /></button>)}</div>
  </div>;
}

export function ScheduleAgenda({ date, bookings, canManage, onBooking, onEmptySlot }: ScheduleActions & { date: string }) {
  const dayBookings = bookings.filter(item => item.bookingDate === date);
  const timed = dayBookings.filter(item => item.startTime && item.endTime);
  const gaps = unbookedWindows(bookings, date);
  const entries = [
    ...timed.map(item => ({ kind: 'booking' as const, minute: timeToMinutes(item.startTime), item })),
    ...gaps.map(gap => ({ kind: 'gap' as const, minute: timeToMinutes(gap.startTime), gap })),
  ].sort((a, b) => a.minute - b.minute || (a.kind === 'booking' ? -1 : 1));
  return <section className="sc-agenda" aria-label="Day agenda">
    <div className="sc-agenda-summary"><span><CalendarDays className="h-4 w-4" />{shootsLabel(shootCount(dayBookings))}</span><span>{durationLabel(gapMinutes(gaps))} unbooked</span></div>
    <p className="sc-availability-note">Unbooked time within {shortTime('11:00')}–{shortTime('20:00')}. Check staff, setup and travel time before booking.</p>
    <UntimedBookings bookings={dayBookings} onBooking={onBooking} />
    {!shootCount(dayBookings) && <p className="sc-empty">No shoots scheduled for this day.</p>}
    <div className="sc-agenda-entries">{entries.map(entry => entry.kind === 'booking' ?
      <button key={entry.item.id} type="button" className={`sc-agenda-booking ${STATUS_CLASS[entry.item.status]}`} onClick={() => onBooking(entry.item)}>
        <span className="sc-agenda-time"><strong>{shortTime(entry.item.startTime)}</strong><span>to {shortTime(entry.item.endTime)}</span></span>
        <span className="sc-agenda-detail"><strong>{formatCustomerName(entry.item.customerName)}</strong><span>{entry.item.service || 'Service not set'}</span><small className="capitalize">{statusLabel(entry.item)}{entry.item.assignedStaffAccountName ? ` · ${entry.item.assignedStaffAccountName}` : ''}</small>{entry.item.location && <small>{entry.item.location}</small>}{hasOverlap(entry.item, dayBookings) && <span className="sc-overlap-label"><AlertTriangle className="h-3 w-3" />Time overlap</span>}</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </button> :
      <div className="sc-agenda-gap" key={`gap-${entry.gap.startTime}`}>
        <div><strong>{shortTime(entry.gap.startTime)}–{shortTime(entry.gap.endTime)}</strong><span>Unbooked · {durationLabel(timeToMinutes(entry.gap.endTime) - timeToMinutes(entry.gap.startTime))}</span></div>
        {canManage && <button type="button" className="sc-control" aria-label={`Add booking at ${shortTime(entry.gap.startTime)}`} onClick={() => onEmptySlot({ bookingDate: date, startTime: entry.gap.startTime })}><Plus className="h-4 w-4" />Add</button>}
      </div>
    )}</div>
  </section>;
}

export function ScheduleCalendar({ dates, bookings, canManage, compact, focusTime, onDay, onBooking, onEmptySlot }: ScheduleActions & {
  dates: string[]; compact: boolean; focusTime?: string; onDay: (date: string, startTime?: string) => void;
}) {
  const { startHour, endHour } = visibleHourBounds(bookings);
  const rowHeight = compact ? 48 : 72;
  const height = (endHour - startHour) * rowHeight + 46;
  const timed = bookings.filter(item => item.startTime && item.endTime);
  const week = dates.length === 7;
  const columnsForDate = (date: string) => Math.max(1, ...layoutScheduleBookings(timed.filter(item => item.bookingDate === date), 46 / rowHeight * 60).map(entry => entry.columns));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  useEffect(() => {
    if (!focusTime || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, (timeToMinutes(focusTime) / 60 - startHour) * rowHeight - 36);
  }, [focusTime, startHour, rowHeight]);
  const gridColumns = `60px ${dates.map(date => `minmax(${44 + columnsForDate(date) * 160}px, 1fr)`).join(' ')}`;
  return <section className={`sc-calendar ${week ? 'sc-week' : 'sc-day'}`} aria-label={week ? 'Week calendar' : 'Day calendar'}>
    <UntimedBookings bookings={bookings} onBooking={onBooking} />
    <div className="sc-calendar-scroll" ref={scrollRef} tabIndex={0} aria-label="Scrollable schedule">
      <div className="sc-calendar-grid" style={{ gridTemplateColumns: gridColumns }}>
        <div className="sc-calendar-corner" aria-hidden="true" />
        {dates.map(date => {
          const items = bookings.filter(item => item.bookingDate === date);
          const gaps = unbookedWindows(items, date);
          return <button key={`header-${date}`} type="button" className="sc-day-header" aria-current={date === kolkataToday(now) ? 'date' : undefined} aria-label={`View ${formatScheduleDay(date)}, ${shootsLabel(shootCount(items))}`} onClick={() => onDay(date)}>
            <span className="sc-day-heading"><span>{formatScheduleDay(date, { weekday: 'short' })}</span><strong>{formatScheduleDay(date, { day: 'numeric', month: 'short' })}</strong></span>
            <span className="sc-day-stats" title="Free means unbooked time between 11 AM and 8 PM, based on known booking times. Check staff availability, setup and travel time."><span>{shootsLabel(shootCount(items))}</span><span aria-hidden="true">·</span><span className="sc-unbooked-count">{gapMinutes(gaps) ? `${durationLabel(gapMinutes(gaps))} free` : 'Fully booked'}</span></span>
          </button>;
        })}
        <div className="sc-time-column" style={{ height }}>{Array.from({ length: endHour - startHour + 1 }, (_, index) => <span key={index} style={{ top: index * rowHeight }}>{shortTime(minutesToTime((startHour + index) * 60))}</span>)}</div>
        {dates.map(date => <DayLane key={date} date={date} bookings={timed.filter(item => item.bookingDate === date)} allBookings={bookings} canManage={canManage} startHour={startHour} endHour={endHour} rowHeight={rowHeight} height={height} currentTime={date === kolkataToday(now) ? currentTime : undefined} onBooking={onBooking} onEmptySlot={onEmptySlot} />)}
      </div>
    </div>
    <div className="sc-calendar-footer"><span className="sc-week-hint">Scroll horizontally to see all days. Select a shoot for details.</span><span><i className="sc-today-dot" />Today</span><span><i className="sc-now-dot" />Current time</span><span><AlertTriangle className="h-3 w-3" />Time overlap</span><span>Unbooked time: 11 AM–8 PM · Check staff and setup time</span></div>
  </section>;
}

function EventContent({ item, overlap, small }: { item: ScheduleBookingItem; overlap: boolean; small: boolean }) {
  return <span className="sc-event-content"><strong>{formatCustomerName(item.customerName)}</strong><span>{shortTime(item.startTime)}–{shortTime(item.endTime)}</span>
    {!small && <><span className="sc-event-service">{item.service || 'Service not set'}</span><small className="capitalize">{statusLabel(item)}</small>{item.assignedStaffAccountName && <small>{item.assignedStaffAccountName}</small>}{overlap && <span className="sc-overlap-label"><AlertTriangle className="h-3 w-3" />Overlap</span>}</>}
  </span>;
}

function DayLane({ date, bookings, allBookings, canManage, startHour, endHour, rowHeight, height, currentTime, onBooking, onEmptySlot }: ScheduleActions & {
  date: string; allBookings: ScheduleBookingItem[]; startHour: number; endHour: number; rowHeight: number; height: number;
  currentTime?: string;
}) {
  const currentMinute = currentTime ? timeToMinutes(currentTime) : -1;
  const topFor = (minute: number) => (minute - startHour * 60) / 60 * rowHeight;
  return <div className={`sc-day-lane ${currentTime ? 'sc-today-lane' : ''}`} style={{ height, backgroundSize: `100% ${rowHeight}px` }}>
    {Array.from({ length: endHour - startHour }, (_, index) => {
      const hour = startHour + index;
      const startTime = minutesToTime(hour * 60);
      const overlap = slotHasConflict(allBookings, date, startTime, endTimeFor(startTime, 1));
      const creatable = canManage && hour >= DEFAULT_START_HOUR && hour < DEFAULT_END_HOUR;
      return <button key={hour} type="button" disabled={!creatable} onClick={() => onEmptySlot({ bookingDate: date, startTime })} className="group absolute left-0 w-10 border-t border-slate-100 text-left disabled:cursor-default" style={{ top: index * rowHeight, height: rowHeight }} aria-label={creatable ? `Create booking ${formatScheduleDay(date)} at ${formatScheduleTime(startTime)}${overlap ? ', existing bookings' : ''}` : undefined}><span className={`ml-1 inline-flex flex-col items-center rounded-md px-1 py-1 text-[10px] font-semibold transition ${creatable ? 'text-blue-700 hover:bg-blue-50' : 'invisible'}`}><Plus className="h-3 w-3" />Add</span></button>;
    })}
    {layoutScheduleBookings(bookings, 46 / rowHeight * 60).map(({ item, column, columns }) => {
      const eventHeight = Math.max(42, (timeToMinutes(item.endTime) - timeToMinutes(item.startTime)) / 60 * rowHeight - 4);
      const overlap = hasOverlap(item, allBookings);
      return <button key={item.id} type="button" className={`sc-event ${STATUS_CLASS[item.status]} ${overlap ? 'sc-event-overlap' : ''}`} title={`${formatCustomerName(item.customerName)} · ${shortTime(item.startTime)}–${shortTime(item.endTime)} · ${item.service} · ${statusLabel(item)}`} aria-label={`${formatCustomerName(item.customerName)}, ${shortTime(item.startTime)}–${shortTime(item.endTime)}${overlap ? ', time overlap' : ''}`} onClick={() => onBooking(item)} style={{ top: topFor(timeToMinutes(item.startTime)) + 2, height: eventHeight, left: `calc(40px + (100% - 40px) * ${column / columns} + 2px)`, width: `calc((100% - 40px) / ${columns} - 4px)` }}><EventContent item={item} overlap={overlap} small={eventHeight < 84} /></button>;
    })}
    {currentMinute >= startHour * 60 && currentMinute < endHour * 60 && <div className="sc-current-time" style={{ top: topFor(currentMinute) }} aria-label={`Current time ${shortTime(currentTime!)}`}><span /></div>}
  </div>;
}
