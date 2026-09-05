import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, History, Loader2, UserRoundSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CustomerLookupResponse } from '../types';
import { canonicalIndianPhone, customerRecordDestination } from './customerLookup.utils';

type Props = {
  phone: string;
  enabled?: boolean;
  current?: { type: 'enquiry' | 'booking'; id: string };
  allowNewShoot?: boolean;
  newShootConfirmed?: boolean;
  onConfirmNewShoot?: () => void;
  onUseContact?: (contact: { customerName: string; email: string }) => void;
  onResult?: (result: CustomerLookupResponse | null) => void;
  onBookEnquiry?: (id: string) => void;
  separateShootReason?: string;
  onReasonChange?: (reason: string) => void;
  refreshKey?: number;
  onChecking?: (checking: boolean) => void;
};

export function CustomerLookupPanel({
  phone,
  enabled = true,
  current,
  allowNewShoot = false,
  newShootConfirmed = false,
  onConfirmNewShoot,
  onUseContact,
  onResult,
  onChecking,
  onBookEnquiry,
  separateShootReason,
  onReasonChange,
  refreshKey,
}: Props) {
  const canonical = canonicalIndianPhone(phone);
  const forBooking = Boolean(onBookEnquiry);
  const [result, setResult] = useState<CustomerLookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!enabled || !canonical) {
      setResult(null);
      setError('');
      setLoading(false);
      onChecking?.(false);
      onResult?.(null);
      return;
    }
    setResult(null);
    setLoading(true);
    setError('');
    onResult?.(null);
    const controller = new AbortController();
    onChecking?.(true);
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      api.lookupCustomer(phone, controller.signal, forBooking)
        .then(value => { if (!controller.signal.aborted) { setResult(value); onResult?.(value); } })
        .catch(err => {
          if (controller.signal.aborted) return;
          setResult(null);
          onResult?.(null);
          setError(err instanceof Error ? err.message : 'Could not check customer history.');
        })
        .finally(() => { if (!controller.signal.aborted) { setLoading(false); onChecking?.(false); } });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [canonical, enabled, onChecking, onResult, phone, retry, refreshKey, forBooking]);

  const records = useMemo(() => {
    if (!result) return [];
    return [...result.active, ...result.history].filter(row => !current || row.id !== current.id || row.type !== current.type);
  }, [current, result]);
  const active = records.filter(row => row.active);
  const history = records.filter(row => !row.active);

  if (!enabled || !canonical) return null;
  if (loading) return <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Checking customer history…</div>;
  if (error) return <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="h-4 w-4" />{error}<button type="button" className="min-h-11 underline" onClick={() => setRetry(value => value + 1)}>Retry</button></div>;
  if (!records.length) return null;

  return (
    <section className={`rounded-xl border p-4 ${active.length ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-start gap-3">
        {active.length ? <UserRoundSearch className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /> : <History className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />}
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold ${active.length ? 'text-amber-950' : 'text-blue-950'}`}>{active.length ? 'Possible active customer record' : 'Returning customer'}</h3>
          <p className="mt-1 text-sm text-slate-600">{active.length ? 'Open the current work or confirm this is a separate shoot.' : `${history.length} previous record${history.length === 1 ? '' : 's'} found.`}</p>
          <div className="mt-3 space-y-2">
            {(onBookEnquiry ? records : records.slice(0, 4)).map(row => <div key={`${row.type}-${row.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <span className="min-w-0 flex-1"><strong className="block break-words text-slate-800">{row.customerName}</strong><span className="block text-xs capitalize text-slate-500">{row.type} · {row.status.replace(/_/g, ' ')}{row.service ? ` · ${row.service}` : ''}</span><span className="block text-xs text-slate-500">{row.bookingDate ? `Shoot date: ${row.bookingDate.slice(0, 10)}` : 'Shoot date not recorded'}</span></span>
              {onBookEnquiry && row.type === 'enquiry' && row.active && <button type="button" onClick={() => onBookEnquiry(row.id)} className="min-h-11 rounded-lg px-3 font-semibold text-admin-primary focus-visible:ring-2 focus-visible:ring-admin-focus">Book this enquiry</button>}
              <Link to={customerRecordDestination(row.type, row.id)} className="inline-flex min-h-11 items-center font-semibold text-admin-primary">{row.type === 'booking' ? 'Open booking' : 'Open enquiry'}</Link>
            </div>)}
          </div>
          {allowNewShoot && active.length > 0 && onReasonChange && <label className="mt-3 block text-sm font-medium">Reason for a different shoot<textarea value={separateShootReason || ''} onChange={event => onReasonChange(event.target.value)} minLength={10} maxLength={500} rows={2} className="mt-1 w-full rounded-lg border border-admin-border p-2" placeholder="Explain why this is a separate shoot (10–500 characters)" /></label>}
          <div className="mt-3 flex flex-wrap gap-2">
            {onUseContact && result?.suggestedContact && <button type="button" onClick={() => onUseContact(result.suggestedContact!)} className="min-h-11 rounded-lg border border-blue-300 bg-white px-3 text-sm font-semibold text-blue-700">Use name and email</button>}
            {allowNewShoot && active.length > 0 && <button type="button" onClick={onConfirmNewShoot} disabled={Boolean(onReasonChange && (separateShootReason || '').trim().length < 10)} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${newShootConfirmed ? 'bg-emerald-600 text-white' : 'bg-amber-700 text-white'}`}>{newShootConfirmed && <Check className="h-4 w-4" />}{newShootConfirmed ? 'Separate shoot confirmed' : 'Different shoot'}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
