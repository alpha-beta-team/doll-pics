import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SalePackageSelector } from '../components/SalePackageSelector';
import { api } from '../api/client';
import type { Package } from '../types';
import type { Sale, SaleInput, SaleReport } from '../../shared/types/sales';
import { formatINR } from '../../lib/pricing';
import { saleDate } from '../../lib/sales';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900';
const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
function local(value: string) { return new Date(+new Date(value) + 19800000).toISOString().slice(0, 16); }
function initial(): SaleInput { return { name: '', description: '', terms: '', startsAt: '', endsAt: '', discountType: 'percentage', discountValue: 10, packageIds: [], showUpcoming: true }; }
export function SalesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirmDialog();
  const [sales, setSales] = useState<Sale[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<SaleInput>(initial);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.previewSale>> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => `${today().slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(today);
  const [campaignId, setCampaignId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [location, setLocation] = useState('');
  const [report, setReport] = useState<SaleReport | null>(null);
  const [overrideTypes, setOverrideTypes] = useState<Record<string, 'percentage' | 'fixed'>>({});
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.getSaleBookings>> | null>(null);
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    const [next, pkgs] = await Promise.all([api.getSales(), api.getPackages()]); setSales(next); setPackages(pkgs);
  }, []);
  useEffect(() => { void load().catch(err => setError(err.message)).finally(() => setLoading(false)); }, [load]);
  useEffect(() => {
    let cancelled = false; setReport(null); setRows(null);
    if (!dateFrom || !dateTo) return;
    void api.getSalesReport(dateFrom, dateTo, campaignId || undefined, { ...(packageId ? { packageId } : {}), ...(location ? { location } : {}) }).then(value => { if (!cancelled) setReport(value); }).catch(err => { if (!cancelled) setError(err.message); });
    if (campaignId) void api.getSaleBookings(campaignId, dateFrom, dateTo, page, { ...(packageId ? { packageId } : {}), ...(location ? { location } : {}) }).then(value => { if (!cancelled) setRows(value); }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [dateFrom, dateTo, campaignId, packageId, location, page, sales]);
  const run = async <T,>(work: () => Promise<T>): Promise<T | undefined> => { setBusy(true); setError(''); try { const result = await work(); await load(); return result; } catch (err) { setError(err instanceof Error ? err.message : 'Sale action failed'); } finally { setBusy(false); } };
  const open = (sale?: Sale) => {
    setPreview(null); setOverrideTypes({}); setEditing(sale?._id ?? 'new');
    setForm(sale ? { name: sale.name, description: sale.description, terms: sale.terms, startsAt: local(sale.startsAt), endsAt: local(sale.endsAt), discountType: sale.discountType, discountValue: sale.discountValue, packageIds: sale.packageIds, showUpcoming: sale.showUpcoming, overrides: sale.overrides ?? [] } : initial());
  };
  useEffect(() => {
    const editId = searchParams.get('edit');
    const resultsId = searchParams.get('results');
    const selected = sales.find(sale => sale._id === (editId || resultsId));
    if (!selected) return;
    if (editId) {
      if (['draft', 'paused'].includes(selected.state)) {
        setEditing(selected._id); setPreview(null); setOverrideTypes({});
        setForm({ name: selected.name, description: selected.description, terms: selected.terms, startsAt: local(selected.startsAt), endsAt: local(selected.endsAt), discountType: selected.discountType, discountValue: selected.discountValue, packageIds: selected.packageIds, showUpcoming: selected.showUpcoming, overrides: selected.overrides ?? [] });
      } else setError('Pause this sale before editing it. Archived sales are read-only.');
    }
    if (resultsId) {
      setCampaignId(selected._id); setPage(1);
      setDateFrom(new Date(+new Date(selected.startsAt) + 19800000).toISOString().slice(0, 10));
      setDateTo(new Date(+new Date(selected.endsAt) + 19800000).toISOString().slice(0, 10));
    }
    setSearchParams({}, { replace: true });
  }, [sales, searchParams, setSearchParams]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const payload = { ...form, overrides: form.overrides?.filter(row => form.packageIds.includes(row.packageId)), startsAt: new Date(`${form.startsAt}:00+05:30`).toISOString(), endsAt: new Date(`${form.endsAt}:00+05:30`).toISOString() };
      const sale = editing === 'new' ? await api.createSale(payload) : await api.updateSale(editing!, payload);
      navigate(`/admin/sales/${sale._id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the sale.'); }
    finally { setBusy(false); }
  };
  const publish = async (sale: Sale) => {
    await run(async () => {
      const result = await api.previewSale(sale._id); setPreview(result);
      if (result.overlaps.length) throw new Error(`Overlapping sale: ${result.overlaps.map(item => item.name).join(', ')}`);
      const accepted = await confirm({ title: `Publish ${sale.name}?`, description: result.allocations.map(item => `${item.packageName}: ${formatINR(item.basePrice)} → ${formatINR(item.salePrice)}`).join(' · '), confirmLabel: 'Publish sale' });
      if (accepted) { await api.saleAction(sale._id, 'publish'); setPreview(null); }
    });
  };
  if (user?.role !== 'owner') return <p>Only the owner can manage sales and view campaign revenue.</p>;
  return <div className="mx-auto max-w-7xl space-y-6 text-slate-900">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-slate-500">Packages</p><h1 className="text-2xl font-semibold">Sales & seasonal offers</h1><p className="mt-1 text-sm text-slate-600">Schedule offers and measure the bookings that used them.</p></div><button className={button} onClick={() => open()} disabled={busy}>Create sale</button></header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {sales.some(sale => !sale.enabled) && <p role="status" className="rounded-lg bg-amber-50 p-3">Sales are disabled. Existing booking prices remain available.</p>}
    {loading && <p>Loading sales…</p>}
    {editing && <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">{editing === 'new' ? 'Create a draft sale' : 'Edit sale'}</h2>
      {editing !== 'new' && <p className="text-sm text-slate-600">Changes are saved as a draft. Preview and publish the sale again to make the offer available. Existing booking prices stay unchanged.</p>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Sale name<input required minLength={2} maxLength={120} className={input} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label className="text-sm">Discount type<select className={input} value={form.discountType} onChange={event => setForm({ ...form, discountType: event.target.value as SaleInput['discountType'] })}><option value="percentage">Percentage</option><option value="fixed">Fixed amount (₹)</option></select></label>
      <label className="text-sm">Discount value<input required type="number" min="0.01" step="0.01" max={form.discountType === 'percentage' ? 100 : 10000000} className={input} value={form.discountValue} onChange={event => setForm({ ...form, discountValue: Number(event.target.value) })} /></label>
      <div className="self-end text-xs text-slate-600">All times are India time (IST). The end time is the instant the offer stops. To include 10 November fully, set the end to 11 November at 00:00.</div>
      <label className="text-sm">Starts at (IST)<input required type="datetime-local" className={input} value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} /></label>
      <label className="text-sm">Ends at (IST)<input required type="datetime-local" min={form.startsAt} className={input} value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} /></label></div>
      <label className="block text-sm">Description<textarea maxLength={2000} className={input} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
      <label className="block text-sm">Terms<textarea maxLength={4000} className={input} value={form.terms} onChange={event => setForm({ ...form, terms: event.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showUpcoming} onChange={event => setForm({ ...form, showUpcoming: event.target.checked })} />Announce this sale before it starts</label>
      <SalePackageSelector packages={packages} value={form} disabled={busy} onChange={next => {
        setForm(next);
        setOverrideTypes(current => Object.fromEntries(Object.entries(current).filter(([id]) => next.packageIds.includes(id))));
      }} />
      <fieldset className="space-y-2"><legend className="font-medium">Per-package discount overrides (optional)</legend><p className="text-xs text-slate-500">Leave blank to use the sale discount.</p>{packages.filter(pkg => form.packageIds.includes(pkg.id)).map(pkg => {
        const override = form.overrides?.find(row => row.packageId === pkg.id);
        return <div key={pkg.id} className="grid items-end gap-2 sm:grid-cols-3"><p className="text-sm">{pkg.name}</p><label className="text-xs">Override type<select className={input} value={override?.discountType ?? overrideTypes[pkg.id] ?? form.discountType} onChange={event => { setOverrideTypes({ ...overrideTypes, [pkg.id]: event.target.value as 'percentage' | 'fixed' }); if (override) setForm({ ...form, overrides: form.overrides?.map(row => row.packageId === pkg.id ? { ...row, discountType: event.target.value as 'percentage' | 'fixed' } : row) }); }}><option value="percentage">Percentage</option><option value="fixed">Fixed ₹</option></select></label><label className="text-xs">Override value<input className={input} type="number" min="0.01" step="0.01" value={override?.discountValue ?? ''} placeholder="Use sale discount" onChange={event => setForm({ ...form, overrides: [...(form.overrides ?? []).filter(row => row.packageId !== pkg.id), ...(event.target.value ? [{ packageId: pkg.id, discountType: override?.discountType ?? overrideTypes[pkg.id] ?? form.discountType, discountValue: Number(event.target.value) }] : [])] })} /></label></div>;
      })}</fieldset>
      <div className="flex gap-2"><button className={button} disabled={busy || !form.packageIds.length}>{busy ? 'Saving…' : editing === 'new' ? 'Save draft' : 'Save changes as draft'}</button><button type="button" className={button} disabled={busy} onClick={() => { if (editing === 'new') setEditing(null); else navigate(`/admin/sales/${editing}`); }}>Cancel</button></div>
    </form>}
    {preview && <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Price preview</h2>{preview.allocations.map(item => <p key={item.packageName}>{item.packageName}: {formatINR(item.basePrice)} → {formatINR(item.salePrice)} · Save {formatINR(item.discountAmount)}</p>)}</section>}
    <section className="grid gap-3 md:grid-cols-2">{sales.map(sale => <article key={sale._id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-2"><h2 className="font-semibold">{sale.name}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{sale.phase}</span></div><p className="text-sm">{sale.discountType === 'percentage' ? `${sale.discountValue}% off` : `${formatINR(sale.discountValue)} off`} · {sale.packageIds.length} packages</p><p className="text-xs text-slate-600">{saleDate(sale.startsAt)} – {saleDate(sale.endsAt)} IST</p><div className="flex flex-wrap gap-2">
      <Link className={button} to={`/admin/sales/${sale._id}`}>View details</Link>
      {['draft', 'paused'].includes(sale.state) && <><button className={button} disabled={busy} onClick={() => open(sale)}>Edit</button><button className={button} disabled={busy} onClick={() => void publish(sale)}>Preview & publish</button></>}
      {sale.state === 'published' && <button className={button} disabled={busy} onClick={() => void run(() => api.saleAction(sale._id, 'pause'))}>Pause</button>}
      {sale.state !== 'archived' && <button className={button} disabled={busy} onClick={() => void run(async () => { if (await confirm({ title: `Archive ${sale.name}?`, description: 'This stops new offer bookings. Historical prices and reports are retained.', confirmLabel: 'Archive' })) await api.saleAction(sale._id, 'archive'); })}>Archive</button>}
      <button className={button} onClick={() => { setCampaignId(sale._id); setDateFrom(new Date(+new Date(sale.startsAt) + 19800000).toISOString().slice(0, 10)); setDateTo(new Date(+new Date(sale.endsAt) + 19800000).toISOString().slice(0, 10)); setPage(1); }}>View results</button></div></article>)}</section>
    {!loading && !sales.length && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">Create your first seasonal sale to get started.</p>}
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold">Sale performance</h2><div className="flex flex-wrap gap-3"><label className="text-sm">Confirmed from<input type="date" className={input} value={dateFrom} onChange={event => { setDateFrom(event.target.value); setPage(1); }} /></label><label className="text-sm">Confirmed to<input type="date" className={input} value={dateTo} onChange={event => { setDateTo(event.target.value); setPage(1); }} /></label><label className="text-sm">Campaign<select className={input} value={campaignId} onChange={event => { setCampaignId(event.target.value); setPage(1); }}><option value="">All sales</option>{sales.map(sale => <option key={sale._id} value={sale._id}>{sale.name}</option>)}</select></label></div>
      <div className="flex flex-wrap gap-3"><label className="text-sm">Package<select className={input} value={packageId} onChange={event => { setPackageId(event.target.value); setPage(1); }}><option value="">All packages</option>{packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}</select></label><label className="text-sm">Venue / location<input className={input} list="sale-locations" placeholder="All locations" value={location} onChange={event => { setLocation(event.target.value); setPage(1); }} /><datalist id="sale-locations">{report?.locations.map(row => <option key={row._id} value={row._id} />)}</datalist></label></div>
      <p className="text-xs text-slate-500">Attributed bookings confirmed in this period. Lifetime collections include later payments; period collections include only payments in these dates. Cancelled bookings are excluded from booked revenue.</p>
      {report && <><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Original listed value', formatINR(report.summary.listedValue ?? 0)], ['Sale bookings', report.summary.bookings ?? 0], ['Booked revenue', formatINR(report.summary.bookedRevenue ?? 0)], ['Campaign discounts', formatINR(report.summary.campaignDiscount ?? 0)], ['Lifetime collections', formatINR(report.summary.lifetimeCollections ?? 0)], ['Collections in period', formatINR(report.summary.periodCollections ?? 0)], ['Outstanding', formatINR(report.summary.outstanding ?? 0)], ['Cancelled bookings', report.summary.cancelledBookings ?? 0], ['Average booking value', formatINR((report.summary.bookedRevenue ?? 0) / Math.max(report.summary.bookings ?? 0, 1))], ['Manual adjustments', formatINR(report.summary.adjustments ?? 0)], ['Cancelled collections', formatINR(report.summary.cancelledCollections ?? 0)], ['Overpayments', formatINR(report.summary.overpayments ?? 0)], ['Starting-price discount estimates', formatINR(report.summary.estimatedDiscount ?? 0)]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>
      {report.summary.startingFromBookings ? <p className="text-xs text-amber-700">{report.summary.startingFromBookings} starting-from bookings have estimated promotional savings, shown separately from confirmed campaign discounts.</p> : null}
      <div className="grid gap-4 md:grid-cols-2">{[{ title: 'Campaigns', values: report.campaigns }, { title: 'Venues / locations', values: report.locations }, { title: 'Packages', values: report.packages }, { title: 'Shoot types', values: report.shootTypes }, { title: 'Daily booked revenue', values: report.trend }].map(group => <div key={group.title}><h3 className="mb-2 font-medium">{group.title}</h3>{group.values.length ? group.values.map(item => <div className="flex justify-between border-b py-2 text-sm" key={item._id}><span>{'name' in item ? String(item.name) : item._id || 'Unknown'} · {item.bookings} bookings</span><span>{formatINR(item.bookedRevenue)}</span></div>) : <p className="text-sm text-slate-500">No sale bookings.</p>}</div>)}</div>
      <div><h3 className="font-medium">All bookings during sale dates</h3><p className="text-xs text-slate-500">Context only: includes bookings without the discount. Overlapping windows can include the same booking.</p>{report.calendarWindows.map(item => <p className="mt-2 text-sm" key={item.campaignId}>{item.name}: {item.bookings} bookings · {formatINR(item.bookedRevenue)}</p>)}</div></>}
      {rows && <div className="overflow-x-auto"><h3 className="mb-2 font-medium">Campaign bookings</h3><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Customer</th><th>Package</th><th>Venue</th><th>Status</th><th>Agreed</th></tr></thead><tbody>{rows.items.map(item => <tr key={item._id} className="border-t"><td className="p-2"><Link className="text-blue-700 underline" to={`/admin/bookings/${item._id}`}>{item.customerName}</Link></td><td>{item.packageName}</td><td>{item.location || 'Unknown'}</td><td>{item.status}</td><td>{item.agreedTotal == null ? 'Unpriced' : formatINR(item.agreedTotal)}</td></tr>)}</tbody></table><div className="mt-3 flex items-center gap-3"><button className={button} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} · {rows.total} bookings</span><button className={button} disabled={page * 25 >= rows.total} onClick={() => setPage(page + 1)}>Next</button></div></div>}
    </section>
  </div>;
}
