import { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, LogIn, LogOut, MonitorSmartphone, RefreshCw, ShieldAlert } from 'lucide-react';
import type { KioskDevice, PunchDirection } from '../attendance/types';
import { durationLabel, formatStudioTime, newRequestId, words } from '../attendance/format';
import { ScopedApiError } from '../attendance/scopedHttp';
import { kioskApi, kioskStorage, type KioskPunchResult } from './api';

type PendingPunch = { employeeCode: string; direction: PunchDirection; requestId: string };
const PENDING_KEY = 'doll_kiosk_pending_request';

export default function KioskApp() {
  const [device, setDevice] = useState<KioskDevice | null>(kioskStorage.device());
  const [checking, setChecking] = useState(Boolean(kioskStorage.token()));
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const previous = manifest?.href;
    if (manifest) manifest.href = '/kiosk.webmanifest';
    return () => { if (manifest && previous) manifest.href = previous; };
  }, []);

  useEffect(() => {
    const online = () => setOffline(false); const disconnected = () => setOffline(true);
    window.addEventListener('online', online); window.addEventListener('offline', disconnected);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', disconnected); };
  }, []);

  useEffect(() => {
    if (!kioskStorage.token()) { setChecking(false); return; }
    kioskApi.status().then((result) => { setDevice(result); }).catch((error) => {
      if (error instanceof ScopedApiError && error.status === 401) { kioskStorage.clear(); setDevice(null); }
    }).finally(() => setChecking(false));
  }, []);

  if (checking) return <KioskShell><div className="text-center text-white"><RefreshCw className="mx-auto h-10 w-10 animate-spin text-blue-300" /><p className="mt-4">Checking tablet registration…</p></div></KioskShell>;
  if (!kioskStorage.token() || !device) return <Enrollment onEnrolled={setDevice} offline={offline} />;
  return <PunchStation device={device} offline={offline} onRevoked={() => { kioskStorage.clear(); setDevice(null); }} />;
}

function Enrollment({ onEnrolled, offline }: { onEnrolled: (device: KioskDevice) => void; offline: boolean }) {
  const [code, setCode] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const result = await kioskApi.enroll(code.trim()); const { deviceToken, ...device } = result; kioskStorage.save(deviceToken, device); onEnrolled(device); } catch (enrollError) { setError(enrollError instanceof Error ? enrollError.message : 'Could not register this tablet.'); } finally { setSaving(false); } };
  return <KioskShell><div className="w-full max-w-lg rounded-3xl bg-white p-7 text-slate-900 shadow-2xl sm:p-9"><div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><MonitorSmartphone className="h-8 w-8" /></span><h1 className="mt-4 text-2xl font-bold">Register office tablet</h1><p className="mt-2 text-sm leading-6 text-slate-500">Ask the owner to generate a device enrollment code. It expires after ten minutes and works once.</p></div>{offline && <KioskMessage tone="warning"><CloudOff className="h-5 w-5" />This tablet is offline.</KioskMessage>}{error && <KioskMessage tone="danger"><ShieldAlert className="h-5 w-5" />{error}</KioskMessage>}<form className="mt-6" onSubmit={(event) => void submit(event)}><label className="block text-sm font-bold">Enrollment code<input autoFocus value={code} onChange={(event) => setCode(event.target.value)} autoCapitalize="none" autoCorrect="off" className="mt-2 h-14 w-full rounded-2xl border border-slate-300 px-4 text-center text-xl tracking-widest outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label><button disabled={saving || offline || code.trim().length < 8} className="mt-4 h-14 w-full rounded-2xl bg-blue-700 text-base font-bold text-white disabled:opacity-50">{saving ? 'Registering…' : 'Register tablet'}</button></form></div></KioskShell>;
}

