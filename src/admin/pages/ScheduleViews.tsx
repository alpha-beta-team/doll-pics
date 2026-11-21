import { formatCustomerName } from '../../shared/formatCustomerName';
import { useEffect, useRef } from 'react';
import { AlertTriangle, CalendarDays, ChevronRight, Plus } from 'lucide-react';
import type { ScheduleBookingItem } from '../types';
import {
  photographerClash, photographerColor, shootTiming, formatScheduleDay, formatScheduleTime,
  kolkataToday, layoutScheduleBookings, minutesToTime,
  scheduleDates, timeToMinutes, unbookedWindows, visibleHourBounds,
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
const hasOverlap = (item: ScheduleBookingItem, bookings: ScheduleBookingItem[]) => bookings.some(other => photographerClash(item, other));

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

function UntimedBookings({ bookings, onBooking, highlight = '' }: Pick<ScheduleActions, 'bookings' | 'onBooking'> & { highlight?: string }) {
  const unknown = bookings.filter(item => item.status !== 'cancelled' && (!item.startTime || !item.endTime));
  if (!unknown.length) return null;
  return <div className="sc-untimed"><h3><AlertTriangle className="h-4 w-4" />{unknown.length} booking{unknown.length === 1 ? '' : 's'} with time not set</h3>
    <p>Set these times before relying on unbooked periods.</p>
    <div>{unknown.map(item => <button type="button" key={item.id} data-dimmed={Boolean(highlight && highlight !== (item.assignedStaffAccountId || 'unassigned'))} onClick={() => onBooking(item)}>{formatCustomerName(item.customerName)} · {formatScheduleDay(item.bookingDate)} <ChevronRight className="h-3 w-3" /></button>)}</div>
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
        <span className="sc-agenda-detail"><strong>{formatCustomerName(entry.item.customerName)}</strong><span>{entry.item.service || 'Service not set'}</span><small className="capitalize">{statusLabel(entry.item)}{entry.item.assignedStaffAccountName ? ` · ${entry.item.assignedStaffAccountName}` : ''}</small>{entry.item.location && <small>{entry.item.location}</small>}{hasOverlap(entry.item, dayBookings) && <span className="sc-overlap-label"><AlertTriangle className="h-3 w-3" />Photographer clash</span>}</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </button> :
      <div className="sc-agenda-gap" key={`gap-${entry.gap.startTime}`}>
        <div><strong>{shortTime(entry.gap.startTime)}–{shortTime(entry.gap.endTime)}</strong><span>Unbooked · {durationLabel(timeToMinutes(entry.gap.endTime) - timeToMinutes(entry.gap.startTime))}</span></div>
        {canManage && <button type="button" className="sc-control" aria-label={`Add booking at ${shortTime(entry.gap.startTime)}`} onClick={() => onEmptySlot({ bookingDate: date, startTime: entry.gap.startTime })}><Plus className="h-4 w-4" />Add</button>}
      </div>
    )}</div>
  </section>;
}

export function ScheduleCalendar({ dates, bookings, canManage, compact, focusTime, highlight, now, children, onDay, onBooking, onEmptySlot }: ScheduleActions & {
  dates: string[]; children: React.ReactNode; highlight: string; now: string; compact: boolean; focusTime?: string; onDay: (date: string, startTime?: string) => void;
}) {
  const { startHour, endHour } = visibleHourBounds(bookings);
  const rowHeight = compact ? 48 : 72;
  const height = (endHour - startHour) * rowHeight;
  const timed = bookings.filter(item => item.startTime && item.endTime);
  const week = dates.length === 7;
  const columnsForDate = (date: string) => Math.max(1, ...layoutScheduleBookings(timed.filter(item => item.bookingDate === date), 46 / rowHeight * 60).map(entry => entry.columns));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [today, currentTime] = now.split('T');
  useEffect(() => {
    if (!focusTime || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, (timeToMinutes(focusTime) / 60 - startHour) * rowHeight - 36);
  }, [focusTime, startHour, rowHeight]);
  const gridColumns = `60px ${dates.map(date => `minmax(${Math.max(84, columnsForDate(date) * 36)}px, 1fr)`).join(' ')}`;
  return <section className={`sc-calendar ${week ? 'sc-week' : 'sc-day'}`} aria-label={week ? 'Week calendar' : 'Day calendar'}>
    <UntimedBookings highlight={highlight} bookings={bookings} onBooking={onBooking} />
    <div className="sc-calendar-scroll" ref={scrollRef} tabIndex={0} aria-label="Scrollable schedule">
      <div className="sc-calendar-grid" style={{ gridTemplateColumns: gridColumns }}>
        <div className="sc-calendar-corner" aria-hidden="true" />
        {dates.map(date => {
          const items = bookings.filter(item => item.bookingDate === date);

          return <button key={`header-${date}`} type="button" className="sc-day-header" aria-current={date === today ? 'date' : undefined} aria-label={`View ${formatScheduleDay(date)}, ${shootsLabel(shootCount(items))}`} onClick={() => onDay(date)}>
            <span className="sc-day-heading"><span>{formatScheduleDay(date, { weekday: 'short' })}</span><strong>{formatScheduleDay(date, { day: 'numeric' })}</strong></span>
            <span className="sc-day-stats"><span>{shootsLabel(shootCount(items))}</span>{items.some(item => hasOverlap(item, items)) && <b className="sc-clash">Clash</b>}{items.some(item => shootTiming(item, now) === 'Past, not closed') && <b className="sc-past">To close</b>}</span>
          </button>;
        })}
        <div className="sc-time-column" style={{ height }}>{Array.from({ length: endHour - startHour }, (_, index) => <span key={index} style={{ top: index * rowHeight }}>{shortTime(minutesToTime((startHour + index) * 60))}</span>)}</div>
        {dates.map(date => <DayLane key={date} date={date} week={week} bookings={timed.filter(item => item.bookingDate === date)} now={now} highlight={highlight} canManage={canManage} startHour={startHour} endHour={endHour} rowHeight={rowHeight} height={height} currentTime={date === today ? currentTime : undefined} onBooking={onBooking} onEmptySlot={onEmptySlot} />)}
      </div>
    </div>
    <div className="sc-calendar-footer">{children}<span>✓ Done</span><span className="sc-live">● Shooting now</span><span className="sc-past">◷ Past, not closed</span><span className="sc-clash">⚠ Same photographer, overlapping</span>{canManage && <span>Click an empty slot to add</span>}</div>
  </section>;
}

