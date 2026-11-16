import { Pencil } from 'lucide-react';
import { BookingDialog } from './bookings/BookingDetailSections';
import { DeliverablePresetPicker } from './DeliverablePresetPicker';
import { useState } from 'react';
import { api } from '../api/client';
import type { Booking } from '../types';
import type { BookingDeliverable, DeliverableType, DeliverableConfiguration } from '../../shared/deliverables';
import { deliverableInputs } from '../../shared/deliverables';
import { DeliverablesEditor } from './DeliverablesEditor';

export function BookingDeliverablesPanel({ booking, canManage, canPrice, onSaved }: { booking: Booking; canManage: boolean; canPrice: boolean; onSaved: (booking: Booking) => void }) {
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [configuration, setConfiguration] = useState<DeliverableConfiguration | null>(null);
  const [catalog, setCatalog] = useState<DeliverableType[]>([]);
  const [rows, setRows] = useState<BookingDeliverable[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState('');
  return <section className="min-w-0 rounded-xl border border-admin-border bg-admin-surface p-4" aria-label="Booking deliverables"><div className="flex min-h-11 items-center justify-between gap-3"><h2 className="font-semibold">Deliverables <span className="ml-1 text-sm font-normal text-admin-subtle">· {booking.deliverables?.length || 0}</span></h2>{canManage && <button type="button" aria-label="Edit deliverables" title="Edit deliverables" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-purple-700 hover:bg-purple-50 hover:text-purple-800 focus-visible:outline-purple-600 disabled:opacity-50" disabled={busy || editing} onClick={async () => { setBusy(true); setError(''); try { const [catalogItems, config] = await Promise.all([api.getDeliverables(), api.getDeliverableConfiguration()]); setCatalog(catalogItems); setConfiguration(config); setRows(booking.deliverables || []); setReason(''); setVersion(booking.updatedAt || ''); setEditing(true); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load deliverables'); } finally { setBusy(false); } }}><Pencil className="h-4 w-4" aria-hidden="true" /></button>}</div>
    {error && !editing && <p role="alert" className="text-red-700">{error}</p>}
    {editing && <BookingDialog title="Edit deliverables" className="admin-theme" variant="drawer" onClose={() => { if (!busy) setEditing(false); }}><div className="space-y-4">{error && <p role="alert" className="text-red-700">{error}</p>}{configuration && <DeliverablePresetPicker configuration={configuration} rows={rows} onApply={setRows} />}<DeliverablesEditor catalog={catalog} rows={rows} onChange={setRows} canPrice={canPrice} /><label className="block text-sm">Reason for change<input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label><div className="flex gap-3"><button type="button" disabled={busy || !reason.trim()} className="min-h-11 rounded-lg bg-admin-primary px-4 text-white" onClick={async () => { setBusy(true); setError(''); try { onSaved(await api.updateBooking(booking.id, { deliverables: deliverableInputs(rows), expectedUpdatedAt: version, deliverablesChangeReason: reason.trim() })); setEditing(false); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save deliverables'); } finally { setBusy(false); } }}>{busy ? 'Saving…' : 'Save deliverables'}</button><button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button></div></div></BookingDialog>}
    {!(booking.deliverables?.length) ? <p className="py-2 text-sm text-admin-subtle">No deliverables recorded.</p> : <>
      <ul className="divide-y divide-admin-border">{(showAll ? booking.deliverables : booking.deliverables.slice(0, 3)).map(row => <li key={row.id} className="flex items-start justify-between gap-4 py-2 text-sm">
        <div className="min-w-0"><p className="break-words font-medium">{row.name}</p>{(row.specifications || row.reason) && <p className="break-words text-xs text-admin-subtle">{[row.specifications, row.reason].filter(Boolean).join(' · ')}</p>}{row.category !== 'included' && <p className="text-xs text-admin-subtle">{row.category === 'extra' ? 'Paid extra' : 'Complimentary'}{canPrice && row.category === 'extra' && ` · ₹${row.amount.toLocaleString('en-IN')} total`}</p>}</div>
        <span className="shrink-0 font-medium tabular-nums">×{row.quantity}</span>
      </li>)}</ul>
      {booking.deliverables.some(row => row.category === 'included') && <p className="pt-2 text-xs text-admin-subtle">{booking.deliverables.every(row => row.category === 'included') ? 'Included in package' : 'Included in package unless marked otherwise'}</p>}
      {booking.deliverables.length > 3 && <button type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)} className="min-h-11 text-sm font-semibold text-admin-primary">{showAll ? 'Show less' : `View all ${booking.deliverables.length} deliverables`}</button>}
    </>}
  </section>;
}