function PunchStation({ device, offline, onRevoked }: { device: KioskDevice; offline: boolean; onRevoked: () => void }) {
  const [employeeCode, setEmployeeCode] = useState(''); const [pin, setPin] = useState(''); const [direction, setDirection] = useState<PunchDirection | null>(null); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<KioskPunchResult | null>(null); const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (!result) return; const timer = window.setTimeout(() => { setResult(null); setEmployeeCode(''); setPin(''); setDirection(null); setError(''); }, 6500); return () => window.clearTimeout(timer); }, [result]);

  const submit = async () => {
    if (!direction || submitting) return;
    setSubmitting(true); setError('');
    const normalized = employeeCode.trim().toUpperCase();
    const pending = readPending();
    const request: PendingPunch = pending?.employeeCode === normalized && pending.direction === direction
      ? pending : { employeeCode: normalized, direction, requestId: newRequestId() };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
    try {
      const saved = await kioskApi.punch({ employeeCode: normalized, pin, direction, clientRequestId: request.requestId });
      sessionStorage.removeItem(PENDING_KEY); setResult(saved);
    } catch (punchError) {
      const apiError = punchError instanceof ScopedApiError ? punchError : null;
      if (apiError?.status === 401 && /revoked|kiosk/i.test(apiError.message)) { sessionStorage.removeItem(PENDING_KEY); onRevoked(); return; }
      if (!apiError || apiError.status !== 0) sessionStorage.removeItem(PENDING_KEY);
      if (apiError?.status === 401) setPin('');
      setError(punchError instanceof Error ? punchError.message : 'Could not record the punch.');
    } finally { setSubmitting(false); }
  };

  return <KioskShell>{result ? <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl"><CheckCircle2 className="mx-auto h-20 w-20 text-emerald-600" /><h1 className="mt-5 text-3xl font-bold text-slate-950">{words(result.direction)} recorded</h1><p className="mt-2 text-xl text-slate-700">Thank you, {result.employeeFirstName}</p><p className="mt-5 text-4xl font-black text-blue-700">{formatStudioTime(result.recordedAt)}</p><div className="mt-6 flex justify-center gap-3"><span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{words(result.status)}</span><span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{durationLabel(result.netMinutes)} today</span></div><p className="mt-6 text-sm text-slate-400">This screen will clear automatically.</p></div> : <div className="w-full max-w-2xl"><header className="mb-5 flex items-center gap-4 text-white"><img src="/logo-doll.png" alt="" className="h-14 w-14 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><h1 className="text-xl font-bold">Doll Pictures Attendance</h1><p className="truncate text-sm text-slate-300">{device.name} · {device.officeLabel}</p></div><div className="text-right"><p className="text-2xl font-bold">{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(now)}</p><p className="text-xs text-slate-400">Server time is used for punches</p></div></header><div className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8">{offline && <KioskMessage tone="warning"><CloudOff className="h-5 w-5" />Offline punching is unavailable. Reconnect or request a correction later.</KioskMessage>}{error && <KioskMessage tone="danger"><ShieldAlert className="h-5 w-5" />{error}{readPending() && <span className="mt-1 block text-xs">Enter the same details and retry; the original request ID will be reused.</span>}</KioskMessage>}<div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold">Employee code<input autoFocus autoComplete="off" autoCapitalize="characters" value={employeeCode} onChange={(event) => { setEmployeeCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20)); setDirection(null); }} className="mt-2 h-16 w-full rounded-2xl border border-slate-300 px-4 text-center text-2xl font-bold tracking-wider outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="DP-001" /></label><label className="text-sm font-bold">6-digit PIN<input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setDirection(null); }} className="mt-2 h-16 w-full rounded-2xl border border-slate-300 px-4 text-center text-3xl font-bold tracking-[0.35em] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="••••••" /></label></div><div className="mt-6 grid grid-cols-2 gap-4"><button type="button" disabled={employeeCode.length < 3 || pin.length !== 6 || offline} onClick={() => setDirection('IN')} className={`flex h-20 items-center justify-center gap-3 rounded-2xl border-2 text-xl font-bold disabled:opacity-40 ${direction === 'IN' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><LogIn className="h-7 w-7" />Punch IN</button><button type="button" disabled={employeeCode.length < 3 || pin.length !== 6 || offline} onClick={() => setDirection('OUT')} className={`flex h-20 items-center justify-center gap-3 rounded-2xl border-2 text-xl font-bold disabled:opacity-40 ${direction === 'OUT' ? 'border-blue-700 bg-blue-700 text-white' : 'border-blue-200 bg-blue-50 text-blue-800'}`}><LogOut className="h-7 w-7" />Punch OUT</button></div>{direction && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-center text-sm font-semibold text-amber-950">Confirm {words(direction)} for employee {employeeCode}</p><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={() => setDirection(null)} className="h-12 rounded-xl border border-slate-300 bg-white font-bold">Go back</button><button type="button" disabled={submitting || offline} onClick={() => void submit()} className="h-12 rounded-xl bg-slate-950 font-bold text-white disabled:opacity-50">{submitting ? 'Recording…' : `Confirm ${words(direction)}`}</button></div></div>}</div></div>}</KioskShell>;
}

function KioskShell({ children }: { children: React.ReactNode }) { return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-8"><div className="pointer-events-none fixed inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_left,#3b82f6,transparent_38%),radial-gradient(circle_at_bottom_right,#10b981,transparent_35%)]" />{children}</main>; }
function KioskMessage({ tone, children }: { tone: 'danger' | 'warning'; children: React.ReactNode }) { return <div className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${tone === 'danger' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{children}</div>; }
function readPending(): PendingPunch | null { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null') as PendingPunch | null; } catch { return null; } }
