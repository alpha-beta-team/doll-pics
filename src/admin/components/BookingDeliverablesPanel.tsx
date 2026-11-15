import { DeliverablePresetPicker } from './DeliverablePresetPicker';
import { useState } from 'react';
import { api } from '../api/client';
import type { Booking } from '../types';
import type { BookingDeliverable, DeliverableType, DeliverableConfiguration } from '../../shared/deliverables';
import { deliverableInputs } from '../../shared/deliverables';
import { DeliverablesEditor } from './DeliverablesEditor';

export function BookingDeliverablesPanel({ booking, canManage, canPrice, onSaved }: { booking: Booking; canManage: boolean; canPrice: boolean; onSaved: (booking: Booking) => void }) {
  const [editing, setEditing] = useState(false);
  const [configuration, setConfiguration] = useState<DeliverableConfiguration | null>(null);
  const [catalog, setCatalog] = useState<DeliverableType[]>([]);
  const [rows, setRows] = useState<BookingDeliverable[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState('');
  return <section className="space-y-3 rounded-xl border border-admin-border bg-white p-4" aria-label="Booking deliverables"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Deliverables</h2>{canManage && !editing && <button type="button" className="min-h-11 px-3 font-semibold text-admin-primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const [catalogItems, config] = await Promise.all([api.getDeliverables(), api.getDeliverableConfiguration()]); setCatalog(catalogItems); setConfiguration(config); setRows(booking.deliverables || []); setReason(''); setVersion(booking.updatedAt || ''); setEditing(true); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load deliverables'); } finally { setBusy(false); } }}>Edit deliverables</button>}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {editing ? <>{configuration && <DeliverablePresetPicker configuration={configuration} rows={rows} onApply={setRows} />}<DeliverablesEditor catalog={catalog} rows={rows} onChange={setRows} canPrice={canPrice} /><label className="block text-sm">Reason for change<input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label><div className="flex gap-3"><button type="button" disabled={busy || !reason.trim()} className="min-h-11 rounded-lg bg-admin-primary px-4 text-white" onClick={async () => { setBusy(true); setError(''); try { onSaved(await api.updateBooking(booking.id, { deliverables: deliverableInputs(rows), expectedUpdatedAt: version, deliverablesChangeReason: reason.trim() })); setEditing(false); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save deliverables'); } finally { setBusy(false); } }}>{busy ? 'Saving…' : 'Save deliverables'}</button><button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button></div></> : <>{!(booking.deliverables?.length) ? <p className="text-sm text-admin-subtle">No deliverables recorded.</p> : <ul className="divide-y divide-admin-border">{booking.deliverables.map(row => <li key={row.id} className="py-2 text-sm"><span className="font-semibold">{row.name} × {row.quantity}</span><span className="ml-2 capitalize">{row.category === 'extra' ? 'Paid extra' : row.category}</span>{canPrice && row.category === 'extra' && <span> · ₹{row.amount.toLocaleString('en-IN')} total</span>}<p className="text-admin-subtle">{row.specifications}{row.reason ? ` · ${row.reason}` : ''}</p></li>)}</ul>}</>}
  </section>;
}
