import { AdminAlert } from '../components/ui/AdminUi';
import { formatCustomerName } from '../../shared/formatCustomerName';
import './enquiries.css';
import './bookings.css';
import '@fontsource/dm-mono/latin-500.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Clock3, Plus, RefreshCw, Inbox, Search, SearchX, X } from 'lucide-react';
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
import { useAuth } from '../contexts/AuthContext';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import { canViewBookingPricing, hasStaffPermission } from '../access/roles';
import { consumeNewBookingSearch } from './bookingsRoute';
import { BookingCard, BookingCardSkeleton } from '../components/bookings/BookingCard';
import { BookingAssignmentDialog } from '../components/bookings/BookingAssignmentDialog';
import { BookingDesktopTable } from '../components/bookings/BookingDesktopTable';
import { BookingListControls } from '../components/bookings/BookingListControls';
import { SalesMobileHeader } from '../components/sales/SalesMobileHeader';
import { SalesListPagination } from '../components/sales/SalesListPagination';
import {
  buildServiceCategoryOptions,
  normalizeServiceCategory,
  serviceCategoryMatches,
} from '../components/sales/serviceCategories';
import {
  BOOKING_STATUSES,
  BOOKING_SORT_OPTIONS,
  bookingMatchesScope,
  bookingMatchesSearch,
  sortBookings,
  type BookingListScope,
  type BookingSort,
} from '../components/bookings/bookingList';

export type ConvertEnquiryState = { convertFromEnquiry?: Enquiry };

const PAGE_SIZE = 7;

type BookingViewState = {
  page: number;
  scope: BookingListScope;
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
  page: 1,
  scope: 'pending',
  status: '',
  assignee: '',
  payment: '',
  overdueOnly: false,
  query: '',
  sort: 'shoot_date',
  serviceCategory: '',
};

function restoredViewState(): BookingViewState {
  const defaults: BookingViewState = { ...defaultViewState, scope: window.matchMedia('(min-width: 640px)').matches ? 'all' : 'pending' };
  try {
    if (sessionStorage.getItem(RESTORE_SCROLL_KEY) !== 'true') return defaults;
    const stored = JSON.parse(sessionStorage.getItem(VIEW_STATE_KEY) || '{}') as Partial<BookingViewState>;
    const restored = { ...defaults, ...stored };
    if (restored.overdueOnly || restored.status === 'shoot_completed' || restored.status === 'delivered' || restored.status === 'cancelled') {
      restored.scope = 'all';
    }
    restored.page = Number.isInteger(restored.page) && restored.page > 0 ? restored.page : 1;
    return restored;
  } catch {
    return defaults;
  }
}

