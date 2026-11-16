import { useState } from 'react';
import { api } from '../../api/client';
import type { Booking } from '../../types';
import { AdminButton } from '../ui';
import { BookingDialog } from './BookingDetailSections';

export function BookingDueDateDialog({ booking, onClose, onSaved }: {
  booking: Booking;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
}) {
  const [date, setDate] = useState(booking.paymentDueDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (saving || date === (booking.paymentDueDate || '')) return;
    setSaving(true);
    setError('');
    try {
      onSaved(await api.updateBooking(booking.id, { paymentDueDate: date }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save payment due date');
    } finally { setSaving(false); }
  };

  return <BookingDialog className="admin-theme !bg-black/30" title={booking.paymentDueDate ? 'Edit due date' : 'Set due date'} onClose={() => { if (!saving) onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <label className="block text-sm font-medium">
        Payment due date
        <input type="date" value={date} disabled={saving} onChange={event => setDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 outline-none focus-visible:ring-2 focus-visible:ring-admin-focus" />
      </label>
      <p className="mt-2 text-sm text-admin-subtle">Leave blank to remove the due date.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <AdminButton type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</AdminButton>
        <AdminButton type="submit" disabled={saving || date === (booking.paymentDueDate || '')}>{saving ? 'Saving…' : 'Save due date'}</AdminButton>
      </div>
    </form>
  </BookingDialog>;
}
