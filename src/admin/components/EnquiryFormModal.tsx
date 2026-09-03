import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, RotateCcw, X } from 'lucide-react';
import { bookingDurationLabel, bookingTimeWindowError } from '../../shared/bookingTime';
import { api } from '../api/client';
import type { AdminEnquiryWritePayload, Enquiry, EnquirySource, ServiceNavLink } from '../types';
import type { CustomerLookupResponse } from '../types';
import { CustomerLookupPanel } from './CustomerLookupPanel';
import { FollowUpShortcuts } from './FollowUpShortcuts';
import {
  buildEnquiryPayload,
  hasRestorableEnquiryDraft,
  phoneNumberError,
} from './quickEntry.utils';
import { dateTimeLocalInKolkata, followUpDateError } from './followUp.utils';
import { photographyServiceOptions } from './bookingForm.utils';
import { LEAD_SOURCE_OPTIONS } from './leadSource';

const DRAFT_KEY = 'doll_admin_enquiry_draft';

type Draft = AdminEnquiryWritePayload;
type FieldErrors = Partial<Record<'name' | 'phone' | 'bookingDate' | 'time' | 'followUp', string>>;

export function EnquiryFormModal({
  enquiry,
  initialContact,
  draftKey = DRAFT_KEY,
  onClose,
  onSaved,
}: {
  enquiry?: Enquiry | null;
  initialContact?: { customerName: string; phone: string };
  draftKey?: string;
  onClose: () => void;
  onSaved: (enquiry: Enquiry) => void;
}) {
  const stored = !enquiry ? readDraft(draftKey) : null;
  const [name, setName] = useState(enquiry?.name || stored?.name || initialContact?.customerName || '');
  const [phone, setPhone] = useState(enquiry?.phone || stored?.phone || initialContact?.phone || '');
  const [source, setSource] = useState<EnquirySource>(enquiry?.source || stored?.source || 'phone');
  const [shootType, setShootType] = useState(enquiry?.shootType || stored?.shootType || '');
  const [nextFollowUpAt, setNextFollowUpAt] = useState(
    localDateTime(enquiry?.nextFollowUpAt || stored?.nextFollowUpAt),
  );
  const [followUpNote, setFollowUpNote] = useState(enquiry?.followUpNote || stored?.followUpNote || '');
  const [email, setEmail] = useState(enquiry?.email || stored?.email || '');
  const [bookingDate, setBookingDate] = useState(enquiry?.bookingDate || stored?.bookingDate || '');
  const [startTime, setStartTime] = useState(enquiry?.startTime || stored?.startTime || '');
  const [endTime, setEndTime] = useState(enquiry?.endTime || stored?.endTime || '');
  const [location, setLocation] = useState(enquiry?.location || stored?.location || '');
  const [notes, setNotes] = useState(enquiry?.notes || stored?.notes || '');
  const [whatsappOptIn, setWhatsappOptIn] = useState(enquiry?.whatsappOptIn || stored?.whatsappOptIn || false);
  const [whatsappNotificationsEnabled, setWhatsappNotificationsEnabled] = useState(
    enquiry?.whatsappNotificationsEnabled || stored?.whatsappNotificationsEnabled || false,
  );
  const [showMore, setShowMore] = useState(Boolean(enquiry || email || bookingDate || startTime || endTime || location || notes));
  const [draftRestored, setDraftRestored] = useState(
    () => !enquiry && hasRestorableEnquiryDraft(stored),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [customerLookup, setCustomerLookup] = useState<CustomerLookupResponse | null>(null);
  const [newShootConfirmed, setNewShootConfirmed] = useState(false);
  const [customerLookupChecking, setCustomerLookupChecking] = useState(false);
  const [services, setServices] = useState<ServiceNavLink[]>([]);
  const serviceOptions = useMemo(
    () => photographyServiceOptions(services, shootType),
    [services, shootType],
  );

  useEffect(() => {
    let active = true;
    void api.getSiteContent()
      .then(content => {
        if (active) setServices(content.serviceNavLinks ?? []);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const currentDraft = useMemo<Draft>(() => buildEnquiryPayload({
    name,
    phone,
    source,
    shootType,
    nextFollowUpAt,
    followUpNote,
    email,
    bookingDate,
    startTime,
    endTime,
    location,
    notes,
    whatsappOptIn,
    whatsappNotificationsEnabled,
  }, Boolean(enquiry)), [bookingDate, email, endTime, enquiry, followUpNote, location, name, nextFollowUpAt, notes, phone, shootType, source, startTime, whatsappNotificationsEnabled, whatsappOptIn]);

  useEffect(() => {
    if (enquiry) return;
    localStorage.setItem(draftKey, JSON.stringify(currentDraft));
  }, [currentDraft, draftKey, enquiry]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors(current => ({ ...current, [field]: undefined }));
  };

  const save = async () => {
    if (saving) return;
    const nextErrors: FieldErrors = {};
    if (name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters.';
    const phoneError = phoneNumberError(phone);
    if (phoneError) nextErrors.phone = phoneError;
    const timeError = bookingTimeWindowError(bookingDate, startTime, endTime);
    if (timeError) {
      if (!bookingDate && (startTime || endTime)) nextErrors.bookingDate = timeError;
      else nextErrors.time = timeError;
    }
    const followUpError = nextFollowUpAt ? followUpDateError(nextFollowUpAt) : null;
    if (followUpError) nextErrors.followUp = followUpError;
    if (!enquiry && customerLookup?.active.length && !newShootConfirmed) {
      nextErrors.phone = 'Open the active record or confirm this is a separate shoot.';
    }
    if (!enquiry && customerLookupChecking) nextErrors.phone = 'Wait a moment while customer history is checked.';
    setFieldErrors(nextErrors);
    const firstError = (['name', 'phone', 'followUp', 'bookingDate', 'time'] as const)
      .find(field => nextErrors[field]);
    if (firstError) {
      if (firstError === 'bookingDate' || firstError === 'time') setShowMore(true);
      window.setTimeout(() => document.getElementById(`enquiry-${firstError}`)?.focus(), 0);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = enquiry
        ? await api.updateEnquiry(enquiry.id, currentDraft)
        : await api.createAdminEnquiry(currentDraft);
      if (!enquiry) localStorage.removeItem(draftKey);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the enquiry. Your entry is still here.');
    } finally {
      setSaving(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setName('');
    setPhone('');
    setSource('phone');
    setShootType('');
    setNextFollowUpAt('');
    setFollowUpNote('');
    setEmail('');
    setBookingDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setNotes('');
    setWhatsappOptIn(false);
    setWhatsappNotificationsEnabled(false);
    setShowMore(false);
    setDraftRestored(false);
    setError('');
    setFieldErrors({});
  };

  const input = 'mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="enquiry-form-title">
      <div className="flex max-h-[94dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><h2 id="enquiry-form-title" className="text-lg font-semibold text-slate-900">{enquiry ? 'Edit enquiry' : 'Add enquiry'}</h2><p className="text-sm text-slate-500">Name and phone are enough to start.</p></div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          {draftRestored && <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"><RotateCcw className="h-4 w-4 shrink-0" /><span className="flex-1 font-medium">Your unfinished enquiry was restored.</span><button type="button" onClick={discardDraft} className="font-semibold text-blue-700 underline">Discard</button></div>}
          {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Customer name *<input id="enquiry-name" autoFocus className={input} value={name} onChange={event => { setName(event.target.value); clearFieldError('name'); }} placeholder="Example: Priya" aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <span className="mt-1 block text-xs font-medium text-red-600">{fieldErrors.name}</span>}</label>
            <label className="text-sm font-medium text-slate-700">Phone number *<input id="enquiry-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} className={input} value={phone} onChange={event => { setPhone(event.target.value); setNewShootConfirmed(false); setCustomerLookup(null); clearFieldError('phone'); }} placeholder="98765 43210" aria-invalid={Boolean(fieldErrors.phone)} />{fieldErrors.phone && <span className="mt-1 block text-xs font-medium text-red-600">{fieldErrors.phone}</span>}</label>
            <label className="text-sm font-medium text-slate-700">Came from<select className={input} value={source} onChange={event => setSource(event.target.value as EnquirySource)}>{LEAD_SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Photography service<select className={input} value={shootType} onChange={event => setShootType(event.target.value)}><option value="">Not decided</option>{serviceOptions.map(value => <option key={value}>{value}</option>)}</select></label>
          </div>

          {!enquiry && <CustomerLookupPanel phone={phone} allowNewShoot newShootConfirmed={newShootConfirmed} onConfirmNewShoot={() => { setNewShootConfirmed(true); clearFieldError('phone'); }} onUseContact={contact => { setName(contact.customerName); setEmail(contact.email); }} onResult={setCustomerLookup} onChecking={setCustomerLookupChecking} />}

          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Next follow-up</h3>
            <div className="mt-3"><FollowUpShortcuts value={nextFollowUpAt} onChange={value => { setNextFollowUpAt(value); clearFieldError('followUp'); if (!value) setFollowUpNote(''); }} allowNone />{fieldErrors.followUp && <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors.followUp}</p>}</div>
            {nextFollowUpAt && <label className="mt-3 block text-sm font-medium text-slate-700">What should we discuss?<input className={input} value={followUpNote} onChange={event => setFollowUpNote(event.target.value)} placeholder="Example: Share package options" /></label>}
          </section>

          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <label className="flex gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={whatsappOptIn} onChange={event => { setWhatsappOptIn(event.target.checked); if (!event.target.checked) setWhatsappNotificationsEnabled(false); }} /><span><strong className="block">WhatsApp consent received</strong><span className="mt-0.5 block text-xs leading-5 text-emerald-800">Customer agreed to receive Doll Pictures updates.</span></span></label>
            {whatsappOptIn && <label className="mt-3 flex gap-3 border-t border-emerald-200 pt-3 text-sm text-emerald-950"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={whatsappNotificationsEnabled} onChange={event => setWhatsappNotificationsEnabled(event.target.checked)} /><span>Send automatic essential updates.</span></label>}
          </section>

          <button type="button" onClick={() => setShowMore(value => !value)} className="flex h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700" aria-expanded={showMore}>Optional details <ChevronDown className={`h-4 w-4 transition ${showMore ? 'rotate-180' : ''}`} /></button>
          {showMore && <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Email<input type="email" autoComplete="email" className={input} value={email} onChange={event => setEmail(event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Preferred date<input id="enquiry-bookingDate" type="date" className={input} value={bookingDate} onChange={event => { setBookingDate(event.target.value); clearFieldError('bookingDate'); }} aria-invalid={Boolean(fieldErrors.bookingDate)} />{fieldErrors.bookingDate && <span className="mt-1 block text-xs font-medium text-red-600">{fieldErrors.bookingDate}</span>}</label>
            <label className="text-sm font-medium text-slate-700">Start time<input id="enquiry-time" type="time" className={input} value={startTime} onChange={event => { setStartTime(event.target.value); clearFieldError('time'); }} aria-invalid={Boolean(fieldErrors.time)} /></label>
            <label className="text-sm font-medium text-slate-700">End time<input type="time" min={startTime || undefined} className={input} value={endTime} onChange={event => { setEndTime(event.target.value); clearFieldError('time'); }} aria-invalid={Boolean(fieldErrors.time)} /></label>
            {(startTime || endTime || fieldErrors.time) && <p className={`text-xs sm:col-span-2 ${fieldErrors.time ? 'font-medium text-red-600' : 'text-slate-500'}`}>{fieldErrors.time || bookingDurationLabel(startTime, endTime) || 'Enter both times; the end must be later than the start.'}</p>}
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Location<input className={input} value={location} onChange={event => setLocation(event.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Internal notes<textarea rows={3} className={`${input} h-auto py-3`} value={notes} onChange={event => setNotes(event.target.value)} /></label>
          </div>}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void save()} disabled={saving} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : enquiry ? 'Save changes' : 'Add enquiry'}</button></div>
      </div>
    </div>
  );
}

function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateTimeLocalInKolkata(date);
}

function readDraft(key: string): Partial<Draft> | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
