import { CampaignPerformance } from '../components/CampaignPerformance';
import { leadSourceLabel } from '../components/leadSource';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileWarning,
  Inbox,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { BookingStatus, OwnerOverviewReport } from '../types';
import {
  AdminAlert,
  AdminCard,
  AdminEmptyState,
  AdminIconButton,
  AdminLoadingState,
  AdminPageHeader,
} from '../components/ui';
import {
  REPORTING_PERIOD_PRESETS,
  rangeForReportingPreset,
  type ReportingDateRange,
  type ReportingPeriodPreset,
} from '../reports/reportingPeriod';
import { formatTimeWindow } from '../../shared/bookingTime';

type MetricTone = 'emerald' | 'violet' | 'amber' | 'rose';

const metricTone: Record<MetricTone, { icon: string; value: string }> = {
  emerald: { icon: 'bg-emerald-50 text-emerald-700', value: 'text-emerald-800' },
  violet: { icon: 'bg-violet-50 text-violet-700', value: 'text-violet-800' },
  amber: { icon: 'bg-amber-50 text-amber-700', value: 'text-amber-900' },
  rose: { icon: 'bg-rose-50 text-rose-700', value: 'text-rose-800' },
};

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return 'Date not set';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00+05:30`));
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Kolkata',
  }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function trendLabel(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
      .format(new Date(`${value}T12:00:00+05:30`));
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' })
      .format(new Date(`${value}-01T12:00:00+05:30`));
  }
  return value.replace(/^\d{4}-W/, 'W');
}

export function OwnerOverviewPage() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<ReportingPeriodPreset>('this_month');
  const [range, setRange] = useState<ReportingDateRange>(() => rangeForReportingPreset('this_month'));
  const [report, setReport] = useState<OwnerOverviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const load = useCallback(async (refresh = false) => {
    if (range.dateFrom > range.dateTo) {
      setError('The start date must be before the end date.');
      return;
    }
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    const requestId = ++requestIdRef.current;
    try {
      const next = await api.getOwnerOverview(range.dateFrom, range.dateTo);
      if (requestId === requestIdRef.current) setReport(next);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Could not load the owner overview.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [range.dateFrom, range.dateTo]);

  useEffect(() => { void load(); }, [load]);

  const selectPreset = (value: ReportingPeriodPreset) => {
    setPreset(value);
    if (value !== 'custom') setRange(rangeForReportingPreset(value));
  };

  const firstName = (user?.name || 'Owner').trim().split(/\s+/)[0];
  const attentionTotal = report
    ? report.attention.untouchedNewEnquiries
      + report.attention.overdueFollowUps
      + report.attention.draftsMissingDetails
      + report.attention.overdueBookings
      + report.attention.financeRecords
    : 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 overflow-x-hidden">
      <AdminPageHeader
        compact
        eyebrow="Owner command center"
        title={`${greeting()}, ${firstName}`}
        description="Revenue, sales activity, and the decisions that need your attention."
        actions={<>
          {report && <span className="hidden text-xs text-admin-subtle lg:inline">Updated {formatGeneratedAt(report.period.generatedAt)}</span>}
          <AdminIconButton label="Refresh owner overview" className="h-9 w-9" disabled={refreshing} onClick={() => void load(true)}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </AdminIconButton>
        </>}
      />

      <OwnerPeriodFilter
        preset={preset}
        range={range}
        onPreset={selectPreset}
        onRange={(next) => { setPreset('custom'); setRange(next); }}
      />

      {error && <AdminAlert><span>{error}</span><button type="button" onClick={() => void load()} className="ml-2 font-semibold underline">Try again</button></AdminAlert>}

      {loading && !report ? (
        <AdminCard><AdminLoadingState label="Preparing your business overview…" /></AdminCard>
      ) : report ? (
        <>
          <section aria-labelledby="owner-finance-title">
            <SectionHeading
              id="owner-finance-title"
              title="Financial health"
              description="Values for the selected period. Each card explains which date it uses."
              to="/admin/payments"
              linkLabel="Full finance report"
            />
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <MetricCard
                label="Shoot value"
                value={report.finance.summary.shootValue == null ? 'Unavailable' : money(report.finance.summary.shootValue)}
                description="Shoot dates in this period · Includes paid and unpaid amounts"
                detail={report.finance.summary.pricedShootBookings == null ? 'Shoot value is not available yet' : `${report.finance.summary.pricedShootBookings} priced bookings · Excludes drafts and cancellations`}
                icon={CalendarCheck2}
                tone="violet"
                to="/admin/payments"
              />
              <MetricCard
                label="Payments received"
                description="Money received in this period · Uses payment dates"
                value={money(report.finance.summary.paymentsReceived)}
                detail={`${report.finance.summary.paymentTransactions} transaction${report.finance.summary.paymentTransactions === 1 ? '' : 's'}`}
                comparison={preset === 'all' ? undefined : report.comparisons.paymentsReceived}
                icon={Banknote}
                tone="emerald"
                to="/admin/payments"
              />
              <MetricCard
                label="Bookings confirmed value"
                description="Confirmed in this period · Includes paid and unpaid amounts"
                value={money(report.finance.summary.bookedRevenue)}
                detail={`${report.finance.summary.confirmedBookings} priced booking${report.finance.summary.confirmedBookings === 1 ? '' : 's'} · Avg ${money(report.finance.summary.averageBookingValue)}`}
                comparison={preset === 'all' ? undefined : report.comparisons.bookedRevenue}
                icon={TrendingUp}
                tone="violet"
                to="/admin/payments"
              />
            </div>
          </section>

          <section aria-labelledby="owner-balances-title">
            <SectionHeading
              id="owner-balances-title"
              title="Current balances"
              description="Across all dates · Not affected by the selected period"
            />
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <MetricCard
                label="Outstanding now"
                value={money(report.finance.summary.outstandingNow)}
                detail={`${report.finance.summary.outstandingBookings} booking${report.finance.summary.outstandingBookings === 1 ? '' : 's'} with balance due`}
                icon={WalletCards}
                tone="amber"
                to="/admin/payments"
              />
              <MetricCard
                label="Overdue now"
                value={money(report.finance.summary.overdueNow)}
                detail={`${report.finance.summary.overdueBookings} overdue booking${report.finance.summary.overdueBookings === 1 ? '' : 's'}`}
                icon={CalendarClock}
                tone="rose"
                to="/admin/payments"
              />
            </div>
          </section>

          <section aria-labelledby="owner-sales-title">
            <SectionHeading
              id="owner-sales-title"
              title="Enquiries and bookings"
              description="A fast view of demand, conversion, and confirmed work."
            />
            <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
              <CompactMetric label="New enquiries" value={report.enquiries.newEnquiries} comparison={preset === 'all' ? undefined : report.comparisons.newEnquiries} icon={UsersRound} to="/admin/enquiries" />
              <CompactMetric label="Lead conversion" value={`${report.enquiries.conversionRate}%`} detail={`${report.enquiries.converted} converted`} icon={Target} to="/admin/enquiries" />
              <CompactMetric label="Confirmed bookings" value={report.bookings.confirmedBookings} comparison={preset === 'all' ? undefined : report.comparisons.confirmedBookings} icon={CheckCircle2} to="/admin/bookings" />
              <CompactMetric label="Shoots next 7 days" value={report.bookings.upcoming7Days} detail={`${report.bookings.upcoming30Days} in the next 30 days`} icon={CalendarCheck2} to="/admin/schedule" />
            </div>
          </section>

          <AdminCard className={`overflow-hidden ${attentionTotal ? 'border-amber-200' : 'border-emerald-200'}`}>
            <div className={`flex items-center gap-3 border-b p-3.5 sm:p-4 ${attentionTotal ? 'border-amber-100 bg-amber-50/70' : 'border-emerald-100 bg-emerald-50/70'}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${attentionTotal ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                {attentionTotal ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-admin-text">{attentionTotal ? `${attentionTotal} items need attention` : 'Everything important is under control'}</h2>
                <p className="mt-0.5 text-xs text-admin-subtle">Prioritised actions that protect leads, bookings, and cash collection.</p>
              </div>
            </div>
            <AttentionGrid report={report} />
          </AdminCard>

          <section className="grid items-start gap-4 xl:grid-cols-3">
            <EnquirySources report={report} />
            <EnquiryFunnel report={report} />
            <BookingHealth report={report} />
          </section>

          <CampaignPerformance report={report} />

          <section className="grid gap-4 xl:grid-cols-2">
            <CashTrend report={report} />
            <RevenueByShootType report={report} />
          </section>

          <UpcomingShoots report={report} />
        </>
      ) : null}
    </div>
  );
}

