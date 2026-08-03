import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { SHOOT_TYPE_OPTIONS } from '../../lib/shootTypes';
import type { Booking, BookingWritePayload, Enquiry, Package, PaymentMethod, TeamMember } from '../types';
import { packagePrefill } from './bookingForm.utils';
import { bookingDurationLabel, bookingTimeWindowError } from '../../shared/bookingTime';

type Props = {
  booking?: Booking | null;
  enquiry?: Enquiry | null;
  packages: Package[];
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: (payload: BookingWritePayload) => Promise<void>;
};

type BookingDraft = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shootType: string;
  preferredEvent: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  packageId: string;
  agreedTotal: string;
  assignedTeamMemberId: string;
  advanceAmount: string;
  advanceMethod: PaymentMethod;
  paymentDueDate: string;
  nextFollowUpAt: string;
  followUpNote: string;
  notes: string;
  whatsappOptIn: boolean;
  whatsappNotificationsEnabled: boolean;
  step: number;
};

function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BookingFormModal({
  booking,
  enquiry,
  packages,
  teamMembers,
  onClose,
  onSave,
}: Props) {
  const draftKey = `doll_admin_booking_draft:${booking?.id || enquiry?.id || 'new'}`;
  const stored = readBookingDraft(draftKey);
  const [customerName, setCustomerName] = useState(stored?.customerName ?? booking?.customerName ?? enquiry?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(stored?.customerPhone ?? booking?.customerPhone ?? enquiry?.phone ?? '');
  const [customerEmail, setCustomerEmail] = useState(stored?.customerEmail ?? booking?.customerEmail ?? enquiry?.email ?? '');
  const [shootType, setShootType] = useState(stored?.shootType ?? booking?.shootType ?? enquiry?.shootType ?? 'Wedding');
  const [preferredEvent, setPreferredEvent] = useState(stored?.preferredEvent ?? booking?.preferredEvent ?? enquiry?.preferredEvent ?? '');
  const [bookingDate, setBookingDate] = useState(stored?.bookingDate ?? booking?.bookingDate ?? enquiry?.bookingDate ?? '');
  const [startTime, setStartTime] = useState(stored?.startTime ?? booking?.startTime ?? enquiry?.startTime ?? '');
  const [endTime, setEndTime] = useState(stored?.endTime ?? booking?.endTime ?? enquiry?.endTime ?? '');
  const [location, setLocation] = useState(stored?.location ?? booking?.location ?? enquiry?.location ?? '');
  const [packageId, setPackageId] = useState(stored?.packageId ?? booking?.packageId ?? '');
  const [agreedTotal, setAgreedTotal] = useState(
    stored?.agreedTotal ?? (booking?.agreedTotal == null ? '' : String(booking.agreedTotal)),
  );
  const [assignedTeamMemberId, setAssignedTeamMemberId] = useState(
    stored?.assignedTeamMemberId ?? booking?.assignedTeamMemberId ?? '',
  );
  const [advanceAmount, setAdvanceAmount] = useState(stored?.advanceAmount ?? '');
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>(stored?.advanceMethod ?? 'upi');
  const [paymentDueDate, setPaymentDueDate] = useState(stored?.paymentDueDate ?? booking?.paymentDueDate ?? '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState(stored?.nextFollowUpAt ?? localDateTime(booking?.nextFollowUpAt));
  const [followUpNote, setFollowUpNote] = useState(stored?.followUpNote ?? booking?.followUpNote ?? '');
  const [notes, setNotes] = useState(() => {
    if (stored) return stored.notes;
    if (booking?.notes) return booking.notes;
    return enquiry ? [enquiry.message, enquiry.notes].filter(Boolean).join('\n\n') : '';
  });
  const [whatsappOptIn, setWhatsappOptIn] = useState(stored?.whatsappOptIn ?? booking?.whatsappOptIn ?? false);
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(
    stored?.whatsappNotificationsEnabled ?? booking?.whatsappNotificationsEnabled ?? false,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(stored?.step && stored.step >= 0 && stored.step <= 3 ? stored.step : 0);
  const steps = ['Customer', 'Shoot', 'Price & payment', 'Optional details'];

  useEffect(() => {
    const draft: BookingDraft = {
      customerName, customerPhone, customerEmail, shootType, preferredEvent,
      bookingDate, startTime, endTime, location, packageId, agreedTotal, assignedTeamMemberId,
      advanceAmount, advanceMethod, paymentDueDate, nextFollowUpAt, followUpNote, notes, whatsappOptIn,
      whatsappNotificationsEnabled, step,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [advanceAmount, advanceMethod, agreedTotal, assignedTeamMemberId, bookingDate, customerEmail, customerName, customerPhone, draftKey, endTime, followUpNote, location, nextFollowUpAt, notes, packageId, paymentDueDate, preferredEvent, shootType, startTime, step, whatsappNotificationsEnabled, whatsappOptIn]);

  const handlePackage = (id: string) => {
    setPackageId(id);
    const prefill = packagePrefill(packages, id, shootType);
    if (prefill.agreedTotal !== undefined) setAgreedTotal(prefill.agreedTotal);
    setShootType(prefill.shootType);
  };

  const submit = async () => {
    if (customerName.trim().length < 2) return setError('Customer name is required.');
    if (customerPhone.trim().length < 8) return setError('A valid phone number is required.');
    if (enquiry && !bookingDate) return setError('Choose the confirmed booking date.');
    const timeError = bookingTimeWindowError(bookingDate, startTime, endTime);
    if (timeError) return setError(timeError);
    setSaving(true);
    setError('');
    try {
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        shootType: shootType || undefined,
        preferredEvent: preferredEvent.trim(),
        bookingDate,
        startTime,
        endTime,
        location: location.trim(),
        packageId: packageId || null,
        agreedTotal: agreedTotal === '' ? null : Number(agreedTotal),
        assignedTeamMemberId: assignedTeamMemberId || null,
        advanceAmount: enquiry && Number(advanceAmount) > 0 ? Number(advanceAmount) : undefined,
        advanceMethod: enquiry && Number(advanceAmount) > 0 ? advanceMethod : undefined,
        paymentDueDate,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
        followUpNote: followUpNote.trim() || undefined,
        notes: notes.trim(),
        enquiryId: !booking && enquiry ? enquiry.id : booking?.enquiryId,
        whatsappOptIn,
        whatsappNotificationsEnabled: whatsappOptIn && whatsappNotificationsEnabled,
        preferredLanguage: 'en',
      });
      localStorage.removeItem(draftKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save booking');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 0 && customerName.trim().length < 2) {
      return setError('Customer name is required.');
    }
    if (step === 0 && customerPhone.trim().length < 8) {
      return setError('A valid phone number is required.');
    }
    if (step === 1 && enquiry && !bookingDate) {
      return setError('Choose the confirmed booking date.');
    }
    if (step === 1) {
      const timeError = bookingTimeWindowError(bookingDate, startTime, endTime);
      if (timeError) return setError(timeError);
    }
    setError('');
    setStep(value => value + 1);
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-lg font-semibold text-slate-900">{booking ? 'Edit booking' : enquiry ? 'Convert enquiry to booking' : 'Create booking'}</h2><p className="mt-0.5 text-xs font-medium text-blue-600">Step {step + 1} of 4 · {steps[step]}</p></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5">
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {step === 0 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">Name *<input className={`${input} mt-1`} value={customerName} onChange={e => setCustomerName(e.target.value)} /></label>
              <label className="text-sm text-slate-700">Phone *<input type="tel" className={`${input} mt-1`} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></label>
              <label className="text-sm text-slate-700 sm:col-span-2">Email<input type="email" className={`${input} mt-1`} value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></label>
            </div>
          </section>}

          {step === 1 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Session</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">Photography service<select className={`${input} mt-1`} value={shootType} onChange={e => setShootType(e.target.value)}>{SHOOT_TYPE_OPTIONS.map(type => <option key={type}>{type}</option>)}</select></label>
              <label className="text-sm text-slate-700">Preferred event<input className={`${input} mt-1`} value={preferredEvent} onChange={e => setPreferredEvent(e.target.value)} /></label>
              <label className="text-sm text-slate-700">Booking date<input type="date" className={`${input} mt-1`} value={bookingDate} onChange={e => setBookingDate(e.target.value)} /></label>
              <label className="text-sm text-slate-700">Location<input className={`${input} mt-1`} value={location} onChange={e => setLocation(e.target.value)} /></label>
              <label className="text-sm text-slate-700">Start time<input type="time" className={`${input} mt-1`} value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
              <label className="text-sm text-slate-700">End time<input type="time" min={startTime || undefined} className={`${input} mt-1`} value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
              {(startTime || endTime) && <p className="text-xs text-slate-500 sm:col-span-2">{bookingDurationLabel(startTime, endTime) || 'Enter both times; the end must be later than the start.'}</p>}
            </div>
          </section>}

          {step === 2 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Package and ownership</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">Package<select className={`${input} mt-1`} value={packageId} onChange={e => handlePackage(e.target.value)}><option value="">No package</option>{packages.map(item => <option key={item.id} value={item.id}>{item.name}{item.isPublished ? '' : ' (unpublished)'}</option>)}</select></label>
              <label className="text-sm text-slate-700">Agreed total (₹)<input type="number" min="0" className={`${input} mt-1`} value={agreedTotal} onChange={e => setAgreedTotal(e.target.value)} placeholder="Not decided" /></label>
              <label className="text-sm text-slate-700">Assigned team member<select className={`${input} mt-1`} value={assignedTeamMemberId} onChange={e => setAssignedTeamMemberId(e.target.value)}><option value="">Unassigned</option>{teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
              <label className="text-sm text-slate-700">Payment due date<input type="date" className={`${input} mt-1`} value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} /></label>
              {enquiry && <label className="text-sm text-slate-700">Advance received (₹)<input type="number" min="0" className={`${input} mt-1`} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} placeholder="Optional" /></label>}
              {enquiry && Number(advanceAmount) > 0 && <label className="text-sm text-slate-700">Advance method<select className={`${input} mt-1`} value={advanceMethod} onChange={e => setAdvanceMethod(e.target.value as PaymentMethod)}><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select></label>}
            </div>
          </section>}

          {step === 3 && <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next action</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-700">Follow-up date and time<input type="datetime-local" className={`${input} mt-1`} value={nextFollowUpAt} onChange={e => setNextFollowUpAt(e.target.value)} /></label>
              <label className="text-sm text-slate-700">Follow-up note<input className={`${input} mt-1`} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} /></label>
            </div>
            <label className="block text-sm text-slate-700">Internal notes<textarea rows={3} className={`${input} mt-1 resize-y`} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          </section>}

          {step === 3 && <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">WhatsApp updates</h3>
            <label className="flex items-start gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-1" checked={whatsappOptIn} onChange={e => { setWhatsappOptIn(e.target.checked); if (!e.target.checked) setWhatsappNotificationsEnabled(false); }} /><span>Customer has explicitly agreed to receive booking and photoshoot updates through WhatsApp.</span></label>
            <label className="flex items-start gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-1" checked={whatsappNotificationsEnabled} disabled={!whatsappOptIn} onChange={e => setWhatsappNotificationsEnabled(e.target.checked)} /><span>Enable automated booking notifications (English).</span></label>
          </section>}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 px-5 py-4">
          <button onClick={step === 0 ? onClose : () => setStep(value => value - 1)} className="h-12 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">{step === 0 ? 'Cancel' : 'Back'}</button>
          {step < 3 ? <button onClick={nextStep} className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">Next</button> : <button onClick={() => void submit()} disabled={saving} className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : enquiry ? 'Confirm booking' : 'Save booking'}</button>}
        </div>
      </div>
    </div>
  );
}

function readBookingDraft(key: string): BookingDraft | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null') as BookingDraft | null; }
  catch { return null; }
}