export function BookingsPage() {
  const { canManage, isReadOnly } = useFeatureAccess('bookings');
  const { canView: canViewPayments } = useFeatureAccess('payments');
  const { user } = useAuth();
  const showBookingPricing = canViewBookingPricing(user?.role);
  const canViewPhone = hasStaffPermission(user, 'mask_phone_number');
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
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [convertFromEnquiry, setConvertFromEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(restored.page);
  const previousPageFilters = useRef<string>();
  const [scope, setScope] = useState<BookingListScope>(restored.scope);
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

  const latestLoad = useRef(0);
  const load = useCallback(async (refresh = false) => {
    const requestId = ++latestLoad.current;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const rows = await api.getBookingListRows();
      if (latestLoad.current === requestId) setBookings(rows);
    } catch (err) {
      if (latestLoad.current === requestId) setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      if (latestLoad.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
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
      setError('');
      try {
        const [packageRows, services] = await Promise.all([
          api.getPackages(),
          api.getPhotographyServices(),
        ]);
        setPackages(packageRows);
        setBookingServices(services);
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
  const assigneeOptions = useMemo(() => {
    const options = new Map(staffAccounts.map(account => [account.id, account.name]));
    for (const booking of bookings) {
      const { assignedStaffAccountId: id, assignedStaffAccountName: name } = booking;
      if (id && name && !options.has(id)) options.set(id, name);
    }
    return Array.from(options, ([id, name]) => ({ id, name }));
  }, [staffAccounts, bookings]);
  const paymentFilter = canViewPayments ? payment : '';

  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const overdueIds = useMemo(() => new Set(bookings.filter(b => b.nextFollowUpAt && Date.parse(b.nextFollowUpAt) <= now).map(b => b.id)), [bookings, now]);
  const matching = useMemo(() => {
    return bookings.filter(booking => {
      if (!bookingMatchesScope(booking, scope)) return false;
      if (status && booking.status !== status) return false;
      if (assignee === 'unassigned' && booking.assignedStaffAccountId) return false;
      if (assignee && assignee !== 'unassigned' && booking.assignedStaffAccountId !== assignee) return false;
      if (paymentFilter && booking.paymentSummary.status !== paymentFilter) return false;
      if (overdueOnly && !overdueIds.has(booking.id)) return false;
      return bookingMatchesSearch(booking, query);
    });
  }, [assignee, bookings, overdueIds, overdueOnly, paymentFilter, query, scope, status]);

  const serviceCategories = useMemo(
    () => buildServiceCategoryOptions(bookings, matching),
    [bookings, matching],
  );
  const visibleServiceCategories = serviceCategories.filter(category => category.count > 0);
  const visible = useMemo(
    () => sortBookings(matching.filter(booking => serviceCategoryMatches(booking, serviceCategory)), sort),
    [matching, serviceCategory, sort],
  );

  const pageFilterKey = JSON.stringify([scope, status, assignee, paymentFilter, overdueOnly, query, sort, requestedServiceCategory]);
  useEffect(() => {
    if (previousPageFilters.current !== undefined && previousPageFilters.current !== pageFilterKey) setPage(1);
    previousPageFilters.current = pageFilterKey;
  }, [pageFilterKey]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = useMemo(() => Object.fromEntries(
    BOOKING_STATUSES.map(item => [item.value, bookingsForSelectedService.filter(row => row.status === item.value).length]),
  ) as Record<BookingStatus, number>, [bookingsForSelectedService]);

  const pendingBookingCount = useMemo(
    () => bookings.filter(booking => bookingMatchesScope(booking, 'pending')).length,
    [bookings],
  );

  const mobileCounts = useMemo(() => ({
    confirmed: bookings.filter(booking => booking.status === 'confirmed').length,
  }), [bookings]);
  const selectView = (view: string) => {
    setScope(view === 'pending' || view === 'confirmed' ? 'pending' : 'all');
    setStatus(view === 'confirmed' ? 'confirmed' : '');
    setOverdueOnly(view === 'overdue');
  };
  const activeFilterCount = Number(Boolean(status)) + Number(Boolean(assignee)) + Number(Boolean(paymentFilter)) + Number(overdueOnly);
  const hasAnyFilter = Boolean(status || assignee || paymentFilter || overdueOnly || query || serviceCategory);

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
        page: currentPage,
        status,
        scope,
        assignee,
        payment: paymentFilter,
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
    const created = await api.createBooking(payload);
    setBookings(current => [created, ...current]);
    setCreating(false);
    setConvertFromEnquiry(null);
    navigate(`/admin/bookings/${created.id}`);
  };

  return (
    <div className="enquiries-workspace bookings-workspace">
      <SalesMobileHeader
        title="Bookings" itemName="booking" itemPlural="bookings" total={bookings.length} totalLabel="total bookings"
        summary={`${pendingBookingCount} pending`} addLabel="Add booking"
        views={[
          { value: 'pending', label: 'Pending shoots', count: pendingBookingCount },
          { value: 'all', label: 'All', count: bookings.length },
          { value: 'confirmed', label: 'Confirmed', count: mobileCounts.confirmed },
          { value: 'overdue', label: 'Follow-up overdue', count: overdueIds.size },
        ]}
        view={overdueOnly && !status ? 'overdue' : !overdueOnly && status === 'confirmed' ? 'confirmed' : !overdueOnly && !status ? scope : ''}
        onViewChange={selectView}
        query={query} onQueryChange={setQuery} filtersOpen={showFilters} activeFilterCount={activeFilterCount}
        onToggleFilters={() => setShowFilters(open => !open)} refreshing={refreshing} onRefresh={() => void load(true)}
        canManage={canManage} onAdd={() => void openCreateBooking()} services={visibleServiceCategories}
        service={serviceCategory} onServiceChange={selectServiceCategory} sort={sort} onSortChange={setSort}
        sortOptions={BOOKING_SORT_OPTIONS.map(option => ({ ...option, shortLabel: ({ shoot_date: 'Shoot ↑', shoot_date_desc: 'Shoot ↓', recent: 'Newest', customer: 'Name A–Z', follow_up: 'Follow-up' })[option.value] }))}
      />
      {isReadOnly && <div className="px-4 pt-3 sm:hidden"><ReadOnlyNotice /></div>}
      <div className="enquiry-list-content space-y-5">
      <header className="bl-header hidden sm:block">
        <div className="bl-heading"><div><h1>Bookings</h1><p>{loading ? 'Loading bookings…' : `${bookings.length} bookings · ${pendingBookingCount} pending shoots`}</p></div>

        <div className="bl-actions"><label className="bl-search"><Search size={16}/><input type="search" aria-label="Search bookings" placeholder="Name, phone, package" value={query} onChange={e => setQuery(e.target.value)}/></label><button aria-label="Refresh bookings" disabled={refreshing || loading} onClick={() => void load(true)}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/></button>{canManage && <button className="bl-primary" onClick={() => void openCreateBooking()}><Plus size={16}/>Add booking</button>}</div></div>
        {isReadOnly && <ReadOnlyNotice/>}
      </header>
      {error && bookings.length > 0 && (
        <AdminAlert contentClassName="flex items-center gap-2">

          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={() => void load(true)} className="min-h-10 rounded-lg px-2 font-semibold hover:bg-red-100">Retry</button>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-red-100"><X className="h-4 w-4" aria-hidden="true" /></button>
        </AdminAlert>
      )}

      {showFilters && (
        <section id="booking-advanced-filters" aria-label="Booking filters" className="grid sm:hidden gap-3 rounded-xl border border-admin-border bg-admin-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] xl:items-center">
          <label className="block">
            <span className="sr-only">Booking status</span>
            <select
              aria-label="Booking status"
              value={status}
              onChange={event => {
                const nextStatus = event.target.value as BookingStatus | '';
                setStatus(nextStatus);
                if (nextStatus === 'shoot_completed' || nextStatus === 'delivered' || nextStatus === 'cancelled') setScope('all');
              }}
              className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
            >
              <option value="">All statuses ({bookingsForSelectedService.length})</option>
              {BOOKING_STATUSES.map(item => <option key={item.value} value={item.value}>{item.label} ({counts[item.value]})</option>)}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Assigned staff member</span>
            <select aria-label="Assigned staff member" value={assignee} onChange={event => setAssignee(event.target.value)} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {staffLoadFailed && <option value="" disabled>Staff options unavailable</option>}
              {assigneeOptions.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
          {canViewPayments ? (
            <label className="block">
              <span className="sr-only">Payment status</span>
              <select aria-label="Payment status" value={payment} onChange={event => setPayment(event.target.value as PaymentState | '')} className="h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-secondary outline-none focus-visible:ring-2 focus-visible:ring-admin-focus">
                <option value="">All payment states</option>
                {(['unpriced', 'unpaid', 'partial', 'paid', 'overpaid'] as const).map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
              </select>
            </label>
          ) : <div className="hidden lg:block" />}
          <label className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-admin-secondary">
            <input type="checkbox" checked={overdueOnly} onChange={event => { setOverdueOnly(event.target.checked); if (event.target.checked) setScope('all'); }} className="h-4 w-4 rounded border-admin-control text-admin-primary focus:ring-admin-focus" />
            Overdue follow-ups
          </label>
          <button type="button" disabled={!activeFilterCount} onClick={clearAdvancedFilters} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:text-admin-subtle disabled:opacity-60">Clear filters</button>
        </section>
      )}

      <section id="booking-list-panel" aria-label="Bookings list" aria-busy={loading || refreshing} className={`booking-list overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-[0_4px_20px_rgba(15,23,42,0.04)] ${showBookingPricing ? 'booking-has-pricing' : ''}`}>
        <BookingListControls views={<div className="bl-views" role="group" aria-label="Booking views">{[
          { key: 'all', label: 'All bookings', count: bookings.length },
          { key: 'pending', label: 'Pending shoots', count: pendingBookingCount },
          { key: 'overdue', label: 'Follow-up overdue', count: overdueIds.size },
        ].map(v => <button key={v.key} aria-pressed={(overdueOnly ? 'overdue' : scope) === v.key} onClick={() => selectView(v.key)}>{v.key === 'overdue' && <Clock3 size={15}/>} {v.label}<b>{v.count}</b></button>)}</div>} sort={sort} onSort={setSort}
          filters={{ status, assignee, payment: paymentFilter, overdueOnly }} onApply={draft => {
            setStatus(draft.status); setAssignee(draft.assignee); setPayment(draft.payment); setOverdueOnly(draft.overdueOnly);
            if (draft.overdueOnly || ['shoot_completed', 'delivered', 'cancelled'].includes(draft.status)) setScope('all');
          }} staff={assigneeOptions} staffFailed={staffLoadFailed} canViewPayments={canViewPayments} counts={counts}
          overdueCount={overdueIds.size} services={serviceCategories} service={serviceCategory} onService={selectServiceCategory}/>
        {loading ? (
          <div className="booking-rows" aria-label="Loading bookings" role="status">
            {Array.from({ length: 4 }, (_, index) => <BookingCardSkeleton key={index} showPricing={showBookingPricing} />)}
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
          <>
          <BookingDesktopTable rows={pageItems} sort={sort} onSort={setSort} showPricing={showBookingPricing}
            canViewPayments={canViewPayments} canViewPhone={canViewPhone} onOpen={openBooking}
            onAssign={canManage ? booking => { setAssignmentSuccess(''); setAssigningBooking(booking); } : undefined}/>
          <div className="sm:hidden"><div className="booking-rows">
            {pageItems.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                canViewPayments={canViewPayments}
                showPricing={showBookingPricing}
                canViewPhone={canViewPhone}
                onOpen={() => openBooking(booking.id)}
                onAssign={canManage ? () => { setAssignmentSuccess(''); setAssigningBooking(booking); } : undefined}
              />
            ))}
          </div></div></>
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
        {!loading && visible.length > 0 && <SalesListPagination itemPlural="bookings" page={currentPage} pageCount={pageCount} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} />}
      </section>
      </div>

      <p role="status" className="sr-only">{assignmentSuccess}</p>
      {canManage && assigningBooking && <BookingAssignmentDialog
        booking={assigningBooking}
        onClose={() => setAssigningBooking(null)}
        onSaved={updated => {
          setBookings(current => current.map(booking => booking.id === updated.id ? updated : booking));
          setAssignmentSuccess(`Staff assignment saved for ${formatCustomerName(updated.customerName)}`);
          setAssigningBooking(null);
        }}
      />}

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