function OwnerPeriodFilter({
  preset,
  range,
  onPreset,
  onRange,
}: {
  preset: ReportingPeriodPreset;
  range: ReportingDateRange;
  onPreset: (value: ReportingPeriodPreset) => void;
  onRange: (value: ReportingDateRange) => void;
}) {
  return (
    <section className="rounded-xl border border-admin-border bg-admin-surface p-2 shadow-sm" aria-label="Owner reporting period">
      <div className="sm:hidden">
        <select value={preset} onChange={(event) => onPreset(event.target.value as ReportingPeriodPreset)} className="h-9 w-full rounded-lg border border-admin-control bg-admin-surface px-2.5 text-xs font-semibold text-admin-text">
          {REPORTING_PERIOD_PRESETS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          <option value="custom">Custom dates</option>
        </select>
        {preset === 'custom' && <DateFields range={range} onRange={onRange} className="mt-2" />}
      </div>
      <div className="hidden flex-col gap-3 sm:flex xl:flex-row xl:items-center xl:justify-between">
        <div className="grid grid-cols-3 gap-2 xl:flex">
          {REPORTING_PERIOD_PRESETS.map((option) => (
            <button key={option.value} type="button" onClick={() => onPreset(option.value)} className={`h-9 rounded-lg px-2.5 text-xs font-semibold transition ${preset === option.value ? 'bg-admin-primary text-white shadow-sm' : 'bg-admin-muted text-admin-secondary hover:text-admin-text'}`}>
              {option.label}
            </button>
          ))}
        </div>
        <DateFields range={range} onRange={onRange} />
      </div>
    </section>
  );
}

function DateFields({ range, onRange, className = '' }: { range: ReportingDateRange; onRange: (value: ReportingDateRange) => void; className?: string }) {
  return <div className={`grid grid-cols-2 gap-2 sm:flex sm:items-center ${className}`}>
    <label className="text-[11px] font-semibold text-admin-subtle">From<input type="date" value={range.dateFrom} max={range.dateTo} onChange={(event) => onRange({ ...range, dateFrom: event.target.value })} className="mt-0.5 h-9 w-full rounded-lg border border-admin-control bg-admin-surface px-2 text-xs text-admin-text outline-none focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20 sm:w-36" /></label>
    <label className="text-[11px] font-semibold text-admin-subtle">To<input type="date" value={range.dateTo} min={range.dateFrom} onChange={(event) => onRange({ ...range, dateTo: event.target.value })} className="mt-0.5 h-9 w-full rounded-lg border border-admin-control bg-admin-surface px-2 text-xs text-admin-text outline-none focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20 sm:w-36" /></label>
  </div>;
}

function SectionHeading({ id, title, description, to, linkLabel }: { id: string; title: string; description: string; to?: string; linkLabel?: string }) {
  return <div className="flex items-center justify-between gap-4">
    <div className="min-w-0 md:flex md:items-baseline md:gap-3"><h2 id={id} className="shrink-0 text-sm font-semibold text-admin-text">{title}</h2><p className="mt-0.5 text-xs text-admin-subtle md:mt-0">{description}</p></div>
    {to && <Link to={to} className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-admin-primary hover:underline sm:flex">{linkLabel}<ArrowRight className="h-3.5 w-3.5" /></Link>}
  </div>;
}

function MetricCard({ label, value, detail, description, comparison, icon: Icon, tone, to }: { label: string; value: string; detail: string; description?: string; comparison?: number | null; icon: LucideIcon; tone: MetricTone; to: string }) {
  const colors = metricTone[tone];
  return <Link to={to} className="group min-w-0 rounded-xl border border-admin-border bg-admin-surface p-3 shadow-[0_8px_22px_rgba(62,56,46,0.035)] transition hover:-translate-y-0.5 hover:border-admin-control hover:shadow-md sm:p-3.5">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-admin-subtle">{label}</p><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}><Icon className="h-4 w-4" /></span></div>
    <p className={`mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl ${colors.value}`}>{value}</p>
    {description && <p className="mt-1 text-[11px] leading-4 text-admin-subtle">{description}</p>}
    <div className="mt-2 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] leading-4 text-admin-subtle sm:text-[11px]"><span>{detail}</span>{comparison !== undefined && <Comparison value={comparison} />}</div>
  </Link>;
}

function CompactMetric({ label, value, detail, comparison, icon: Icon, to }: { label: string; value: string | number; detail?: string; comparison?: number | null; icon: LucideIcon; to: string }) {
  return <Link to={to} className="group rounded-xl border border-admin-border bg-admin-surface p-3 shadow-sm transition hover:border-admin-control hover:shadow-md sm:p-3.5">
    <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-admin-subtle">{label}</p><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span></div>
    <p className="mt-2 text-xl font-semibold tracking-tight text-admin-text sm:text-2xl">{value}</p>
    <div className="mt-1.5 min-h-4 text-[10px] leading-4 text-admin-subtle sm:text-[11px]">{detail || (comparison !== undefined ? <Comparison value={comparison} /> : null)}</div>
  </Link>;
}

function Comparison({ value }: { value: number | null }) {
  if (value === null) return <span className="inline-flex items-center gap-1 font-semibold text-blue-700"><Sparkles className="h-3 w-3" />New vs previous period</span>;
  if (value === 0) return <span className="text-admin-subtle">No change vs previous period</span>;
  const positive = value > 0;
  return <span className={`inline-flex items-center gap-1 font-semibold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>{positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(value)}% vs previous period</span>;
}

function AttentionGrid({ report }: { report: OwnerOverviewReport }) {
  const items = [
    { label: 'Untouched for 24h+', value: report.attention.untouchedNewEnquiries, detail: `${report.attention.newEnquiries} new enquiries open`, to: '/admin/enquiries', icon: Inbox, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Follow-ups overdue', value: report.attention.overdueFollowUps, detail: 'Enquiry and booking follow-ups', to: '/admin/today#today-followups', icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Drafts missing details', value: report.attention.draftsMissingDetails, detail: 'Incomplete booking records', to: '/admin/bookings', icon: FileWarning, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Payments overdue', value: report.attention.overdueBookings, detail: money(report.finance.summary.overdueNow), to: '/admin/payments', icon: CircleDollarSign, tone: 'bg-rose-50 text-rose-700' },
    { label: 'Finance records', value: report.attention.financeRecords, detail: 'Missing or inconsistent finance data', to: '/admin/payments', icon: AlertTriangle, tone: 'bg-orange-50 text-orange-700' },
  ];
  return <div className="grid sm:grid-cols-2 xl:grid-cols-5">
    {items.map(({ label, value, detail, to, icon: Icon, tone }) => <Link key={label} to={to} className="group flex items-center gap-2.5 border-b border-admin-border p-3 last:border-b-0 sm:p-3.5 xl:border-b-0 xl:border-r xl:last:border-r-0"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-admin-text group-hover:text-admin-primary">{label}</p><p className="mt-0.5 truncate text-[10px] text-admin-subtle">{detail}</p></div><span className={value ? 'text-base font-semibold text-admin-text' : 'text-emerald-600'}>{value || <CheckCircle2 className="h-4 w-4" />}</span><ChevronRight className="h-3.5 w-3.5 text-admin-subtle" /></Link>)}
  </div>;
}

export function EnquirySources({ report }: { report: OwnerOverviewReport }) {
  const sources = [...report.enquiries.sourceBreakdown].sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
  const total = sources.reduce((sum, item) => sum + item.count, 0);
  return <AdminCard className="overflow-hidden"><CardHeader icon={UsersRound} title="Enquiries by source" description="Enquiries created in the selected period · All stages" to="/admin/enquiries" /><div className="p-4">{total ? <><p className="mb-3 text-xs text-admin-subtle">{total} enquiries · Select a source to view its enquiries</p><div className="space-y-2">{sources.map(item => { const percentage = Math.round(item.count / total * 1000) / 10; const query = new URLSearchParams({ source: item.source || 'not_recorded', dateFrom: report.period.dateFrom, dateTo: report.period.dateTo }); return <Link key={item.source || 'not_recorded'} to={`/admin/enquiries?${query}`} className="block rounded-lg p-2 outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus"><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span>{leadSourceLabel(item.source)}</span><span className="shrink-0 font-semibold">{item.count} <span className="ml-2 font-normal text-admin-subtle">{percentage}%</span></span></div><div aria-hidden="true" className="h-1.5 rounded-full bg-admin-muted"><div className="h-full rounded-full bg-admin-primary" style={{ width: `${percentage}%` }} /></div></Link>; })}</div></> : <AdminEmptyState title="No enquiries in this period" description="Choose a different date range." />}</div></AdminCard>;
}

function EnquiryFunnel({ report }: { report: OwnerOverviewReport }) {
  const total = Math.max(report.enquiries.newEnquiries, 1);
  const stages = [
    { label: 'New enquiries', value: report.enquiries.newEnquiries, color: 'bg-blue-500' },
    { label: 'Engaged', value: report.enquiries.engaged, color: 'bg-indigo-500' },
    { label: 'Converted', value: report.enquiries.converted, color: 'bg-violet-500' },
  ];
  return <AdminCard className="overflow-hidden"><CardHeader icon={Target} title="Enquiry funnel" description="How enquiries received in this period moved toward a booking." to="/admin/enquiries" /><div className="space-y-3.5 p-4">{report.enquiries.newEnquiries ? stages.map((stage) => <div key={stage.label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-admin-secondary">{stage.label}</span><span className="font-semibold text-admin-text">{stage.value} <span className="ml-1 text-[10px] font-normal text-admin-subtle">{Math.round((stage.value / total) * 100)}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-admin-muted"><div className={`h-full rounded-full ${stage.color}`} style={{ width: `${(stage.value / total) * 100}%` }} /></div></div>) : <AdminEmptyState title="No enquiries in this period" description="Try a wider reporting period." />}</div></AdminCard>;
}

function BookingHealth({ report }: { report: OwnerOverviewReport }) {
  const labels: Record<BookingStatus, string> = { draft: 'Draft', confirmed: 'Confirmed', shoot_completed: 'Shoot completed', delivered: 'Delivered', cancelled: 'Cancelled' };
  const colors: Record<BookingStatus, string> = { draft: 'bg-slate-400', confirmed: 'bg-emerald-500', shoot_completed: 'bg-blue-500', delivered: 'bg-violet-500', cancelled: 'bg-rose-500' };
  const statuses = Object.entries(report.bookings.statusBreakdown) as Array<[BookingStatus, number]>;
  const total = Math.max(statuses.reduce((sum, [, value]) => sum + value, 0), 1);
  return <AdminCard className="overflow-hidden"><CardHeader icon={CalendarCheck2} title="Booking health" description="Current booking records at every workflow stage." to="/admin/bookings" /><div className="space-y-3 p-4">{statuses.map(([status, value]) => <div key={status}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="inline-flex items-center gap-2 text-admin-secondary"><span className={`h-2 w-2 rounded-full ${colors[status]}`} />{labels[status]}</span><span className="font-semibold text-admin-text">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-admin-muted"><div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${(value / total) * 100}%` }} /></div></div>)}<div className="grid grid-cols-2 gap-2 border-t border-admin-border pt-3.5"><div className="rounded-lg bg-admin-muted p-2.5"><p className="text-[10px] text-admin-subtle">Cancelled this period</p><p className="mt-0.5 text-lg font-semibold text-admin-text">{report.bookings.cancelledBookings}</p></div><div className="rounded-lg bg-admin-muted p-2.5"><p className="text-[10px] text-admin-subtle">Next 30 days</p><p className="mt-0.5 text-lg font-semibold text-admin-text">{report.bookings.upcoming30Days}</p></div></div></div></AdminCard>;
}

