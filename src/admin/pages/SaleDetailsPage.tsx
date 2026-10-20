import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SaleDetails } from '../components/SaleDetails';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { SaleDetail } from '../../shared/types/sales';
import { formatINR } from '../../lib/pricing';
const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50';
export function SaleDetailsPage() {
  const { id = '' } = useParams();
  const confirm = useConfirmDialog();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const next = await api.getSale(id); setSale(next); }, [id]);
  useEffect(() => {
    let cancelled = false; setLoading(true); setSale(null); setError('');
    void api.getSale(id).then(next => { if (!cancelled) setSale(next); }).catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load sale.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);
  const action = async (name: 'publish' | 'pause' | 'archive', editAfterPause = false) => {
    if (!sale || busy) return;
    setBusy(true); setError('');
    try {
      if (name === 'publish') {
        const preview = await api.previewSale(id);
        if (preview.overlaps.length) throw new Error(`Overlapping sale: ${preview.overlaps.map(item => item.name).join(', ')}`);
        if (!await confirm({ title: `Publish ${sale.name}?`, description: preview.allocations.map(pkg => `${pkg.packageName}: ${formatINR(pkg.basePrice)} → ${formatINR(pkg.salePrice)}`).join(' · '), confirmLabel: 'Publish sale' })) return;
      } else if (editAfterPause) {
        if (!await confirm({ title: `Pause & edit ${sale.name}?`, description: 'This stops new offer bookings immediately. Saving your changes creates a draft. Preview and publish it again to resume the offer. Existing booking prices and history stay unchanged. Cancelling the editor leaves the sale paused.', confirmLabel: 'Pause & edit' })) return;
      } else if (!await confirm({ title: `${name === 'pause' ? 'Pause' : 'Archive'} ${sale.name}?`, description: 'New offer bookings will stop. Saved booking prices and history are retained.', confirmLabel: name === 'pause' ? 'Pause sale' : 'Archive sale' })) return;
      await api.saleAction(id, name);
      if (editAfterPause) navigate(`/admin/sales?edit=${encodeURIComponent(id)}`);
      else await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Sale action failed.'); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-7xl space-y-5 text-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/admin/sales" className="text-sm font-semibold text-blue-700 underline">← All sales</Link><div className="flex flex-wrap gap-2">
      {sale && ['draft', 'paused'].includes(sale.state) && <><Link className={button} to={`/admin/sales?edit=${sale._id}`}>Edit sale</Link><button className={button} disabled={busy || !sale.enabled} onClick={() => void action('publish')}>Preview & publish</button></>}
      {sale?.state === 'published' && <><button className={button} disabled={busy} onClick={() => void action('pause', true)}>Pause & edit</button><button className={button} disabled={busy} onClick={() => void action('pause')}>Pause</button></>}
      {sale && sale.state !== 'archived' && <button className={button} disabled={busy} onClick={() => void action('archive')}>Archive</button>}
      {sale && <Link className={button} to={`/admin/sales?results=${sale._id}`}>View results</Link>}
    </div></div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-800"><p>{error}</p><button className="mt-2 font-semibold underline" type="button" onClick={() => { setLoading(true); setError(''); void load().catch(err => setError(err.message)).finally(() => setLoading(false)); }}>Try again</button></div>}
    {loading ? <p role="status">Loading sale details…</p> : sale ? <SaleDetails sale={sale} /> : null}
  </div>;
}
