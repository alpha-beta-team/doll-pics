import { useRef, useState } from 'react';
import { BookingDialog } from './BookingDetailSections';
import { formatCustomerName } from '../../../shared/formatCustomerName';
export function BookingCancellationDialog({ customerName, onClose, onConfirm }: {
  customerName: string; onClose: () => void; onConfirm: (reason: string) => Promise<boolean | undefined>;
}) {
  const [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  return <BookingDialog title="Cancel this booking?" onClose={() => { if (!lock.current) onClose(); }}><form className="space-y-4" onSubmit={event => {
    event.preventDefault(); if (!reason.trim() || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    void onConfirm(reason.trim()).then(saved => { if (saved) onClose(); else setError('Could not cancel booking. Please try again.'); })
      .catch(error => setError(error instanceof Error ? error.message : 'Could not cancel booking.'))
      .finally(() => { lock.current = false; setBusy(false); });
  }}><p>The booking for {formatCustomerName(customerName)} will be cancelled.</p><label className="block">Reason for cancellation<textarea className="mt-2 block min-h-[90px] w-full rounded-lg border border-admin-border p-3" required maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>{error && <p role="alert" className="text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" className="bd-button min-h-[38px] rounded-lg border border-admin-border px-4" disabled={busy} onClick={onClose}>Keep booking</button><button type="submit" className="bd-button min-h-[38px] rounded-lg bg-red-700 px-4 text-white" disabled={busy || !reason.trim()}>{busy ? 'Cancelling…' : 'Cancel booking'}</button></div></form></BookingDialog>;
}
