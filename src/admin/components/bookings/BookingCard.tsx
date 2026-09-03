import type { KeyboardEvent, MouseEvent } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Clock3,
  IndianRupee,
  UserRound,
} from 'lucide-react';
import type { Booking } from '../../types';
import { formatTimeWindow } from '../../../shared/bookingTime';
import {
  bookingPriceLabel,
  bookingStatusClass,
  bookingStatusLabel,
  formatBookingDay,
} from './bookingList';

type BookingCardProps = {
  booking: Booking;
  canViewPayments: boolean;
  showPricing: boolean;
  canViewPhone: boolean;
  onOpen: () => void;
};

function formatFollowUp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function stopCardNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

export function BookingCard({ booking, canViewPayments, showPricing, canViewPhone, onOpen }: BookingCardProps) {
  const followUpOverdue = Boolean(
    booking.nextFollowUpAt && new Date(booking.nextFollowUpAt).getTime() < Date.now(),
  );
  const hasOutstandingBalance = canViewPayments
    && booking.paymentSummary.balanceDue != null
    && booking.paymentSummary.balanceDue > 0;
  const hasPaymentDueDate = hasOutstandingBalance && Boolean(booking.paymentDueDate);
  const service = booking.packageName || booking.shootType || 'Service not set';
  const hasTime = Boolean(booking.startTime && booking.endTime);

  const openFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Open booking for ${booking.customerName || 'unnamed customer'}`}
      onClick={onOpen}
      onKeyDown={openFromKeyboard}
      className={`group grid min-h-[116px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3.5 text-left shadow-[0_3px_12px_rgba(62,56,46,0.035)] outline-none transition-[border-color,background-color,box-shadow,transform] hover:border-admin-primary/35 hover:bg-white hover:shadow-[0_5px_16px_rgba(62,56,46,0.07)] focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-canvas active:scale-[0.995] lg:min-h-0 lg:items-center lg:gap-x-5 lg:gap-y-0 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-3 lg:shadow-none lg:last:border-b-0 lg:hover:bg-admin-muted/55 lg:hover:shadow-none lg:active:scale-100 ${showPricing ? 'lg:grid-cols-[minmax(0,1.45fr)_minmax(9.5rem,0.9fr)_minmax(8rem,0.72fr)_minmax(10.5rem,1fr)_1.25rem]' : 'lg:grid-cols-[minmax(0,1.45fr)_minmax(9.5rem,0.9fr)_minmax(10.5rem,1fr)_1.25rem]'}`}
    >
      <div className="col-span-2 min-w-0 lg:col-span-1">
        <div className="flex min-w-0 items-start justify-between gap-2 lg:items-center">
          <h3 className="min-w-0 truncate text-[15px] font-semibold leading-5 text-admin-text">
            {booking.customerName || 'Unnamed customer'}
          </h3>
          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${bookingStatusClass[booking.status]}`}>
            {bookingStatusLabel(booking.status)}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs leading-4 text-admin-subtle">
          <span className="min-w-0 flex-1 truncate" title={service}>{service}</span>
          {booking.customerPhone && (
            <>
              <span aria-hidden="true" className="text-admin-border-strong">·</span>
              {canViewPhone ? (
                <a
                  href={`tel:${booking.customerPhone}`}
                  onClick={stopCardNavigation}
                  className="max-w-[48%] shrink-0 truncate rounded-sm font-medium text-admin-secondary outline-none hover:text-admin-primary hover:underline focus-visible:ring-2 focus-visible:ring-admin-focus"
                  aria-label={`Call ${booking.customerName || 'customer'} at ${booking.customerPhone}`}
                >
                  {booking.customerPhone}
                </a>
              ) : <span className="max-w-[48%] shrink-0 truncate font-medium text-admin-secondary">{booking.customerPhone}</span>}
            </>
          )}
        </div>
      </div>

      <div className={`flex min-w-0 items-center gap-1.5 text-sm ${booking.bookingDate ? 'text-admin-secondary' : 'font-medium text-amber-800'}`}>
        <CalendarDays className="h-4 w-4 shrink-0 text-admin-gold" aria-hidden="true" />
        <span className="truncate">
          {formatBookingDay(booking.bookingDate)}
          {hasTime && <span className="text-admin-subtle"> · {formatTimeWindow(booking.startTime, booking.endTime)}</span>}
        </span>
      </div>

      {showPricing && <div className={`flex items-center justify-end gap-1 text-right text-sm font-semibold tabular-nums ${booking.agreedTotal == null && booking.packageListedPrice == null ? 'text-amber-800' : 'text-admin-text'} md:justify-start md:text-left`}>
        <IndianRupee className="hidden h-4 w-4 shrink-0 text-admin-gold lg:block" aria-hidden="true" />
        <span className="whitespace-nowrap">{bookingPriceLabel(booking, canViewPayments)}</span>
      </div>}

      {booking.nextFollowUpAt ? (
        <div className={`col-span-2 flex min-w-0 items-center gap-1.5 border-t border-admin-border/70 pt-2 text-xs lg:col-span-1 lg:border-0 lg:pt-0 ${followUpOverdue ? 'font-semibold text-red-700' : 'text-admin-secondary'}`}>
          <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {followUpOverdue ? 'Overdue' : 'Follow-up'} · {formatFollowUp(booking.nextFollowUpAt)}
            {booking.followUpNote ? ` · ${booking.followUpNote}` : ''}
          </span>
        </div>
      ) : hasPaymentDueDate ? (
        <div className="col-span-2 flex min-w-0 items-center gap-1.5 border-t border-admin-border/70 pt-2 text-xs font-medium text-amber-800 lg:col-span-1 lg:border-0 lg:pt-0">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Payment due · {formatBookingDay(booking.paymentDueDate)}</span>
        </div>
      ) : booking.assignedStaffAccountName ? (
        <div className="col-span-2 flex min-w-0 items-center gap-1.5 border-t border-admin-border/70 pt-2 text-xs text-admin-subtle lg:col-span-1 lg:border-0 lg:pt-0">
          <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Assigned to {booking.assignedStaffAccountName}</span>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}

      <ChevronRight className="hidden h-4 w-4 text-admin-border-strong transition-transform group-hover:translate-x-0.5 group-hover:text-admin-primary lg:block" aria-hidden="true" />
    </article>
  );
}

export function BookingCardSkeleton({ showPricing }: { showPricing: boolean }) {
  return (
    <div className={`grid min-h-[126px] animate-pulse grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3.5 lg:min-h-0 lg:items-center lg:gap-x-5 lg:rounded-none lg:border-0 lg:border-b lg:px-5 lg:py-4 ${showPricing ? 'lg:grid-cols-[minmax(0,1.45fr)_minmax(9.5rem,0.9fr)_minmax(8rem,0.72fr)_minmax(10.5rem,1fr)_1.25rem]' : 'lg:grid-cols-[minmax(0,1.45fr)_minmax(9.5rem,0.9fr)_minmax(10.5rem,1fr)_1.25rem]'}`}>
      <div className="col-span-2 lg:col-span-1"><div className="h-4 w-3/5 rounded bg-admin-muted" /><div className="mt-2 h-3 w-4/5 rounded bg-admin-muted" /></div>
      <div className="h-4 w-28 rounded bg-admin-muted" />
      {showPricing && <div className="h-4 w-20 rounded bg-admin-muted" />}
      <div className="col-span-2 h-4 w-40 rounded bg-admin-muted lg:col-span-1" />
      <div className="hidden lg:block" />
    </div>
  );
}
