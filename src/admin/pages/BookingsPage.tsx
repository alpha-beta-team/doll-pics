import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Filter,
  IndianRupee,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import type { Booking, BookingStatus, BookingWritePayload, Enquiry, Package, TeamMember } from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { formatTimeWindow } from '../../shared/bookingTime';
import { AdminButton, AdminIconButton, AdminLoadingState, AdminPageHeader } from '../components/ui';
import { consumeNewBookingSearch } from './bookingsRoute';

export type ConvertEnquiryState = { convertFromEnquiry?: Enquiry };

const STATUSES: Array<{ value: BookingStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shoot_completed', label: 'Shoot completed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusClass: Record<BookingStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  shoot_completed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
};

function formatDay(value?: string) {
  if (!value) return 'Date not set';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function money(value: number | null) {
  if (value == null) return 'Not priced';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(value);
}

export function BookingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [creating, setCreating] = useState(false);
  const [convertFromEnquiry, setConvertFromEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [assignee, setAssignee] = useState('');
  const [payment, setPayment] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [bookingRows, packageRows, memberRows] = await Promise.all([
        api.getBookings(), api.getPackages(), api.getTeamMembers(),
      ]);
      setBookings(bookingRows);
      setPackages(packageRows);
      setTeamMembers(memberRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const next = consumeNewBookingSearch(location.search);
    if (!next.shouldOpen) return;
    setConvertFromEnquiry(null);
    setCreating(true);
    navigate(
      { pathname: location.pathname, search: next.search },
      { replace: true, state: location.state },
    );
  }, [location.pathname, location.search, location.state, navigate]);
  useEffect(() => {
    const state = location.state as ConvertEnquiryState | null;
    if (!state?.convertFromEnquiry) return;
    setConvertFromEnquiry(state.convertFromEnquiry);
    setCreating(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const visible = useMemo(() => {
    const now = Date.now();
    return bookings.filter(booking => {
      if (status && booking.status !== status) return false;
      if (assignee === 'unassigned' && booking.assignedTeamMemberId) return false;
      if (assignee && assignee !== 'unassigned' && booking.assignedTeamMemberId !== assignee) return false;
      if (payment && booking.paymentSummary.status !== payment) return false;
      if (overdueOnly && (!booking.nextFollowUpAt || new Date(booking.nextFollowUpAt).getTime() > now)) return false;
      return true;
    });
  }, [assignee, bookings, overdueOnly, payment, status]);

  const counts = useMemo(() => Object.fromEntries(
    STATUSES.map(item => [item.value, bookings.filter(row => row.status === item.value).length]),
  ) as Record<BookingStatus, number>, [bookings]);

  const saveNew = async (payload: BookingWritePayload) => {
    const created = convertFromEnquiry
      ? await api.convertEnquiry(convertFromEnquiry.id, {
          bookingDate: payload.bookingDate || '',
          startTime: payload.startTime,
          endTime: payload.endTime,
          shootType: payload.shootType,
          preferredEvent: payload.preferredEvent,
          location: payload.location,
          packageId: payload.packageId,
          agreedTotal: payload.agreedTotal,
          assignedTeamMemberId: payload.assignedTeamMemberId,
          advanceAmount: payload.advanceAmount,
          advancePaidAt: payload.advancePaidAt,
          advanceMethod: payload.advanceMethod,
          paymentDueDate: payload.paymentDueDate,
          notes: payload.notes,
          whatsappOptIn: payload.whatsappOptIn,
          whatsappNotificationsEnabled: payload.whatsappNotificationsEnabled,
          acknowledgeUntimedConflict: payload.acknowledgeUntimedConflict,
        })
      : await api.createBooking(payload);
    setBookings(current => [created, ...current]);
    setCreating(false);
    setConvertFromEnquiry(null);
    navigate(`/admin/bookings/${created.id}`);
  };

  if (loading) return <AdminLoadingState label="Loading bookings…" />;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <AdminPageHeader eyebrow="Studio Operations" title="Bookings" description="Manage dates, ownership, payments, follow-ups, and delivery." actions={<><AdminButton variant="secondary" onClick={() => setShowFilters(value => !value)} aria-expanded={showFilters}><Filter className="h-4 w-4" />Filters</AdminButton><AdminIconButton label="Refresh bookings" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></AdminIconButton><AdminButton onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Add booking</AdminButton></>} />

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5" />{error}<button className="ml-auto" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map(item => (
          <button key={item.value} onClick={() => setStatus(status === item.value ? '' : item.value)} className={`rounded-xl border p-4 text-left transition ${status === item.value ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}>
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{counts[item.value]}</p>
          </button>
        ))}
      </section>

      {showFilters && (
        <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-4">
          <select value={assignee} onChange={e => setAssignee(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All assignees</option><option value="unassigned">Unassigned</option>{teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          <select value={payment} onChange={e => setPayment(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All payment states</option>{['unpriced', 'unpaid', 'partial', 'paid', 'overpaid'].map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} /> Overdue follow-ups only</label>
          <button onClick={() => { setStatus(''); setAssignee(''); setPayment(''); setOverdueOnly(false); }} className="text-sm font-medium text-blue-600">Clear filters</button>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.35fr_1.1fr_0.9fr_1fr_32px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Customer</span><span>Booking</span><span>Payment</span><span>Next action</span><span />
        </div>
        <div className="divide-y divide-slate-100">
          {visible.map(booking => {
            const overdue = booking.nextFollowUpAt && new Date(booking.nextFollowUpAt).getTime() < Date.now();
            return (
              <button key={booking.id} onClick={() => navigate(`/admin/bookings/${booking.id}`)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[1.35fr_1.1fr_0.9fr_1fr_32px] md:items-center md:gap-4">
                <div className="min-w-0"><p className="truncate font-medium text-slate-900">{booking.customerName}</p><p className="mt-1 truncate text-xs text-slate-500">{booking.customerPhone} · {booking.shootType || 'Service not set'}</p></div>
                <div><p className="inline-flex items-center gap-1.5 text-sm text-slate-700"><CalendarDays className="h-4 w-4 text-slate-400" />{formatDay(booking.bookingDate)}</p>{booking.startTime && booking.endTime && <p className="mt-1 text-xs text-slate-500">{formatTimeWindow(booking.startTime, booking.endTime)}</p>}<span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass[booking.status]}`}>{booking.status.replace('_', ' ')}</span></div>
                <div><p className="inline-flex items-center gap-1 text-sm font-medium text-slate-700"><IndianRupee className="h-3.5 w-3.5" />{money(booking.paymentSummary.balanceDue)}</p><p className="mt-1 text-xs capitalize text-slate-500">{booking.paymentSummary.status}</p></div>
                <div><p className={`text-sm ${overdue ? 'font-medium text-red-600' : 'text-slate-600'}`}>{booking.nextFollowUpAt ? new Date(booking.nextFollowUpAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'No follow-up'}</p>{booking.followUpNote && <p className="mt-1 truncate text-xs text-slate-400">{booking.followUpNote}</p>}</div>
                <ChevronRight className="hidden h-5 w-5 text-slate-300 md:block" />
              </button>
            );
          })}
          {!visible.length && <div className="p-12 text-center text-sm text-slate-500">No bookings match these filters.</div>}
        </div>
      </section>

      {creating && (
        <BookingFormModal
          enquiry={convertFromEnquiry}
          packages={packages}
          teamMembers={teamMembers}
          onClose={() => { setCreating(false); setConvertFromEnquiry(null); }}
          onSave={saveNew}
        />
      )}
    </div>
  );
}
