import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Inbox, SearchX, X } from 'lucide-react';
import { api } from '../api/client';
import type {
  Booking,
  BookingStatus,
  BookingWritePayload,
  Enquiry,
  Package,
  PaymentState,
  ServiceNavLink,
  StaffAccountOption,
} from '../types';
import { BookingFormModal } from '../components/BookingFormModal';
import { AdminButton, AdminEmptyState } from '../components/ui';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { consumeNewBookingSearch } from './bookingsRoute';
import { BookingCard, BookingCardSkeleton } from '../components/bookings/BookingCard';
import { BookingListHeader } from '../components/bookings/BookingListHeader';
import { BookingSortControl } from '../components/bookings/BookingStatusFilter';
import { BookingToolbar } from '../components/bookings/BookingToolbar';
import { SalesWorkspaceHeader } from '../components/sales/SalesWorkspaceHeader';
import {
  buildServiceCategoryOptions,
  normalizeServiceCategory,
  serviceCategoryMatches,
  serviceCategoryTabId,
} from '../components/sales/serviceCategories';
import {
  BOOKING_STATUSES,
  bookingMatchesSearch,
  sortBookings,
  type BookingSort,
} from '../components/bookings/bookingList';

export type ConvertEnquiryState = { convertFromEnquiry?: Enquiry };

type BookingViewState = {
  status: BookingStatus | '';
  assignee: string;
  payment: PaymentState | '';
  overdueOnly: boolean;
  query: string;
  sort: BookingSort;
  serviceCategory: string;
};

const SCROLL_POSITION_KEY = 'doll-bookings-scroll-position';
const RESTORE_SCROLL_KEY = 'doll-bookings-restore-scroll';
const VIEW_STATE_KEY = 'doll-bookings-view-state';

const defaultViewState: BookingViewState = {
  status: '',
  assignee: '',
  payment: '',
  overdueOnly: false,
  query: '',
  sort: 'recent',
  serviceCategory: '',
};

function restoredViewState(): BookingViewState {
  try {
    if (sessionStorage.getItem(RESTORE_SCROLL_KEY) !== 'true') return defaultViewState;
    const stored = JSON.parse(sessionStorage.getItem(VIEW_STATE_KEY) || '{}') as Partial<BookingViewState>;
    return { ...defaultViewState, ...stored };
  } catch {
    return defaultViewState;
  }
}

