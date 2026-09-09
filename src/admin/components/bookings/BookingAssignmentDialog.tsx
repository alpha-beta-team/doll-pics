import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Booking, StaffAccountOption } from '../../types';
import { AdminButton } from '../ui';
import { BookingDialog } from './BookingDetailSections';

export function BookingAssignmentDialog({ booking, onClose, onSaved }: {
  booking: Booking;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
}) {
  const [staff, setStaff] = useState<StaffAccountOption[]>([]);
  const [assignee, setAssignee] = useState(booking.assignedStaffAccountId || '');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    void api.getAssignableStaffAccounts()
      .then(rows => { if (active) setStaff(rows); })
      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load staff'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const save = async () => {
    if (saving || loading || loadError || assignee === (booking.assignedStaffAccountId || '')) return;
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.updateBooking(booking.id, { assignedStaffAccountId: assignee || null });
      onSaved(updated);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BookingDialog title="Assign staff" onClose={() => { if (!saving) onClose(); }}>
      <p className="mb-4 text-sm text-admin-secondary">{booking.customerName || 'Unnamed customer'} · {booking.packageName || booking.shootType || 'Booking'}</p>
      {loadError ? <div role="alert" className="space-y-3 text-sm text-red-700"><p>{loadError}</p><AdminButton variant="secondary" onClick={() => setAttempt(value => value + 1)}>Retry staff loading</AdminButton></div> : (
        <form onSubmit={event => { event.preventDefault(); void save(); }}>
          <label className="block text-sm font-medium">
            Assigned staff
            <select value={assignee} disabled={loading || saving} onChange={event => setAssignee(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-admin-border bg-admin-surface px-3 outline-none focus-visible:ring-2 focus-visible:ring-admin-focus disabled:opacity-60">
              <option value="">No staff assigned</option>
              {booking.assignedStaffAccountId && !staff.some(option => option.id === booking.assignedStaffAccountId) && <option value={booking.assignedStaffAccountId}>{booking.assignedStaffAccountName || 'Current assignee'}</option>}
              {staff.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>
          {loading && <p role="status" className="mt-2 text-sm text-admin-subtle">Loading staff…</p>}
          {!loading && !staff.length && <p className="mt-2 text-sm text-admin-subtle">No assignable staff available.</p>}
          {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <AdminButton type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</AdminButton>
            <AdminButton type="submit" disabled={loading || saving || assignee === (booking.assignedStaffAccountId || '')}>{saving ? 'Saving…' : 'Save assignment'}</AdminButton>
          </div>
        </form>
      )}
    </BookingDialog>
  );
}
