import type { Booking, BookingStatus } from '../../types';
import { leadSourceLabel } from '../leadSource';

export type BookingSort = 'shoot_date' | 'recent' | 'customer' | 'follow_up';

export const BOOKING_STATUSES: ReadonlyArray<{ value: BookingStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shoot_completed', label: 'Shoot completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const BOOKING_SORT_OPTIONS: ReadonlyArray<{ value: BookingSort; label: string }> = [
  { value: 'shoot_date', label: 'Shoot date' },
  { value: 'recent', label: 'Recently created' },
  { value: 'customer', label: 'Customer name' },
  { value: 'follow_up', label: 'Follow-up date' },
];

export const bookingStatusClass: Record<BookingStatus, string> = {
  draft: 'bg-stone-100 text-stone-700 ring-stone-200',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  shoot_completed: 'bg-blue-50 text-blue-800 ring-blue-200',
  delivered: 'bg-emerald-100 text-emerald-950 ring-emerald-300',
  cancelled: 'bg-red-50 text-red-800 ring-red-200',
};

export const bookingStatusDotClass: Record<BookingStatus, string> = {
  draft: 'bg-stone-400',
  confirmed: 'bg-emerald-500',
  shoot_completed: 'bg-blue-500',
  delivered: 'bg-emerald-700',
  cancelled: 'bg-red-500',
};

export function bookingStatusLabel(status: BookingStatus) {
  return BOOKING_STATUSES.find(item => item.value === status)?.label
    ?? status.replace(/_/g, ' ');
}

export function formatBookingDay(value?: string) {
  if (!value) return 'Shoot date not set';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export function formatBookingMoney(value: number | null | undefined) {
  if (value == null) return 'Price not set';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function bookingPriceLabel(booking: Booking, canViewPayments: boolean) {
  const total = booking.agreedTotal ?? booking.packageListedPrice;
  if (!canViewPayments) return formatBookingMoney(total);

  const balance = booking.paymentSummary.balanceDue;
  if (balance != null && balance > 0) return `${formatBookingMoney(balance)} due`;
  if (total == null) return 'Price not set';
  if (balance != null && balance <= 0) return `${formatBookingMoney(total)} paid`;
  return formatBookingMoney(total);
}

function sortableDate(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function sortableRecentDate(value?: string) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export function sortBookings(bookings: Booking[], sort: BookingSort) {
  return [...bookings].sort((a, b) => {
    if (sort === 'customer') {
      return a.customerName.localeCompare(b.customerName, 'en-IN', { sensitivity: 'base' });
    }
    if (sort === 'recent') {
      return sortableRecentDate(b.createdAt) - sortableRecentDate(a.createdAt);
    }
    if (sort === 'follow_up') {
      return sortableDate(a.nextFollowUpAt) - sortableDate(b.nextFollowUpAt);
    }
    return sortableDate(a.bookingDate) - sortableDate(b.bookingDate);
  });
}

export function bookingMatchesSearch(booking: Booking, query: string) {
  const normalized = query.trim().toLocaleLowerCase('en-IN');
  if (!normalized) return true;
  const matchesText = [
    booking.customerName,
    booking.customerPhone,
    booking.shootType,
    booking.preferredEvent,
    booking.packageName,
    leadSourceLabel(booking.source),
    booking.source,
  ].some(value => value.toLocaleLowerCase('en-IN').includes(normalized));
  if (matchesText) return true;

  const phoneQuery = normalized.replace(/\D/g, '');
  return phoneQuery.length >= 3
    && booking.customerPhone.replace(/\D/g, '').includes(phoneQuery);
}
