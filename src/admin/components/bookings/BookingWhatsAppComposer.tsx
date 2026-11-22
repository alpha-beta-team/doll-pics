import { useRef, useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import type { Booking, WhatsAppMessageSummary } from '../../types';
import type { OrderWorkflow } from '../../../shared/orderWorkflow';
import { formatCustomerName } from '../../../shared/formatCustomerName';
import { whatsappUrl } from '../../contact';
import { BookingDialog } from './BookingDetailSections';
import { bookingMessageDraft, bookingMessageGroups, bookingMessageLabel, bookingMessageSuggestions, type BookingWhatsAppTemplateId } from './bookingWhatsApp';
import './booking-whatsapp.css';

const fieldValue = (type: string | undefined, value: string) => type === 'datetime-local' && value ? new Date(`${value}:00+05:30`).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : value.trim();
export function BookingWhatsAppComposer({ booking, order, canViewPayments, reviewUrl, messages, initialTemplate, onClose, onLog }: {
  booking: Booking; order: OrderWorkflow | null; canViewPayments: boolean; reviewUrl: string; messages: WhatsAppMessageSummary[];
  initialTemplate: BookingWhatsAppTemplateId | 'suggested'; onClose: () => void;
  onLog: (template: BookingWhatsAppTemplateId, message: string, requestId: string) => Promise<void>;
}) {
  const suggestions = bookingMessageSuggestions(booking, order, canViewPayments);
  const [template, setTemplate] = useState<BookingWhatsAppTemplateId>(() => booking.whatsappOptOutAt ? 'custom' : initialTemplate === 'suggested' ? suggestions[0].id : initialTemplate);
  const [values, setValues] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<string | null>(null);
  const [noDate, setNoDate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<{ template: BookingWhatsAppTemplateId; message: string; requestId: string } | null>(null);
  const logging = useRef(false);
  const draft = bookingMessageDraft(template, booking, order, reviewUrl, canViewPayments, noDate);
  let base = draft.body;
  for (const field of draft.fields) {
    const value = values[field.label] ?? field.value ?? '';
    if (value.trim()) base = base.split(`[${field.label}]`).join(fieldValue(field.type, value));
  }
  const message = custom ?? base;
  const missing = [...message.matchAll(/\[([^\]\n]+)\]/g)].map(match => match[1]);
  const invalid = draft.fields.filter(field => {
    const value = (values[field.label] ?? field.value ?? '').trim();
    return value && message.includes(value) && field.type === 'url' && !/^https?:\/\/\S+$/i.test(value);
  });
  const recipient = new URL(whatsappUrl(booking.customerPhone)).pathname.slice(1);
  const validPhone = /^\d{7,15}$/.test(recipient) && !booking.customerPhone.includes('*');
  const ready = message.length <= 4800 && Boolean(message.trim()) && !missing.length && !invalid.length && validPhone;
  const eventTypes: Partial<Record<BookingWhatsAppTemplateId, string[]>> = { booking_confirmation: ['booking_confirmed'], payment_receipt: ['payment_received'], review_request: ['review_request', 'thank_you'] };
  const sent = messages.filter(item => eventTypes[template]?.includes(item.eventType) && ['sent', 'delivered', 'read'].includes(item.status)).sort((a, b) => Date.parse(b.sentAt || b.scheduledAt) - Date.parse(a.sentAt || a.scheduledAt))[0];
  const choose = (id: BookingWhatsAppTemplateId) => { setTemplate(id); setCustom(null); setValues({}); setNoDate(false); setCopied(false); setError(''); };
  const setField = (label: string, type: string | undefined, value: string, initial?: string) => {
    if (custom !== null) {
      const previous = fieldValue(type, values[label] ?? initial ?? '');
      const token = `[${label}]`;
      setCustom(custom.split(custom.includes(token) ? token : previous || token).join(value.trim() ? fieldValue(type, value) : token));
    }
    setValues(current => ({ ...current, [label]: value })); setCopied(false); setError('');
  };
  const log = async () => {
    if (!opened || logging.current) return;
    logging.current = true; setBusy(true); setError('');
    try { await onLog(opened.template, opened.message, opened.requestId); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not log the message. Try again.'); }
    finally { logging.current = false; setBusy(false); }
  };
  const hint = message.length > 4800 ? 'Keep the message within 4,800 characters.' : !validPhone ? 'A valid customer phone number is required.' : missing.length ? `Fill ${missing.join(' and ')} first` : invalid.length ? `Enter a valid ${invalid.map(field => field.label).join(' and ')}` : !message.trim() ? 'Write a message first.' : 'Opens WhatsApp with this message. Nothing is sent until you press send there.';
  return <BookingDialog title={`Message ${formatCustomerName(booking.customerName)}`} className="admin-theme booking-wa" onClose={() => { if (!busy) onClose(); }} dismissOnBackdrop>
    <div className="bwa-recipient"><span>To {validPhone ? `+${recipient}` : booking.customerPhone || 'Number unavailable'}</span><span className={`bwa-consent ${booking.whatsappOptIn && !booking.whatsappOptOutAt ? 'is-consented' : ''}`}>{booking.whatsappOptOutAt ? 'WhatsApp opted out' : booking.whatsappOptIn ? '✓ WhatsApp consent' : 'Consent not recorded'}</span></div>
    {booking.whatsappOptOutAt && <p className="bwa-warning">This customer opted out. Prefilled templates are disabled; only use a custom chat when appropriate.</p>}
    <div className="bwa-body"><fieldset disabled={Boolean(opened)} className="bwa-controls">
      {!booking.whatsappOptOutAt && <><div className="bwa-section-label">Suggested now</div><div className="bwa-suggestions" role="group" aria-label="Suggested messages">{suggestions.map(item => <button type="button" key={item.id} aria-pressed={template === item.id} onClick={() => choose(item.id)}><strong>{bookingMessageLabel(item.id)}</strong><small>{item.reason}</small></button>)}</div></>}
      <label className="bwa-template">All templates<select value={template} onChange={event => choose(event.target.value as BookingWhatsAppTemplateId)}>{bookingMessageGroups.filter(group => canViewPayments || group.label !== 'Payment').map(group => <optgroup key={group.label} label={group.label}>{group.templates.map(([id, label]) => <option key={id} value={id} disabled={Boolean(booking.whatsappOptOutAt && id !== 'custom')}>{label}</option>)}</optgroup>)}</select></label>
      {template === 'booking_rescheduled' && <div className="bwa-date-options" role="group" aria-label="New date">{[false, true].map(ask => <button key={String(ask)} type="button" aria-pressed={noDate === ask} onClick={() => { setNoDate(ask); setCustom(null); setValues({}); }}>{ask ? 'Not fixed yet · ask the customer' : 'New date is fixed'}</button>)}</div>}
      {sent && <p className="bwa-auto" role="status">Sent automatically on {new Date(sent.sentAt || sent.scheduledAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}. Send again only if the customer asks.</p>}
      {draft.fields.length > 0 && <div className="bwa-fields"><strong>Fill before sending</strong>{draft.fields.map(field => <label key={field.label}>{field.label}<input type={field.type || 'text'} value={values[field.label] ?? field.value ?? ''} placeholder={field.type === 'url' ? 'https://' : field.label} onChange={event => setField(field.label, field.type, event.target.value, field.value)} /></label>)}</div>}
      <div className="bwa-message-label"><label htmlFor="booking-whatsapp-message">Message</label>{custom !== null && <button type="button" onClick={() => { setCustom(null); setValues({}); setCopied(false); }}>Reset to template</button>}</div>
      <textarea id="booking-whatsapp-message" rows={8} maxLength={4800} value={message} onChange={event => { setCustom(event.target.value); setCopied(false); }} />
    </fieldset></div>
    {error && <p role="alert" className="bwa-error">{error}</p>}
    {opened ? <div className="bwa-footer bwa-confirm"><strong>WhatsApp opened. Did you send it?</strong><div><button type="button" disabled={busy} onClick={() => { setOpened(null); setError(''); }}>Not yet</button><button type="button" disabled={busy} className="bwa-primary" onClick={() => void log()}>{busy ? 'Saving…' : 'Yes, log it'}</button></div></div> : <div className="bwa-footer"><span className={!ready ? 'bwa-missing' : ''}>{hint}</span><div><button type="button" disabled={!ready} onClick={async () => { try { await navigator.clipboard.writeText(message); setCopied(true); setError(''); } catch { setError('Could not copy. Select and copy the message manually.'); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy message'}</button><a role="link" tabIndex={ready ? 0 : -1} className={`bwa-primary ${!ready ? 'is-disabled' : ''}`} aria-disabled={!ready} href={ready ? whatsappUrl(booking.customerPhone, message) : undefined} target="_blank" rel="noopener noreferrer" onClick={event => { if (!ready) { event.preventDefault(); return; } setOpened({ template, message, requestId: crypto.randomUUID() }); }}><MessageCircle size={18} />Open WhatsApp</a></div></div>}
  </BookingDialog>;
}