function CashTrend({ report }: { report: OwnerOverviewReport }) {
  const points = report.finance.paymentTrend.slice(-14);
  const max = Math.max(...points.map((point) => point.amount), 1);
  return <AdminCard className="overflow-hidden"><CardHeader icon={Banknote} title="Cash received trend" description="Payments recorded during the selected period." to="/admin/payments" />{points.length ? <div className="p-4"><div className="flex h-40 items-end gap-1.5 border-b border-admin-border px-1">{points.map((point) => <div key={point.period} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"><div className="relative flex h-28 w-full items-end justify-center"><div className="w-full max-w-9 rounded-t bg-emerald-500 transition group-hover:bg-emerald-600" style={{ height: `${Math.max(5, (point.amount / max) * 100)}%` }} title={`${trendLabel(point.period)}: ${money(point.amount)}`} /></div><span className="max-w-full truncate text-[9px] text-admin-subtle">{trendLabel(point.period)}</span></div>)}</div><p className="mt-3 text-xs font-semibold text-emerald-700">{money(report.finance.summary.paymentsReceived)} received</p></div> : <AdminEmptyState title="No payments in this period" description="Recorded payments will appear as a trend here." />}</AdminCard>;
}

function RevenueByShootType({ report }: { report: OwnerOverviewReport }) {
  const items = report.finance.revenueByShootType.slice(0, 6);
  const max = Math.max(...items.map((item) => item.bookedRevenue), 1);
  return <AdminCard className="overflow-hidden"><CardHeader icon={TrendingUp} title="Confirmed value by shoot type" description="Agreed value of priced bookings won in this period." to="/admin/payments" />{items.length ? <div className="space-y-3.5 p-4">{items.map((item) => <div key={item.shootType}><div className="mb-1.5 flex items-end justify-between gap-4"><div className="min-w-0"><p className="truncate text-xs font-medium text-admin-secondary">{item.shootType}</p><p className="text-[10px] text-admin-subtle">{item.bookings} booking{item.bookings === 1 ? '' : 's'}</p></div><p className="shrink-0 text-xs font-semibold text-admin-text">{money(item.bookedRevenue)}</p></div><div className="h-2 overflow-hidden rounded-full bg-admin-muted"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(item.bookedRevenue / max) * 100}%` }} /></div></div>)}</div> : <AdminEmptyState title="No priced bookings confirmed in this period" description="Confirmed priced bookings will be grouped here." />}</AdminCard>;
}

function CardHeader({ icon: Icon, title, description, to }: { icon: LucideIcon; title: string; description: string; to: string }) {
  return <div className="flex items-start justify-between gap-3 border-b border-admin-border p-3.5 sm:p-4"><div><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-admin-primary" /><h2 className="text-sm font-semibold text-admin-text">{title}</h2></div><p className="mt-0.5 text-xs text-admin-subtle">{description}</p></div><Link to={to} aria-label={`Open ${title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-admin-subtle hover:bg-admin-muted hover:text-admin-primary"><ArrowRight className="h-3.5 w-3.5" /></Link></div>;
}

function UpcomingShoots({ report }: { report: OwnerOverviewReport }) {
  return <AdminCard className="overflow-hidden"><CardHeader icon={CalendarCheck2} title="Upcoming shoots" description="The next confirmed sessions in the coming 30 days." to="/admin/schedule" />{report.bookings.upcoming.length ? <div className="divide-y divide-admin-border px-4">{report.bookings.upcoming.map((booking) => <Link key={booking.bookingId} to={`/admin/bookings/${booking.bookingId}`} className="group flex items-center gap-2.5 py-3"><span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><span className="text-[8px] font-bold uppercase">{new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${booking.bookingDate}T12:00:00+05:30`))}</span><span className="text-sm font-bold leading-3.5">{new Date(`${booking.bookingDate}T12:00:00+05:30`).getDate()}</span></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-admin-text group-hover:text-admin-primary">{booking.customerName}</p><p className="mt-0.5 truncate text-[11px] text-admin-subtle">{booking.shootType}{booking.startTime && booking.endTime ? ` · ${formatTimeWindow(booking.startTime, booking.endTime)}` : ''}</p><p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-admin-subtle">{booking.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{booking.location}</span>}{booking.assignedStaffAccountName && <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{booking.assignedStaffAccountName}</span>}</p></div><div className="hidden shrink-0 text-right sm:block"><p className="text-[11px] font-semibold text-admin-secondary">{formatDate(booking.bookingDate)}</p></div><ChevronRight className="h-3.5 w-3.5 shrink-0 text-admin-subtle" /></Link>)}</div> : <AdminEmptyState icon={CalendarCheck2} title="No confirmed shoots in the next 30 days" description="Newly confirmed bookings will appear here." />}</AdminCard>;
}
