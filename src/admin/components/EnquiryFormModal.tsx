import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, X } from 'lucide-react';
import { SHOOT_TYPE_OPTIONS } from '../../lib/shootTypes';
import { api } from '../api/client';
import type { AdminEnquiryWritePayload, Enquiry, EnquirySource } from '../types';
import { bookingDurationLabel, bookingTimeWindowError } from '../../shared/bookingTime';

const DRAFT_KEY = 'doll_admin_enquiry_draft';

type Draft = AdminEnquiryWritePayload;

export function EnquiryFormModal({
  enquiry,
  onClose,
  onSaved,
}: {
  enquiry?: Enquiry | null;
  onClose: () => void;
  onSaved: (enquiry: Enquiry) => void;
}) {
  const stored = !enquiry ? readDraft() : null;
  const [name, setName] = useState(enquiry?.name || stored?.name || '');
  const [phone, setPhone] = useState(enquiry?.phone || stored?.phone || '');
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentDraft = useMemo<Draft>(() => ({
    name: name.trim(),
    phone: phone.trim(),
    source: !enquiry && source !== 'website' ? source : undefined,
    shootType: shootType || undefined,
    nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
    followUpNote: followUpNote.trim() || undefined,
    email: email.trim() || undefined,
    bookingDate: enquiry ? bookingDate : bookingDate || undefined,
    startTime: enquiry ? startTime : startTime || undefined,
    endTime: enquiry ? endTime : endTime || undefined,
    location: location.trim() || undefined,
    notes: notes.trim() || undefined,
    whatsappOptIn,
    whatsappNotificationsEnabled: whatsappOptIn && whatsappNotificationsEnabled,
    preferredLanguage: 'en',
  }), [bookingDate, email, endTime, enquiry, followUpNote, location, name, nextFollowUpAt, notes, phone, shootType, source, startTime, whatsappNotificationsEnabled, whatsappOptIn]);

  useEffect(() => {
    if (enquiry) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(currentDraft));
  }, [currentDraft, enquiry]);

  const save = async () => {
    if (name.trim().length < 2) return setError('Enter the customer name.');
    if (phone.trim().length < 8) return setError('Enter a valid phone number.');
    const timeError = bookingTimeWindowError(bookingDate, startTime, endTime);
    if (timeError) return setError(timeError);
    setSaving(true);
    setError('');
    try {
      const saved = enquiry
        ? await api.updateEnquiry(enquiry.id, currentDraft)
        : await api.createAdminEnquiry(currentDraft);
      if (!enquiry) localStorage.removeItem(DRAFT_KEY);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the enquiry. Your entry is still here.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-lg font-semibold text-slate-900">{enquiry ? 'Edit enquiry' : 'Add enquiry'}</h2><p className="text-sm text-slate-500">Name and phone are enough to start.</p></div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Customer name *<input autoFocus className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Example: Priya" /></label>
            <label className="text-sm font-medium text-slate-700">Phone number *<input type="tel" inputMode="tel" className={input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" /></label>
            <label className="text-sm font-medium text-slate-700">Came from<select className={input} value={source} disabled={enquiry?.source === 'website'} onChange={e => setSource(e.target.value as EnquirySource)}>{enquiry?.source === 'website' && <option value="website">Website</option>}<option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="walk_in">Walk-in</option><option value="referral">Referral</option><option value="diary_import">Diary import</option></select></label>
            <label className="text-sm font-medium text-slate-700">Photography service<select className={input} value={shootType} onChange={e => setShootType(e.target.value)}><option value="">Not decided</option>{SHOOT_TYPE_OPTIONS.map(value => <option key={value}>{value}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Follow-up date and time<input type="datetime-local" className={input} value={nextFollowUpAt} onChange={e => setNextFollowUpAt(e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">What should we discuss?<input className={input} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="Example: Share package options" /></label>
          </div>
          <button type="button" onClick={() => setShowMore(value => !value)} className="flex h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700">Optional details <ChevronDown className={`h-4 w-4 transition ${showMore ? 'rotate-180' : ''}`} /></button>
          {showMore && <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Email<input type="email" className={input} value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Preferred date<input type="date" className={input} value={bookingDate} onChange={e => setBookingDate(e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Start time<input type="time" className={input} value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">End time<input type="time" min={startTime || undefined} className={input} value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
            {(startTime || endTime) && <p className="text-xs text-slate-500 sm:col-span-2">{bookingDurationLabel(startTime, endTime) || 'Enter both times; the end must be later than the start.'}</p>}
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Location<input className={input} value={location} onChange={e => setLocation(e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Internal notes<textarea rows={3} className={`${input} h-auto py-3`} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          </div>}
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <label className="flex gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-1 h-5 w-5" checked={whatsappOptIn} onChange={e => { setWhatsappOptIn(e.target.checked); if (!e.target.checked) setWhatsappNotificationsEnabled(false); }} /><span>Customer clearly agreed to receive Doll Pictures updates on WhatsApp.</span></label>
            <label className="flex gap-3 text-sm text-emerald-950"><input type="checkbox" className="mt-1 h-5 w-5" checked={whatsappNotificationsEnabled} disabled={!whatsappOptIn} onChange={e => setWhatsappNotificationsEnabled(e.target.checked)} /><span>Send automatic essential updates.</span></label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" onClick={onClose} className="h-12 rounded-xl border border-slate-300 font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => void save()} disabled={saving} className="h-12 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : enquiry ? 'Save changes' : 'Add enquiry'}</button></div>
      </div>
    </div>
  );
}

function localDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function readDraft(): Partial<Draft> | null {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}
