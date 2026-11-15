import './booking-crew-dialog.css';
import { useEffect, useState } from 'react';
import { CREW_SERVICE_LABELS, CrewServiceType } from '../../../shared/crew';
import type { BookingCrewMember } from '../../../shared/crew';
import { api } from '../../api/client';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import type { Booking, StaffAccountOption } from '../../types';
import { CrewListEditor } from '../CrewListEditor';
import { AdminButton } from '../ui';
import { BookingDialog } from './BookingDetailSections';

export function BookingCrewDialog({ booking, onClose, onSaved }: {
  booking: Booking;
  onClose: () => void;
  onSaved: (booking: Booking) => void;
}) {
  const confirm = useConfirmDialog();
  const [rows, setRows] = useState<BookingCrewMember[]>(() => booking.crewList ?? []);
  const [staff, setStaff] = useState<StaffAccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    void api.getAssignableStaffAccounts()
      .then(accounts => { if (active) setStaff(accounts); })
      .catch(reason => { if (active) setLoadError(reason instanceof Error ? reason.message : 'Could not load staff'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const close = async () => {
    if (saving) return;
    if (JSON.stringify(rows) !== JSON.stringify(booking.crewList ?? []) && !await confirm({
      title: 'Discard unsaved crew changes?', description: 'Your crew changes have not been saved.',
      confirmLabel: 'Discard changes', variant: 'danger',
    })) return;
    onClose();
  };

  const save = async () => {
    if (saving || loading || loadError) return;
    if (rows.some(row => !CREW_SERVICE_LABELS[row.serviceType] || !row.staffAccountId)) {
      setError('Select a service and member for every crew row'); return;
    }
    if (new Set(rows.map(row => `${row.serviceType}:${row.staffAccountId}`)).size !== rows.length) {
      setError('The same member is listed twice for a crew service'); return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateBooking(booking.id, {
        crewList: rows.map(({ serviceType, staffAccountId }) => ({ serviceType, staffAccountId })),
      });
      onSaved(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save crew');
    } finally { setSaving(false); }
  };

  return <BookingDialog className="admin-theme booking-crew-dialog" title="Edit crew" onClose={() => { void close(); }}>
    <p className="text-sm text-admin-subtle">{booking.customerName} · {booking.packageName || booking.shootType || 'Booking'}</p>
    {loading && <p role="status" className="mt-3 text-sm text-admin-subtle">Loading staff…</p>}
    {loadError && <div role="alert" className="mt-3 text-sm text-red-700"><p>{loadError}</p><AdminButton variant="secondary" onClick={() => setAttempt(value => value + 1)}>Retry staff loading</AdminButton></div>}
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); void save(); }}>
      <div role="region" aria-label="Crew list scroll area" className="min-h-0 min-w-0 overflow-y-auto overscroll-contain pb-4">
      <fieldset disabled={loading || saving || Boolean(loadError)} className="min-w-0 disabled:opacity-60">
        <CrewListEditor value={rows} staffAccounts={staff} onChange={setRows} showAddButton={false} />
      </fieldset>
      </div>
      {error && <p role="alert" className="shrink-0 pt-3 text-sm text-red-700">{error}</p>}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-admin-border bg-admin-surface pt-4" aria-label="Crew actions">
        <AdminButton type="button" variant="secondary" disabled={loading || saving || Boolean(loadError) || rows.length >= 100} onClick={() => setRows(current => [...current, { serviceType: CrewServiceType.CandidPhoto, staffAccountId: '', memberName: '' }])}>Add crew member</AdminButton>
        <div className="ml-auto flex gap-2">
        <AdminButton type="button" variant="secondary" disabled={saving} onClick={() => { void close(); }}>Cancel</AdminButton>
        <AdminButton type="submit" disabled={loading || saving || Boolean(loadError)}>{saving ? 'Saving…' : 'Save crew'}</AdminButton>
        </div>
      </div>
    </form>
  </BookingDialog>;
}
