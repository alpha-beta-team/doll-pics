import type { ConfirmDialogRequest } from '../hooks/useConfirmDialog';
import { BookingRecordIcon } from './bookings/BookingRecordIcon';
import { FormTextarea } from './ui/FormControls';
import { AdminAlert } from './ui/AdminUi';
import { Pencil } from 'lucide-react';
import { BookingDialog } from './bookings/BookingDetailSections';
import { DeliverablePresetPicker } from './DeliverablePresetPicker';
import { useState } from 'react';
import { api } from '../api/client';
import type { Booking } from '../types';
import type { BookingDeliverable, DeliverableType, DeliverableConfiguration } from '../../shared/deliverables';
import { deliverableInputs } from '../../shared/deliverables';
import { DeliverablesEditor } from './DeliverablesEditor';

export function BookingDeliverablesPanel({ booking, canManage, canPrice, onSaved, confirm, presentation = 'default' }: { booking: Booking; canManage: boolean; canPrice: boolean; onSaved: (booking: Booking) => void; confirm?: ConfirmDialogRequest; presentation?: 'default' | 'record' }) {
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [configuration, setConfiguration] = useState<DeliverableConfiguration | null>(null);
  const [catalog, setCatalog] = useState<DeliverableType[]>([]);
  const [rows, setRows] = useState<BookingDeliverable[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState('');
  async function close() {
    if (busy) return;
    if (confirm && (reason.trim() || JSON.stringify(rows) !== JSON.stringify(booking.deliverables || [])) &&
      !await confirm({ title: 'Discard deliverable changes?', description: 'Your deliverable changes have not been saved.', confirmLabel: 'Discard changes', variant: 'danger' })) return;
    setEditing(false);
  }
  return <section className="min-w-0 rounded-xl border border-admin-border bg-admin-surface p-4" aria-label="Booking deliverables"><div className="flex min-h-11 items-center justify-between gap-3"><h2 className="font-semibold">Deliverables <span className="ml-1 text-sm font-normal text-admin-subtle">· {booking.deliverables?.length || 0}</span></h2>{canManage && <button type="button" aria-label={presentation === 'record' ? "Manage deliverables" : "Edit deliverables"} title="Edit deliverables" className={presentation === 'record' ? "bd-small-action bd-manage-deliverables" : "inline-flex h-11 w-11 items-center justify-center rounded-lg text-purple-700 hover:bg-purple-50 hover:text-purple-800 focus-visible:outline-purple-600 disabled:opacity-50"} disabled={busy || editing} onClick={async () => { setBusy(true); setError(''); try { const [catalogItems, config] = await Promise.all([api.getDeliverables(), api.getDeliverableConfiguration()]); setCatalog(catalogItems); setConfiguration(config); setRows(booking.deliverables || []); setReason(''); setVersion(booking.updatedAt || ''); setEditing(true); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load deliverables'); } finally { setBusy(false); } }}><>{presentation === 'record' ? <><BookingRecordIcon name="Manage" />Manage</> : <Pencil className="h-4 w-4" aria-hidden="true" />}</></button>}</div>
    {error && !editing && <AdminAlert as="span">{error}</AdminAlert>}
    {editing && <BookingDialog dismissOnBackdrop={presentation === 'record'} title="Edit deliverables"
      subtitle={presentation === 'record' ? `Items promised to ${[booking.customerName, booking.customerCode].filter(Boolean).join(' · ')}` : undefined}
      className={presentation === 'record' ? 'admin-theme bd-record-drawer' : 'admin-theme'}
      variant={presentation === 'record' ? 'drawer' : 'modal'} onClose={() => void close()}>
      <form className="bd-deliverable-form" onSubmit={async event => {
        event.preventDefault();
        if (busy || !reason.trim()) return;
        setBusy(true); setError('');
        try {
          onSaved(await api.updateBooking(booking.id, { deliverables: deliverableInputs(rows), expectedUpdatedAt: version, deliverablesChangeReason: reason.trim() }));
          setEditing(false);
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save deliverables'); }
        finally { setBusy(false); }
      }}>
        <fieldset disabled={busy} className="bd-drawer-body space-y-4">
          {configuration && <DeliverablePresetPicker record={presentation === 'record'} configuration={configuration} rows={rows} onApply={setRows} />}
          <DeliverablesEditor catalog={catalog} rows={rows} onChange={setRows} canPrice={canPrice} />
          <label className="block text-sm font-semibold">Reason for change
            <FormTextarea rows={2} required placeholder="e.g. Customer added a second frame at the shoot" className="mt-2" maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} />
          </label>
          <p className="text-xs text-admin-subtle">Saved to the booking’s activity log.</p>
        </fieldset>
        {error && <AdminAlert as="span">{error}</AdminAlert>}
        <footer className="bd-drawer-footer">
          <small>Changes update the booking total and the customer page.</small>
          <button type="button" disabled={busy} onClick={() => void close()}>Cancel</button>
          <button type="submit" disabled={busy || !reason.trim()}>{busy ? 'Saving…' : 'Save deliverables'}</button>
        </footer>
      </form>
    </BookingDialog>}
    {!(booking.deliverables?.length) ? <p className="py-2 text-sm text-admin-subtle">No deliverables recorded.</p> : <>
      {presentation === 'record' ? <div className="bd-deliverables-table-wrap"><table className="bd-deliverables-table"><thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Billing</th>{canPrice && <th scope="col">Amount</th>}</tr></thead><tbody>{(showAll ? booking.deliverables : booking.deliverables.slice(0, 3)).map(row => <tr key={row.id}><td>{row.name}{row.specifications && <span className="bd-deliverable-specification"> · {row.specifications}</span>}{row.reason && <span className="bd-deliverable-reason">{row.reason}</span>}</td><td>{row.quantity}</td><td><span className={`bd-record-badge ${row.category === 'extra' ? 'is-extra' : ''}`}>{row.category === 'included' ? 'Included' : row.category === 'extra' ? 'Paid extra' : 'Complimentary'}</span></td>{canPrice && <td className={row.category === 'extra' ? 'bd-currency' : 'bd-muted'}>{row.category === 'extra' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(row.amount) : '—'}</td>}</tr>)}</tbody></table></div> : <>
      <ul className="divide-y divide-admin-border">{(showAll ? booking.deliverables : booking.deliverables.slice(0, 3)).map(row => <li key={row.id} className="flex items-start justify-between gap-4 py-2 text-sm">
        <div className="min-w-0"><p className="break-words font-medium">{row.name}</p>{(row.specifications || row.reason) && <p className="break-words text-xs text-admin-subtle">{[row.specifications, row.reason].filter(Boolean).join(' · ')}</p>}{row.category !== 'included' && <p className="text-xs text-admin-subtle">{row.category === 'extra' ? 'Paid extra' : 'Complimentary'}{canPrice && row.category === 'extra' && ` · ₹${row.amount.toLocaleString('en-IN')} total`}</p>}</div>
        <span className="shrink-0 font-medium tabular-nums">×{row.quantity}</span>
      </li>)}</ul>
      {booking.deliverables.some(row => row.category === 'included') && <p className="pt-2 text-xs text-admin-subtle">{booking.deliverables.every(row => row.category === 'included') ? 'Included in package' : 'Included in package unless marked otherwise'}</p>}
      </>}
      {booking.deliverables.length > 3 && <button type="button" aria-expanded={showAll} onClick={() => setShowAll(value => !value)} className={presentation === 'record' ? "bd-record-link" : "min-h-11 text-sm font-semibold text-admin-primary"}>{showAll ? 'Show less' : presentation === 'record' ? `Show all ${booking.deliverables.length} items` : `View all ${booking.deliverables.length} deliverables`}{presentation === 'record' && <BookingRecordIcon name="Expand" className={showAll ? "rotate-180" : undefined} />}</button>}
    </>}
  </section>;
}
