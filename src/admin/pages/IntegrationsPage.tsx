import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import type { GoogleCalendarIntegrationStatus } from '../types';
import { AdminPageHeader } from '../components/ui';

export function IntegrationsPage() {
  const [status, setStatus] = useState<GoogleCalendarIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setStatus(await api.getGoogleCalendarStatus()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load Calendar status.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const test = async () => {
    setTesting(true); setError(''); setMessage('');
    try { const result = await api.testGoogleCalendar(); setMessage(result.message); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Calendar connection test failed.'); }
    finally { setTesting(false); }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading integrations…</div>;
  return <div className="mx-auto max-w-4xl space-y-5">
    <AdminPageHeader eyebrow="Studio Settings" title="Integrations" description="Check the shared studio Calendar without exposing credentials." />
    {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
    {message && <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" />{message}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarCheck className="h-6 w-6" /></span><div><h2 className="font-bold text-slate-900">Google Calendar</h2><p className="mt-1 text-sm text-slate-500">One-way all-day shoot synchronization</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${status?.enabled ? status.dryRun ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status?.enabled ? status.dryRun ? 'Dry run' : 'Live' : 'Disabled'}</span></div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Info label="Health" value={(status?.health || 'disabled').replace('_', ' ')} /><Info label="Credentials" value={status?.configured ? 'Configured' : 'Missing'} /><Info label="Timezone" value={status?.timezone || '—'} /><Info label="Service account" value={status?.serviceAccountEmail || 'Not configured'} /><Info label="Failed bookings" value={String(status?.failedBookings || 0)} /><Info label="Failed jobs" value={String(status?.failedJobs || 0)} /><Info label="Pending jobs" value={String(status?.jobCounts.pending || 0)} /><Info label="Last synchronized" value={status?.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString('en-IN') : 'Not yet'} /></dl>
      <div className="mt-5 flex flex-wrap gap-2"><button disabled={testing || !status?.configured} onClick={() => void test()} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-40"><ShieldCheck className="h-4 w-4" />{testing ? 'Testing…' : 'Test writer access'}</button><button onClick={() => void load()} className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button></div>
    </section>
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><h2 className="font-bold">Setup checklist</h2><ol className="mt-2 list-decimal space-y-1 pl-5"><li>Create the shared Calendar using the owner’s Google account.</li><li>Share it with the service-account email using “Make changes to events.”</li><li>Start with dry-run enabled and preview the future-booking backfill.</li><li>Enable live mode only after the connection test succeeds.</li></ol></section>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 break-all font-medium text-slate-700">{value}</dd></div>; }
