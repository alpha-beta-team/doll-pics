import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/client';
import type { FinanceReport, PaymentMethod } from '../types';
import {
  AdminAlert,
  AdminCard,
  AdminEmptyState,
  AdminIconButton,
  AdminLoadingState,
  AdminPageHeader,
  AdminTableSurface,
  adminFieldClass,
} from '../components/ui';

type PeriodPreset = 'this_month' | 'last_month' | '7_days' | '30_days' | '90_days' | 'all' | 'custom';
type DateRange = { dateFrom: string; dateTo: string };

const PRESETS: Array<{ value: Exclude<PeriodPreset, 'custom'>; label: string }> = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: '7_days', label: '7 days' },
  { value: '30_days', label: '30 days' },
  { value: '90_days', label: '90 days' },
  { value: 'all', label: 'All time' },
];

function kolkataToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function rangeForPreset(preset: Exclude<PeriodPreset, 'custom'>, today = kolkataToday()): DateRange {
  const [year, month] = today.split('-').map(Number);
  if (preset === 'this_month') return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today };
  if (preset === 'last_month') {
    const start = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10);
    return { dateFrom: start, dateTo: end };
  }
  if (preset === 'all') return { dateFrom: '2000-01-01', dateTo: today };
  const days = preset === '7_days' ? 7 : preset === '30_days' ? 30 : 90;
  return { dateFrom: addDays(today, -(days - 1)), dateTo: today };
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return 'Date not set';
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(parsed);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date not set';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(parsed);
}

function formatMethod(value: PaymentMethod) {
  return value === 'bank_transfer'
    ? 'Bank transfer'
    : value === 'upi'
      ? 'UPI'
      : value.charAt(0).toUpperCase() + value.slice(1);
}

function periodLabel(preset: PeriodPreset, range: DateRange) {
  const matched = PRESETS.find((option) => option.value === preset);
  if (matched) return matched.label;
  return `${formatDate(range.dateFrom)}–${formatDate(range.dateTo)}`;
}

export function PaymentsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('this_month');
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('this_month'));
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const financeReport = await api.getFinanceReport(range.dateFrom, range.dateTo);
      if (requestId !== requestIdRef.current) return;
      setReport(financeReport);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Could not load the finance dashboard.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [range.dateFrom, range.dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectPreset = (value: PeriodPreset) => {
    if (value === 'custom') {
      setPreset('custom');
      return;
    }
    setPreset(value);
    setRange(rangeForPreset(value));
  };

  const qualityIssues = report
    ? report.dataQuality.unpricedBookings
      + report.dataQuality.missingDueDates
      + report.dataQuality.overpaidBookings
    : 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Owner finance"
        title="Revenue & Payments"
        description="Track booked revenue, money received, and balances still due. Expenses and profit are not included."
        titleAction={(
          <AdminIconButton label="Refresh revenue and payments" disabled={refreshing} onClick={() => void load(true)}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </AdminIconButton>
        )}
      />

      <PeriodFilter
        preset={preset}
        range={range}
        onPreset={selectPreset}
        onRange={(next) => {
          setPreset('custom');
          setRange(next);
        }}
      />

      {error && <AdminAlert>{error}</AdminAlert>}

      {loading ? (
        <AdminCard><AdminLoadingState label="Loading revenue and payments…" /></AdminCard>
      ) : report ? (
        <>
          <KpiGrid report={report} selectedPeriod={periodLabel(preset, range)} />

          {qualityIssues > 0 && (
            <AdminAlert tone="warning">
              <p className="font-semibold">{qualityIssues} finance record{qualityIssues === 1 ? '' : 's'} need attention</p>
              <p className="mt-1">
                {report.dataQuality.unpricedBookings} without an agreed total ·{' '}
                {report.dataQuality.missingDueDates} outstanding without a due date ·{' '}
                {report.dataQuality.overpaidBookings} overpaid
              </p>
              <Link to="/admin/bookings" className="mt-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                Review bookings <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </AdminAlert>
          )}

          <section className="grid gap-5 xl:grid-cols-2">
            <RevenueByShootType report={report} />
            <PaymentStatus report={report} />
          </section>

          <RecentPayments report={report} />
          <OverduePayments report={report} />
        </>
      ) : null}
    </div>
  );
}