export function BookingsPage() {
  const { canManage, isReadOnly } = useFeatureAccess('bookings');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const restored = useMemo(restoredViewState, []);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookingServices, setBookingServices] = useState<ServiceNavLink[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccountOption[]>([]);
  const [staffLoadFailed, setStaffLoadFailed] = useState(false);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const formDataPromise = useRef<Promise<boolean> | null>(null);
  const [creating, setCreating] = useState(false);
  const [convertFromEnquiry, setConvertFromEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<BookingStatus | ''>(restored.status);
  const [assignee, setAssignee] = useState(restored.assignee);
  const [payment, setPayment] = useState<PaymentState | ''>(restored.payment);
  const [overdueOnly, setOverdueOnly] = useState(restored.overdueOnly);
  const [query, setQuery] = useState(restored.query);
  const [sort, setSort] = useState<BookingSort>(restored.sort);
  const [requestedServiceCategory, setRequestedServiceCategory] = useState(
    () => {
      const value = params.get('service') || restored.serviceCategory;
      return value ? normalizeServiceCategory(value) : '';
    },
  );

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setBookings(await api.getBookingListRows());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    setStaffLoadFailed(false);
    void api.getAssignableStaffAccounts()
      .then(rows => { if (active) setStaffAccounts(rows); })
      .catch(() => { if (active) setStaffLoadFailed(true); });
    return () => { active = false; };
  }, [canManage]);

  const ensureBookingFormData = useCallback(async () => {
    if (!canManage) return false;
    if (formDataLoaded) return true;
    if (formDataPromise.current) return formDataPromise.current;
    formDataPromise.current = (async () => {
      try {
        const [packageRows, siteContent] = await Promise.all([
          api.getPackages(),
          api.getSiteContent().catch(() => null),
        ]);
        setPackages(packageRows);
        setBookingServices(siteContent?.serviceNavLinks ?? []);
        setFormDataLoaded(true);
        return true;
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load booking form data');
        return false;
      } finally {
        formDataPromise.current = null;
      }
    })();
    return formDataPromise.current;
  }, [canManage, formDataLoaded]);

  const openCreateBooking = useCallback(async (enquiry?: Enquiry) => {
    if (!await ensureBookingFormData()) return;
    setConvertFromEnquiry(enquiry ?? null);
    setCreating(true);
  }, [ensureBookingFormData]);

  useEffect(() => {
    if (loading) return;
    let position = 0;
    try {
      if (sessionStorage.getItem(RESTORE_SCROLL_KEY) !== 'true') return;
      position = Number(sessionStorage.getItem(SCROLL_POSITION_KEY)) || 0;
      sessionStorage.removeItem(RESTORE_SCROLL_KEY);
      sessionStorage.removeItem(SCROLL_POSITION_KEY);
      sessionStorage.removeItem(VIEW_STATE_KEY);
    } catch {
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo({ top: position, behavior: 'auto' }));
    });
  }, [loading]);

  useEffect(() => {
    if (!canManage) return;
    const next = consumeNewBookingSearch(location.search);
    if (!next.shouldOpen) return;
    void openCreateBooking();
    navigate(
      { pathname: location.pathname, search: next.search },
      { replace: true, state: location.state },
    );
  }, [canManage, location.pathname, location.search, location.state, navigate, openCreateBooking]);

  useEffect(() => {
    if (!canManage) return;
    const state = location.state as ConvertEnquiryState | null;
    if (!state?.convertFromEnquiry) return;
    void openCreateBooking(state.convertFromEnquiry);
    navigate(location.pathname, { replace: true, state: {} });
  }, [canManage, location.pathname, location.state, navigate, openCreateBooking]);

  const serviceCategory = requestedServiceCategory
    && bookings.some(booking => serviceCategoryMatches(booking, requestedServiceCategory))
    ? requestedServiceCategory
    : '';
  const bookingsForSelectedService = useMemo(
    () => bookings.filter(booking => serviceCategoryMatches(booking, serviceCategory)),
    [bookings, serviceCategory],
  );

  const matching = useMemo(() => {
    const now = Date.now();
    return bookings.filter(booking => {
      if (status && booking.status !== status) return false;
      if (assignee === 'unassigned' && booking.assignedStaffAccountId) return false;
      if (assignee && assignee !== 'unassigned' && booking.assignedStaffAccountId !== assignee) return false;
      if (payment && booking.paymentSummary.status !== payment) return false;
      if (overdueOnly && (!booking.nextFollowUpAt || new Date(booking.nextFollowUpAt).getTime() > now)) return false;
      return bookingMatchesSearch(booking, query);
    });
  }, [assignee, bookings, overdueOnly, payment, query, status]);

  const serviceCategories = useMemo(
    () => buildServiceCategoryOptions(bookings, matching),
    [bookings, matching],
  );
  const visible = useMemo(
    () => sortBookings(matching.filter(booking => serviceCategoryMatches(booking, serviceCategory)), sort),
    [matching, serviceCategory, sort],
  );

  const counts = useMemo(() => Object.fromEntries(
    BOOKING_STATUSES.map(item => [item.value, bookingsForSelectedService.filter(row => row.status === item.value).length]),
  ) as Record<BookingStatus, number>, [bookingsForSelectedService]);

  const selectedStatusLabel = BOOKING_STATUSES.find(item => item.value === status)?.label;
  const activeFilterCount = Number(Boolean(status)) + Number(Boolean(assignee)) + Number(Boolean(payment)) + Number(overdueOnly);
  const hasAnyFilter = Boolean(status || assignee || payment || overdueOnly || query || serviceCategory);

  const selectServiceCategory = (value: string) => {
    setRequestedServiceCategory(value);
    const next = new URLSearchParams(params);
    if (value) next.set('service', value);
    else next.delete('service');
    setParams(next, { replace: true });
  };

  const clearAdvancedFilters = () => {
    setStatus('');
    setAssignee('');
    setPayment('');
    setOverdueOnly(false);
  };

  const clearAllFilters = () => {
    setQuery('');
    selectServiceCategory('');
    clearAdvancedFilters();
  };

  const openBooking = (bookingId: string) => {
    try {
      sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
      sessionStorage.setItem(RESTORE_SCROLL_KEY, 'true');
      sessionStorage.setItem(VIEW_STATE_KEY, JSON.stringify({
        status,
        assignee,
        payment,
        overdueOnly,
        query,
        sort,
        serviceCategory,
      } satisfies BookingViewState));
    } catch {
      // Navigation still works when storage is unavailable.
    }
    navigate(`/admin/bookings/${bookingId}`);
  };

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
          assignedStaffAccountId: payload.assignedStaffAccountId,
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

  return (
    <div className="mx-auto max-w-[1320px] space-y-3 pb-2 sm:space-y-4">
      <SalesWorkspaceHeader
        title="Bookings"
        serviceCategories={serviceCategories}
        serviceCategory={serviceCategory}
        onServiceCategoryChange={selectServiceCategory}
        panelId="booking-list-panel"
        readOnlyNotice={isReadOnly ? <ReadOnlyNotice /> : undefined}
        listControls={<BookingSortControl value={sort} onChange={setSort} />}
        actions={(
          <BookingToolbar
            query={query}
            onQueryChange={setQuery}
            filtersOpen={showFilters}
            onFiltersOpenChange={setShowFilters}
            activeFilterCount={activeFilterCount}
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            canManage={canManage}
            onAdd={() => void openCreateBooking()}
          />
        )}
      />

      {error && bookings.length > 0 && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={() => void load(true)} className="min-h-10 rounded-lg px-2 font-semibold hover:bg-red-100">Retry</button>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-red-100"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      )}

      {showFilters && (
        <section id="booking-advanced-filters" aria-label="Booking filters" className="grid gap-3 rounded-xl border border-admin-border bg-admin-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] xl:items-center">
          <label className="block">
            <span className="sr-only">Booking status</span>
            <select value={status} onChange={event => setStatus(event.target.value as BookingStatus | '')} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
              <option value="">All statuses ({bookingsForSelectedService.length})</option>
              {BOOKING_STATUSES.map(item => <option key={item.value} value={item.value}>{item.label} ({counts[item.value]})</option>)}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Assigned staff member</span>
            <select value={assignee} onChange={event => setAssignee(event.target.value)} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {staffLoadFailed && <option value="" disabled>Staff options unavailable</option>}
              {staffAccounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
          {canViewPayments ? (
            <label className="block">
              <span className="sr-only">Payment status</span>
              <select value={payment} onChange={event => setPayment(event.target.value as PaymentState | '')} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
                <option value="">All payment states</option>
                {(['unpriced', 'unpaid', 'partial', 'paid', 'overpaid'] as const).map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
              </select>
            </label>
          ) : <div className="hidden lg:block" />}
          <label className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-admin-secondary">
            <input type="checkbox" checked={overdueOnly} onChange={event => setOverdueOnly(event.target.checked)} className="h-4 w-4 rounded border-admin-control text-admin-primary focus:ring-admin-focus" />
            Overdue follow-ups
          </label>
          <button type="button" disabled={!activeFilterCount} onClick={clearAdvancedFilters} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:text-admin-subtle disabled:opacity-60">Clear filters</button>
        </section>
      )}

      <BookingListHeader
        title={serviceCategory
          ? selectedStatusLabel
            ? `${serviceCategories.find(option => option.value === serviceCategory)?.label} · ${selectedStatusLabel}`
            : `${serviceCategories.find(option => option.value === serviceCategory)?.label} bookings`
          : selectedStatusLabel || 'All bookings'}
        count={visible.length}
      />

      <section id="booking-list-panel" role="tabpanel" aria-labelledby={serviceCategoryTabId(serviceCategory)} className="space-y-2.5 lg:space-y-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-admin-border lg:bg-admin-surface lg:shadow-[0_4px_18px_rgba(62,56,46,0.04)]">
        <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(9.5rem,0.9fr)_minmax(8rem,0.72fr)_minmax(10.5rem,1fr)_1.25rem] gap-x-5 border-b border-admin-border bg-admin-muted/60 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-admin-subtle lg:grid">
          <span>Customer</span><span>Shoot</span><span>Amount</span><span>Attention</span><span />
        </div>

        {loading ? (
          <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:block lg:space-y-0" aria-label="Loading bookings" role="status">
            {Array.from({ length: 4 }, (_, index) => <BookingCardSkeleton key={index} />)}
            <span className="sr-only">Loading bookings…</span>
          </div>
        ) : error && bookings.length === 0 ? (
          <AdminEmptyState
            icon={AlertCircle}
            title="Bookings could not be loaded"
            description={error}
            action={<AdminButton onClick={() => void load()}>Try again</AdminButton>}
          />
        ) : visible.length > 0 ? (
          <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:block lg:space-y-0">
            {visible.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                canViewPayments={canViewPayments}
                onOpen={() => openBooking(booking.id)}
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <AdminEmptyState
            icon={Inbox}
            title="No bookings yet"
            description="New shoots will appear here as soon as they are booked."
            action={canManage ? <AdminButton onClick={() => void openCreateBooking()}>Add booking</AdminButton> : undefined}
          />
        ) : (
          <AdminEmptyState
            icon={SearchX}
            title="No matching bookings"
            description="Try a different search or clear the active filters."
            action={hasAnyFilter ? <AdminButton variant="secondary" onClick={clearAllFilters}>Clear all filters</AdminButton> : undefined}
          />
        )}
      </section>

      {canManage && creating && (
        <BookingFormModal
          enquiry={convertFromEnquiry}
          packages={packages}
          services={bookingServices}
          staffAccounts={staffAccounts}
          onClose={() => { setCreating(false); setConvertFromEnquiry(null); }}
          onSave={saveNew}
        />
      )}
    </div>
  );
}