function EventContent({ item, overlap, timing }: { item: ScheduleBookingItem; overlap: boolean; timing: string }) {
  const marker = overlap ? '⚠' : timing === 'Done' ? '✓' : timing === 'Shooting now' ? '●' : timing ? '◷' : '';
  return <span className="sc-event-content">
    <strong>{marker && <i aria-hidden="true">{marker}</i>}<span>{formatCustomerName(item.customerName)}</span></strong>
    <span className="sc-event-service">{item.service || 'Service not set'}</span>
    <span>{shortTime(item.startTime)}–{shortTime(item.endTime)}</span>
    <small>{item.assignedStaffAccountId ? item.assignedStaffAccountName : 'Unassigned'}</small>
  </span>;
}

function DayLane({ date, week, bookings, now, highlight, canManage, startHour, endHour, rowHeight, height, currentTime, onBooking, onEmptySlot }: ScheduleActions & {
  date: string; week: boolean; now: string; highlight: string; startHour: number; endHour: number; rowHeight: number; height: number;
  currentTime?: string;
}) {
  const currentMinute = currentTime ? timeToMinutes(currentTime) : -1;
  const topFor = (minute: number) => (minute - startHour * 60) / 60 * rowHeight;
  return <div className={`sc-day-lane ${currentTime ? 'sc-today-lane' : ''}`} style={{ height, backgroundSize: `100% ${rowHeight}px` }}>
    {currentMinute > startHour * 60 && <div className="sc-elapsed" aria-hidden="true" style={{ height: Math.min(height, topFor(currentMinute)) }} />}
    {canManage && Array.from({ length: (endHour - startHour) * 2 }, (_, index) => {
      const startTime = minutesToTime(startHour * 60 + index * 30);
      return <button key={startTime} type="button" className="sc-slot" style={{ top: index * rowHeight / 2, height: rowHeight / 2 }} onClick={() => onEmptySlot({ bookingDate: date, startTime })} aria-label={`Create booking ${formatScheduleDay(date)} at ${formatScheduleTime(startTime)}`}><span>+ Add</span></button>;
    })}
    {layoutScheduleBookings(bookings, 46 / rowHeight * 60).map(({ item, column, columns }) => {
      const eventHeight = Math.max(42, (timeToMinutes(item.endTime) - timeToMinutes(item.startTime)) / 60 * rowHeight - 4);
      const overlap = hasOverlap(item, bookings);
      const color = photographerColor(item.assignedStaffAccountId);
      const timing = shootTiming(item, now);
      // Stagger successive starts. Adjacent headings need separate lanes to stay readable.
      const stagger = week && !bookings.some(other => other.id !== item.id
        && Math.abs(timeToMinutes(other.startTime) - timeToMinutes(item.startTime)) * rowHeight / 60 < 32);
      const left = stagger ? Math.min(column * 22, 60) : column * 100 / columns;
      const width = stagger ? 100 - left : 100 / columns;
      return <button key={item.id} type="button" data-timing={timing} data-dimmed={Boolean(highlight && highlight !== (item.assignedStaffAccountId || 'unassigned'))} className={`sc-event ${STATUS_CLASS[item.status]} ${overlap ? 'sc-event-overlap' : ''}`} title={`${formatCustomerName(item.customerName)} · ${shortTime(item.startTime)}–${shortTime(item.endTime)} · ${item.service} · ${statusLabel(item)}`} aria-label={`${formatCustomerName(item.customerName)}, ${shortTime(item.startTime)}–${shortTime(item.endTime)}${overlap ? ', photographer clash' : ''}`} onClick={() => onBooking(item)} style={{ borderLeftColor: color, backgroundColor: `color-mix(in srgb, ${color} 12%, white)`, top: topFor(timeToMinutes(item.startTime)) + 2, height: eventHeight, left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` }}><EventContent item={item} overlap={overlap} timing={timing} /></button>;
    })}
    {currentMinute >= startHour * 60 && currentMinute < endHour * 60 && <div className="sc-current-time" style={{ top: topFor(currentMinute) }} aria-label={`Current time ${shortTime(currentTime!)}`}><span /></div>}
  </div>;
}