function PeriodFilter({
  preset,
  range,
  onPreset,
  onRange,
}: {
  preset: PeriodPreset;
  range: DateRange;
  onPreset: (preset: PeriodPreset) => void;
  onRange: (range: DateRange) => void;
}) {
  return (
    <section className="rounded-2xl border border-admin-border bg-admin-surface p-2.5 shadow-sm sm:p-3" aria-label="Finance reporting period">
      <div className="sm:hidden">
        <label>
          <span className="sr-only">Reporting period</span>
          <select
            value={preset}
            onChange={(event) => onPreset(event.target.value as PeriodPreset)}
            className="min-h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm font-semibold text-admin-text outline-none focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20"
          >
            {PRESETS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            <option value="custom">Custom dates</option>
          </select>
        </label>
        {preset === 'custom' && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold text-admin-subtle">
              From
              <input
                type="date"
                value={range.dateFrom}
                max={range.dateTo}
                onChange={(event) => onRange({ ...range, dateFrom: event.target.value })}
                className={`${adminFieldClass} min-h-10 px-2 text-xs`}
              />
            </label>
            <label className="text-[11px] font-semibold text-admin-subtle">
              To
              <input
                type="date"
                value={range.dateTo}
                min={range.dateFrom}
                max={kolkataToday()}
                onChange={(event) => onRange({ ...range, dateTo: event.target.value })}
                className={`${adminFieldClass} min-h-10 px-2 text-xs`}
              />
            </label>
          </div>
        )}
      </div>

      <div className="hidden flex-col gap-3 sm:flex xl:flex-row xl:items-center xl:justify-between">
        <div className="grid grid-cols-3 gap-2 xl:flex">
          {PRESETS.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => onPreset(option.value)}
              className={`min-h-10 rounded-xl px-2 text-xs font-semibold transition sm:px-3.5 sm:text-sm xl:shrink-0 ${
                preset === option.value
                  ? 'bg-admin-primary text-white shadow-sm'
                  : 'bg-admin-muted text-admin-secondary hover:text-admin-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <label className="text-xs font-semibold text-admin-subtle">
            From
            <input
              type="date"
              value={range.dateFrom}
              max={range.dateTo}
              onChange={(event) => onRange({ ...range, dateFrom: event.target.value })}
              className={`${adminFieldClass} min-h-10 sm:w-40`}
            />
          </label>
          <label className="text-xs font-semibold text-admin-subtle">
            To
            <input
              type="date"
              value={range.dateTo}
              min={range.dateFrom}
              max={kolkataToday()}
              onChange={(event) => onRange({ ...range, dateTo: event.target.value })}
              className={`${adminFieldClass} min-h-10 sm:w-40`}
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function KpiGrid({ report, selectedPeriod }: { report: FinanceReport; selectedPeriod: string }) {
  const cards = [
    {
      label: 'Payments received',
      value: money(report.summary.paymentsReceived),
      detail: `${report.summary.paymentTransactions} transaction${report.summary.paymentTransactions === 1 ? '' : 's'} · ${selectedPeriod}`,
      icon: Banknote,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Booked revenue',
      value: money(report.summary.bookedRevenue),
      detail: `${report.summary.confirmedBookings} confirmed · Avg ${money(report.summary.averageBookingValue)}`,
      icon: TrendingUp,
      iconClass: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Outstanding now',
      value: money(report.summary.outstandingNow),
      detail: `${report.summary.outstandingBookings} booking${report.summary.outstandingBookings === 1 ? '' : 's'} with balance due`,
      icon: CircleDollarSign,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Overdue now',
      value: money(report.summary.overdueNow),
      detail: `${report.summary.overdueBookings} overdue booking${report.summary.overdueBookings === 1 ? '' : 's'}`,
      icon: CalendarClock,
      iconClass: 'bg-rose-50 text-rose-700',
    },
  ];

  return (
    <section className="grid gap-3 min-[400px]:grid-cols-2 xl:grid-cols-4" aria-label="Finance summary">
      {cards.map(({ label, value, detail, icon: Icon, iconClass }) => (
        <AdminCard key={label} className="p-5 min-[400px]:p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-admin-subtle min-[400px]:text-xs sm:text-sm">{label}</p>
              <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-admin-text min-[400px]:text-xl sm:text-3xl">{value}</p>
            </div>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl min-[400px]:h-9 min-[400px]:w-9 sm:h-11 sm:w-11 ${iconClass}`}>
              <Icon className="h-5 w-5 min-[400px]:h-4 min-[400px]:w-4 sm:h-5 sm:w-5" />
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-admin-subtle min-[400px]:mt-3 min-[400px]:text-[11px] min-[400px]:leading-4 sm:mt-4 sm:text-xs sm:leading-5">{detail}</p>
        </AdminCard>
      ))}
    </section>
  );
}

