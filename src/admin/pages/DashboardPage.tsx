import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  CircleDollarSign,
  Clock3,
  Inbox,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { createDashboardMockData } from '../data/dashboardMockData';
import type { Booking, Enquiry } from '../types';

type Period = 7 | 30 | 90 | 'all';

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 'all', label: 'All time' },
];

const DAY = 24 * 60 * 60 * 1000;

function timestamp(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date not set';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: parsed.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(parsed);
}

function formatRelativeDate(value: string) {
  const parsed = timestamp(value);
  if (!parsed) return 'Date not set';
  const days = Math.ceil((parsed - Date.now()) / DAY);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

function normaliseShootType(value: string) {
  return value.trim().toLocaleLowerCase();
}

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-28 rounded bg-slate-100" />
      <div className="mt-4 h-8 w-16 rounded bg-slate-100" />
      <div className="mt-4 h-3 w-36 rounded bg-slate-100" />
    </div>
  );
}

export function DashboardPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [period, setPeriod] = useState<Period>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const [enquiriesResult, bookingsResult] = await Promise.allSettled([
      api.getEnquiries(),
      api.getBookings(),
    ]);

    const failures: string[] = [];
    const loadedEnquiries = enquiriesResult.status === 'fulfilled' ? enquiriesResult.value : null;
    const loadedBookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : null;
    if (!loadedEnquiries) failures.push('enquiries');
    if (!loadedBookings) failures.push('bookings');

    const forceMockData = import.meta.env.VITE_ADMIN_DASHBOARD_MOCK_DATA === 'true';
    const noAvailableRecords = !loadedEnquiries?.length && !loadedBookings?.length;
    const useMockData = forceMockData || (import.meta.env.DEV && noAvailableRecords);

    if (useMockData) {
      const mockData = createDashboardMockData();
      setEnquiries(mockData.enquiries);
      setBookings(mockData.bookings);
      setIsUsingMockData(true);
    } else {
      if (loadedEnquiries) setEnquiries(loadedEnquiries);
      if (loadedBookings) setBookings(loadedBookings);
      setIsUsingMockData(false);
    }

    if (failures.length && !useMockData) {
      setError(`Could not refresh ${failures.join(' and ')}. The available dashboard data is still shown.`);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const dashboard = useMemo(() => {
    const now = Date.now();
    const periodStart = period === 'all' ? 0 : now - period * DAY;
    const previousStart = period === 'all' ? 0 : now - period * 2 * DAY;
    const periodEnquiries = enquiries.filter((item) => timestamp(item.createdAt) >= periodStart);
    const previousEnquiries =
      period === 'all'
        ? []
        : enquiries.filter((item) => {
            const created = timestamp(item.createdAt);
            return created >= previousStart && created < periodStart;
          });

    const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');
    const bookedEnquiryIds = new Set(
      activeBookings.map((booking) => booking.enquiryId).filter((id): id is string => Boolean(id)),
    );
    const periodEnquiryIds = new Set(periodEnquiries.map((enquiry) => enquiry.id));
    const periodLinkedBookings = activeBookings.filter(
      (booking) => booking.enquiryId && periodEnquiryIds.has(booking.enquiryId),
    );
    const convertedIds = new Set(
      periodLinkedBookings.map((booking) => booking.enquiryId).filter((id): id is string => Boolean(id)),
    );
    const confirmedIds = new Set(
      periodLinkedBookings
        .filter((booking) => ['confirmed', 'shoot_completed', 'delivered'].includes(booking.status))
        .map((booking) => booking.enquiryId)
        .filter((id): id is string => Boolean(id)),
    );

    const engagedCount = periodEnquiries.filter(
      (enquiry) => enquiry.status !== 'new' || convertedIds.has(enquiry.id),
    ).length;
    const openLeads = enquiries.filter(
      (enquiry) => enquiry.status !== 'responded' && !bookedEnquiryIds.has(enquiry.id),
    );
    const draftBookings = bookings.filter((booking) => booking.status === 'draft');
    const conversionRate = periodEnquiries.length
      ? Math.round((convertedIds.size / periodEnquiries.length) * 100)
      : 0;

    const trend = (() => {
      if (period === 'all') return null;
      if (previousEnquiries.length === 0) {
        return periodEnquiries.length ? { value: null, label: 'New activity this period' } : { value: 0, label: 'No change' };
      }
      const value = Math.round(
        ((periodEnquiries.length - previousEnquiries.length) / previousEnquiries.length) * 100,
      );
      return { value, label: `${Math.abs(value)}% vs previous ${period} days` };
    })();

    const upcoming = bookings
      .filter((booking) => {
        const bookingDate = timestamp(booking.bookingDate);
        return booking.status === 'confirmed' && bookingDate >= now && bookingDate <= now + 30 * DAY;
      })
      .sort((a, b) => timestamp(a.bookingDate) - timestamp(b.bookingDate));

    const dueReminders = [
      ...bookings
        .filter(
          (booking) =>
            booking.status !== 'delivered' &&
            booking.status !== 'cancelled' &&
            Boolean(booking.nextFollowUpAt) &&
            timestamp(booking.nextFollowUpAt || '') <= now,
        )
        .map((booking) => timestamp(booking.nextFollowUpAt || '')),
    ].filter(Boolean);

    const demandMap = new Map<string, { label: string; enquiries: Enquiry[] }>();
    periodEnquiries.forEach((enquiry) => {
      const key = normaliseShootType(enquiry.shootType) || 'not specified';
      const current = demandMap.get(key) ?? {
        label: enquiry.shootType.trim() || 'Not specified',
        enquiries: [],
      };
      current.enquiries.push(enquiry);
      demandMap.set(key, current);
    });
    const demand = Array.from(demandMap.values())
      .map((group) => {
        const booked = group.enquiries.filter((enquiry) => convertedIds.has(enquiry.id)).length;
        return {
          label: group.label,
          leads: group.enquiries.length,
          booked,
          open: group.enquiries.length - booked,
          conversion: group.enquiries.length ? Math.round((booked / group.enquiries.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.leads - a.leads || b.booked - a.booked)
      .slice(0, 5);
    const maxDemand = Math.max(...demand.map((item) => item.leads), 1);

    return {
      periodEnquiries,
      trend,
      openLeads,
      draftBookings,
      conversionRate,
      convertedCount: convertedIds.size,
      engagedCount,
      confirmedCount: confirmedIds.size,
      upcoming,
      dueReminders: dueReminders.length,
      demand,
      maxDemand,
      draftsMissingDetails: draftBookings.filter((booking) =>
        !booking.bookingDate || !booking.shootType || !booking.location || booking.agreedTotal == null,
      ).length,
      outstandingBalances: bookings.filter(booking =>
        booking.status !== 'cancelled' && (booking.paymentSummary.balanceDue ?? 0) > 0,
      ).length,
      newLeads: enquiries.filter((enquiry) => enquiry.status === 'new' && !bookedEnquiryIds.has(enquiry.id)).length,
    };
  }, [bookings, enquiries, period]);

  const periodDescription =
    period === 'all' ? 'across all recorded enquiries' : `from the last ${period} days`;
  const funnel = [
    { label: 'Enquiries', value: dashboard.periodEnquiries.length, color: 'bg-blue-600' },
    { label: 'Engaged', value: dashboard.engagedCount, color: 'bg-indigo-500' },
    { label: 'Bookings', value: dashboard.convertedCount, color: 'bg-violet-500' },
    { label: 'Confirmed', value: dashboard.confirmedCount, color: 'bg-emerald-500' },
  ];
  const workflowStages = [
    { label: 'Draft', count: bookings.filter(item => item.status === 'draft').length, color: 'bg-slate-400' },
    { label: 'Confirmed', count: bookings.filter(item => item.status === 'confirmed').length, color: 'bg-emerald-500' },
    { label: 'Shoot completed', count: bookings.filter(item => item.status === 'shoot_completed').length, color: 'bg-blue-500' },
    { label: 'Delivered', count: bookings.filter(item => item.status === 'delivered').length, color: 'bg-violet-500' },
    { label: 'Cancelled', count: bookings.filter(item => item.status === 'cancelled').length, color: 'bg-rose-500' },
  ];
  const attentionItems = [
    {
      label: 'New enquiries to review',
      value: dashboard.newLeads,
      detail: 'Unopened leads in the inbox',
      to: '/admin/enquiries',
      icon: Inbox,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Follow-up reminders due',
      value: dashboard.dueReminders,
      detail: 'Overdue booking follow-ups',
      to: '/admin/bookings',
      icon: Clock3,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Drafts missing details',
      value: dashboard.draftsMissingDetails,
      detail: 'Complete these booking records',
      to: '/admin/bookings',
      icon: CalendarClock,
      iconClass: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Outstanding balances',
      value: dashboard.outstandingBalances,
      detail: 'Bookings with payment still due',
      to: '/admin/bookings',
      icon: CircleDollarSign,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Studio pulse
            {isUsingMockData && (
              <span className="ml-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] tracking-normal text-violet-700">
                Sample data
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            See demand, lead potential, and how enquiries turn into shoots.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" aria-label="Dashboard period">
            {PERIODS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  period === option.value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto rounded-md p-1 hover:bg-amber-100" aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard metrics">
          {Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />)}
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Studio overview">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">New enquiries</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{dashboard.periodEnquiries.length}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UsersRound className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              {dashboard.trend?.value != null && dashboard.trend.value !== 0 ? (
                dashboard.trend.value > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                )
              ) : <CircleDot className="h-3.5 w-3.5 text-slate-400" />}
              <span className={dashboard.trend?.value && dashboard.trend.value > 0 ? 'font-medium text-emerald-700' : 'text-slate-500'}>
                {dashboard.trend?.label ?? 'All recorded enquiries'}
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Active opportunities</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{dashboard.openLeads.length + dashboard.draftBookings.length}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {dashboard.openLeads.length} open leads · {dashboard.draftBookings.length} draft bookings
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Lead conversion</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{dashboard.conversionRate}%</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Target className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {dashboard.convertedCount} of {dashboard.periodEnquiries.length} enquiries became bookings
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Shoots next 30 days</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{dashboard.upcoming.length}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {dashboard.upcoming[0]
                ? `Next: ${formatRelativeDate(dashboard.upcoming[0].bookingDate)}`
                : 'No confirmed shoots scheduled'}
            </p>
          </article>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold text-slate-900">Booking workflow</h2><p className="mt-1 text-sm text-slate-500">Current count at every operational stage.</p></div><Link to="/admin/bookings" className="flex items-center gap-1 text-sm font-medium text-blue-600">View bookings <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{workflowStages.map(stage => <div key={stage.label} className="rounded-xl bg-slate-50 p-3"><span className={`block h-1.5 w-8 rounded-full ${stage.color}`} /><p className="mt-3 text-2xl font-semibold text-slate-900">{stage.count}</p><p className="mt-1 text-xs text-slate-500">{stage.label}</p></div>)}</div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h2 className="font-semibold text-slate-900">Enquiry flow</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">How leads {periodDescription} moved toward a confirmed shoot.</p>
            </div>
            <Link to="/admin/enquiries" className="hidden items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 sm:flex">
              View leads <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="p-5 sm:p-6">
            {dashboard.periodEnquiries.length ? (
              <div className="space-y-5">
                {funnel.map((stage, index) => {
                  const percent = Math.round((stage.value / dashboard.periodEnquiries.length) * 100);
                  return (
                    <div key={stage.label}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">{index + 1}</span>
                          <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">{stage.value}</span>
                          <span className="ml-2 text-xs text-slate-400">{percent}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all ${stage.color}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
                  Bookings and confirmations are counted when they are linked to an enquiry. Manually created bookings are excluded from conversion.
                </p>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><TrendingUp className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-medium text-slate-700">No enquiry flow yet</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">There are no enquiries in this period. Try a wider date range.</p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-600" />
              <h2 className="font-semibold text-slate-900">Demand potential</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Top shoot types by enquiry demand and open potential.</p>
          </div>
          <div className="p-5 sm:p-6">
            {dashboard.demand.length ? (
              <div className="space-y-5">
                {dashboard.demand.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{item.label}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{item.open} open potential · {item.booked} booked</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">{item.leads} leads</span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="bg-violet-500" style={{ width: `${(item.booked / dashboard.maxDemand) * 100}%` }} title={`${item.booked} booked`} />
                      <div className="bg-violet-200" style={{ width: `${(item.open / dashboard.maxDemand) * 100}%` }} title={`${item.open} open`} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Booked</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-200" />Open potential</span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Target className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-medium text-slate-700">No demand data yet</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">Shoot-type demand will appear when enquiries arrive.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-slate-900">Needs attention</h2>
              <p className="mt-1 text-sm text-slate-500">The next actions that keep work moving.</p>
            </div>
            <MessageSquareText className="h-5 w-5 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100 px-5 sm:px-6">
            {attentionItems.map(({ label, value, detail, to, icon: Icon, iconClass }) => (
              <Link key={label} to={to} className="group flex items-center gap-3 py-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}><Icon className="h-4.5 w-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700">{label}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{detail}</p>
                </div>
                <span className={`text-lg font-semibold ${value ? 'text-slate-900' : 'text-emerald-600'}`}>{value || <CheckCircle2 className="h-5 w-5" />}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="font-semibold text-slate-900">Upcoming shoots</h2>
              <p className="mt-1 text-sm text-slate-500">Confirmed work scheduled in the next 30 days.</p>
            </div>
            <Link to="/admin/bookings" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">All bookings <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {dashboard.upcoming.length ? (
            <div className="divide-y divide-slate-100 px-5 sm:px-6">
              {dashboard.upcoming.slice(0, 4).map((booking) => (
                <Link key={booking.id} to={`/admin/bookings/${booking.id}`} className="group flex items-center gap-3 py-4">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <span className="text-[9px] font-semibold uppercase leading-none">{new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${booking.bookingDate}T12:00:00`))}</span>
                    <span className="mt-1 text-sm font-bold leading-none">{new Date(`${booking.bookingDate}T12:00:00`).getDate()}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700">{booking.customerName || 'Unnamed client'}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{booking.shootType || 'Shoot type not set'}{booking.location ? ` · ${booking.location}` : ''}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-slate-600">{formatRelativeDate(booking.bookingDate)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{formatShortDate(booking.bookingDate)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CalendarCheck2 className="h-5 w-5" /></span>
              <p className="mt-3 text-sm font-medium text-slate-700">The next 30 days are open</p>
              <p className="mt-1 text-xs text-slate-500">Confirmed bookings will appear here.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
