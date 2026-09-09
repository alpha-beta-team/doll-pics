import type { KeyboardEvent } from 'react';
import { AlertTriangle, CalendarDays, ChevronRight, Clock3, Globe, Phone, UserRound, UserRoundPlus } from 'lucide-react';
import type { Booking } from '../../types';
import { formatTimeWindow } from '../../../shared/bookingTime';
import { bookingPriceLabel, bookingStatusClass, bookingStatusLabel, formatBookingDay } from './bookingList';
import { leadSourceLabel } from '../leadSource';
import { WhatsAppIcon } from '../enquiries/WhatsAppIcon';
import { whatsappUrl } from '../../contact';

type BookingCardProps = {
  booking: Booking;
  canViewPayments: boolean;
  showPricing: boolean;
  canViewPhone: boolean;
  onOpen: () => void;
  onAssign?: () => void;
};

const AVATAR_COLORS = ['bg-emerald-100 text-emerald-800 ring-emerald-200', 'bg-rose-100 text-rose-700 ring-rose-200', 'bg-purple-100 text-purple-700 ring-purple-200', 'bg-sky-100 text-sky-700 ring-sky-200', 'bg-amber-100 text-amber-700 ring-amber-200'];

function formatFollowUp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
}

function shortShootDate(value: string) {
  if (!value) return 'Date not set';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() === new Date().getFullYear() ? undefined : '2-digit' }).format(date);
}