function PaymentStatus({ report }: { report: FinanceReport }) {
  const status = [
    { label: 'Fully paid', value: report.paymentStatus.paid, color: 'bg-emerald-500' },
    { label: 'Partially paid', value: report.paymentStatus.partial, color: 'bg-amber-500' },
    { label: 'Unpaid', value: report.paymentStatus.unpaid, color: 'bg-rose-500' },
    { label: 'Overpaid', value: report.paymentStatus.overpaid, color: 'bg-violet-500' },
  ];
  const total = status.reduce((sum, item) => sum + item.value, 0);
  return (
    <AdminCard className="overflow-hidden">
      <div className="border-b border-admin-border p-5 sm:p-6">
        <h2 className="font-semibold text-admin-text">Payment status</h2>
        <p className="mt-1 text-sm text-admin-subtle">Current non-cancelled bookings.</p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {status.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="text-admin-secondary">{item.label}</span>
              <span className="font-semibold text-admin-text">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-admin-muted">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${total ? (item.value / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
        {!total && <p className="py-5 text-center text-sm text-admin-subtle">No priced bookings yet.</p>}
      </div>
    </AdminCard>
  );
}

function RevenueByShootType({ report }: { report: FinanceReport }) {
  const max = Math.max(...report.revenueByShootType.map((item) => item.bookedRevenue), 1);
  return (
    <AdminCard className="overflow-hidden">
      <div className="border-b border-admin-border p-5 sm:p-6">
        <h2 className="font-semibold text-admin-text">Booked revenue by shoot type</h2>
        <p className="mt-1 text-sm text-admin-subtle">Confirmed booking value in the selected period.</p>
      </div>
      {report.revenueByShootType.length ? (
        <div className="space-y-5 p-5 sm:p-6">
          {report.revenueByShootType.map((item) => (
            <div key={item.shootType}>
              <div className="mb-2 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-admin-secondary">{item.shootType}</p>
                  <p className="mt-0.5 text-xs text-admin-subtle">{item.bookings} booking{item.bookings === 1 ? '' : 's'}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-admin-text">{money(item.bookedRevenue)}</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-admin-muted">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${(item.bookedRevenue / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmptyState title="No booked revenue in this period" description="Confirmed priced bookings will be grouped here." />
      )}
    </AdminCard>
  );
}

function RecentPayments({ report }: { report: FinanceReport }) {
  return (
    <AdminCard className="overflow-hidden">
      <div className="border-b border-admin-border p-5 sm:p-6">
        <h2 className="font-semibold text-admin-text">Recent payments</h2>
        <p className="mt-1 text-sm text-admin-subtle">Latest transactions in the selected period.</p>
      </div>
      {report.recentPayments.length ? (
        <div className="divide-y divide-admin-border px-5 sm:px-6">
          {report.recentPayments.map((payment) => (
            <Link key={payment.paymentId} to={`/admin/bookings/${payment.bookingId}`} className="group flex items-center gap-3 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CreditCard className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-admin-text group-hover:text-admin-primary">{payment.customerName}</p>
                <p className="mt-0.5 truncate text-xs text-admin-subtle">{formatMethod(payment.method)} · {formatDateTime(payment.paidAt)}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-emerald-700">{money(payment.amount)}</p>
            </Link>
          ))}
        </div>
      ) : (
        <AdminEmptyState title="No recent payments" description="Try a wider reporting period." />
      )}
    </AdminCard>
  );
}

function OverduePayments({ report }: { report: FinanceReport }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold text-admin-text">Overdue payments</h2>
          <p className="mt-1 text-sm text-admin-subtle">Current balances past their payment due date.</p>
        </div>
        <span className="text-sm font-semibold text-rose-700">{money(report.summary.overdueNow)}</span>
      </div>
      {report.overduePayments.length ? (
        <>
          <div className="space-y-2 sm:hidden">
            {report.overduePayments.map((item) => (
              <Link
                key={item.bookingId}
                to={`/admin/bookings/${item.bookingId}`}
                className="block rounded-2xl border border-admin-border bg-admin-surface p-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-admin-text">{item.customerName}</p>
                    <p className="mt-0.5 truncate text-xs text-admin-subtle">{item.shootType} · due {formatDate(item.paymentDueDate)}</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-rose-700">{money(item.balanceDue)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-admin-border pt-3 text-xs">
                  <span className="font-semibold text-rose-700">{item.daysOverdue} day{item.daysOverdue === 1 ? '' : 's'} overdue</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-admin-primary">Open <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            ))}
          </div>

          <AdminTableSurface className="hidden max-w-full sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-admin-border bg-admin-muted text-xs uppercase tracking-wide text-admin-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Due date</th>
                  <th className="px-4 py-3 text-right font-semibold">Agreed</th>
                  <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3" aria-label="Action" />
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {report.overduePayments.map((item) => (
                  <tr key={item.bookingId} className="hover:bg-admin-muted/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-admin-text">{item.customerName}</p>
                      <p className="mt-0.5 text-xs text-admin-subtle">{item.shootType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-admin-secondary">{formatDate(item.paymentDueDate)}</p>
                      <p className="mt-0.5 text-xs font-semibold text-rose-700">{item.daysOverdue} day{item.daysOverdue === 1 ? '' : 's'} overdue</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-admin-secondary">{money(item.agreedTotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-admin-secondary">{money(item.amountPaid)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-700">{money(item.balanceDue)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/bookings/${item.bookingId}`} className="font-semibold text-admin-primary hover:underline">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableSurface>
        </>
      ) : (
        <AdminEmptyState icon={CheckCircle2} title="No overdue payments" description="Every dated balance is currently on schedule." />
      )}
    </section>
  );
}
