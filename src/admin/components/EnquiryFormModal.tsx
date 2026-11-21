import './enquiry-form-modal.css';
import { AdminAlert } from './ui/AdminUi';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, RotateCcw, UserRound, X } from 'lucide-react';
import { bookingDurationLabel, bookingTimeWindowError } from '../../shared/bookingTime';
import { ApiError } from '../api/http';
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
import { Select } from '../../components/ui/Select';
import { LeadSourceSelect } from './LeadSourceSelect';
import { FormInput, FormTextarea } from './ui/FormControls';
import { endTimeFor, timeToMinutes } from '../pages/schedule.utils';

const DRAFT_KEY = 'doll_admin_enquiry_draft';

type Draft = AdminEnquiryWritePayload;
type FieldErrors = Partial<Record<'name' | 'phone' | 'bookingDate' | 'time' | 'followUp', string>>;

export function EnquiryFormModal({
  enquiry,
  phoneReadOnly = false,
  initialContact,
  draftKey = DRAFT_KEY,
  onClose,
  onSaved,
}: {
  enquiry?: Enquiry | null;
  phoneReadOnly?: boolean;
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
  const [showSchedule, setShowSchedule] = useState(Boolean(enquiry || bookingDate || startTime || endTime));
  const [showMore, setShowMore] = useState(Boolean(enquiry || email || location || notes));
  const [draftRestored, setDraftRestored] = useState(
    () => !enquiry && hasRestorableEnquiryDraft(stored),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [customerLookup, setCustomerLookup] = useState<CustomerLookupResponse | null>(null);
  const [newShootConfirmed, setNewShootConfirmed] = useState(false);
  const [separateShootReason, setSeparateShootReason] = useState('');
  const [lookupRefresh, setLookupRefresh] = useState(0);
  const [customerLookupChecking, setCustomerLookupChecking] = useState(false);
  const [services, setServices] = useState<ServiceNavLink[]>([]);
  const serviceOptions = useMemo(
    () => photographyServiceOptions(services, shootType),
    [services, shootType],
  );

  const dialogRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      // An open select owns its keyboard interactions and Escape key.
      if (event.defaultPrevented || document.querySelector('[role="listbox"]')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!submitting.current) onCloseRef.current();
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter(element => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

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
    if (submitting.current) return;
    const nextErrors: FieldErrors = {};
    if (name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters.';
    const phoneError = phoneNumberError(phone);
    if (!phoneReadOnly && phoneError) nextErrors.phone = phoneError;
    const timeError = bookingTimeWindowError(bookingDate, startTime, endTime);
    if (timeError) {
      if (!bookingDate && (startTime || endTime)) nextErrors.bookingDate = timeError;
      else nextErrors.time = timeError;
    }
    const followUpError = nextFollowUpAt ? followUpDateError(nextFollowUpAt) : null;
    if (followUpError) nextErrors.followUp = followUpError;
    const checkDuplicates = !enquiry || phone !== enquiry.phone;
    const activeMatches = customerLookup?.active.filter(row => row.type !== 'enquiry' || row.id !== enquiry?.id);
    if (checkDuplicates && activeMatches?.length && (!newShootConfirmed || separateShootReason.trim().length < 10)) {
      nextErrors.phone = 'Open the active record or confirm this is a separate shoot.';
    }
    if (checkDuplicates && customerLookupChecking) nextErrors.phone = 'Wait a moment while customer history is checked.';
    setFieldErrors(nextErrors);
    const firstError = (['name', 'phone', 'followUp', 'bookingDate', 'time'] as const)
      .find(field => nextErrors[field]);
    if (firstError) {
      if (firstError === 'bookingDate' || firstError === 'time') setShowSchedule(true);
      window.setTimeout(() => document.getElementById(`enquiry-${firstError}`)?.focus(), 0);
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      const saved = enquiry
        ? await api.updateEnquiry(enquiry.id, { ...currentDraft, ...(phoneReadOnly ? { phone: undefined } : {}), ...(newShootConfirmed ? { separateShootReason: separateShootReason.trim() } : {}) })
        : await api.createAdminEnquiry({ ...currentDraft, ...(newShootConfirmed ? { separateShootReason: separateShootReason.trim() } : {}) });
      if (!enquiry) localStorage.removeItem(draftKey);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_ENQUIRY') { setNewShootConfirmed(false); setLookupRefresh(value => value + 1); }
      setError(err instanceof Error ? err.message : 'Could not save the enquiry. Your entry is still here.');
    } finally {
      submitting.current = false;
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
    setShowSchedule(false);
    setDraftRestored(false);
    setError('');
    setFieldErrors({});
  };

  const close = () => { if (!submitting.current) onClose(); };
  const chooseDuration = (hours: 1 | 2 | 3) => {
    if (!bookingDate || !startTime || timeToMinutes(startTime) + hours * 60 >= 24 * 60) return;
    setEndTime(endTimeFor(startTime, hours));
    clearFieldError('time');
  };
  const followUpLabel = nextFollowUpAt
    ? new Date(`${nextFollowUpAt}:00+05:30`).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'No follow-up set';

  return (
    <div className="enquiry-entry-overlay fixed inset-0 z-[70] flex items-center justify-center">
      <div ref={dialogRef} className="enquiry-entry-dialog" role="dialog" aria-modal="true" aria-labelledby="enquiry-form-title" aria-describedby="enquiry-form-description">
        <header className="enquiry-entry-header">
          <div>
            <h2 id="enquiry-form-title">{enquiry ? 'Edit enquiry' : 'Add enquiry'}</h2>
            <p id="enquiry-form-description">Phone and name are enough to start.</p>
          </div>
          <button type="button" onClick={close} disabled={saving} className="enquiry-entry-close" aria-label="Close"><X size={18} /></button>
        </header>
        <div className="enquiry-entry-body">
          {draftRestored && <AdminAlert tone="info" contentClassName="flex items-center gap-3"><RotateCcw className="h-4 w-4 shrink-0" /><span className="flex-1 font-medium">Your unfinished enquiry was restored.</span><button type="button" disabled={saving} onClick={discardDraft} className="font-semibold underline">Discard</button></AdminAlert>}
          {error && <AdminAlert contentClassName="flex gap-2">{error}</AdminAlert>}

          <div className="enquiry-entry-grid">
            <label className="enquiry-entry-field"><span id="enquiry-phone-label">Phone number <b aria-hidden="true">*</b></span>
              <FormInput id="enquiry-phone" aria-labelledby="enquiry-phone-label" aria-required="true" autoFocus={!enquiry && !phoneReadOnly} readOnly={phoneReadOnly} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={phoneReadOnly ? 'Phone hidden' : phone} onChange={event => { setPhone(event.target.value); setNewShootConfirmed(false); setSeparateShootReason(''); setCustomerLookup(null); clearFieldError('phone'); }} placeholder="Mobile number" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'enquiry-phone-error' : undefined} />
              {fieldErrors.phone && <span id="enquiry-phone-error" className="enquiry-entry-error">{fieldErrors.phone}</span>}
            </label>
            <label className="enquiry-entry-field"><span id="enquiry-name-label">Customer name <b aria-hidden="true">*</b></span>
              <FormInput id="enquiry-name" aria-labelledby="enquiry-name-label" aria-required="true" autoFocus={Boolean(enquiry || phoneReadOnly)} value={name} onChange={event => { setName(event.target.value); clearFieldError('name'); }} placeholder="Customer name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'enquiry-name-error' : undefined} />
              {fieldErrors.name && <span id="enquiry-name-error" className="enquiry-entry-error">{fieldErrors.name}</span>}
            </label>
          </div>

          {(!enquiry || phone !== enquiry.phone) && <CustomerLookupPanel phone={phone} current={enquiry ? { type: 'enquiry', id: enquiry.id } : undefined} refreshKey={lookupRefresh} separateShootReason={separateShootReason} onReasonChange={value => { setSeparateShootReason(value); setNewShootConfirmed(false); }} allowNewShoot newShootConfirmed={newShootConfirmed} onConfirmNewShoot={() => { setNewShootConfirmed(true); clearFieldError('phone'); }} onUseContact={contact => { setName(contact.customerName); setEmail(contact.email); }} onResult={setCustomerLookup} onChecking={setCustomerLookupChecking} />}

          <label className="enquiry-entry-check">
            <input type="checkbox" checked={whatsappOptIn} onChange={event => { setWhatsappOptIn(event.target.checked); if (!event.target.checked) setWhatsappNotificationsEnabled(false); }} />
            <span>Customer agreed to WhatsApp updates from Doll Pictures</span>
          </label>

          <div className="enquiry-entry-grid">
            <label className="enquiry-entry-field">Photography service
              <Select compact className="mt-1" value={shootType} onChange={setShootType} options={[{ value: '', label: 'Not decided' }, ...serviceOptions.map(value => ({ value, label: value }))]} />
            </label>
            <LeadSourceSelect compact value={source} onChange={value => setSource(value as EnquirySource)} />
          </div>

          <section id="enquiry-followUp" tabIndex={-1} className="enquiry-entry-follow-up" aria-labelledby="enquiry-follow-up-title">
            <div className="enquiry-entry-follow-up-heading"><h3 id="enquiry-follow-up-title">Next follow-up</h3><span>{followUpLabel}</span></div>
            <FollowUpShortcuts compact value={nextFollowUpAt} onChange={value => { setNextFollowUpAt(value); clearFieldError('followUp'); if (!value) setFollowUpNote(''); }} allowNone />
            {fieldErrors.followUp && <p role="alert" className="enquiry-entry-error">{fieldErrors.followUp}</p>}
            {nextFollowUpAt && <label className="enquiry-entry-field mt-3 block">What should we discuss?<FormInput value={followUpNote} onChange={event => setFollowUpNote(event.target.value)} placeholder="Example: Share package options" /></label>}
          </section>

          <section className="enquiry-entry-optional">
            <button type="button" onClick={() => setShowSchedule(value => !value)} aria-expanded={showSchedule} aria-controls="enquiry-preferred-shoot">
              <CalendarDays size={16} aria-hidden="true" /><span>Preferred shoot date</span><span className="enquiry-entry-hint">{bookingDate || 'Optional'}</span><ChevronDown size={16} className={showSchedule ? 'rotate-180' : ''} aria-hidden="true" />
            </button>
            {showSchedule && <div id="enquiry-preferred-shoot" className="enquiry-entry-optional-body">
              <div className="enquiry-entry-grid">
                <label className="enquiry-entry-field"><span id="enquiry-date-label">Preferred date</span><FormInput id="enquiry-bookingDate" aria-labelledby="enquiry-date-label" type="date" value={bookingDate} onChange={event => { setBookingDate(event.target.value); clearFieldError('bookingDate'); }} aria-invalid={Boolean(fieldErrors.bookingDate)} aria-describedby={fieldErrors.bookingDate ? 'enquiry-date-error' : undefined} />{fieldErrors.bookingDate && <span id="enquiry-date-error" className="enquiry-entry-error">{fieldErrors.bookingDate}</span>}</label>
                <label className="enquiry-entry-field">Start time<FormInput id="enquiry-time" type="time" value={startTime} onChange={event => { setStartTime(event.target.value); clearFieldError('time'); }} aria-invalid={Boolean(fieldErrors.time)} aria-describedby={fieldErrors.time ? 'enquiry-time-error' : undefined} /></label>
              </div>
              <div className="enquiry-entry-duration" aria-label="Preferred shoot duration">
                {([1, 2, 3] as const).map(hours => <button type="button" key={hours} disabled={!bookingDate || !startTime || timeToMinutes(startTime) + hours * 60 >= 24 * 60} aria-pressed={Boolean(startTime && endTime && timeToMinutes(endTime) - timeToMinutes(startTime) === hours * 60)} onClick={() => chooseDuration(hours)}>{hours} hour{hours > 1 ? 's' : ''}</button>)}
                <label className="enquiry-entry-end-time">End time<FormInput type="time" min={startTime || undefined} value={endTime} onChange={event => { setEndTime(event.target.value); clearFieldError('time'); }} aria-invalid={Boolean(fieldErrors.time)} aria-describedby={fieldErrors.time ? 'enquiry-time-error' : undefined} /></label>
              </div>
              {(startTime || endTime || fieldErrors.time) && <p id="enquiry-time-error" className={fieldErrors.time ? 'enquiry-entry-error' : 'enquiry-entry-hint'}>{fieldErrors.time || bookingDurationLabel(startTime, endTime) || 'Enter both times; the end must be later than the start.'}</p>}
            </div>}
          </section>

          <section className="enquiry-entry-optional">
            <button type="button" onClick={() => setShowMore(value => !value)} aria-expanded={showMore} aria-controls="enquiry-contact-details">
              <UserRound size={16} aria-hidden="true" /><span>Email, location &amp; notes</span><span className="enquiry-entry-hint">Optional</span><ChevronDown size={16} className={showMore ? 'rotate-180' : ''} aria-hidden="true" />
            </button>
            {showMore && <div id="enquiry-contact-details" className="enquiry-entry-optional-body">
              <div className="enquiry-entry-grid">
                <label className="enquiry-entry-field">Email<FormInput type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Optional" /></label>
                <label className="enquiry-entry-field">Location<FormInput value={location} onChange={event => setLocation(event.target.value)} placeholder="Studio, home or venue" /></label>
              </div>
              <label className="enquiry-entry-field mt-3 block">Internal notes<FormTextarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="What did they ask about?" /></label>
              {whatsappOptIn && <label className="enquiry-entry-check mt-3"><input type="checkbox" checked={whatsappNotificationsEnabled} onChange={event => setWhatsappNotificationsEnabled(event.target.checked)} /><span>Send automatic essential updates.</span></label>}
            </div>}
          </section>
        </div>
        <footer className="enquiry-entry-footer">
          <span className="enquiry-entry-hint">{saving ? 'Saving enquiry…' : 'Other details can be added later.'}</span>
          <button type="button" onClick={close} disabled={saving}>Cancel</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="enquiry-entry-save">{saving ? 'Saving…' : enquiry ? 'Save changes' : 'Add enquiry'}</button>
        </footer>
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
