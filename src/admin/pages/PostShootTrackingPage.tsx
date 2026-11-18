import './booking-detail.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { api } from '../api/client';
import { orderWorkflowApi } from '../api/orderWorkflow';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { queues, queueFor, isOverdue, trackingActions, type TrackingResult, type TrackingRow, type Queue } from '../components/postShootTracking';
import { BulkOrderUpdate } from '../components/bookings/BulkOrderUpdate';
import { OrderWorkflowPanel, type OrderWorkflowHandle } from '../components/bookings/OrderWorkflowPanel';
import { BookingDialog } from '../components/bookings/BookingDetailSections';
import { orderDate, type OrderStage } from '../../shared/orderWorkflow';
import type { Booking, StaffAccountOption } from '../types';
const control = 'h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-700 focus:outline-none focus:ring-1 focus:ring-violet-700 disabled:opacity-50';
const secondary = `${control} hover:bg-slate-50`;
const primary = 'h-9 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:opacity-50';
const stageLabels: Record<Queue, string> = {
  photos: 'Share photos',
  selection: 'Customer selection',
  editing: 'Editing',
  edited: 'Share edits',
  print_selection: 'Print selection',
  print: 'Ready to print',
  prints: 'Awaiting prints',
  handover: 'Handover',
  receipt: 'Confirm delivery',
  delivered: 'Delivered',
  setup: 'Setup needed',
  cancelled: 'Cancelled',
};
const filtersFromParams = (params: URLSearchParams) => ({
  search: params.get('search') || '', from: params.get('from') || '', to: params.get('to') || '',
  stage: params.get('stage') || (params.get('scope') === 'delivered' ? 'delivered' : ''),
  scope: params.get('scope') === 'overdue' || params.get('filter') === 'overdue' ? 'overdue' : 'all',
});
const day = (value: string) => value ? new Date(`${value}T12:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not recorded';
function TrackingDialog({ booking, staff, canManage, autoOpen, actionStage, onClose, onSaved }: { booking: Booking; staff: StaffAccountOption[]; canManage: boolean; autoOpen: boolean; actionStage?: OrderStage; onClose: () => void; onSaved: () => void }) {
  const panel = useRef<OrderWorkflowHandle>(null), opened = useRef(false);
  const ready = useCallback((value: boolean) => {
    if (value && autoOpen && !opened.current) { opened.current = true; setTimeout(() => panel.current?.openStatus(actionStage), 0); }
  }, [autoOpen, actionStage]);
  return <BookingDialog title={`Order tracking · ${booking.customerName}`} className="admin-theme booking-detail" onClose={onClose}>
    <Link to={`/admin/bookings/${booking.id}`} className="mb-3 inline-block text-sm font-semibold text-violet-700 underline">Open booking details / Follow up</Link>
    <OrderWorkflowPanel ref={panel} booking={booking} staff={staff} canManage={canManage} onSaved={onSaved} onReadyChange={ready} />
  </BookingDialog>;
}
export function PostShootTrackingPage() {
  const { canManage } = useFeatureAccess('bookings');
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<TrackingResult>({ rows: [], counts: { all: 0, stages: {}, stage: 0, overdue: 0 } });
  const rows = result.rows;
  const [staff, setStaff] = useState<StaffAccountOption[]>([]);
  const rowCache = useRef(new Map<string, TrackingRow>());
  const scope = params.get('scope') === 'overdue' || params.get('filter') === 'overdue' ? 'overdue' : 'all';
  const query = params.get('search') || '', from = params.get('from') || '', to = params.get('to') || '';
  const stage = params.get('stage') || (params.get('scope') === 'delivered' ? 'delivered' : '');
  const filters = useMemo(() => ({ search: query, from, to, stage, scope }), [query, from, to, stage, scope]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set()), [bulk, setBulk] = useState<TrackingRow[] | null>(null);
  const [individual, setIndividual] = useState<{ booking: Booking; action: boolean; actionStage?: OrderStage } | null>(null), [opening, setOpening] = useState('');
  const [now, setNow] = useState(Date.now());
  const requestSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true); setError('');
    try {
      const data = await orderWorkflowApi.list(filters);
      if (sequence !== requestSequence.current) return;
      data.rows.forEach(row => rowCache.current.set(row.id, row));
      setResult(data); setNow(Date.now());
    } catch (cause) { if (sequence === requestSequence.current) { setError(cause instanceof Error ? cause.message : 'Could not load orders'); throw cause; } }
    finally { if (sequence === requestSequence.current) setLoading(false); }
  }, [filters]);
  useEffect(() => {
    void load().catch(() => {});
    const sequence = requestSequence;
    return () => { sequence.current++; };
  }, [load]);
  useEffect(() => { if (canManage) void api.getAssignableStaffAccounts().then(setStaff).catch(() => setNotice('Staff options unavailable. Refresh to retry.')); }, [canManage]);
  useEffect(() => { const timer = setInterval(() => { void load().catch(() => {}); }, 60000); return () => clearInterval(timer); }, [load]);
  const applyFilters = (next: URLSearchParams) => {
    const nextFilters = filtersFromParams(next);
    const unchanged = (Object.keys(filters) as Array<keyof typeof filters>).every(key => filters[key] === nextFilters[key]);
    // Changed filters load after navigation commits. Re-clicks refresh explicitly.
    setParams(next);
    if (unchanged) void load().catch(() => {});
  };
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.delete('page'); applyFilters(next); };
  const filtered = rows;
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
  const visible = filtered.slice((page - 1) * 25, page * 25);
  const selectedRows = [...selected].map(id => rowCache.current.get(id)).filter((row): row is TrackingRow => Boolean(row));
  const hiddenSelected = selectedRows.filter(row => !filtered.some(item => item.id === row.id)).length;
  const selectPage = (checked: boolean) => setSelected(current => { const next = new Set(current); visible.forEach(row => checked ? next.add(row.id) : next.delete(row.id)); return next; });
  const allPage = visible.length > 0 && visible.every(row => selected.has(row.id));
  const open = async (row: TrackingRow, action: boolean, actionStage?: OrderStage) => {
    if (opening) return;
    setOpening(row.id); setError('');
    try { const booking = await api.getBooking(row.id); if (!booking) throw new Error('Booking no longer available'); setIndividual({ booking, action, actionStage }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open order'); }
    finally { setOpening(''); }
  };
  const refresh = () => { void load().catch(() => {}); if (canManage) void api.getAssignableStaffAccounts().then(setStaff).catch(() => setNotice('Staff options unavailable. Try Refresh again.')); };
  const completed = async (ids: string[]) => { setSelected(current => new Set([...current].filter(id => !ids.includes(id)))); await load(); };
  const movePage = (value: number) => { const next = new URLSearchParams(params); next.set('page', String(value)); setParams(next); };
  const stages = [
    { key: '', label: 'All stages', shortLabel: 'All stages', count: result.counts.all },
    ...Object.entries(queues).filter(([key]) => key !== 'delivered' && key !== 'cancelled').map(([key, queue]) => ({ key, label: queue.label, shortLabel: stageLabels[key as Queue], count: result.counts.stages[key as Queue] || 0 })),
  ];
  const hasFilters = Boolean(query || stage || from || to || scope === 'overdue');
  const clearFilters = () => { const next = new URLSearchParams(params); ['search', 'stage', 'from', 'to', 'page', 'scope', 'filter'].forEach(key => next.delete(key)); applyFilters(next); };
  const changeStage = (value: string) => { const next = new URLSearchParams(params); if (value) next.set('stage', value); else next.delete('stage'); next.delete('scope'); next.delete('filter'); next.delete('page'); applyFilters(next); };
  const changeScope = (value: string) => { const next = new URLSearchParams(params); next.set('scope', value); if (stage) next.set('stage', stage); next.delete('filter'); next.delete('page'); applyFilters(next); };
  const renderActions = (row: TrackingRow, mobile = false) => <div className={mobile ? 'flex flex-wrap items-center gap-2 pt-1' : 'flex flex-col items-start gap-2'}>
    {canManage && trackingActions(row).map(action => <button
      key={action.stage || 'initialize'}
      className="inline-flex min-h-9 items-center rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-left text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
      title={action.label}
      disabled={Boolean(opening) || loading || Boolean(error)}
      onClick={() => void open(row, true, action.stage)}
    >{opening === row.id ? 'Opening…' : action.label}</button>)}
    <button className={`${mobile ? 'min-h-9' : ''} text-xs text-slate-600 underline underline-offset-2 disabled:opacity-50`} disabled={Boolean(opening)} onClick={() => void open(row, false)}>View tracking</button>
  </div>;
  return <main className="post-shoot-tracking min-h-screen min-w-0 rounded-2xl bg-slate-50 p-3 text-slate-900 [&_button]:focus-visible:outline-violet-700">
    {error && <p role="alert" className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error} <button className="font-semibold underline" onClick={refresh}>Retry loading</button></p>}
    {notice && <p role="status" className="mb-3 text-sm text-slate-600">{notice} <button className="underline" onClick={() => setNotice('')}>Dismiss</button></p>}
    <section aria-label="Order workspace" className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(31,35,48,0.035)]">
      <header className="space-y-2 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Post-Shoot Tracking</h1>
          <div className="order-3 flex min-w-0 flex-[1_1_100%] flex-wrap items-center gap-2 sm:order-none sm:basis-[420px]">
          <label className="relative min-w-0 flex-[1_1_240px]"><span className="sr-only">Search orders</span><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input className={`${control} tracking-search w-full pl-9`} value={query} placeholder="Customer, phone or reference" onChange={event => change('search', event.target.value)} /></label>
          <div role="group" aria-label="Shoot date range" className="flex h-9 max-w-full items-center gap-2 rounded-lg border border-slate-200 px-2 text-slate-600">
            <input type="date" aria-label="Shoot from" title="Shoot from" className="h-8 min-w-0 w-32 border-0 bg-transparent text-xs text-slate-900 focus:outline-violet-700" value={from} onChange={event => change('from', event.target.value)} /><span aria-hidden="true" className="text-xs">–</span><input type="date" aria-label="Shoot to" title="Shoot to" className="h-8 min-w-0 w-32 border-0 bg-transparent text-xs text-slate-900 focus:outline-violet-700" value={to} min={from} onChange={event => change('to', event.target.value)} />
          </div>
          {hasFilters && <button className="h-9 text-xs font-semibold text-violet-700 underline" onClick={clearFilters}>Clear filters</button>}
        </div>
          <button title="Refresh orders" aria-label="Refresh orders" className={`${secondary} ml-auto inline-flex w-9 shrink-0 items-center justify-center p-0`} disabled={loading || Boolean(bulk)} onClick={refresh}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        <div role="group" aria-label="Order stages" className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
          {stages.map(({ key, label, shortLabel, count }) => <button key={key} title={label} aria-label={label} aria-pressed={stage === key} onClick={() => changeStage(key)} className={`inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors sm:h-8 ${stage === key ? 'border-transparent bg-violet-100 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'}`}>{shortLabel}<span className="rounded-full bg-white px-1.5 text-[11px] leading-5 tabular-nums">{count}</span></button>)}
        </div>
      </header>
      {stage === 'edited' && <p className="border-b border-slate-200 bg-sky-50 px-4 py-2 text-xs text-sky-700">Editing and edited-photo sharing use the same stored editing stage. Open an order’s sharing preview to confirm when its edited photos are ready and shared.</p>}
      <div className="flex min-h-8 flex-wrap items-center gap-3 px-4 py-1 text-xs text-slate-600">
        <div role="group" aria-label="Stage status" className="flex gap-2">
          {[{ key: 'all', label: 'All', count: result.counts.stage }, { key: 'overdue', label: 'Overdue', count: result.counts.overdue }].map(({ key, label, count }) => <button key={key} aria-label={label} aria-pressed={scope === key} onClick={() => changeScope(key)} className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 font-medium transition-colors ${scope === key ? 'border-transparent bg-violet-100 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'}`}>{label}<span className="rounded-full bg-white px-1.5 text-[11px] leading-5 tabular-nums">{count}</span></button>)}
        </div>
        <span role="status">{loading ? 'Loading orders…' : `${filtered.length} matching orders`}</span>
        {canManage && selectedRows.length > 0 && <div role="region" aria-label="Order selection" className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <span className="font-semibold text-slate-900">{selectedRows.length} orders selected</span>
          {hiddenSelected > 0 && <span>{hiddenSelected} outside current filters.</span>}
          {filtered.length > 0 && <button disabled={loading || Boolean(error)} className="font-semibold text-violet-700 underline" onClick={() => setSelected(new Set(filtered.map(row => row.id)))}>Select all {filtered.length} matching orders</button>}
          <button className="h-9 font-semibold text-slate-600 underline" onClick={() => setSelected(new Set())}>Clear selection</button>
          <button className={primary} disabled={loading || Boolean(error)} onClick={() => setBulk(selectedRows)}>Bulk update</button>
        </div>}
      </div>
      <div className="max-h-[65vh] overflow-auto"><div className="divide-y divide-slate-200 md:hidden">{canManage && visible.length > 0 && <label className="flex items-center gap-2 bg-slate-50 px-3 py-2 text-xs text-slate-600"><input type="checkbox" aria-label="Select current page on mobile" className="accent-violet-700" checked={allPage} disabled={loading || Boolean(error)} onChange={event => selectPage(event.target.checked)} />Select current page</label>}{visible.map(row => { const queue = queues[queueFor(row)]; return <article key={row.id} className={`space-y-2 p-3 text-sm ${selected.has(row.id) ? 'bg-violet-50' : ''}`}><div className="flex items-start gap-3">{canManage && <input type="checkbox" aria-label={`Select ${row.customerName} on mobile`} className="mt-1 accent-violet-700" checked={selected.has(row.id)} disabled={loading || Boolean(error)} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} />}<div className="min-w-0 flex-1"><Link to={`/admin/bookings/${row.id}`} className="font-semibold text-slate-900">{row.customerName}</Link><p className="text-xs text-slate-600">{row.customerPhone || 'Phone not recorded'}</p><p className="break-all text-[11px] text-slate-500">{row.customerCode && `${row.customerCode} · `}{row.reference}</p></div><span className={`max-w-[45%] rounded px-2 py-1 text-xs font-medium ${queue.tone}`}>{queue.label}</span></div><p className="text-xs text-slate-600">Shoot type: {row.shootType?.trim() || 'Not recorded'}</p><p className="text-xs text-slate-600">Shoot {day(row.bookingDate)} · {row.order?.assigneeName || 'Unassigned'}{row.order?.mode === 'digital' && ' · Digital only'}</p><p className="text-xs text-slate-600">Next: {row.order?.details.nextAction || queue.action}</p>{row.order?.details.blocker && <p className="text-xs text-rose-700">Blocked: {row.order.details.blocker}</p>}<p className="text-xs text-slate-600">{row.order?.stage === 'editing' && row.order.state === 'active' && row.order.editingDueAt ? `Due ${orderDate(row.order.editingDueAt)} IST` : 'No active deadline'}{isOverdue(row, now) && <span className="ml-2 rounded bg-rose-50 px-2 py-1 text-rose-700">Overdue</span>}</p>{renderActions(row, true)}</article>; })}</div><table className="hidden w-full min-w-[800px] text-left text-sm md:table"><thead className="sticky top-0 z-10 border-y border-slate-200 bg-slate-50 text-xs text-slate-600"><tr>{canManage && <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select current page" className="accent-violet-700" disabled={loading || Boolean(error) || !visible.length} checked={allPage} ref={element => { if (element) element.indeterminate = !allPage && visible.some(row => selected.has(row.id)); }} onChange={event => selectPage(event.target.checked)} /></th>}{['Customer / Booking', 'Shoot type', 'Shoot date', 'Stage / Next action', 'Due date · IST', 'Actions'].map(label => <th key={label} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{visible.map(row => { const queue = queues[queueFor(row)]; const overdue = isOverdue(row, now); return <tr key={row.id} className={selected.has(row.id) ? 'bg-violet-50' : 'hover:bg-slate-50'}>{canManage && <td className="px-3 py-3 align-top"><input type="checkbox" aria-label={`Select ${row.customerName}`} className="accent-violet-700" checked={selected.has(row.id)} disabled={loading || Boolean(error)} onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /></td>}<td className="max-w-60 px-3 py-3 align-top"><Link to={`/admin/bookings/${row.id}`} className="font-semibold text-slate-900 hover:text-violet-700 hover:underline">{row.customerName}</Link><p className="mt-1 text-xs text-slate-600">{row.customerPhone || 'Phone not recorded'}</p><p className="mt-1 break-all text-[11px] text-slate-500">{row.customerCode && `${row.customerCode} · `}{row.reference}</p></td><td className="max-w-40 break-words px-3 py-3 align-top text-xs text-slate-600">{row.shootType?.trim() || 'Not recorded'}</td><td className="whitespace-nowrap px-3 py-3 align-top text-xs text-slate-600">{day(row.bookingDate)}</td><td className="max-w-64 px-3 py-3 align-top"><span className={`inline-block rounded px-2 py-1 text-xs font-medium ${queue.tone}`}>{queue.label}</span><p className="mt-1.5 text-xs text-slate-600">{row.order?.details.nextAction || queue.action}</p>{row.order?.details.blocker && <p className="mt-1 text-xs text-rose-700">Blocked: {row.order.details.blocker}</p>}{row.order?.mode === 'digital' && <p className="mt-1 text-[11px] text-slate-500">Digital only</p>}</td><td className="px-3 py-3 align-top text-xs text-slate-600">{row.order?.stage === 'editing' && row.order.state === 'active' && row.order.editingDueAt ? <>{orderDate(row.order.editingDueAt)}{overdue && <span className="mt-1 block w-fit rounded bg-rose-50 px-2 py-1 font-medium text-rose-700">Overdue</span>}</> : 'No active deadline'}</td><td className="px-3 py-3 align-top">{renderActions(row)}</td></tr>; })}</tbody></table>{!loading && !visible.length && <div className="p-10 text-center text-sm text-slate-600">No orders match these filters. <button className="text-violet-700 underline" onClick={() => setParams({})}>Reset filters</button></div>}</div>
      <footer className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-600"><span>Page {page} of {pageCount} · 25 per page</span><div className="flex gap-2"><button aria-label="Previous page" className={secondary} disabled={page <= 1 || loading} onClick={() => movePage(page - 1)}><ChevronLeft size={15} /></button><button aria-label="Next page" className={secondary} disabled={page >= pageCount || loading} onClick={() => movePage(page + 1)}><ChevronRight size={15} /></button></div></footer>
    </section>
    {bulk && <BulkOrderUpdate rows={bulk} staff={staff} onClose={() => setBulk(null)} onUpdated={completed} />}
    {individual && <TrackingDialog booking={individual.booking} autoOpen={individual.action} actionStage={individual.actionStage} staff={staff} canManage={canManage} onClose={() => setIndividual(null)} onSaved={() => { void load().catch(() => {}); void api.getBooking(individual.booking.id).then(booking => { if (booking) setIndividual(current => current ? { ...current, booking } : null); }).catch(() => setNotice('Order updated. Reopen tracking to refresh booking details.')); }} />}
  </main>;
}
