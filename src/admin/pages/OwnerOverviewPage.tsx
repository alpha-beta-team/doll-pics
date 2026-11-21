import '@fontsource/dm-mono/latin-500.css';
import { shortDate, timestamp } from '../reports/ownerDashboardFormat';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LockKeyhole, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import type { SalarySummary } from '../api/salary';
import type { Booking, OwnerOverviewReport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BookingPaymentDialog } from '../components/bookings/BookingPaymentDialog';
import { OwnerOverview } from '../components/owner/OwnerOverview';
import { OwnerFinance } from '../components/owner/OwnerFinance';
import { OwnerQueueDialog } from '../components/owner/OwnerDashboardWidgets';
import { OWNER_PRESETS, ownerRange, validOwnerRange, type OwnerPreset, type OwnerQueue } from '../reports/ownerDashboard';
import './owner-dashboard.css';
export function OwnerOverviewPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'finance' ? 'finance' : 'overview';
  const preset = (OWNER_PRESETS.find(([key]) => key === params.get('period'))?.[0] || 'month') as OwnerPreset;
  const fallback = ownerRange(preset);
  const from = params.get('dateFrom') ?? fallback.dateFrom, to = params.get('dateTo') ?? fallback.dateTo;
  const valid = validOwnerRange(from, to), rangeKey = `${preset}:${from}:${to}`;
  const [loaded, setLoaded] = useState<{ key: string; report: OwnerOverviewReport } | null>(null);
  const [salaryLoaded, setSalaryLoaded] = useState<{ key: string; value: SalarySummary } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [salaryError, setSalaryError] = useState('');
  const [queue, setQueue] = useState<{ kind: OwnerQueue; title: string } | null>(null), [payment, setPayment] = useState<Booking | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false), [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null), salaryVersion = useRef(0), paymentVersion = useRef(0);
  const report = loaded?.key === rangeKey ? loaded.report : null;
  const salary = salaryLoaded?.key === rangeKey ? salaryLoaded.value : null;
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => next.set(key, value));
    setParams(next);
  };
  const loadSalary = useCallback(async () => {
    if (!valid) return;
    const version = ++salaryVersion.current;
    setSalaryError('');
    try {
      const value = await api.salarySummary(from, to);
      if (version === salaryVersion.current) setSalaryLoaded({ key: rangeKey, value });
    } catch (err) {
      if (version === salaryVersion.current) { setSalaryLoaded(null); setSalaryError(err instanceof Error ? err.message : 'Could not load salary breakdown.'); }
    }
  }, [from, to, rangeKey, valid]);
  const load = useCallback(async () => {
    request.current?.abort();
    if (!valid) { setError('Choose valid dates with the start on or before the end.'); setBusy(false); return; }
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError('');
    try {
      const next = await api.getOwnerOverview(from, to, controller.signal, { dashboard: true, comparisonMode: preset === 'month' ? 'previous_month' : 'preceding' });
      if (!next.dashboard) throw new Error('The updated dashboard is temporarily unavailable. Please try again later.');
      if (!controller.signal.aborted) setLoaded({ key: rangeKey, report: next });
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load Owner Home.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }, [from, to, preset, rangeKey, valid]);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  useEffect(() => { void loadSalary(); return () => { salaryVersion.current += 1; }; }, [loadSalary]);
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(interval); }, []);
  useEffect(() => () => { paymentVersion.current += 1; }, []);
  const refresh = () => { void load(); void loadSalary(); };
  const openPayment = async (id: string) => {
    const version = ++paymentVersion.current;
    setNotice(''); setPaymentLoading(true);
    try {
      const booking = await api.getBooking(id);
      if (!booking) throw new Error('This booking is no longer available.');
      if (version === paymentVersion.current) { setQueue(null); setPayment(booking); }
    } catch (err) { if (version === paymentVersion.current) setNotice(err instanceof Error ? err.message : 'Could not load booking.'); }
    finally { if (version === paymentVersion.current) setPaymentLoading(false); }
  };
  const stale = report && now - Date.parse(report.period.generatedAt) > 60 * 60 * 1000;
  return <div className="owner-dashboard">
    <div className="od-heading"><header className="od-page-header"><div><h1>{tab === 'finance' ? 'Finance' : 'Owner overview'}</h1><p>{tab === 'finance' ? 'Money in, money out and who still owes' : 'Decisions for this month, and what needs attention now'}</p></div><button className="od-refresh" disabled={busy || !valid} onClick={refresh} aria-label="Refresh owner dashboard"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /><span>Refresh</span></button></header>
    <div className="od-filter-bar"><div className="od-presets" aria-label="Reporting period">{OWNER_PRESETS.map(([key, label]) => <button key={key} aria-pressed={preset === key} onClick={() => { const range = key === 'custom' ? { dateFrom: from, dateTo: to } : ownerRange(key); update({ period: key, ...range }); }}>{label}</button>)}</div></div>
    {preset === 'custom' && <div className="od-dates"><label>From<input type="date" value={from} max={to || undefined} onChange={event => update({ period: 'custom', dateFrom: event.target.value })} /></label><label>To<input type="date" value={to} min={from || undefined} onChange={event => update({ period: 'custom', dateTo: event.target.value })} /></label></div>}
    <p className="od-period-description">{valid ? <>{shortDate(from)}–{shortDate(to)} {to.slice(0, 4)} · India time (IST){report && <> · compared with {shortDate(report.period.previousDateFrom)}–{shortDate(report.period.previousDateTo)} {report.period.previousDateTo.slice(0, 4)} · generated {timestamp(report.period.generatedAt)}</>}</> : 'Choose a valid reporting period.'}<span className="od-owner-inline"><LockKeyhole size={11} />Owner only</span></p></div>
    <nav className="od-tabs" aria-label="Owner Home views"><button aria-current={tab === 'overview' ? 'page' : undefined} onClick={() => update({ tab: 'overview' })}>Overview</button><button aria-current={tab === 'finance' ? 'page' : undefined} onClick={() => update({ tab: 'finance' })}>Finance</button></nav>
    {report && (tab === 'finance' || stale || error) && <div className={`od-freshness ${stale || error ? 'od-stale' : ''}`}>Figures generated {timestamp(report.period.generatedAt)} IST.{stale ? ' These figures are more than one hour old.' : error ? ' Refresh failed; showing the last successful figures for this range.' : ' Current balances use all dates.'}<button disabled={busy} onClick={refresh}>Refresh</button></div>}
    {error && <p className="od-error" role="alert">{error} <button disabled={busy || !valid} onClick={refresh}>Try again</button></p>}
    {notice && <p className="od-error" role="status">{notice}</p>}{paymentLoading && <p role="status">Loading booking for payment…</p>}
    {report ? tab === 'overview' ? <OwnerOverview report={report} openQueue={(kind, title) => setQueue({ kind, title })} openFinance={() => update({ tab: 'finance' })} /> : <OwnerFinance report={report} salary={salary} salaryError={salaryError} retrySalary={() => void loadSalary()} openQueue={(kind, title) => setQueue({ kind, title })} onPayment={id => void openPayment(id)} /> : valid && !error ? <div role="status" className="od-loading">Preparing your business overview…<div className="od-grid od-four">{[1, 2, 3, 4].map(key => <div key={key} className="od-skeleton" />)}</div></div> : null}
    {queue && <OwnerQueueDialog key={`${queue.kind}:${from}:${to}`} {...queue} paymentMessage={paymentLoading ? 'Loading booking for payment…' : notice} from={from} to={to} onClose={() => { paymentVersion.current += 1; setPaymentLoading(false); setQueue(null); }} onPayment={id => void openPayment(id)} />}
    {payment && user?.role === 'owner' && <BookingPaymentDialog booking={payment} payment={null} onClose={() => setPayment(null)} onSave={async data => { await api.addBookingPayment(payment.id, data); setPayment(null); setNotice('Payment recorded.'); refresh(); }} />}
  </div>;
}