export function BookingCard({ booking, canViewPayments, showPricing, canViewPhone, onOpen, onAssign }: BookingCardProps) {
  const customer = booking.customerName || 'Unnamed customer';
  const initials = customer.trim().split(/\s+/).length > 1 ? customer.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() : customer.slice(0, 2).toUpperCase();
  const avatarColor = AVATAR_COLORS[Array.from(customer).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const followUpOverdue = Boolean(booking.nextFollowUpAt && new Date(booking.nextFollowUpAt).getTime() < Date.now());
  const hasPaymentDueDate = canViewPayments && showPricing && booking.paymentSummary.balanceDue != null && booking.paymentSummary.balanceDue > 0 && Boolean(booking.paymentDueDate);
  const hasAttention = Boolean(booking.nextFollowUpAt || hasPaymentDueDate || booking.assignedStaffAccountName);
  const service = booking.packageName || booking.shootType || 'Service not set';
  const hasTime = Boolean(booking.startTime && booking.endTime);
  const source = leadSourceLabel(booking.source);
  const SourceIcon = booking.source === 'whatsapp' ? WhatsAppIcon : Globe;
  const actionsClass = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus';
  const openFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); }
  };
  return (
    <article role="link" tabIndex={0} aria-label={`Open booking for ${customer}`} onClick={onOpen} onKeyDown={openFromKeyboard}
      className={`booking-row group cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus ${showPricing ? 'booking-has-pricing' : ''}`}>
      <div className="booking-customer flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className={`booking-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ${avatarColor}`}><span className="booking-desktop-only">{customer[0].toUpperCase()}</span><span className="booking-mobile-only">{initials}</span></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="break-words text-sm font-semibold leading-5 text-admin-text">{customer}</h3><span className={`booking-status-badge inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${bookingStatusClass[booking.status]}`}>{bookingStatusLabel(booking.status)}</span></div>
          {booking.customerPhone && <p className="mt-1 break-all text-xs text-admin-subtle">{canViewPhone ? booking.customerPhone : 'Phone hidden'}</p>}
        </div>
      </div>
      <div className="booking-service min-w-0 text-xs leading-5">
        <p className="booking-service-name font-medium text-admin-secondary">{service}</p>
        <p className="booking-source mt-1 flex items-center gap-1 text-xs text-admin-subtle"><SourceIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><span className="booking-source-prefix">Source: </span>{source}</span></p>
      </div>
      <div className="booking-date min-w-0 text-xs text-admin-secondary" title={formatBookingDay(booking.bookingDate)}>
        <span className="booking-mobile-only">{shortShootDate(booking.bookingDate)}</span>
        <div className="booking-desktop-only"><p>{formatBookingDay(booking.bookingDate)}</p>{hasTime && <p className="mt-1 text-[11px] text-admin-subtle">{formatTimeWindow(booking.startTime, booking.endTime, '12h')}</p>}</div>
      </div>
      {showPricing && <div className="booking-amount text-xs font-semibold tabular-nums text-admin-text">{bookingPriceLabel(booking, canViewPayments)}</div>}
      <div className={`booking-attention min-w-0 text-xs ${hasAttention ? '' : 'booking-attention-empty'}`}>
        {booking.nextFollowUpAt ? <span title={booking.followUpNote || undefined} className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 leading-4 ${followUpOverdue ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{followUpOverdue ? 'Overdue' : 'Follow-up'} · {formatFollowUp(booking.nextFollowUpAt)}{booking.followUpNote ? ` · ${booking.followUpNote}` : ''}</span></span>
          : hasPaymentDueDate ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800"><AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>Payment due · {formatBookingDay(booking.paymentDueDate)}</span></span>
          : booking.assignedStaffAccountName ? <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-muted px-2.5 py-1.5 text-admin-secondary"><UserRound className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" /><span>Assigned to {booking.assignedStaffAccountName}</span></span>
          : <span className="text-admin-subtle">Unassigned</span>}
      </div>
      <div className="booking-actions flex items-center justify-end gap-1.5">
        {onAssign && <button type="button" title="Assign staff" aria-label={`Assign staff for ${customer}`} onClick={event => { event.stopPropagation(); onAssign(); }} className={`${actionsClass} bg-slate-100 text-slate-600 hover:bg-slate-200`}><UserRoundPlus className="h-4 w-4" aria-hidden="true" /></button>}
        {canViewPhone && booking.customerPhone && <>
          <a href={`tel:${booking.customerPhone}`} onClick={event => event.stopPropagation()} aria-label={`Call ${customer} at ${booking.customerPhone}`} className={`${actionsClass} bg-slate-100 text-slate-600 hover:bg-slate-200`}><Phone className="h-4 w-4" aria-hidden="true" /></a>
          <a href={whatsappUrl(booking.customerPhone)} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()} aria-label={`Message ${customer} on WhatsApp`} className={`${actionsClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}><WhatsAppIcon className="h-4 w-4" /></a>
        </>}
        <button type="button" aria-label={`View booking for ${customer}`} onClick={event => { event.stopPropagation(); onOpen(); }} className={`${actionsClass} text-slate-400 hover:bg-admin-muted`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      {hasTime && <p className="booking-mobile-time booking-mobile-only text-[11px] text-admin-subtle"><CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{formatTimeWindow(booking.startTime, booking.endTime, '12h')}</p>}
    </article>
  );
}

export function BookingCardSkeleton({ showPricing }: { showPricing: boolean }) {
  return <div className={`booking-row animate-pulse ${showPricing ? 'booking-has-pricing' : ''}`} aria-hidden="true">
    <div className="booking-customer flex items-center gap-3"><div className="h-10 w-10 shrink-0 rounded-full bg-admin-muted" /><div className="w-full space-y-2"><div className="h-4 w-3/4 rounded bg-admin-muted" /><div className="h-3 w-1/2 rounded bg-admin-muted" /></div></div>
    <div className="booking-service h-4 w-3/4 rounded bg-admin-muted" /><div className="booking-date h-4 w-3/4 rounded bg-admin-muted" />
    {showPricing && <div className="booking-amount h-4 w-20 rounded bg-admin-muted" />}
    <div className="booking-attention h-7 w-3/4 rounded-full bg-admin-muted" /><div className="booking-actions h-9 w-28 rounded bg-admin-muted" />
  </div>;
}
